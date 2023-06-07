import { Request, Response } from 'express'
import supabase from '../config/db.config'
import fs from 'fs'

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

    res.status(200).json({ message: 'Video uploaded successfully', data })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to upload video', message: error.message })
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

    res.status(200).json({ message: 'success', data })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed' })
  }
}

const emptyBucket = async (_: Request, res: Response) => {
  try {
    const { data, error } = await supabase.storage.emptyBucket('video-bucket')
    console.log(data)

    if (error) {
      throw new Error(error.message)
    }

    res.status(200).json({ message: 'success', data })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed' })
  }
}

export default {
  uploadVideo,
  listBuckets,
  emptyBucket
}