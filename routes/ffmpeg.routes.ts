import { Application } from 'express'
import ffmpegController from '../controllers/ffmpeg.controller'
import multer from 'multer'

import { MAX_FILE_SIZE } from '../constants/multer.constant'

const upload = multer({
  limits: { fileSize: MAX_FILE_SIZE * 1024 * 1024 }, // Individual fileSize should be <= 25MB
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
      const fileName = file.originalname.slice(0, -4) + '-' + Date.now() + '.mp4'
      cb(null, fileName)
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
  app.post('/api/merge', upload.fields([{ name: 'preFile', maxCount: 1 }, { name: 'inputFile', maxCount: 1 }]), ffmpegController.mergeVideo)
  app.post('/api/getMetadata', upload.single('video'), ffmpegController.getMetadata)
}