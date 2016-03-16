var entu = require('entulib')

entuOptions = {
    entuUrl: 'https://devm.entu.ee',
    user: '155058',
    key: 'ameff79oy7t4ocgdf'
}

entu.getEntity(155058, entuOptions)
.then(function(opEntity) {
    console.log(opEntity.get())
})
.catch(function(reason) {
    console.log('Reading entity failed: ', reason)
})
