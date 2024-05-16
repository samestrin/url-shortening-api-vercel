import { VercelRequest, VercelResponse } from "@vercel/node";
import { getUrl } from "../edge-config";
import { logRedirect } from "../utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { shortId } = req.query;

  if (typeof shortId !== "string") {
    return res.status(400).json({ error: "Invalid shortId" });
  }

  const longUrl = await getUrl(shortId);

  if (!longUrl) {
    return res.status(404).json({ error: "URL not found" });
  }

  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const hostname = req.headers.host;

  await logRedirect(shortId, ip as string, hostname);

  return res.redirect(301, longUrl);
}
