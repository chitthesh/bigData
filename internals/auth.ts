import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

function createPasswordSalt(): string {
  return randomBytes(16).toString('hex')
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex')
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const actualHash = hashPassword(password, salt)
  const actualBuffer = Buffer.from(actualHash, 'hex')
  const expectedBuffer = Buffer.from(expectedHash, 'hex')

  if (actualBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(actualBuffer, expectedBuffer)
}

export { createPasswordSalt, hashPassword, verifyPassword }