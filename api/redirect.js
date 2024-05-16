const { VercelRequest, VercelResponse } = require("@vercel/node");
const { config: loadEnvConfig } = require("dotenv");
loadEnvConfig();
const { kv } = require("@vercel/kv");
const { logRedirect, stripLeadingSlash } = require("../utils/index.js");

export async function GET(req) {
  try {
    // Parse the URL from the request
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = requestUrl.pathname;
    const shortId = stripLeadingSlash(pathname);

    if (typeof shortId !== "string") {
      return new Response(JSON.stringify({ error: "Invalid shortId" }), {
        status: 400,
      });
    }

    const longUrl = await kv.get(`url:${shortId}`);

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
