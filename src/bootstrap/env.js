const path = require('path')
const dotenv = require('dotenv')

const NODE_ENV = process.env.NODE_ENV || 'development'

dotenv.config({
  path: path.resolve(process.cwd(), `.env.${NODE_ENV}`)
})

module.exports = {
  NODE_ENV
}
