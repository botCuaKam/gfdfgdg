const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ===== PostgreSQL Railway =====
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false
});

// ===== Tạo bảng nếu chưa có =====
pool.query(`
  CREATE TABLE IF NOT EXISTS zones (
    id SERIAL PRIMARY KEY,
    content TEXT
  );
`).catch(err => console.log(err));

// ===== Lưu dữ liệu =====
app.post("/save", async (req, res) => {
  try {
    const { data } = req.body;

    await pool.query("DELETE FROM zones"); // ghi đè dữ liệu cũ

    for (let line of data) {
      await pool.query("INSERT INTO zones(content) VALUES($1)", [line]);
    }

    res.json({ message: "Saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Save failed" });
  }
});

// ===== Lấy dữ liệu =====
app.get("/data", async (req, res) => {
  try {
    const result = await pool.query("SELECT content FROM zones");
    res.json(result.rows.map(r => r.content));
  } catch (err) {
    res.status(500).json({ error: "Load failed" });
  }
});

// ===== Serve frontend =====
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
