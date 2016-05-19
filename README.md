entulib
=======
[![npm version](https://badge.fury.io/js/entulib.svg)](https://badge.fury.io/js/entulib)
[![Build Status](https://travis-ci.org/mitselek/entulib.svg?branch=master)](https://travis-ci.org/mitselek/entulib)
[![Dependency Status](https://david-dm.org/mitselek/entulib.svg)](https://david-dm.org/mitselek/entulib)
[![DOI](https://zenodo.org/badge/6763/mitselek/entulib.png)](http://dx.doi.org/10.5281/zenodo.12356)


Library for authenticated access to Entu database API.

| Service Request | Description | HTTP Method
|:---- |:---- |:---- |:---:|:---:|
| Get Entity | Fetch Entity by ID | GET |
| Find Entity | Description | GET |
| Get Childs | Description | GET |
| Get Relationships | Description | GET |
| Edit Entity | Description | PUT |
| Add Entity | Description | POST |
| Poll | Description | GET |


Authentication of application is done with

  - API key
    - that is stored in Entu
      - and is attached to entity
        - that identifies the application


#### Usage
`$ npm install entulib --save`,  
then `var entu = require('entulib')`



#### Methods to please your application
All methods return a promise
- getEntity(id, entuOptions)
- getEntities(definition, limit, page, entuOptions)
- getChilds(parentEid, definition, entuOptions)
- getRelationships(parentEid, definition, entuOptions)
- edit(params, entuOptions)
- add(parentEid, definition, properties, entuOptions)
- pollUpdates(entuOptions)
- pollParents(id, entuOptions)


#### EntuOptions

```
entuOptions = {
  entuUrl: entuUrl,
  user: user,
  key: key
}
```
