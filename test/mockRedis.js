const redis = {
  createClient: (host, port) => {
    let map = {}
    const client = {
      get: (key, cb) => {
        cb(null, map[key])
      },
      setex: (key, ttl, obj, cb) => {
        map[key] = obj
        cb()
      },
      expire: (key, ttl, cb) => {
        delete map[key]
        cb()
      },
      flushdb: () => {
        map = {}
      }
    }

    return Promise.resolve(client)
  }
}

module.exports = redis
