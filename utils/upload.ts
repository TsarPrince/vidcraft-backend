import supabase from '../config/db.config'
import fs from 'fs'

interface supabaseData {
  path: string
}

// this function assumes that the file is already present at filePath locally
// it doesn't handles removing the file after upload
const uploadVideo = async (filePath: string, fileName: string, mimeType: string) => {
  return new Promise<supabaseData>(async (resolve, reject) => {
    const fileBuffer = fs.readFileSync(filePath)
    const { data, error } = await supabase.storage.from('video-bucket').upload(fileName, fileBuffer, {
      contentType: mimeType
    })

    if (error) {
      reject(error)
    }
    resolve(data);
  })
}
export default uploadVideo