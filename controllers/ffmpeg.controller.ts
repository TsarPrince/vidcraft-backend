import { Request, Response } from 'express'
import ffmpeg from 'fluent-ffmpeg'
import { join } from 'path'
import fs from 'fs'
import ApiResponse from '../types/Response.type'
import uploadVideo from '../utils/upload'
import downloadVideo from '../utils/fetch'

import { TIME_DURATION, FOLDERS, WATERMARK_PATH } from '../constants/ffmpeg.constant'
import { execSync } from 'child_process'

const SUPABASE_VIDEO_URL = process.env.SUPABASE_VIDEO_URL

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffprobePath = require('@ffprobe-installer/ffprobe').path
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

  let filePath1: string, filePath2: string, outputPath: string
  try {
    const { id1, id2 } = req.body

    const blob1 = await downloadVideo(id1)
    const blob2 = await downloadVideo(id2)
    const buffer1 = Buffer.from(await blob1.arrayBuffer())
    const buffer2 = Buffer.from(await blob2.arrayBuffer())
    filePath1 = 'file1.mp4'
    filePath2 = 'file2.mp4'
    fs.writeFileSync(filePath1, buffer1)
    fs.writeFileSync(filePath2, buffer2)


    const shell_scrpit = [
      `ffmpeg -i file1.mp4 -t ${TIME_DURATION} -video_track_timescale 60000 -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1" trimmed1.mp4 -y`,
      `ffmpeg -i file2.mp4 -t ${TIME_DURATION} -video_track_timescale 60000 -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1" trimmed2.mp4 -y`,
      `echo file 'trimmed1.mp4' > list.txt`,
      `echo file 'trimmed2.mp4' >> list.txt`,
      `ffmpeg -f concat -safe 0 -i list.txt -c copy merged.mp4 -y`,
      `ffmpeg -i merged.mp4 -i ${WATERMARK_PATH} -filter_complex "overlay=x=(main_w-overlay_w-20):y=(main_h-overlay_h-20)" result.mp4 -y`,
      `rm trimmed1.mp4`,
      `rm trimmed2.mp4`,
      `rm list.txt`,
      `rm merged.mp4`
    ]

    shell_scrpit.forEach(cmd => {
      console.log(cmd)
      execSync(cmd, { encoding: 'utf-8' })
    })

    outputPath = 'result.mp4'
    const outputFile = 'PROCESSED-' + Date.now() + '-' + id1 + '-' + id2 + '.mp4'
    console.log('uploading to supabase')
    const { path } = await uploadVideo(outputPath, outputFile, 'video/mp4')

    console.log('DONE!')

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
    try {
      fs.unlinkSync(outputPath)
    } catch (err) {
      console.log(err)
    }
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