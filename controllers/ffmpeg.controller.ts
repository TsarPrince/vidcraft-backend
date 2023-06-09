import { Request, Response } from 'express'
import ffmpeg from 'fluent-ffmpeg'
import { join } from 'path'
import fs from 'fs'
import ApiResponse from '../types/Response.type'
import uploadVideo from '../utils/upload'
import downloadVideo from '../utils/fetch'
import concat from 'ffmpeg-concat'


import { TIME_DURATION, FOLDERS, WATERMARK_PATH } from '../constants/ffmpeg.constant'

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
    filePath1 = join(FOLDERS.TEMP, 'file1.mp4')
    filePath2 = join(FOLDERS.TEMP, 'file2.mp4')
    fs.writeFileSync(filePath1, buffer1)
    fs.writeFileSync(filePath2, buffer2)

    const outputFile = 'PROCESSED-' + Date.now() + '-' + id1 + '-' + id2 + '.mp4'
    outputPath = join(FOLDERS.OUTPUT, outputFile)

    const promise = new Promise<string>((resolve, reject) => {

      // 1. trim videos
      ffmpeg()
        .input(filePath1)
        .inputOptions([`-t ${TIME_DURATION}`])
        .save(join(FOLDERS.TEMP, 'file11.mp4'))
        .on('start', () => { console.log('trimming file1.mp4') })
        .on('error', (err) => { reject(err) })
        .on('end', () => {


          console.log('trimming file2.mp4')
          ffmpeg()
            .input(filePath2)
            .inputOptions([`-t ${TIME_DURATION}`])
            .save(join(FOLDERS.TEMP, 'file22.mp4'))
            .on('error', (err) => { reject(err) })
            .on('end', () => {

              // 2. merge videos
              console.log('merging files')
              const fileList = [join(FOLDERS.TEMP, 'file11.mp4'), join(FOLDERS.TEMP, 'file22.mp4')]
              const listFileName = join(FOLDERS.TEMP, 'list.txt')
              let fileNames = ''

              // ffmpeg -f concat -i list.txt -c copy output.mp4
              fileList.forEach(function (fileName, _) {
                fileNames = fileNames + 'file ' + '\'' + fileName + '\'\n'
              })
              fs.writeFileSync(listFileName, fileNames)
              ffmpeg()
                .input(listFileName)
                .inputOptions(['-f concat', '-safe 0'])
                .outputOptions('-c copy')
                .save(join(FOLDERS.TEMP, 'file33.mp4'))
                .on('error', (err) => { reject(err) })
                .on('end', () => {


                  // 3. add watermark
                  console.log('applying watermark')
                  ffmpeg()
                    .input(join(FOLDERS.TEMP, 'file33.mp4'))
                    .input(WATERMARK_PATH)
                    .complexFilter([{
                      filter: 'overlay', options: { x: 'main_w-overlay_w-20', y: 'main_h-overlay_h-20' },
                      inputs: ['0:v', '1:v'], outputs: 'output'
                    }], 'output')
                    .save(outputPath)
                    .on('error', (err) => { reject(err) })
                    .on('end', async () => {

                      // 4. Upload result to supabase storage
                      console.log('uploading to supabase')
                      const data = await uploadVideo(outputPath, outputFile, 'video/mp4')
                      resolve(data.path)

                      // 5. Delete files from temp folder
                      fs.unlinkSync(join(FOLDERS.TEMP, 'file11.mp4'))
                      fs.unlinkSync(join(FOLDERS.TEMP, 'file22.mp4'))
                      fs.unlinkSync(join(FOLDERS.TEMP, 'file33.mp4'))
                      console.log('DONE!')
                    })
                })
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
    try {
      fs.unlinkSync(outputPath)
      fs.unlinkSync(filePath1)
      fs.unlinkSync(filePath2)
    } catch (err) {
      // one or more file may not exist at filePath
      // in sequential order
      // so we can safely ignore subsequent files and the error
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