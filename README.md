entulib
=======
[![DOI](https://zenodo.org/badge/6763/mitselek/entulib.png)](http://dx.doi.org/10.5281/zenodo.12356)
[![Dependency Status](https://david-dm.org/mitselek/entulib.svg)](https://david-dm.org/mitselek/entulib)


Library for authenticated access to Entu database API.

| Service Request | Description | HTTP Method
|:---- |:---- |:---- |:---:|:---:|
| Get Entity | Fetch Entity by ID | GET |
| Find Entity | Description | GET |
| Get Childs | Description | GET |
| Edit Entity | Description | PUT |
| Add Entity | Description | POST |
| Poll | Description | GET |


Authentication of application is done with

  - API key
    - that is stored in Entu
      - and is attached to entity
        - that identifies the application


#### Usage
Add "entulib": "mitselek/entulib" to dependencies, then  
var entu = require('entulib')


#### Methods to please your application
All methods return a promise
- getEntity(id, entuOptions)
- getEntities(definition, limit, page, entuOptions)
- getChilds(parentEid, definition, entuOptions)
- edit(params, entuOptions)
- add(parentEid, definition, properties, entuOptions)
- pollUpdates(entuOptions)


#### EntuOptions

```
entuOptions = {
  entuUrl: entuUrl,
  user: user,
  key: key
}
```
