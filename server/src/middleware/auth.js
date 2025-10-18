import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

export function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })
}

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Missing auth header' })
  const token = authHeader.replace('Bearer ', '')
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' })
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}
