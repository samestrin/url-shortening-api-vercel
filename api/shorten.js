const { IncomingForm } = require("formidable");
const { config: loadEnvConfig } = require("dotenv");
const validUrl = require("valid-url");
const querystring = require("querystring");
loadEnvConfig();
const { kv } = require("@vercel/kv");
const {
  generateShortId,
  saveUrl,
  getUrlByLongUrl,
} = require("../utils/index.js");

const defaultUserId = Number(process.env.URLSHORT_DEFAULT_USER_ID) || 1;
const urlBase = process.env.URLSHORT_URL_BASE || "/";

/**
 * Handles the URL shortening process.
 *
 * @param {string} url - The long URL to be shortened.
 * @returns {Promise<string>} The shortened URL.
 * @throws {Error} If there's an issue processing the request or saving the URL.
 */
async function handleUrlShortening(url) {
  // Check the cache for an existing short URL
  let shortUrl = await kv.get(`longUrl:${url}`);
  if (!shortUrl) {
    // Check the database for an existing short URL
    const existingUrl = await getUrlByLongUrl(url);
    if (existingUrl) {
      shortUrl = `${urlBase}${existingUrl.short_url}`;
    } else {
      // Generate a new short URL if none exists
      const shortId = generateShortId();
      shortUrl = `${urlBase}${shortId}`;
      await kv.set(`url:${shortId}`, url, { nx: true });
      await kv.set(`longUrl:${url}`, shortId, { nx: true });
      await saveUrl(shortId, url, defaultUserId);
    }
  } else {
    shortUrl = `${urlBase}${shortUrl}`;
  }

  return shortUrl;
}

/**
 * Handles the shorten endpoint to create a new short URL for a given long URL.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {void} Sends the new short URL in the response.
 * @throws {Error} If there's an issue processing the request or saving the URL.
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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const contentType = req.headers["content-type"];

  if (contentType && contentType.includes("multipart/form-data")) {
    const form = new IncomingForm();

    form.parse(req, async (err, fields) => {
      if (err) {
        console.error("Error parsing form data:", err);
        return res.status(400).json({ error: "Invalid form data" });
      }

      const url = fields.url && fields.url[0];

      // URL validation
      if (!url || !validUrl.isUri(url)) {
        return res.status(400).json({ error: "Invalid URL" });
      }

      try {
        const shortUrl = await handleUrlShortening(url);
        return res.status(200).json({ shortUrl });
      } catch (error) {
        console.error("Error saving URL:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    });
  } else if (
    contentType &&
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      const fields = querystring.parse(body);
      const url = fields.url;

      // URL validation
      if (!url || !validUrl.isUri(url)) {
        return res.status(400).json({ error: "Invalid URL" });
      }

      try {
        const shortUrl = await handleUrlShortening(url);
        return res.status(200).json({ shortUrl });
      } catch (error) {
        console.error("Error saving URL:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    });
  } else {
    return res.status(415).json({ error: "Unsupported content type" });
  }
}

module.exports = handler;
