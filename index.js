var request = require('request')
var async = require('async')
var op = require('object-path')
var fs = require('fs')
var md = require('marked')
var crypto = require('crypto')
var Promise = require('bluebird')

var ENTU_API = '/api2'

Promise.onPossiblyUnhandledRejection(function (error) { throw error })

function signData (data, entuOptions) {
  data = data || {}

  if (!entuOptions.user || !entuOptions.key) { return data }

  var conditions = []
  for (let k in data) {
    if (data.hasOwnProperty(k)) {
      conditions.push({ k: data[k] })
    }
  }

  var expiration = new Date()
  expiration.setMinutes(expiration.getMinutes() + 10)

  data.user = entuOptions.user
  var buffStr = JSON.stringify({expiration: expiration.toISOString(), conditions: conditions})
  data.policy = new Buffer(buffStr).toString('base64')
  data.signature = crypto.createHmac('sha1', entuOptions.key).update(data.policy).digest('base64')

  return data
}

// Get entity from Entu
function getEntity (id, entuOptions) {
  var headers = {}
  var qs = {}
  if (entuOptions.authId && entuOptions.authToken) {
    headers = { 'X-Auth-UserId': entuOptions.authId, 'X-Auth-Token': entuOptions.authToken }
  } else {
    qs = signData(null, entuOptions)
  }

  var options = {
    url: entuOptions.entuUrl + ENTU_API + '/entity-' + id,
    headers: headers,
    qs: qs,
    strictSSL: true,
    json: true
  }
  return new Promise(function (fulfill, reject) {
    request.get(options, function (err, response, body) {
      if (err) {
        return reject(err)
      }
      if (response.statusCode !== 200) {
        return reject({
          error: op.get(body, 'error', body), eID: id, status: response.statusCode,
          options: options
        })
      }
      if (!body.result) {
        return reject(op.get(body, 'error', body))
      }
      if (body.error) {
        return reject(op.get(body, 'error', body))
      }
      var properties = op.get(body, 'result.properties', {})
      var entity = {
        id: op.get(body, 'result.id', null),
        displayname: op.get(body, 'result.displayname', null),
        displayinfo: op.get(body, 'result.displayinfo', null),
        definition: op.get(body, 'result.definition.keyname', null),
        picture: entuOptions.entuUrl + ENTU_API + '/entity-' + op.get(body, 'result.id', null) + '/picture',
        right: op.get(body, 'result.right', null),
        properties: {}
      }
      for (var p in properties) {
        if (op.has(properties, [p, 'values'])) {
          for (var v in op.get(properties, [p, 'values'])) {
            if (op.get(properties, [p, 'datatype']) === 'file') {
              op.push(entity, ['properties', p], {
                id: op.get(properties, [p, 'values', v, 'id']),
                created: op.get(properties, [p, 'values', v, 'created']),
                'created_by': op.get(properties, [p, 'values', v, 'created_by']),
                value: op.get(properties, [p, 'values', v, 'value']),
                file: entuOptions.entuUrl + ENTU_API + '/file-' + op.get(properties, [p, 'values', v, 'db_value'])
              })
            } else if (op.get(properties, [p, 'datatype']) === 'text') {
              op.push(entity, ['properties', p], {
                id: op.get(properties, [p, 'values', v, 'id']),
                created: op.get(properties, [p, 'values', v, 'created']),
                'created_by': op.get(properties, [p, 'values', v, 'created_by']),
                value: op.get(properties, [p, 'values', v, 'value']),
                md: md(op.get(properties, [p, 'values', v, 'db_value']))
              })
            } else if (op.get(properties, [p, 'datatype']) === 'reference') {
              op.push(entity, ['properties', p], {
                id: op.get(properties, [p, 'values', v, 'id']),
                created: op.get(properties, [p, 'values', v, 'created']),
                'created_by': op.get(properties, [p, 'values', v, 'created_by']),
                value: op.get(properties, [p, 'values', v, 'value']),
                reference: op.get(properties, [p, 'values', v, 'db_value'])
              })
            } else {
              op.push(entity, ['properties', p], {
                id: op.get(properties, [p, 'values', v, 'id']),
                created: op.get(properties, [p, 'values', v, 'created']),
                'created_by': op.get(properties, [p, 'values', v, 'created_by']),
                value: op.get(properties, [p, 'values', v, 'value'])
              })
            }
          }
        // if (op.get(properties, [p, 'multiplicity']) === 1) { op.set(entity, ['properties', p], op.get(entity, ['properties', p, 0])) }
        }
      }
      fulfill(op(entity))
    })
  })
}

