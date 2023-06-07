import express, { Request, Response, NextFunction } from 'express'
import dotenv from 'dotenv'
import multer from 'multer'
import { MAX_FILE_SIZE } from './constants/multer.constant'

const app = express()
const cors = require('cors')
const PORT = process.env.PORT || 5000

dotenv.config()
app.use(cors())
app.use(express.json())

require("./routes/hello.routes")(app)
require("./routes/supabase.routes")(app);
require("./routes/ffmpeg.routes")(app);

// Error handler middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    // Multer error occurred (e.g., file size exceeds limit)
    res.status(400).json({ message: `File size limit exceeded. Individual file size should be less than ${MAX_FILE_SIZE} MBs.` });
  } else {
    // Other error types
    res.status(500).json({ message: 'Internal server error.' });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 server at http://localhost:${PORT}`)
})
