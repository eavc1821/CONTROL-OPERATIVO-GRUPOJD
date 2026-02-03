const required = [
  'DATABASE_URL',
  'JWT_SECRET'
]

module.exports = function validateEnv() {
  required.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required env variable: ${key}`)
    }
  })
}