// Get entities by definition
function getEntities (definition, limit, page, entuOptions) {
  if (!definition) {
    return new Promise(function (fulfill, reject) {
      return reject(new Error('Missing "definition"'))
    })
  }
  var qs = { definition: definition }
  var headers = {}
  if (limit) { qs.limit = limit }
  if (page) { qs.page = page }
  if (entuOptions.authId && entuOptions.authToken) {
    headers = { 'X-Auth-UserId': entuOptions.authId, 'X-Auth-Token': entuOptions.authToken }
  } else {
    qs = signData(qs, entuOptions)
  }
  var options = {
    url: entuOptions.entuUrl + ENTU_API + '/entity',
    headers: headers,
    qs: qs,
    strictSSL: true,
    json: true
  }

  return new Promise(function (fulfill, reject) {
    request.get(options, function (error, response, body) {
      if (error) { return reject(error) }
      if (response.statusCode !== 200 || !body.result) {
        return reject(new Error(op.get(body, 'error', body)))
      }

      var entities = []
      async.eachSeries(op.get(body, 'result', []), function (e, callback) {
        getEntity(e.id, entuOptions)
          .then(function (opEntity) {
            entities.push(opEntity)
            callback()
          })
      }, function (error) {
        if (error) { return reject(error) }
        fulfill({ entities: entities, total: body.count, count: entities.length, page: page })
      })
    })
  })
}

// Get childs by parent entity id and optionally by definition
function getChilds (parentEid, definition, entuOptions) {
  if (!parentEid) {
    return new Promise(function (fulfill, reject) {
      return reject(new Error('Missing "parentEid"'))
    })
  }
  var qs = {}
  if (definition) { qs = { definition: definition } }
  var headers = {}
  if (entuOptions.authId && entuOptions.authToken) {
    headers = { 'X-Auth-UserId': entuOptions.authId, 'X-Auth-Token': entuOptions.authToken }
  } else {
    qs = signData(qs, entuOptions)
  }
  var url = '/entity-' + parentEid + '/childs'
  var options = {
    url: entuOptions.entuUrl + ENTU_API + url,
    headers: headers,
    qs: qs,
    strictSSL: true,
    json: true
  }

  return new Promise(function (fulfill, reject) {
    request.get(options, function (error, response, body) {
      if (error) { return reject(error) }
      if (response.statusCode !== 200 || !body.result) { return reject(new Error(op.get(body, 'error', body))) }
      var definitions = Object.keys(body.result)
      var childs = []
      async.eachSeries(
        definitions,
        function doLoop (definition, doLoopCB) {
          var loop = ['result', definition, 'entities']
          async.each(op.get(body, loop, []), function (e, eachCB) {
            getEntity(e.id, entuOptions)
              .then(function (childE) {
                childE.set('_display', {name: e.name, info: e.info})
                childs.push(childE)
                eachCB()
              })
          }, function gotByDef (error) {
            if (error) { return doLoopCB(error) }
            doLoopCB(null)
          })
        },
        function endLoop (error) {
          if (error) { return reject(error) }
          fulfill(childs)
        }
      )
    })
  })
}

