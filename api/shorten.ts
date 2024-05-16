import { VercelRequest, VercelResponse } from "@vercel/node";
import { generateShortId, saveUrl } from "../utils";
import { setUrl } from "../edge-config";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  const shortId = generateShortId();
  await setUrl(shortId, url);
  await saveUrl(shortId, url);

  return res.status(200).json({ shortUrl: `https://frwrd.ing/${shortId}` });
}
