import express from 'express'
import dotenv from 'dotenv'

const app = express()
dotenv.config()

const PORT = process.env.PORT || 5000
app.use(express.json())

require("./routes/hello.routes")(app)
require("./routes/supabase.routes")(app);
require("./routes/ffmpeg.routes")(app);

app.listen(PORT, () => {
  console.log(`🚀 server at http://localhost:${PORT}`)
})
