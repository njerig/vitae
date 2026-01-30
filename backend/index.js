const express = require("express");
const app = express();
const cors = require("cors");

require("dotenv").config();

// set up postgres connectivity
const { Pool } = require("pg");
const POOL = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(express.json());




// basic apis to play around with
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/me", (_req, res) => {
  res.json({ id: "demo", name: "Demo User" });
});

// GET /canon/:userId
// Gets ALL career history for a user
app.get("/api/canon/:userId", async (req,res) => {
  try {
     const { userId } = req.params;

     const { rows } = await POOL.query(
       `
        SELECT id, user_id, item_type, title, position, content, created_at, updated_at
        FROM canon_items
        WHERE user_id = $1
        ORDER BY item_type, position, created_at;
      `, [userId],);

     res.json(rows);
  } catch (error) {
     console.error(`Server error: ${error}`);
     res.status(500).json({ error: "Server error" });
  }
});

// PUT /canon/:userId
// Creates a new career history item for a particular user
app.put("/api/canon/:userId", async (req,res) => {
  try {
     const { userId } = req.params;

     const { rows } = await POOL.query(
       `
        SELECT id, user_id, item_type, title, position, content, created_at, updated_at
        FROM canon_items
        WHERE user_id = $1
        ORDER BY item_type, position, created_at;
      `, [userId],);

     res.json(rows);
  } catch (error) {
     console.error(`Server error: ${error}`);
     res.status(500).json({ error: "Server error" });
  }
});


// start app
const port = Number(process.env.PORT);
app.listen(port, () => {
  console.log(`Express API listening on http://localhost:${port}`);
});

