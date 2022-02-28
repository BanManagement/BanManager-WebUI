module.exports = {
  collectCoverage: true,
  testMatch: ['/**/test/*.test.js'],
  resetModules: true,
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
}
