import { nanoid } from "nanoid";
import { Client } from "pg";

export function generateShortId(): string {
  return nanoid(7);
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
  shortId: string,
  ip: string,
  hostname: string
): Promise<void> {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const urlResult = await client.query(
    "SELECT id FROM urls WHERE short_id = $1",
    [shortId]
  );
  if (urlResult.rows.length === 0) {
    await client.end();
    throw new Error("URL not found");
  }
  const urlId = urlResult.rows[0].id;

  const ipId = await getOrInsert("ip_addresses", "ip_address", ip, client);
  const hostnameId = await getOrInsert(
    "hostnames",
    "hostname",
    hostname,
    client
  );

  await client.query(
    "INSERT INTO clicks (url_id, ip_id, hostname_id, timestamp) VALUES ($1, $2, $3, NOW())",
    [urlId, ipId, hostnameId]
  );

  await client.end();
}

export async function saveUrl(shortId: string, longUrl: string): Promise<void> {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  await client.query("INSERT INTO urls (short_id, long_url) VALUES ($1, $2)", [
    shortId,
    longUrl,
  ]);

  await client.end();
}
