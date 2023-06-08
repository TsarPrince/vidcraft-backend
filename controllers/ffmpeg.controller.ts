import { Request, Response } from 'express'
import ffmpeg from 'fluent-ffmpeg'
import { join } from 'path'
import fs from 'fs'
import ApiResponse from '../types/Response.type'
import uploadVideo from '../utils/upload'

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffprobePath = require('@ffprobe-installer/ffprobe').path

import { TIME_DURATION, FOLDERS, WATERMARK_PATH } from '../constants/ffmpeg.constant'


ffmpeg.setFfmpegPath(ffmpegPath)
ffmpeg.setFfprobePath(ffprobePath)

interface MergeVideoResponse extends ApiResponse {
  data: {
    fileName: string
  }
}

interface GetMetadataResponse extends ApiResponse {
  data: ffmpeg.FfprobeData
}

const mergeVideo = async (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] }
  try {

    const preFile = files.preFile
    const inputFile = files.inputFile

    const { path: prePath, originalname: preFileName } = preFile[0]
    const { path: inputPath, originalname: inputFileName } = inputFile[0]

    const promise = new Promise<string>((resolve, reject) => {

      // 1. trim first TIME_DURATION seconds of both input files
      // 2. merge to a single video file
      ffmpeg()
        .input(prePath)
        .inputOptions([`-t ${TIME_DURATION}`])
        .input(inputPath)
        .inputOptions([`-t ${TIME_DURATION}`])
        .mergeToFile(join(FOLDERS.OUTPUT, inputFileName), FOLDERS.TEMP)

        .on('start', () => {
          console.log(`Trimming and merging ${preFileName} + ${inputFileName}`)
        })
        .on('error', reject)
        .on('end', () => {

          const outputFile = 'PROCESSED-' + Date.now() + '-' + preFileName + '-' + inputFileName
          const outputPath = join(FOLDERS.OUTPUT, outputFile)

          // 3. add watermark after trimming and merging videos
          ffmpeg()
            .input(join(FOLDERS.OUTPUT, inputFileName))
            .input(WATERMARK_PATH)

            .complexFilter([{
              filter: 'overlay', options: { x: 'main_w-overlay_w-20', y: 'main_h-overlay_h-20' },
              inputs: ['0:v', '1:v'], outputs: 'output'
            }], 'output')

            .saveToFile(outputPath)

            .on('start', () => { console.log(`Adding watermark to ${preFileName} + ${inputFileName}`) })
            .on('error', reject)
            .on('end', async () => {

              // 4. Upload result to supabase storage
              const data = await uploadVideo(outputPath, outputFile, 'video/mp4')
              fs.unlinkSync(outputPath)
              console.log(`Video ${data.path} processed!`)
              resolve(data.path)
            })
        })
    })
    const path = await promise

    const json: MergeVideoResponse = {
      message: 'Video processed successfully',
      data: {
        fileName: path
      },
      error: null
    }
    res.status(200).json(json)

  } catch (err) {
    console.log(err)
    const json: ApiResponse = {
      message: err.message,
      data: null,
      error: 'Failed to merge video',
    }
    res.status(500).json(json)
  } finally {
    // delete files after merge
    if (files) {
      const preFile = files.preFile
      const inputFile = files.inputFile
      const prePath = preFile[0].path
      const inputPath = inputFile[0].path
      fs.unlinkSync(prePath)
      fs.unlinkSync(inputPath)
    }
  }
}


const getMetadata = async (req: Request, res: Response) => {
  const file = req.file
  try {
    const inputPath = file.path
    const promise = new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
      ffmpeg
        .ffprobe(inputPath, (err, metadata) => {
          if (err) {
            reject(err)
          } else {
            resolve(metadata)
          }
        })
    })
    const data = await promise
    const json: GetMetadataResponse = {
      message: 'Codecs processed!',
      data,
      error: null
    }
    res.status(200).json(json)

  } catch (err) {
    console.log(err)
    const json: ApiResponse = {
      error: 'Failed to fetch codec',
      data: null,
      message: err.message
    }
    res.status(500).json(json)

  } finally {
    // delete files after usage
    if (file) {
      fs.unlinkSync(file.path)
    }
  }
}


export default {
  mergeVideo,
  getMetadata
}