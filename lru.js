'use strict'

const LRU = require('lru-cache')
const { ONE_HOUR, TEN_THOUSAND } = require('./constant')

const init = (options) => {
  const lruOptions = {
    length: (value) => JSON.stringify(value).length,
    max: options.max || TEN_THOUSAND,
    maxAge: options.maxAge || ONE_HOUR
  }
  const lru = LRU(lruOptions)
  const store = {
    get: (key) => lru.get(key),

    set: (key, val) => lru.set(key, val),

    expire: (key) => lru.del(key),

    reset: () => lru.reset()
  }

  return store
}

module.exports = { init }
