import cloudinaryModule from 'cloudinary'
const cloudinary = cloudinaryModule.v2 || cloudinaryModule

// configure via CLOUDINARY_URL or environment vars
// Accept several common env var name variants to be robust when deploying (Render / .env files).
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.Cloudinary_Cloud_Name || process.env.Cloudinary_CloudName || process.env.CLOUDINARY_CLOUDNAME || process.env.Cloudinary_Cloudname
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || process.env.Cloudinary_API_Key || process.env.CloudinaryApiKey || process.env.CLOUDINARY_APIKEY || process.env.Cloudinary_Api_Key
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || process.env.Cloudinary_API_Secret || process.env.CloudinaryApiSecret || process.env.CLOUDINARY_APISECRET || process.env.Cloudinary_Api_Secret

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  // Helpful warning in logs to make debugging on Render easier
  console.warn('Cloudinary environment variables missing or incomplete. Expected env vars (one of):', {
    CLOUDINARY_CLOUD_NAME: !!CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: !!CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: !!CLOUDINARY_API_SECRET,
  })
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
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
