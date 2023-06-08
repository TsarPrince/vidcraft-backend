import { Application } from 'express'
import multer from 'multer'
const upload = multer({ dest: 'uploads/' })
import supabaseController from '../controllers/supabase.controller'


module.exports = (app: Application) => {
  app.post('/api/upload', upload.single('video'), supabaseController.uploadVideo)
  app.delete('/api/emptyBucket', supabaseController.emptyBucket)
}