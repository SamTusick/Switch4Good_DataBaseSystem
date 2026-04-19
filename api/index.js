const app = require("../backend/src/app");

module.exports = (req, res) => {
  // Ensure dotenv is loaded for Vercel environment
  require("dotenv").config({ path: require("path").join(__dirname, "../backend/.env") });
  app(req, res);
};