// Get referrals by entity id and optionally by definition
function getReferrals (targetEid, definition, entuOptions) {
  if (!targetEid) {
    return new Promise(function (fulfill, reject) {
      return reject(new Error('Missing "targetEid"'))
    })
  }
  var qs = {}
  if (definition) { qs = { definition: definition } }
  var headers = {}
  if (entuOptions.authId && entuOptions.authToken) {
    headers = { 'X-Auth-UserId': entuOptions.authId, 'X-Auth-Token': entuOptions.authToken }
  } else {
    qs = signData(qs, entuOptions)
  }
  var url = '/entity-' + targetEid + '/referrals'
  var options = {
    url: entuOptions.entuUrl + ENTU_API + url,
    headers: headers,
    qs: qs,
    strictSSL: true,
    json: true
  }

  return new Promise(function (fulfill, reject) {
    request.get(options, function (error, response, body) {
      if (error) { return reject(error) }
      if (response.statusCode !== 200 || !body.result) { return reject(new Error(op.get(body, 'error', body))) }
      var definitions = Object.keys(body.result)
      var childs = []
      async.eachSeries(
        definitions,
        function doLoop (definition, doLoopCB) {
          var loop = ['result', definition, 'entities']
          async.each(op.get(body, loop, []), function (e, eachCB) {
            getEntity(e.id, entuOptions)
              .then(function (childE) {
                childE.set('_display', {name: e.name, info: e.info})
                childs.push(childE)
                eachCB()
              })
          }, function gotByDef (error) {
            if (error) { return doLoopCB(error) }
            doLoopCB(null)
          })
        },
        function endLoop (error) {
          if (error) { return reject(error) }
          fulfill(childs)
        }
      )
    })
  })
}

// Edit entity
// params = {
//     entity_id: entity_id,
//     entity_definition: entity_definition,
//     dataproperty: dataproperty,
//     property_id: property_id,
//     new_value: new_value
// }
function edit (params, entuOptions) {
  var body = {}
  var property = params.entity_definition + '-' + params.dataproperty
  if (op.get(params, ['property_id'], false)) {
    property = property + '.' + params.property_id
  }
  body[property] = op.get(params, 'new_value', '')
  var headers = {}
  if (entuOptions.authId && entuOptions.authToken) {
    headers = { 'X-Auth-UserId': entuOptions.authId, 'X-Auth-Token': entuOptions.authToken }
  }
  var qb = signData(body, entuOptions)
  return new Promise(function (fulfill, reject) {
    request.put(
      { url: entuOptions.entuUrl + ENTU_API + '/entity-' + params.entity_id, headers: headers, body: qb, strictSSL: true, json: true, timeout: 60000 },
      function (error, response, body) {
        if (error) { return reject(error) }
        if (response.statusCode !== 201 || !body.result) { return reject(new Error(op.get(body, 'error', body))) }
        fulfill(op.get(body, 'result.properties.' + property + '.0', null))
      }
    )
  })
}

// Add entity
function add (parentEid, definition, properties, entuOptions) {
  var data = { definition: definition }

  for (let p in properties) {
    if (properties.hasOwnProperty(p)) {
      data[definition + '-' + p] = properties[p]
    }
  }

  var headers = {}
  var qb = data
  if (entuOptions.authId && entuOptions.authToken) {
    headers = { 'X-Auth-UserId': entuOptions.authId, 'X-Auth-Token': entuOptions.authToken }
  } else {
    qb = signData(data, entuOptions)
  }

  var options = {
    url: entuOptions.entuUrl + ENTU_API + '/entity-' + parentEid,
    headers: headers,
    body: qb,
    strictSSL: true,
    json: true
  }
  return new Promise(function (fulfill, reject) {
    request.post(options, function (error, response, body) {
      if (error) { return reject(error) }
      if (response.statusCode !== 201 || !body.result) { return reject(new Error(op.get(body, 'error', body))) }
      fulfill(op.get(body, 'result.id', null))
    })
  })
}

// Poll Entu for updated entities
// options: {
//     definition: definition,
//     timestamp: unix_timestamp,
//     limit: limit
// }
// As of API2@2016-02-05, limit < 500, default 50
function pollUpdates (entuOptions) {
  var qs = {}
  op.set(qs, ['limit'], op.get(entuOptions, ['limit'], 50))
  if (entuOptions.definition) { qs.definition = entuOptions.definition }
  if (entuOptions.timestamp) { qs.timestamp = entuOptions.timestamp }

  var headers = {}
  if (entuOptions.authId && entuOptions.authToken) {
    headers = { 'X-Auth-UserId': entuOptions.authId, 'X-Auth-Token': entuOptions.authToken }
  } else {
    qs = signData(qs, entuOptions)
  }

  var options = {
    url: entuOptions.entuUrl + ENTU_API + '/changed',
    headers: headers,
    qs: qs,
    strictSSL: true,
    json: true
  }
  return new Promise(function (fulfill, reject) {
    request.get(options, function (error, response, body) {
      if (error) {
        return reject(error)
      }
      if (response.statusCode !== 200 || !body.result) { return reject(new Error(op.get(body, 'error', body))) }
      fulfill({ 'updates': op.get(body, 'result', []), 'count': op.get(body, 'count', 0) })
    })
  })
}

