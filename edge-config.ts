import { get, set } from "@vercel/edge-config";

const EDGE_CONFIG_NAMESPACE =
  process.env.URLSHORT_EDGE_CONFIG_NAMESPACE || "frwrd_ing";

export async function getUrl(shortId: string): Promise<string | null> {
  return await get(`${EDGE_CONFIG_NAMESPACE}:url:${shortId}`);
}

export async function setUrl(shortId: string, longUrl: string): Promise<void> {
  await set(`${EDGE_CONFIG_NAMESPACE}:url:${shortId}`, longUrl);
}
