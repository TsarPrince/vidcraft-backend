import supabase from '../config/db.config'

const SUPABASE_BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME

const downloadVideo = async (id: string) => {
  return new Promise<Blob>(async (resolve, reject) => {
    console.log(`Fetching file name for ${id}`)
    const { data: filesData, error: listError } = await supabase.storage.from(SUPABASE_BUCKET_NAME).list()

    let fileName: string
    filesData?.forEach((file) => {
      if (file.id === id) {
        fileName = file.name
      }
    })

    if (!fileName) reject(new Error(`File with specified id ${id} was not found`))

    console.log(`Downloading file ${fileName}`)
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET_NAME).download(fileName)

    if (error || listError) {
      reject(error)
    }
    resolve(data);
  })
}
export default downloadVideo
