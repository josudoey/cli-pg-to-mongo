module.exports = function (prog) {
  prog
    .command('list  [collection]')
    .description('list collection')
    .action(async function (colName, opts) {
      const conf = require('../config')
      conf.load(prog.conf)
      const url = conf.get('mongoose.url')
      const mongoose = require('mongoose')
      mongoose.Promise = Promise
      await mongoose.connect(url)
      const db = mongoose.connection.db
      let cursor
      if (colName) {
        cursor = db.collection(colName).find({})
      } else {
        cursor = db.listCollections()
      }
      for (let item = await cursor.next(); item !== null; item = await cursor.next()) {
        console.log(JSON.stringify(item, null, 4))
      }
      mongoose.connection.close()
    })
}
