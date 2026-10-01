// Reads settings from environment variables, with safe local defaults.
const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/archcanvas',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret'
}

export const isProduction = env.nodeEnv === 'production'

// Refuse to run in production with the built-in development secrets.
if (isProduction) {
  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
    const value = process.env[key]
    if (!value || value.length < 32 || value.startsWith('change-me')) {
      throw new Error(`${key} must be set to a random string of at least 32 characters`)
    }
  }
}

export default env
