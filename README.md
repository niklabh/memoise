memoise
=======
[![CircleCI](https://circleci.com/gh/niklabh/memoise.svg?style=svg)](https://circleci.com/gh/niklabh/memoise)

memoise is a memoisation/caching module for node.js. Results are cached in redis or memory, via a backing store.
Redis is used if REDIS_HOST, REDIS_PORT and REDIS_DB environment variables are set otherwise it fallback to in memory
lru store.

Usage
------

create a cache with max 10000 items(only for lru) and a TTL of 300 seconds

```
const Memoise = require('memoise')
const memoiser = new Memoise({ max: 10000, maxAge: 300 })

```
Then wrap your original async function like this

```
const cached = memoiser.wrap(original);
```

Now call the wrapper as you would call the original function

```
await cached(arg1, arg2,...argn);
```

API
---

### new Memoise
Creates a new Memoiser and returns it

### memoiser.wrap
Wraps a given function and returns a cached version of it.
Functions to be wrapped must be async function and not object methods.
Sometimes, you may want to use a different value of this inside the caller function.

The arguments are used to create the key. Subsequently, when the wrapped function is called with the same n arguments, it would lookup the key in LRU, and if found, call the callback with the associated data. It is expected that the callback will never modified the returned data, as any modifications of the original will change the object in cache.

### memoiser.debug

The debug interface can be used to see stats and cache efficiency.
