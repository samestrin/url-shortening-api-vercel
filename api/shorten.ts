import { VercelRequest, VercelResponse } from "@vercel/node";
import { generateShortId, saveUrl } from "../utils";
import { setUrl } from "../edge-config";

const urlBase = process.env.URLSHORT_URL_BASE || "/";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url, userId } = req.body;
  if (!url || !userId) {
    return res.status(400).json({ error: "Missing url or userId parameter" });
  }

  const shortId = generateShortId();
  await setUrl(shortId, url);
  await saveUrl(shortId, url, userId);

  return res.status(200).json({ shortUrl: `${urlBase}${shortId}` });
}
