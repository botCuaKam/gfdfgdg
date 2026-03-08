require("dotenv").config()

const express = require("express")
const cors = require("cors")
const multer = require("multer")
const XLSX = require("xlsx")
const fs = require("fs")
const axios = require("axios")

const { Pool } = require("pg")

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.static("public"))

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

const upload = multer({ dest: "uploads/" })

// tạo bảng nếu chưa có
pool.query(`
CREATE TABLE IF NOT EXISTS zones(
 id SERIAL PRIMARY KEY,
 content TEXT
)
`)


// tìm kiếm
app.post("/search", async (req,res)=>{

  const {query} = req.body

  const result = await pool.query(
    "SELECT * FROM zones WHERE content ILIKE $1",
    [`%${query}%`]
  )

  if(result.rows.length>0){

    res.json({
      type:"database",
      data: result.rows
    })

  }else{

    try{

      const ai = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents:[{
          parts:[{text:query}]
        }]
      })

      const text =
      ai.data.candidates?.[0]?.content?.parts?.[0]?.text || "AI không trả lời"

      res.json({
        type:"ai",
        data:text
      })

    }catch(err){

      res.json({
        type:"error",
        data:"AI lỗi"
      })

    }

  }

})



// upload file
app.post("/upload", upload.single("file"), async (req,res)=>{

  const file = req.file
  const path = file.path

  let lines=[]

  if(file.originalname.endsWith(".xlsx")){

    const workbook = XLSX.readFile(path)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]

    const data = XLSX.utils.sheet_to_json(sheet,{header:1})

    lines = data.flat().filter(Boolean)

  }

  if(file.originalname.endsWith(".csv")){

    const content = fs.readFileSync(path,"utf8")
    lines = content.split("\n")

  }

  if(file.originalname.endsWith(".txt")){

    const content = fs.readFileSync(path,"utf8")
    lines = content.split("\n")

  }

  for(let line of lines){

    await pool.query(
      "INSERT INTO zones(content) VALUES($1)",
      [line.toString()]
    )

  }

  fs.unlinkSync(path)

  res.json({message:"upload xong"})
})



const PORT = process.env.PORT || 3000

app.listen(PORT,()=>{
  console.log("Server running "+PORT)
})
