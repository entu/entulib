import os
import urllib.request, urllib.parse
import hashlib
import hmac
import json
import datetime
import base64


class EntuLib():

    def __init__(self, entu_user_id, entu_user_key, entu_url):
        self.entu_user_id = entu_user_id
        self.entu_user_key = entu_user_key.encode('utf-8')
        self.entu_url = entu_url


    def __create_policy(self, entu_query):
        conditions = []
        for k,v in entu_query.items():
            conditions.append({k:v})

        policy = { 'expiration': (datetime.datetime.utcnow()+datetime.timedelta(minutes=15)).strftime('%Y-%m-%dT%H:%M:%SZ'), 'conditions': conditions }
        policy = json.dumps(policy)
        encoded_policy = base64.b64encode(policy.encode('utf-8'))
        signature = base64.b64encode(hmac.new(self.entu_user_key, encoded_policy, hashlib.sha1).digest())

        entu_query.setdefault('policy', encoded_policy.decode('utf-8'))
        entu_query.setdefault('user', self.entu_user_id)
        entu_query.setdefault('signature', signature.decode('utf-8'))

        data = urllib.parse.urlencode(entu_query, doseq=True)
        data = data.encode('utf-8')
        return data


    def __submit_it(self, path, method, data):
        request = urllib.request.Request('%s/%s' % (self.entu_url, path), method=method)
        try:
            f_get = urllib.request.urlopen(request, data)
        except:
            print ('Request: %s/%s' % (self.entu_url, path))
            print ('Data: %s' % data)
            raise
        urllib_result = f_get.read().decode('utf-8')
        if urllib_result:
            return json.loads(urllib_result)


    #
    # Fetch entity by id
    def get_entity(self, entity_id):
        data = self.__create_policy({})
        path = 'entity-%s?%s' % (entity_id, data.decode('utf-8'))
        return self.__submit_it(path=path, method='GET', data=None)


    #
    # Search and fetch entities
    def find_entity(self, definition, query, limit=1000000):
        entu_query = {
            'definition': definition,
            'query': query,
            'limit': limit
        }
        data = self.__create_policy(entu_query)
        path = 'entity?%s' % data.decode('utf-8')
        return self.__submit_it(path=path, method='GET', data=None)


    #
    # Create entity
    def create_entity(self, parent_id, definition, properties={}):
        entu_query = {'definition': definition}
        for k,v in properties.items():
            entu_query['%s-%s' % (definition, k)] = v
        data = self.__create_policy(entu_query)
        path = 'entity-%s' % parent_id
        return self.__submit_it(path=path, method='POST', data=data)


    #
    # PUT properties to entity
    def add_properties(self, entity_id, definition, properties):
        entu_query = {}
        for k,v in properties.items():
            entu_query['%s-%s' % (definition, k)] = v
        data = self.__create_policy(entu_query)
        path = 'entity-%s' % entity_id
        return self.__submit_it(path=path, method='PUT', data=data)


    #
    # POST file property to entity
    def add_file(self, entity_id, property_definition, abspath):
        if not os.path.isfile(abspath):
            return
        if os.path.getsize(abspath) == 0:
            return
        entu_query = {
            'filename': os.path.basename(abspath),
            'entity': entity_id,
            'property': property_definition
        }
        # print (entu_query)
        data = self.__create_policy(entu_query)
        path = 'file?%s' % data.decode('utf-8')
        datafile = open(abspath, 'rb')
        return self.__submit_it(path=path, method='POST', data=datafile.read())
