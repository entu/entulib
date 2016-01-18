entulib
=======
[![DOI](https://zenodo.org/badge/6763/mitselek/entulib.png)](http://dx.doi.org/10.5281/zenodo.12356)


Library for authenticated access to Entu database API.

| Service Request | Description | HTTP Method
|:---- |:---- |:---- |:---:|:---:|
| Get Entity | Fetch Entity by ID | GET |
| Get Childs | Description | GET |
| Get Referrals | Description | GET |
| Find Entity | Description | GET |
| Create Entity | Description | POST |
| Add Properties | Description | PUT |
| Add File | Description | POST |


Authentication of application is done with

  - API key
    - that is stored in Entu
      - and is attached to entity
        - that identifies the application


## 7 javascript (5 python) methods to please your application


#### var EntuLib = function EntuLib(entu_user_id, entu_user_key, entu_url)
- getEntity: function (entity_id, callback)
    - on success callback ({result: entity, time: 0.009})
    - else callback ({time: 0.009, error: "Entity with given ID is not found!"})
- getChilds: function (entity_id, callback)
    - on success callback ({count: count, result: {}, time: 0.097})
    - else callback ({count: 0, result: {definition: {entities:[entities]}}, time: 0.094})
- getReferrals: function (entity_id, callback)
    - on success callback ({result: entity, time: 0.009})
    - else callback ({count: 0, result: {definition: {entities:[entities]}}, time: 0.095})
- findEntity: function (definition, query, limit, callback)
    - on success callback ({ count: count, result: [entitylist], time: 0.011})
    - else callback ({ count: 0, result: [], time: 0.086 })
- createEntity: function (parent_id, definition, properties, callback)
    - on success callback ({result: { id: 685 }, time: 0.073})
    - else callback ({time: 0.01, error: message})
- addProperties: function (entity_id, definition, properties, callback)
    - on success callback ({result: { id: '686' }, time: 0.024})
    - else callback ({time: 0.018, error: message})
- addFile: function (entity_id, property_definition, abspath, callback)
    - on success callback ({time: 0.088})
    - else callback ({time: 0.018, error: message})
