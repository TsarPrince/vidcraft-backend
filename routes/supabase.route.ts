import { Application } from 'express'
import multer from 'multer'
import supabaseController from '../controllers/supabase.controller'

import { MAX_FILE_SIZE } from '../constants/multer.constant'

const upload = multer({
  limits: { fileSize: MAX_FILE_SIZE * 1024 * 1024 }, // Individual fileSize should be <= 25MB
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/')
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'video/mp4') {
      return cb(new Error('Only video files are allowed!'))
    }
    cb(null, true)
  }
})

module.exports = (app: Application) => {
  app.post('/api/upload', upload.single('video'), supabaseController.uploadVideo)
  app.delete('/api/emptyBucket', supabaseController.emptyBucket)
}