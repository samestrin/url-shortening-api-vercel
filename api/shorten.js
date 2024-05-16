const { VercelRequest, VercelResponse } = require("@vercel/node");
const { config: loadEnvConfig } = require("dotenv");
loadEnvConfig();
const { kv } = require("@vercel/kv");
const { generateShortId, saveUrl } = require("../utils/index.js");

const urlBase = process.env.URLSHORT_URL_BASE || "/";

export async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url, userId } = req.body;
  if (!url || !userId) {
    return res.status(400).json({ error: "Missing url or userId parameter" });
  }

  const shortId = generateShortId();
  await kv.set(`url:${shortId}`, url);
  await saveUrl(shortId, url, userId);

  return res.status(200).json({ shortUrl: `${urlBase}${shortId}` });
}

module.exports = handler;
module.exports.runtime = runtime;
