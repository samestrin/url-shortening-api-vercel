const { Client } = require("pg");
const { config } = require("dotenv");
config();

const trackClicks = process.env.URLSHORT_TRACK_CLICKS === "true";
const resolveHostname = process.env.URLSHORT_RESOLVE_HOSTNAME === "true";
const defaultIpAddressId =
  Number(process.env.URLSHORT_DEFAULT_IP_ADDRESS_ID) || 1;
const defaultHostnameId = Number(process.env.URLSHORT_DEFAULT_HOSTNAME_ID) || 1;

function generateShortId() {
  return crypto.randomUUID().substring(0, 7);
}

async function logRedirect(shortUrl, ip, hostname) {
  if (!trackClicks) return;
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const urlResult = await client.query(
    "SELECT id FROM urls WHERE short_url = $1",
    [shortUrl]
  );
  if (urlResult.rows.length === 0) {
    await client.end();
    throw new Error("URL not found");
  }
  const urlId = urlResult.rows[0].id;
  let ipId = defaultIpAddressId;
  if (ip) {
    ipId = await getOrInsert("ip_addresses", "address", ip, client);
  }
  if (resolveHostname && (!hostname || /^[0-9.]+$/.test(hostname))) {
    hostname = await resolveHostnameFromIp(ip);
  }
  let hostnameId = defaultHostnameId;
  if (hostname) {
    hostnameId = await getOrInsert("hostnames", "name", hostname, client);
  }
  await client.query(
    "INSERT INTO clicks (url_id, ip_address_id, hostname_id, clicked_at) VALUES ($1, $2, $3, NOW())",
    [urlId, ipId, hostnameId]
  );
  await client.end();
}

async function saveUrl(shortUrl, longUrl, userId) {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
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
  await client.query(
    "INSERT INTO urls (short_url, long_url, user_id, ip_address_id, hostname_id) VALUES ($1, $2, $3, $4, $5)",
    [shortUrl, longUrl, userId, ipId, hostnameId]
  );
  await client.end();
}

async function resolveHostnameFromIp(ip) {
  try {
    const fetch = await import("node-fetch"); // Dynamic import
    const response = await fetch(`https://dns.google/resolve?name=${ip}`);
    const data = await response.json();
    if (data.Answer && data.Answer.length > 0) {
      return data.Answer[0].data;
    }
  } catch (error) {
    console.error(`Error resolving hostname for IP ${ip}:`, error);
  }
  return "unknown";
}

async function getOrInsert(table, column, value, client) {
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
}

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
};
