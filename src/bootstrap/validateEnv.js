const required = [
  'DATABASE_URL',
  'JWT_SECRET'
]

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required env variable: ${key}`)
  }
})
