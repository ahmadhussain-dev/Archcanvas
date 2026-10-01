import mongoose from 'mongoose'

// Tests that need MongoDB use MONGODB_TEST_URI (CI runs a mongo service),
// or a local server. If none is reachable they are skipped, not failed.
export async function connectTestDatabase(name) {
  const base = process.env.MONGODB_TEST_URI ?? 'mongodb://127.0.0.1:27017'
  try {
    await mongoose.connect(base, { dbName: `archcanvas_test_${name}`, serverSelectionTimeoutMS: 2000 })
  } catch (err) {
    // CI sets MONGODB_TEST_URI, so a missing database there is a real failure.
    if (process.env.MONGODB_TEST_URI) throw err
    console.warn(`MongoDB not reachable at ${base}; skipping ${name} tests.`)
    return false
  }
  await mongoose.connection.dropDatabase()
  await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()))
  return true
}

export async function closeTestDatabase() {
  if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
}
