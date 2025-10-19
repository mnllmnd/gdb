import express from 'express'
import multer from 'multer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { v2 as cloudinary } from 'cloudinary'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadDir = path.join(__dirname, '..', '..', 'uploads')
// ensure upload directory exists
try { fs.mkdirSync(uploadDir, { recursive: true }) } catch (error_) { console.debug('upload dir exists or cannot be created', error_) }
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname)
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
    cb(null, name)
  },
})

// Limit upload size to 5MB and accept only common image mimetypes
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Invalid file type'))
    cb(null, true)
  }
})
const router = express.Router()

// configure cloudinary from env
cloudinary.config({
  cloud_name: process.env.Cloudinary_Cloud_Name,
  api_key: process.env.Cloudinary_API_Key,
  api_secret: process.env.Cloudinary_API_Secret,
})

// single file upload -> uploads to Cloudinary and returns { url }
router.post('/', (req, res) => {
  upload.single('file')(req, res, async function (err) {
    if (err) {
      console.error('Upload error', err)
      return res.status(400).json({ error: err.message || 'upload_error' })
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    try {
      const localPath = req.file.path
      const result = await cloudinary.uploader.upload(localPath, { folder: 'gestion_de_boutique' })
      // remove local file
  try { fs.unlinkSync(localPath) } catch (error_) { console.debug('failed to remove local upload', error_) }
      return res.json({ url: result.secure_url })
    } catch (error_) {
      console.error('Cloudinary upload failed', error_)
      return res.status(500).json({ error: 'upload_failed' })
    }
  })
})

export default router
