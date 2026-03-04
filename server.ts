import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("investments.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    cost REAL NOT NULL,
    current_price REAL,
    currency TEXT DEFAULT 'TWD',
    date TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/investments", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM investments ORDER BY date DESC").all();
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch investments" });
    }
  });

  app.post("/api/investments", (req, res) => {
    const { name, type, amount, cost, current_price, currency } = req.body;
    try {
      const info = db.prepare(
        "INSERT INTO investments (name, type, amount, cost, current_price, currency) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(name, type, amount, cost, current_price || cost, currency || 'TWD');
      res.json({ id: info.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: "Failed to add investment" });
    }
  });

  app.delete("/api/investments/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM investments WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete investment" });
    }
  });

  app.patch("/api/investments/:id", (req, res) => {
    const { id } = req.params;
    const { current_price } = req.body;
    try {
      db.prepare("UPDATE investments SET current_price = ? WHERE id = ?").run(current_price, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update investment" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
