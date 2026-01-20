require('./bootstrap/env')
require('./bootstrap/validateEnv')

const app = require('./app')

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on ${process.env.NODE_ENV} on port ${PORT}`)
})
