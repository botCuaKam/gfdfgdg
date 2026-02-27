const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Tạo bảng nếu chưa có
pool.query(`
CREATE TABLE IF NOT EXISTS zones (
  id SERIAL PRIMARY KEY,
  content TEXT
)
`);

// Lưu dữ liệu
app.post("/save", async (req, res) => {
  const { content } = req.body;
  await pool.query("INSERT INTO zones (content) VALUES ($1)", [content]);
  res.json({ success: true });
});

// Lấy dữ liệu
app.get("/data", async (req, res) => {
  const result = await pool.query("SELECT * FROM zones");
  res.json(result.rows);
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running...");
});
