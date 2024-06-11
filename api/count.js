const { Client } = require("pg");
const { config: loadEnvConfig } = require("dotenv");
loadEnvConfig();

/**
 * Handles the count endpoint to retrieve the number of URLs shortened.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {void} Sends the count of shortened URLs in the response.
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
    const client = new Client({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    const result = await client.query("SELECT COUNT(*) AS url_count FROM urls");
    await client.end();

    const endTime = process.hrtime(startTime);
    const elapsedTime = endTime[0] * 1000 + endTime[1] / 1e6; // Convert to milliseconds

    res.setHeader("Content-Type", "application/json");
    res
      .status(200)
      .json({
        count: result.rows[0].url_count,
        runtime: `${runTime.toFixed(2)}ms`,
      });
  } catch (error) {
    console.error("Error querying database:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}

module.exports = handler;
