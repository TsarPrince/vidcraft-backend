import { Request, Response } from 'express'
import ffmpeg from 'fluent-ffmpeg'
import { join } from 'path'
import fs from 'fs'
import ApiResponse from '../types/Response.type'
import uploadVideo from '../utils/upload'
import downloadVideo from '../utils/fetch'

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffprobePath = require('@ffprobe-installer/ffprobe').path

import { TIME_DURATION, FOLDERS, WATERMARK_PATH } from '../constants/ffmpeg.constant'

const SUPABASE_VIDEO_URL = process.env.SUPABASE_VIDEO_URL

ffmpeg.setFfmpegPath(ffmpegPath)
ffmpeg.setFfprobePath(ffprobePath)

interface MergeVideoResponse extends ApiResponse {
  data: {
    fileName: string
    url: string
  }
}

interface GetMetadataResponse extends ApiResponse {
  data: ffmpeg.FfprobeData
}

const mergeVideo = async (req: Request, res: Response) => {

  let filePath1: string, filePath2: string, filePath3: string
  try {
    const { id1, id2 } = req.body

    const blob1 = await downloadVideo(id1)
    const blob2 = await downloadVideo(id2)
    const buffer1 = Buffer.from(await blob1.arrayBuffer())
    const buffer2 = Buffer.from(await blob2.arrayBuffer())
    filePath1 = join(FOLDERS.TEMP, 'file1.mp4')
    filePath2 = join(FOLDERS.TEMP, 'file2.mp4')
    fs.writeFileSync(filePath1, buffer1)
    fs.writeFileSync(filePath2, buffer2)

    const promise = new Promise<string>((resolve, reject) => {

      // 1. trim first TIME_DURATION seconds of both input files
      // 2. merge to a single video file
      filePath3 = join(FOLDERS.OUTPUT, 'file3.mp4')
      ffmpeg()
        .input(filePath1)
        .inputOptions([`-t ${TIME_DURATION}`])
        .input(filePath2)
        .inputOptions([`-t ${TIME_DURATION}`])
        .mergeToFile(filePath3, FOLDERS.TEMP)

        .on('start', () => {
          console.log(`Trimming and merging ${id1} + ${id2}`)
        })
        .on('error', reject)
        .on('end', () => {

          const outputFile = 'PROCESSED-' + Date.now() + '-' + id1 + '-' + id2 + '.mp4'
          const outputPath = join(FOLDERS.OUTPUT, outputFile)

          // 3. add watermark after trimming and merging videos
          ffmpeg()
            .input(filePath3)
            .input(WATERMARK_PATH)

            .complexFilter([{
              filter: 'overlay', options: { x: 'main_w-overlay_w-20', y: 'main_h-overlay_h-20' },
              inputs: ['0:v', '1:v'], outputs: 'output'
            }], 'output')

            .saveToFile(outputPath)

            .on('start', () => { console.log(`Adding watermark to ${id1} + ${id2}`) })
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
        fileName: path, url: `${SUPABASE_VIDEO_URL}/${path}`
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
    if (filePath1) fs.unlinkSync(filePath1)
    if (filePath2) fs.unlinkSync(filePath2)
    if (filePath3) fs.unlinkSync(filePath3)
  }
}


const getMetadata = async (req: Request, res: Response) => {
  let filePath: string
  try {
    const { id } = req.body

    const blob = await downloadVideo(id)
    const buffer = Buffer.from(await blob.arrayBuffer())
    filePath = join(FOLDERS.TEMP, 'file.mp4')
    fs.writeFileSync(filePath, buffer)

    const inputPath = filePath
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
    if (filePath) {
      fs.unlinkSync(filePath)
    }
  }
}


export default {
  mergeVideo,
  getMetadata
}