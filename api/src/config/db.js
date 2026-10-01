import mongoose from 'mongoose'

export async function connectDatabase(uri) {
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
  console.log(`MongoDB connected: ${mongoose.connection.name}`)
}

// 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
export function databaseState() {
  return ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] ?? 'unknown'
}
