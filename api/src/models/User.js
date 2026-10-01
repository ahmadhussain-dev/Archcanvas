import mongoose from 'mongoose'

export const ROLES = ['user', 'admin']

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address']
    },
    // bcrypt hash, set by the auth service. Never returned to the client.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'user' },
    // Lockout after repeated failed logins (5 tries, 15 minutes).
    failedLoginCount: { type: Number, default: 0, min: 0, select: false },
    lockUntil: { type: Date, select: false },
    // Bumped on logout so every refresh token issued before it stops working.
    tokenVersion: { type: Number, default: 0, min: 0, select: false },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
)

userSchema.virtual('isLocked').get(function () {
  return Boolean(this.lockUntil && this.lockUntil > new Date())
})

userSchema.set('toJSON', {
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.passwordHash
    delete ret.failedLoginCount
    delete ret.lockUntil
    delete ret.tokenVersion
    return ret
  }
})

export default mongoose.models.User ?? mongoose.model('User', userSchema)
