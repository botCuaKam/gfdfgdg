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

function log(...msg){
  console.log(new Date().toISOString(), ...msg)
}

function logError(...msg){
  console.error("ERROR", new Date().toISOString(), ...msg)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

const upload = multer({ dest: "uploads/" })

pool.query(`
CREATE TABLE IF NOT EXISTS zones(
 id SERIAL PRIMARY KEY,
 content TEXT
)
`)

async function askAI(question){

  try{

    log("AI fallback")

    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents:[
          {
            parts:[{text:question}]
          }
        ]
      }
    )

    return res.data.candidates[0].content.parts[0].text

  }catch(err){

    logError("AI error",err.message)

    return "AI lỗi"

  }

}

app.post("/search", async (req,res)=>{

  const {query} = req.body

  log("search:",query)

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

    res.status(500).json({error:"server error"})

  }

})

app.post("/upload", upload.single("file"), async (req,res)=>{

  try{

    const file = req.file

    log("upload:",file.originalname)

    let lines=[]

    if(file.originalname.endsWith(".xlsx")){

      const wb = XLSX.readFile(file.path)
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(sheet,{header:1})

      lines = data.flat()

    }else{

      const txt = fs.readFileSync(file.path,"utf8")
      lines = txt.split("\n")

    }

    for(const line of lines){

      if(!line) continue

      await pool.query(
        "INSERT INTO zones(content) VALUES($1)",
        [line.toString()]
      )

    }

    fs.unlinkSync(file.path)

    log("upload rows:",lines.length)

    res.json({rows:lines.length})

  }catch(err){

    logError("upload error",err)

    res.status(500).json({error:"upload failed"})

  }

})

const PORT = process.env.PORT || 3000

app.listen(PORT,()=>{

  log("server started")
  log("port:",PORT)

})
