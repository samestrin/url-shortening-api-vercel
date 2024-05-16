import { nanoid } from "nanoid";
import { Client } from "@vercel/postgres";
import { Resolver } from "dns/promises";

const urlBase = process.env.URLSHORT_URL_BASE || "/";
const trackClicks = process.env.URLSHORT_TRACK_CLICKS === "true";
const resolveHostname = process.env.URLSHORT_RESOLVE_HOSTNAME === "true";
const defaultIpAddressId = process.env.URLSHORT_DEFAULT_IP_ADDRESS_ID || 1;
const defaultHostnameId = process.env.URLSHORT_DEFAULT_HOSTNAME_ID || 1;

export function generateShortId(): string {
  return nanoid(6);
}

async function getOrInsert(
  table: string,
  column: string,
  value: string,
  client: Client
): Promise<number> {
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

export async function logRedirect(
  shortUrl: string,
  ip: string,
  hostname: string
): Promise<void> {
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
    try {
      const resolver = new Resolver();
      const [resolvedHostname] = await resolver.reverse(ip);
      hostname = resolvedHostname || "unknown";
    } catch {
      hostname = "unknown";
    }
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

export async function saveUrl(
  shortUrl: string,
  longUrl: string,
  userId: number
): Promise<void> {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  await client.query(
    "INSERT INTO urls (short_url, long_url, user_id) VALUES ($1, $2, $3)",
    [shortUrl, longUrl, userId]
  );

  await client.end();
}
