import cloudinaryModule from 'cloudinary'
const cloudinary = cloudinaryModule.v2 || cloudinaryModule

// configure via CLOUDINARY_URL or environment vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

// Helper to upload a video (reel). Use upload() with resource_type: 'video'.
export async function uploadReel(streamOrFilePath, opts = {}) {
  // opts: { folder, public_id, upload_preset }
  const params = {
    resource_type: 'video',
    folder: opts.folder || 'reels',
    ...(opts.upload_preset ? { upload_preset: opts.upload_preset } : {}),
    ...(opts.public_id ? { public_id: opts.public_id } : {}),
    chunk_size: 6000000, // allow large uploads
  }
  // streamOrFilePath may be a path or a buffer/stream; cloudinary handles paths directly
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(streamOrFilePath, params, (error, result) => {
      if (error) return reject(error)
      resolve(result)
    })
  })
}

export default cloudinary

// Helper: upload stream (for multer memory buffer or stream)
export function uploadReelStream(stream, opts = {}) {
  return new Promise((resolve, reject) => {
    const uploader = cloudinary.uploader.upload_stream({ resource_type: 'video', folder: opts.folder || 'reels', ...(opts.upload_preset ? { upload_preset: opts.upload_preset } : {}) }, (error, result) => {
      if (error) return reject(error)
      resolve(result)
    })
    if (stream.pipe) {
      stream.pipe(uploader)
    } else if (stream.buffer) {
      // multer memoryStorage: stream is a buffer
      uploader.end(stream.buffer)
    } else {
      reject(new Error('Unsupported stream type'))
    }
  })
}
