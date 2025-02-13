const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const FILE_PATH = "data/agents.csv";

// Read CSV file and send data as JSON
app.get("/agents", (req, res) => {
  fs.readFile(FILE_PATH, "utf8", (err, data) => {
    if (err) return res.status(500).send("Error reading file");

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

    res.json(agents);
  });
});

// Update CSV file with new order
app.post("/update-agents", (req, res) => {
  const agents = req.body;
  const header = "name,surname,inboundoutbound,priority\n";
  const csvContent =
    header +
    agents
      .map(
        (a, index) => `${a.name},${a.surname},${a.inboundoutbound},${index + 1}`
      )
      .join("\n");

  fs.writeFile(FILE_PATH, csvContent, "utf8", (err) => {
    if (err) return res.status(500).send("Error writing file");
    res.send("CSV updated successfully");
  });
});

// Start server
app.listen(3000, () => console.log("Server running on port 3000"));
