// Gives an existing account the admin role (admins edit material prices).
// Usage: npm run make-admin -w @archcanvas/api -- someone@example.com
import mongoose from 'mongoose'
import env from '../config/env.js'
import { connectDatabase } from '../config/db.js'
import { User } from '../models/index.js'

async function makeAdmin(email) {
  if (!email) throw new Error('Pass the account email, e.g. npm run make-admin -w @archcanvas/api -- you@example.com')
  await connectDatabase(env.mongoUri)
  const user = await User.findOneAndUpdate({ email: email.toLowerCase().trim() }, { role: 'admin' }, { new: true })
  if (!user) throw new Error(`No account with email ${email}. Sign up first, then run this again.`)
  console.log(`${user.email} is now an admin.`)
}

makeAdmin(process.argv[2])
  .catch((err) => {
    console.error(err.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
