const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/me", (_req, res) => {
  res.json({ id: "demo", name: "Demo User" });
});

const port = Number(process.env.PORT ?? 8000);
app.listen(port, () => {
  console.log(`Express API listening on http://localhost:${port}`);
});
