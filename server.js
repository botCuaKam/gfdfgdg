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

/* ======================
   LOG SYSTEM
====================== */

function log(...msg){
  console.log(new Date().toISOString(), ...msg)
}

function logError(...msg){
  console.error("ERROR", new Date().toISOString(), ...msg)
}

/* ======================
   DATABASE
====================== */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

pool.query(`
CREATE TABLE IF NOT EXISTS zones(
 id SERIAL PRIMARY KEY,
 content TEXT
)
`).then(()=>{
  log("database ready")
}).catch(err=>{
  logError("database error",err)
})

/* ======================
   FILE UPLOAD
====================== */

const upload = multer({ dest: "uploads/" })

/* ======================
   AI FUNCTION
====================== */

async function askAI(question){

  try{

    log("AI fallback:",question)

    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents:[
          {
            parts:[
              { text: question }
            ]
          }
        ]
      }
    )

    const text =
      res.data?.candidates?.[0]?.content?.parts?.[0]?.text

    log("AI response received")

    return text || "AI không trả lời"

  }catch(err){

    logError("AI error", err.response?.data || err.message)

    return "AI lỗi"

  }

}

/* ======================
   SEARCH API
====================== */

app.post("/search", async (req,res)=>{

  const {query} = req.body

  log("search:",query)

  if(!query){
    return res.json({
      source:"none",
      results:[]
    })
  }

  try{

    const db = await pool.query(
      "SELECT * FROM zones WHERE content ILIKE $1",
      [`%${query}%`]
    )

    log("db rows:",db.rows.length)

    if(db.rows.length > 0){

      return res.json({
        source:"db",
        results:db.rows
      })

    }

    const ai = await askAI(query)

    res.json({
      source:"ai",
      results:[{content:ai}]
    })

  }catch(err){

    logError("search error",err)

    res.status(500).json({
      error:"server error"
    })

  }

})

/* ======================
   FILE UPLOAD
====================== */

app.post("/upload", upload.single("file"), async (req,res)=>{

  try{

    const file = req.file

    log("upload file:",file.originalname)

    let lines=[]

    if(file.originalname.endsWith(".xlsx")){

      const workbook = XLSX.readFile(file.path)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]

      const data = XLSX.utils.sheet_to_json(sheet,{header:1})

      lines = data.flat()

    }else{

      const txt = fs.readFileSync(file.path,"utf8")
      lines = txt.split("\n")

    }

    let count = 0

    for(const line of lines){

      if(!line) continue

      await pool.query(
        "INSERT INTO zones(content) VALUES($1)",
        [line.toString()]
      )

      count++

    }

    fs.unlinkSync(file.path)

    log("upload rows:",count)

    res.json({rows:count})

  }catch(err){

    logError("upload error",err)

    res.status(500).json({error:"upload failed"})

  }

})

/* ======================
   SERVER START
====================== */

const PORT = process.env.PORT || 3000

app.listen(PORT,()=>{

  log("server started")
  log("port:",PORT)
  log("AI enabled:", !!process.env.GEMINI_API_KEY)

})
