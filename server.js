require("dotenv").config()

const express = require("express")
const cors = require("cors")
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

pool.query(`
CREATE TABLE IF NOT EXISTS zones(
 id SERIAL PRIMARY KEY,
 content TEXT
)
`)

/* AI fallback */
async function askAI(question){

  try{

    log("AI fallback:",question)

    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

    return text || "AI không trả lời"

  }catch(err){

    logError("AI error", err.response?.data || err.message)

    return "AI lỗi"

  }

}

/* SEARCH */
app.post("/search", async (req,res)=>{

  const {query} = req.body

  log("search:",query)

  if(!query){
    return res.json({source:"none",results:[]})
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

    res.status(500).json({error:"server error"})

  }

})

const PORT = process.env.PORT || 3000

app.listen(PORT,()=>{

  log("server started")
  log("port:",PORT)

})
