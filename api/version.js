const packageJson = require("../package.json");

/**
 * Handles the version endpoint to retrieve the current version of the API.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {void} Sends the current version information in the response.
 * @throws {Error} If there's an issue reading the package.json file.
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
    const { name, description, author, homepage, version } = packageJson;

    const response = {
      name,
      version,
      description,
      author,
      homepage,
    };

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(response);
  } catch (error) {
    console.error("Error reading package.json:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}

module.exports = handler;
