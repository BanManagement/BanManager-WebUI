module.exports = async function () {
  if (process.env.NODE_ENV !== 'test') require('dotenv').config()
}
