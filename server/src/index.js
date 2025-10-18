import express from 'express'
import dotenv from 'dotenv'
import helmet from 'helmet'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'
import adminRoutes from './routes/admin.js'
import uploadRoutes from './routes/uploads.js'
import shopRoutes from './routes/shops.js'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/shops', shopRoutes)

// serve uploaded files
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.get('/', (req, res) => res.json({ ok: true, message: 'Marketplace backend' }))

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Server running on port ${port}`))
