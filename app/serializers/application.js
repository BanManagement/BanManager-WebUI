import JSONAPISerializer from 'ember-data/serializers/json-api'

export default JSONAPISerializer.extend(
{ keyForAttribute: function (attr) {
    return attr
  }
, keyForRelationship: function (key) {
    return key
  }
, normalizeQueryResponse(store, clazz, payload) {
    var result = this._super(...arguments)

    result.meta = result.meta || {}

    if (payload.links) result.meta.pagination = this.createPageMeta(payload.links)

    return result
  }
, createPageMeta(data) {
    var meta = {}

    Object.keys(data).forEach(type => {
      var link = data[type]
        , a = document.createElement('a')

      meta[type] = {}
      a.href = link

      a.search.slice(1).split('&').forEach(pairs => {
        const [param, value] = pairs.split('=')

        if (param === 'page%5Bnumber%5D') {
          meta[type].number = parseInt(value, 10)
        }
        if (param === 'page%5Bsize%5D') {
          meta[type].size = parseInt(value, 10)
        }

      })

      a = null
    })

    return meta
  }
})
