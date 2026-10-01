// Reads settings from environment variables, with safe local defaults.
const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/archcanvas',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
}

export const isProduction = env.nodeEnv === 'production'

export default env
