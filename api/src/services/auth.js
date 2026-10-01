import bcrypt from 'bcryptjs'
import { User } from '../models/index.js'
import { HttpError, conflict, unauthorized } from '../lib/httpError.js'

export const BCRYPT_ROUNDS = 12
export const MAX_FAILED_LOGINS = 5
export const LOCK_MINUTES = 15

// Compared against when the email is unknown, so a wrong email takes as long as a wrong password.
const DUMMY_HASH = bcrypt.hashSync('archcanvas-dummy-password', BCRYPT_ROUNDS)

export async function registerUser({ name, email, password }) {
  if (await User.exists({ email })) throw conflict('An account with this email already exists')
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
  return User.create({ name, email, passwordHash, lastLoginAt: new Date() })
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash +failedLoginCount +lockUntil +tokenVersion')
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH)
    throw unauthorized('Email or password is incorrect')
  }
  if (user.isLocked) throw lockedError(user.lockUntil)

  if (!(await bcrypt.compare(password, user.passwordHash))) {
    const updated = await User.findByIdAndUpdate(
      user._id,
      { $inc: { failedLoginCount: 1 } },
      { new: true, projection: '+failedLoginCount' }
    )
    if (updated.failedLoginCount >= MAX_FAILED_LOGINS) {
      const lockUntil = new Date(Date.now() + LOCK_MINUTES * 60_000)
      await User.updateOne({ _id: user._id }, { $set: { lockUntil, failedLoginCount: 0 } })
      throw lockedError(lockUntil)
    }
    throw unauthorized('Email or password is incorrect')
  }

  user.failedLoginCount = 0
  user.lockUntil = undefined
  user.lastLoginAt = new Date()
  await user.save()
  return user
}

function lockedError(lockUntil) {
  const minutes = Math.max(1, Math.ceil((lockUntil.getTime() - Date.now()) / 60_000))
  const err = new HttpError(423, `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`)
  err.retryAfterSeconds = minutes * 60
  return err
}
