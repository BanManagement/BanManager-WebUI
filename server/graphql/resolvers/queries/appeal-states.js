module.exports = async function appealStates (obj, args, { state }) {
  const results = await state.dbPool('bm_web_appeal_states').select('id', 'name')

  return results
}
