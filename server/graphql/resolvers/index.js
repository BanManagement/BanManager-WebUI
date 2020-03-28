const { readdirSync } = require('fs')
const { join } = require('path')
const { GraphQLScalarType } = require('graphql')
const { GraphQLJSONObject } = require('graphql-type-json')

function importFunctions (...dir) {
  return readdirSync(join(...dir)).reduce((files, file) => {
    const fn = require(join(...dir, file))

    if (typeof fn !== 'function') return files

    files[fn.name] = fn

    return files
  }, {})
}

const mutations = importFunctions(__dirname, 'mutations')

const queries = importFunctions(__dirname, 'queries')

const scalars = readdirSync(join(__dirname, 'scalars'))
  .reduce((files, file) => {
    const fn = require(join(__dirname, 'scalars', file))

    if (typeof fn !== 'object') return files

    if (fn instanceof GraphQLScalarType) {
      files[fn.name] = fn
    } else {
      files = { ...files, ...fn }
    }

    return files
  }, { JSONObject: GraphQLJSONObject })

module.exports = { Mutation: mutations, Query: queries, ...scalars }
