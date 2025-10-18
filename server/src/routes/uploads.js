import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { v2 as cloudinary } from 'cloudinary'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadDir = path.join(__dirname, '..', '..', 'uploads')
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

const upload = multer({ storage })
const router = express.Router()

// configure cloudinary from env
cloudinary.config({
  cloud_name: process.env.Cloudinary_Cloud_Name,
  api_key: process.env.Cloudinary_API_Key,
  api_secret: process.env.Cloudinary_API_Secret,
})

// single file upload -> uploads to Cloudinary and returns { url }
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  try {
    const localPath = req.file.path
    const result = await cloudinary.uploader.upload(localPath, { folder: 'gestion_de_boutique' })
    // remove local file
    try { fs.unlinkSync(localPath) } catch (e) { /* ignore */ }
    return res.json({ url: result.secure_url })
  } catch (err) {
    console.error('Cloudinary upload failed', err)
    return res.status(500).json({ error: 'upload_failed' })
  }
})

export default router
