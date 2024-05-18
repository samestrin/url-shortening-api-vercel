const { Client } = require("pg");
const { config: loadEnvConfig } = require("dotenv");
loadEnvConfig();
const {
  logRedirect,
  stripLeadingSlash,
  fetchFromCache,
} = require("../utils/index.js");

/**
 * Handles the redirect endpoint to redirect to the long URL based on the short URL.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {void} Redirects to the long URL.
 * @throws {Error} If there's an issue querying the database or processing the redirect.
 */
async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = requestUrl.pathname;
    const shortId = stripLeadingSlash(pathname);
    if (typeof shortId !== "string") {
      return res.status(400).json({ error: "Invalid shortId" });
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
      return res.status(404).json({ error: "URL not found" });
    }

    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      "unknown";
    const hostname = req.headers.host || "unknown";
    await logRedirect(shortId, ip, hostname);

    res.writeHead(301, { Location: longUrl });
    res.end();
  } catch (error) {
    console.error("Error processing redirect:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = handler;
