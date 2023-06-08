import { Request, Response } from 'express'
import supabase from '../config/db.config'
import fs from 'fs'

import { Bucket } from '@supabase/storage-js'

import ApiResponse from '../types/Response.type'

interface UploadSuccessResponse extends ApiResponse {
  data: {
    path: string
  }
}

interface ListBucketResponse extends ApiResponse {
  data: Bucket[]
}

const uploadVideo = async (req: Request, res: Response) => {
  const file = req.file
  try {
    const { originalname, path, mimetype } = file
    const newFileName = Date.now() + '-' + originalname
    const fileBuffer = fs.readFileSync(path)
    const { data, error } = await supabase.storage.from('video-bucket').upload(newFileName, fileBuffer, {
      // multer renames the file to prevent naming conflicts
      // pass in content type explicitly for supabase
      contentType: mimetype
    })

    if (error) {
      throw new Error(error.message)
    }

    const json: UploadSuccessResponse = {
      message: 'Video uploaded successfully',
      data,
      error: null
    }
    res.status(200).json(json)

  } catch (error) {
    console.error(error)
    const json: ApiResponse = {
      message: error.message,
      data: null,
      error: 'Failed to upload video',
    }
    res.status(500).json(json)

  } finally {
    // Delete the file from the server
    if (file) {
      fs.unlinkSync(file.path)
    }
  }
}

const listBuckets = async (_: Request, res: Response) => {
  try {
    const { data, error } = await supabase.storage.listBuckets()
    console.log(data)

    if (error) {
      throw new Error(error.message)
    }
    const json: ListBucketResponse = { message: 'success', data, error: null }
    res.status(200).json(json)

  } catch (error) {
    console.error(error)
    const json: ApiResponse = {
      message: error.message,
      data: null,
      error: 'Failed to fetch bucket items',
    }
    res.status(500).json(json)
  }
}

const emptyBucket = async (_: Request, res: Response) => {
  try {
    const { data, error } = await supabase.storage.emptyBucket('video-bucket')
    console.log(data)

    if (error) {
      throw new Error(error.message)
    }

    const json: ApiResponse = {
      message: 'Bucket emptied successfully',
      data,
      error: null,
    }
    res.status(200).json(json)

  } catch (error) {
    console.error(error)
    const json: ApiResponse = {
      message: error.message,
      data: null,
      error: 'Failed to fetch bucket items',
    }
    res.status(500).json(json)
  }
}

export default {
  uploadVideo,
  listBuckets,
  emptyBucket
}