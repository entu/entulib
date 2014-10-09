entulib
=======

Library for authenticated access to Entu database

## 5 methods to please your application

### python 3
#### class EntuLib():
- def \__init__(self, entu_user_id, entu_user_key, entu_url):
- def get_entity(self, entity_id):
- def find_entity(self, definition, query, limit=1000000):
- def create_entity(self, parent_id, definition, properties={}):
- def add_properties(self, entity_id, definition, properties):
- def add_file(self, entity_id, property_definition, abspath):


### javascript
#### var EntuLib = function EntuLib(entu_user_id, entu_user_key, entu_url)
- getEntity: function (callback, entity_id)
- findEntity: function (callback, definition, query, limit)
- createEntity: function (callback, parent_id, definition, properties)
- addProperties: function (callback, entity_id, definition, properties)
- addFile: function (callback, entity_id, property_definition, abspath)
