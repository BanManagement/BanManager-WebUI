module.exports = async function role (obj, { id }, { state: { loaders } }) {
  return loaders.role.ids.load(id)
}
