import { join } from 'path'

const TIME_DURATION = 30 // seconds

const FOLDERS = {
  INPUT: './ffmpeg/input',
  OUTPUT: './ffmpeg/output',
  TEMP: './ffmpeg/temp'
}

const WATERMARK_PATH = join(FOLDERS.INPUT, 'watermark.jpg')

export {
  TIME_DURATION,
  FOLDERS,
  WATERMARK_PATH
}