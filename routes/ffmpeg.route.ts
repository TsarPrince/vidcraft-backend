import { Application } from 'express'
import ffmpegController from '../controllers/ffmpeg.controller'

module.exports = (app: Application) => {
  app.post('/api/merge', ffmpegController.mergeVideo)
  app.post('/api/getMetadata', ffmpegController.getMetadata)
}