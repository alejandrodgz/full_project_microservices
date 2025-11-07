import bcrypt from 'bcryptjs'

type User = {
  id: string
  email: string
  passwordHash: string
}

const users = new Map<string, User>()

export function findUserByEmail(email: string): User | undefined {
  return users.get(email)
}

export async function createUser(email: string, password: string): Promise<User> {
  const existing = users.get(email)
  if (existing) throw new Error('User already exists')
  const id = String(users.size + 1)
  const passwordHash = await bcrypt.hash(password, 10)
  const user: User = { id, email, passwordHash }
  users.set(email, user)
  return user
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash)
}

export function getUserPublic(u: User) {
  return { id: u.id, email: u.email }
}
