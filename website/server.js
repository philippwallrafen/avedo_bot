console.log("__dirname is:", __dirname);

const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const FILE_PATH = path.join(__dirname, "data", "agents.csv");

// Set up Express and EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files if needed

// Set up EJS and the layouts
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout"); // looks for views/layout.ejs

// Helper function to parse agents from CSV
function parseAgents(callback) {
  fs.readFile(FILE_PATH, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading CSV:", err);
      return callback(err, []);
    }

    const lines = data.trim().split("\n").slice(1);
    const agents = lines
      .map((line) => {
        const [name, surname, inboundoutbound, priority] = line.split(",");
        return {
          name,
          surname,
          inboundoutbound,
          priority: parseInt(priority, 10),
        };
      })
      .sort((a, b) => a.priority - b.priority);

    callback(null, agents);
  });
}

// Route: Render Index Page
app.get("/", (req, res) => {
  parseAgents((err, agents) => {
    if (err) return res.status(500).send("Error loading agents.");
    res.render("index", { agents });
  });
});

// Route: Get Agents as JSON
app.get("/agents", (req, res) => {
  parseAgents((err, agents) => {
    if (err) return res.status(500).json({ error: "Error loading agents." });
    res.json(agents);
  });
});

// Route: Render Agent Priority Page
app.get("/agent_priority", (req, res) => {
  parseAgents((err, agents) => {
    if (err) return res.status(500).send("Error loading agents.");
    res.render("pages/agent_priority", { agents });
  });
});

// Route: Update Agent Order and Write to CSV
app.post("/update-agents", (req, res) => {
  const agents = req.body;
  if (!Array.isArray(agents))
    return res.status(400).json({ error: "Invalid data format" });

  const csvContent = ["name,surname,inboundoutbound,priority"]
    .concat(
      agents.map(
        (a, index) =>
          `${a.name},${a.surname},${a.inboundoutbound},${index + 1}`,
      ),
    )
    .join("\n");

  fs.writeFile(FILE_PATH, csvContent, "utf8", (err) => {
    if (err) {
      console.error("Error writing CSV:", err);
      return res.status(500).json({ error: "Failed to update agents" });
    }
    res.json({ message: "CSV updated successfully" });
  });
});

// Start Server
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);
