/**
 * Switch4Good API Server
 * Entry point for the application
 */
require("dotenv").config();
const app = require("./app");
const { PORT } = require("./config");

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║     Switch4Good API Server                 ║
╠════════════════════════════════════════════╣
║  Status:  Running                          ║
║  Port:    ${PORT}                              ║
║  Mode:    ${process.env.NODE_ENV || "development"}                      ║
╚════════════════════════════════════════════╝
  `);
});
