const { Client } = require("pg");
const { config } = require("dotenv");
config();
const { kv } = require("@vercel/kv");
const https = require("https");

const trackClicks = process.env.URLSHORT_TRACK_CLICKS === "true";
const resolveHostname = process.env.URLSHORT_RESOLVE_HOSTNAME === "true";
const defaultIpAddressId =
  Number(process.env.URLSHORT_DEFAULT_IP_ADDRESS_ID) || 1;
const defaultHostnameId = Number(process.env.URLSHORT_DEFAULT_HOSTNAME_ID) || 1;

/**
 * Generates a short ID for the URL.
 *
 * @returns {string} A randomly generated short ID.
 */
function generateShortId() {
  return crypto.randomUUID().substring(0, 7);
}

/**
 * Retrieves the short URL for a given long URL from the database.
 *
 * @param {string} longUrl - The long URL to search for.
 * @returns {Object|null} The short URL record if found, otherwise null.
 * @throws {Error} If there's an issue querying the database.
 */
async function getUrlByLongUrl(longUrl) {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const result = await client.query(
    "SELECT short_url FROM urls WHERE long_url = $1",
    [longUrl]
  );
  await client.end();

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Logs a redirect event in the database.
 *
 * @param {string} shortUrl - The short URL being redirected.
 * @param {string} ip - The IP address of the client.
 * @param {string} hostname - The hostname of the client.
 * @returns {void}
 * @throws {Error} If there's an issue logging the redirect.
 */
async function logRedirect(shortUrl, ip, hostname) {
  if (!trackClicks) return;

  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // Check cache for urlId
  let urlId = await kv.get(`urlId:${shortUrl}`);
  if (!urlId) {
    const urlResult = await client.query(
      "SELECT id FROM urls WHERE short_url = $1",
      [shortUrl]
    );
    if (urlResult.rows.length === 0) {
      await client.end();
      throw new Error("URL not found");
    }
    urlId = urlResult.rows[0].id;
    // Cache the urlId
    await kv.set(`urlId:${shortUrl}`, urlId);
  }

  // Check cache for ipId
  let ipId = await kv.get(`ipId:${ip}`);
  if (!ipId) {
    ipId = defaultIpAddressId;
    if (ip) {
      ipId = await getOrInsert("ip_addresses", "address", ip, client);
      // Cache the ipId
      await kv.set(`ipId:${ip}`, ipId);
    }
  }

  // Resolve hostname if needed and check cache for hostnameId
  if (resolveHostname && (!hostname || /^[0-9.]+$/.test(hostname))) {
    hostname = await resolveHostnameFromIp(ip);
  }
  let hostnameId = await kv.get(`hostnameId:${hostname}`);
  if (!hostnameId) {
    hostnameId = defaultHostnameId;
    if (hostname) {
      hostnameId = await getOrInsert("hostnames", "name", hostname, client);
      // Cache the hostnameId
      await kv.set(`hostnameId:${hostname}`, hostnameId);
    }
  }

  await client.query(
    "INSERT INTO clicks (url_id, ip_address_id, hostname_id, clicked_at) VALUES ($1, $2, $3, NOW())",
    [urlId, ipId, hostnameId]
  );
  await client.end();
}

/**
 * Saves a new URL in the database.
 *
 * @param {string} shortUrl - The short URL.
 * @param {string} longUrl - The long URL.
 * @param {number} [userId=null] - The ID of the user.
 * @returns {Object} The saved URL record.
 * @throws {Error} If there's an issue saving the URL.
 */
async function saveUrl(shortUrl, longUrl, userId = null) {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // Check if the short_url already exists
  const existingUrl = await client.query(
    "SELECT id FROM urls WHERE long_url = $1",
    [longUrl]
  );

  // If the URL already exists, return immediately
  if (existingUrl.rows.length > 0) {
    await client.end();
    return existingUrl.rows[0];
  }

  let ipId = defaultIpAddressId;
  const ip = "unknown";
  if (ip) {
    ipId = await getOrInsert("ip_addresses", "address", ip, client);
  }
  let hostnameId = defaultHostnameId;
  const hostname = resolveHostname
    ? await resolveHostnameFromIp(ip)
    : "unknown";
  if (hostname) {
    hostnameId = await getOrInsert("hostnames", "name", hostname, client);
  }

  // Insert the new URL record
  const result = await client.query(
    "INSERT INTO urls (short_url, long_url, user_id, ip_address_id, hostname_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [shortUrl, longUrl, userId, ipId, hostnameId]
  );
  await client.end();

  return result.rows[0];
}

/**
 * Resolves the hostname from the given IP address.
 *
 * @param {string} ip - The IP address to resolve.
 * @returns {Promise<string>} The resolved hostname.
 * @throws {Error} If there's an issue resolving the hostname.
 */
async function resolveHostnameFromIp(ip) {
  return new Promise((resolve, reject) => {
    https
      .get(`https://dns.google/resolve?name=${ip}`, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.Answer && json.Answer.length > 0) {
              resolve(json.Answer[0].data);
            } else {
              resolve("unknown");
            }
          } catch (error) {
            console.error(`Error resolving hostname for IP ${ip}:`, error);
            resolve("unknown");
          }
        });
      })
      .on("error", (error) => {
        console.error(`Error resolving hostname for IP ${ip}:`, error);
        resolve("unknown");
      });
  });
}

/**
 * Retrieves an ID from the specified table for the given value, or inserts a new record if it doesn't exist.
 *
 * @param {string} table - The table name.
 * @param {string} column - The column name.
 * @param {string} value - The value to search for.
 * @param {Object} client - The database client.
 * @returns {Promise<number>} The ID of the record.
 * @throws {Error} If there's an issue querying or inserting into the database.
 */
async function getOrInsert(table, column, value, client) {
  const key = `${table}:${column}:${value}`;
  const cachedValue = await fetchFromCache(key, async () => {
    const result = await client.query(
      `SELECT id FROM ${table} WHERE ${column} = $1`,
      [value]
    );
    if (result.rows.length > 0) {
      return result.rows[0].id;
    } else {
      const insertResult = await client.query(
        `INSERT INTO ${table} (${column}) VALUES ($1) RETURNING id`,
        [value]
      );
      return insertResult.rows[0].id;
    }
  });
  return cachedValue;
}

/**
 * Fetches a value from the cache, or from the database if not found in the cache.
 *
 * @param {string} key - The cache key.
 * @param {Function} fetchFromDB - The function to fetch the value from the database.
 * @returns {Promise<any>} The cached or fetched value.
 * @throws {Error} If there's an issue fetching from the cache or database.
 */
async function fetchFromCache(key, fetchFromDB) {
  // Check if the value exists in the KV store
  const cachedValue = await kv.get(key);
  if (cachedValue) {
    return cachedValue;
  }

  // Value not found in KV, fetch from the database
  const dbValue = await fetchFromDB();

  // If the value exists in the database, store it in KV
  if (dbValue) {
    await kv.set(key, dbValue);
  }

  return dbValue;
}

/**
 * Removes the leading slash from a string.
 *
 * @param {string} str - The string to modify.
 * @returns {string} The modified string without a leading slash.
 */
function stripLeadingSlash(str) {
  if (str.startsWith("/")) {
    return str.slice(1);
  }
  return str;
}

module.exports = {
  generateShortId,
  logRedirect,
  saveUrl,
  stripLeadingSlash,
  fetchFromCache,
  getUrlByLongUrl,
};
