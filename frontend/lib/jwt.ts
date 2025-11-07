import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'dev-secret'

export function signToken(payload: object, expiresIn = '7d') {
  return jwt.sign(payload as any, SECRET, { expiresIn })
}

export function verifyToken<T = any>(token: string): T | null {
  try {
    return jwt.verify(token, SECRET) as T
  } catch (e) {
    return null
  }
}
