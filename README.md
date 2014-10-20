entulib
=======

Library for authenticated access to Entu database API

## 7 javascript (5 python) methods to please your application

### python 3
#### class EntuLib():
\__init__(self, entu_user_id, entu_user_key, entu_url):  
>
>  - def get_entity(self, entity_id):  
>    - on success return {result: entity, time: 0.009}
>    - else return {time: 0.009, error: "Entity with given ID is not found!"}
>  - def find_entity(self, definition, query, limit=1000000):
>    - on success return { count: count, result: [entitylist], time: 0.011}
>    - else return { count: 0, result: [], time: 0.086 }
>  - def create_entity(self, parent_id, definition, properties={}):
>    - on success return {result: { id: 685 }, time: 0.073}
>    - else return {time: 0.01, error: message}
>  - def add_properties(self, entity_id, definition, properties):
>    - on success return {result: { id: '686' }, time: 0.024}
>    - else return {time: 0.018, error: message}
>  - def add_file(self, entity_id, property_definition, abspath):
>    - on success return {time: 0.088}
>    - else return {time: 0.018, error: message}


### javascript
#### var EntuLib = function EntuLib(entu_user_id, entu_user_key, entu_url)
> - getEntity: function (entity_id, callback)
>    - on success callback ({result: entity, time: 0.009})
>    - else callback ({time: 0.009, error: "Entity with given ID is not found!"})
> - getChilds: function (entity_id, callback)
>    - on success callback ({count: count, result: {}, time: 0.097})
>    - else callback ({count: 0, result: {definition: {entities:[entities]}}, time: 0.094})
> - getReferrals: function (entity_id, callback)
>    - on success callback ({result: entity, time: 0.009})
>    - else callback ({count: 0, result: {definition: {entities:[entities]}}, time: 0.095})
> - findEntity: function (definition, query, limit, callback)
>    - on success callback ({ count: count, result: [entitylist], time: 0.011})
>    - else callback ({ count: 0, result: [], time: 0.086 })
> - createEntity: function (parent_id, definition, properties, callback)
>    - on success callback ({result: { id: 685 }, time: 0.073})
>    - else callback ({time: 0.01, error: message})
> - addProperties: function (entity_id, definition, properties, callback)
>    - on success callback ({result: { id: '686' }, time: 0.024})
>    - else callback ({time: 0.018, error: message})
> - addFile: function (entity_id, property_definition, abspath, callback)
>    - on success callback ({time: 0.088})
>    - else callback ({time: 0.018, error: message})
