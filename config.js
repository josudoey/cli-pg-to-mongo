const dotProp = require('dot-prop')
const fs = require('graceful-fs')
const makeDir = require('make-dir')
const writeFileAtomic = require('write-file-atomic')
const makeDirOptions = {mode: 0o0700}
const writeFileOptions = {mode: 0o0600}
const path = require('path')
class Store {
  constructor (path) {
    this.path = path
  }

  load (opts = {
    defaults: {},
    autoCreate: true
  }) {
    try {
      return Object.assign({},
        opts.defaults,
        JSON.parse(fs.readFileSync(this.path, 'utf8')
        ))
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err
      }
      const val = Object.assign({}, opts.defaults)
      if (opts.autoCreate) {
        this.save(val)
      }
      return val
    }
  }

  save (val) {
    try {
      makeDir.sync(path.dirname(this.path), makeDirOptions)
      writeFileAtomic.sync(this.path, JSON.stringify(val, null, 4), writeFileOptions)
    } catch (err) {
      throw err
    }
  }
}

class Config {
  constructor (defaults) {
    this.defaults = defaults
    this.cache = Object.assign({}, defaults)
  }

  load (path, opts = { autoCreate: true }) {
    const store = this.store = new Store(path)
    const defaults = this.defaults
    this.cache = store.load({
      defaults: defaults,
      autoCreate: opts.autoCreate
    })
  }

  get (key) {
    const config = this.cache
    if (dotProp.has(config, key)) {
      return dotProp.get(config, key)
    }
    return config[key]
  }

  set (key, val) {
    const config = this.cache
    if (arguments.length === 1) {
      for (const k of Object.keys(key)) {
        dotProp.set(config, k, key[k])
      }
    } else {
      dotProp.set(config, key, val)
    }
  }

  delete (key) {
    dotProp.delete(this.cache, key)
  }

  save () {
    this.store.save(this.cache)
  }
}

exports = module.exports = new Config({
  mongoose: {
    url: 'mongodb://localhost:27017/test'

  },
  pg: {
    connectionString: 'postgres:///test'
  }
})
