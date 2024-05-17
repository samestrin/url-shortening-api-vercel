const { VercelRequest, VercelResponse } = require("@vercel/node");
const { config: loadEnvConfig } = require("dotenv");
loadEnvConfig();
const { Client } = require("pg");
const {
  logRedirect,
  stripLeadingSlash,
  fetchFromCache,
} = require("../utils/index.js");

export async function GET(req) {
  try {
    const requestUrl = new URL(req.url, `http://`);
    const pathname = requestUrl.pathname;
    const shortId = stripLeadingSlash(pathname);

    if (typeof shortId !== "string") {
      return new Response(JSON.stringify({ error: "Invalid shortId" }), {
        status: 400,
      });
    }

    const longUrl = await fetchFromCache(`url:${shortId}`, async () => {
      const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false },
      });
      await client.connect();

      const result = await client.query(
        "SELECT long_url FROM urls WHERE short_url = $1",
        [shortId]
      );

      await client.end();

      return result.rows.length > 0 ? result.rows[0].long_url : null;
    });

    if (!longUrl) {
      return new Response(JSON.stringify({ error: "URL not found" }), {
        status: 404,
      });
    }

    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      "unknown";
    const hostname = req.headers.host || "unknown";
    await logRedirect(shortId, ip, hostname);

    return new Response(null, {
      status: 301,
      headers: {
        Location: longUrl,
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
