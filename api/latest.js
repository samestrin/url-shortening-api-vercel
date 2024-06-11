const { Client } = require("pg");
const { config: loadEnvConfig } = require("dotenv");
loadEnvConfig();

/**
 * Handles the latest endpoint to retrieve the latest URLs shortened.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {void} Sends the latest shortened URLs in the response.
 * @throws {Error} If there's an issue querying the database.
 */
async function handler(req, res) {
  const startTime = process.hrtime();

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
    const url = new URL(req.url, `http://${req.headers.host}`);
    const count = parseInt(url.searchParams.get("count"), 10) || 10;

    const client = new Client({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    const result = await client.query(
      "SELECT short_url, long_url, created_at FROM urls ORDER BY created_at DESC LIMIT $1",
      [count]
    );
    await client.end();

    const endTime = process.hrtime(startTime);
    const runTime = endTime[0] * 1000 + endTime[1] / 1e6; // Convert to milliseconds

    res.setHeader("Content-Type", "application/json");
    res
      .status(200)
      .json({ latest: result.rows, runtime: `${runTime.toFixed(2)}ms` });
  } catch (error) {
    console.error("Error querying database:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}

module.exports = handler;