function pollParents (id, entuOptions) {
  var qs = {}
  var headers = {}
  if (entuOptions.authId && entuOptions.authToken) {
    headers = { 'X-Auth-UserId': entuOptions.authId, 'X-Auth-Token': entuOptions.authToken }
  } else {
    qs = signData(qs, entuOptions)
  }

  var requestUrl = entuOptions.entuUrl + ENTU_API + '/entity-' + id + '/parents'
  // debug('Checking for parents of ' + id + ' from ' + requestUrl)
  var options = {
    url: requestUrl,
    headers: headers,
    qs: qs,
    strictSSL: true,
    json: true
  }
  return new Promise(function (fulfill, reject) {
    request.get(options, function (error, response, body) {
      if (error) { return reject(error) }
      if (response.statusCode !== 200 || !body.result) { return reject(new Error(op.get(body, 'error', body))) }
      fulfill(op.get(body, 'result', []))
    })
  })
}

function createReadStream (fileUrl, entuOptions) {
  var headers = {}
  var qs = {}
  if (entuOptions.authId && entuOptions.authToken) {
    headers = { 'X-Auth-UserId': entuOptions.authId, 'X-Auth-Token': entuOptions.authToken }
  } else {
    qs = signData(null, entuOptions)
  }
  var options = {
    url: fileUrl,
    headers: headers,
    qs: qs
  }
  return request.get(options)
}

// property_definition in form of entity_keyname + "-" + property_keyname
// as for entity with definition "person" and property with definition "photo"
// property_definition = "person-photo"
function uploadFile (fileOptions, entuOptions) {
  // console.log(entuOptions)
  var headers = {}
  var qs = {
    'entity': fileOptions.entityId,
    'property': fileOptions.property,
    'filename': fileOptions.filename,
    'filetype': fileOptions.filetype,
    'filesize': fileOptions.filesize
  }
  if (entuOptions.authId && entuOptions.authToken) {
    headers = { 'X-Auth-UserId': entuOptions.authId, 'X-Auth-Token': entuOptions.authToken }
  } else {
    qs = signData(qs, entuOptions)
  }

  var options = {
    url: entuOptions.entuUrl + ENTU_API + '/file/s3',
    headers: headers,
    qs: qs,
    strictSSL: true,
    json: true
  }
  return new Promise(function (fulfill, reject) {
    request.post(options, function (error, response, body) {
      if (error) {
        console.log("addFileCB: Can't reach Entu")
        reject(error)
      }

      if (response.statusCode !== 200 || !body.result) { return reject(new Error(op.get(body, ['error'], body))) }

      try {
        var formData = body.result.s3.data
      } catch (err) {
        console.log('EntuLib err: ', err)
        console.log(body.result.s3)
        return reject(new Error({fileOptions: fileOptions, qs: qs, err: err}))
      }
      formData['file'] = fs.createReadStream(fileOptions.filepath)

      request.post({url: body.result.s3.url, formData: formData}, function optionalCallback (err, httpResponse) {
        if (err) {
          return reject(new Error({fileOptions: fileOptions, qs: qs, err: err}))
        }
        fulfill({ 'updates': op.get(body, 'result', []), 'count': op.get(body, 'count', 0) })
      })
    })
  })
}

module.exports = {
  getEntity: getEntity,
  getChilds: getChilds,
  getReferrals: getReferrals,
  getEntities: getEntities,
  pollUpdates: pollUpdates,
  pollParents: pollParents,
  createReadStream: createReadStream,
  uploadFile: uploadFile,
  edit: edit,
  add: add
}
