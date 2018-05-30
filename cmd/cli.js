module.exports = function (prog) {
  prog
    .command('mongo-list [collection]')
    .description('list mongo collection')
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

  prog
    .command('pg-list [table-name]')
    .description('list pg table')
    .action(async function (tbName, opts) {
      const { Pool, Client } = require('pg')
      const conf = require('../config')
      conf.load(prog.conf)
      const connectionString = conf.get('pg.connectionString')
      const client = new Client({
        connectionString: connectionString
      })

      await client.connect()
      if (tbName) {
        const sql = `select * from ${tbName}`
        const cursor = pgQuery(client, sql)
        for (let item = await cursor.next(); item !== null; item = await cursor.next()) {
          console.log(JSON.stringify(item, null, 4))
        }
      } else {
        const sql = `select * from information_schema.tables WHERE table_schema='public'`
        const cursor = pgQuery(client, sql)
        for (let item = await cursor.next(); item !== null; item = await cursor.next()) {
          console.log(JSON.stringify(item, null, 4))
        }
      }
      await client.end()
    })

  prog
    .command('pg-migrate [table-name]')
    .description('migrate pg table to mongo')
    .action(async function (tbName, opts) {
      const { Pool, Client } = require('pg')
      const conf = require('../config')
      conf.load(prog.conf)
      const connectionString = conf.get('pg.connectionString')
      const client = new Client({
        connectionString: connectionString
      })

      await client.connect()

      const migrateTb = async function (name) {
        console.log(`migrate ${name}`)
        const sql = `select * from ${name}`
        const cursor = pgQuery(client, sql)
        for (let item = await cursor.next(); item !== null; item = await cursor.next()) {
          console.log(JSON.stringify(item, null, 4))
          console.log(`insert to ${name} `)
        }
      }

      if (tbName) {
        await migrateTb(tbName)
      } else {
        const sql = `select * from information_schema.tables WHERE table_schema='public'`
        const query = await client.query(sql)
        for (const item of query.rows) {
          const {table_name} = item
          await migrateTb(table_name)
        }
      }
      await client.end()
    })

  function pgQuery (client, sql, params) {
    const Cursor = require('pg-cursor')
    const cursor = client.query(new Cursor(sql, params))
    let items = []
    const next = function () {
      if (items.length) {
        return Promise.resolve(items.shift())
      }

      return new Promise((resolve, reject) => {
        cursor.read(10, (err, rows) => {
          if (err) {
            return reject(err)
          }
          if (!rows.length) {
            return resolve(null)
          }
          items = rows
          return resolve(items.shift())
        })
      })
    }
    return {
      next: next
    }
  }
}
