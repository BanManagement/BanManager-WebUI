import JSONAPISerializer from 'ember-data/serializers/json-api'

export default JSONAPISerializer.extend(
{ keyForAttribute: function (attr) {
    return attr
  }
, keyForRelationship: function (key) {
    return key
  }
, normalizeDeleteRecordResponse(store, primaryModelClass, payload, id, requestType) {
    let documentHash = this._super(store, primaryModelClass, payload, id, requestType)

    console.log(documentHash)

    return documentHash
  }
})
