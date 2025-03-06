import fs from "fs/promises";
import path from "path";
// Get the current directory in ES modules
const dataPath = path.join(process.cwd(), "data"); // Assuming "data" is at the root

// Define log directory and file path
const logDir = path.join(dataPath, "logs");

// Ensure the log directory exists
async function ensureLogDirectory() {
  try {
    await fs.mkdir(logDir, { recursive: true });
  } catch (error) {
    console.error("❌ Could not create log directory:", error);
  }
}

// Generate log filename with the current date
function getLogFilePath() {
  const date = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
  return path.join(logDir, `server-${date}.log`);
}

// Write log messages to the daily log file
async function writeLog(message, type = "INFO") {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${type}] ${message}\n`;
  const logFile = getLogFilePath(); // Get log file for the current date

  try {
    await fs.appendFile(logFile, logEntry, "utf8");
  } catch (error) {
    console.error("❌ Error writing log file:", error);
  }
}

// Log functions for different types of messages
export async function logInfo(message) {
  console.log(`✅ %c[INFO] ${message}`, "color: #4caf50;");
  await writeLog(message, "INFO");
}

export async function logError(message) {
  console.error(`❌ %c[ERROR] ${message}`, "color: #ff3333; font-weight: bold;");
  await writeLog(message, "ERROR");
}

export async function logWarning(message) {
  console.warn(`⚠️ %c[WARNING] ${message}`, "color: #ffa500;");
  await writeLog(message, "WARNING");
}

// Ensure the log directory exists before logging
await ensureLogDirectory();
