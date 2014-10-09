var https   = require('https')
var crypto = require('crypto')
var querystring = require('querystring')
var fs       = require('fs')


function EntuLib(entu_user_id, entu_user_key, entu_url) {

    var POLICY_EXPIRATION_MINUTES = 15
    var API_VERSION = '/api2/'
    var returned_data = false

    //
    // Possible values for entu_query =
    //             Fetch entity by id | {}
    //                  Create entity | { 'definition': entitydefinition, ('entitydefinition-propertydefinition':value) }
    //      Search and fetch entities | { 'definition': entitydefinition, 'query': query, 'limit': limit }
    //       PUT properties to entity | { ('entitydefinition-propertydefinition':value) }
    //
    var __create_policy = function __create_policy(entu_query) {
        var conditions = []
        var entu_query = entu_query === undefined ? {} : entu_query
        var conditions = Object.keys(entu_query).map(function(v) { return entu_query[v] })
        var expiration_time = new Date()
        expiration_time.setMinutes(expiration_time.getMinutes() + POLICY_EXPIRATION_MINUTES)
        var policy = { 'expiration': expiration_time.toISOString(), 'conditions': conditions }
        policy = JSON.stringify(policy)
        encoded_policy = new Buffer(new Buffer(policy).toString('utf8')).toString('base64')
        var signature = crypto.createHmac('sha1', entu_user_key).update(encoded_policy).digest().toString('base64')
        entu_query.policy = encoded_policy
        entu_query.user = entu_user_id
        entu_query.signature = signature
        return querystring.stringify(entu_query)
    }

    var __submit_it = function __submit_it(callback, path, method, data) {
        var options = {
            hostname: entu_url,
            path: path,
            port: 443,
            method: method
        }
        if (data !== undefined) {
            options.headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': data.length
            }
        }
        var buffer = ''
        var request = https.request(options)
        request.on('response', function response_handler( response ) {
            response.on('data', function chunk_sticher(chunk) {
                buffer += chunk
            })
            response.on('end', function response_emitter() {
                var str = buffer.toString()
                var returned_data = JSON.parse(str)
                callback(returned_data)
            })
        })
        if (data !== undefined) {
            request.write(data)
        }
        request.end()
    }

    return {
        getEntity: function (callback, entity_id) {
            var data = __create_policy()
            var path = API_VERSION + 'entity-' + entity_id + '?' + data
            __submit_it(callback, path, 'GET')
        },
        findEntity: function (callback, definition, query, limit) {
            var entu_query = {
                'definition': definition,
                'query': query,
                'limit': limit
            }
            var data = __create_policy(entu_query)
            var path = API_VERSION + 'entity?' + data
            __submit_it(callback, path, 'GET')
        },
        createEntity: function (callback, parent_id, definition, properties) {
            var entu_query = {}
            entu_query.definition = definition
            for (var key in properties) {
                entu_query[definition + '-' + key] = properties[key]
            }
            var data = __create_policy(entu_query)
            var path = API_VERSION + 'entity-' + parent_id
            __submit_it(callback, path, 'POST', data)
        },
        addProperties: function (callback, entity_id, definition, properties) {
            var entu_query = {}
            for (var key in properties) {
                entu_query[definition + '-' + key] = properties[key]
            }
            var data = __create_policy(entu_query)
            var path = API_VERSION + 'entity-' + entity_id
            __submit_it(callback, path, 'PUT', data)
        },
        addFile: function (callback, entity_id, property_definition, abspath) {
            if (!fs.existsSync(abspath))
                callback({'Error':'No such file','Path':abspath})
            var entu_query = {
                'filename': abspath,
                'entity': entity_id,
                'property': property_definition
            }
            var data = __create_policy(entu_query)
            console.log(abspath)
            console.log(data)
            var path = API_VERSION + 'file?' + data
            file_contents = fs.readFileSync(abspath)
            console.log(file_contents)
            __submit_it(callback, path, 'POST', file_contents)
        }
    }
}

var print_result = function print_result(data) {
    console.log(stringifier(data))
}

var stringifier = function stringifier(o) {
    var cache = [];
    return JSON.stringify(o, function(key, value) {
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                // Circular reference found, replace key
                return 'Circular reference to: ' + key
            }
            // Store value in our collection
            cache.push(value)
        }
        return value
    }, '\t')
}

var entu_user_id = 1001
var entu_user_key = 'test the access with help of the key'
var entu_url = 'yourdomain.entu.ee'
var EntuLib = new EntuLib(entu_user_id, entu_user_key, entu_url)
