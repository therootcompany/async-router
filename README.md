# [@root/async-router](https://github.com/therootcompany/async-router)

[![express-async-router_14 1 1-youtube](https://user-images.githubusercontent.com/122831/120441794-2cb13180-c342-11eb-9747-6db1e472b3be.jpg))[https://www.youtube.com/watch?v=XFn0SJmGYs4&list=PLxki0D-ilnqZfyo2dZe11ZNGP7RJxJcoA&index=18]

A lightweight, zero-dependency JavaScript library to bring native `Promise`s and
`async`/`await` to Express.

Wraps the Express Router and provides a drop-in replacement to allow you to
progressively enhance your routes with Promise and await support.

```js
// Handle Async & Promise routes - and normal routes too!
app.get('/foo', async function (req, res) {
    // no more try/catch wrappers
    // no more 'unhandledRejection' errors
    let user = await UserService.findById(req.user.id);
    
    // res.json() can be called automatically
    return users;
});
```

## Features

-   [x] API-compatible with `express.Router()`
    -   [x] NO refactoring required!
-   [x] supports `Promise`s
-   [x] supports `async`/`await`
-   [x] Proper error handling!
    - [x] No more `unhandledPromiseRejectionWarning`  
    - [x] No more `unhandledRejection`
    - [x] No uncaught exception server crashes
-   [x] `res.json()` can be called automatically

## Usage

### TL;DR

Swap out `app` for a the async router, and handle the server separately:

```js
let app = require('@root/async-router').Router();

// ...

let server = express().use('/', app);
http.createServer(server).listen(3000, onListen);
```

Keep existing routes just they way they are...

```js
// yuck!
app.get('/profile', async function (req, res, next) {
    try {
        let results = await ProfileModel.get(req.user.id);
        res.json(results);
    } catch(e) {
        return next(e);
    }
})
```

Or give them a facelift:

```js
// yay!
app.get('/profile', async function (req, res) {
    return await ProfileModel.get(req.user.id);
})
```

#### Caveats

If you need to set express options, you'll move that down to the bottom as well:

```js
let app = require('@root/async-router').Router();

// ...

let server = express()
    .use('trust proxy', 1)
    .use('view engine', 'pug')
    .use('/', app);
http.createServer(server).listen(3000, onListen);
```

Also, if you do happen to have a few routes that explicitly
`res.json()` in a callback after having returning a value,
those would need to be updated - a very rare case, but I'm
sure it exists in some code somewhere.

### Full Example

```js
'use strict';

let http = require('http');
let express = require('express');
let app = require('@root/async-router').Router();

// Handle Async & Promise routes
app.get('/foo', async function (req, res) {
    let user = await UserService.findById();
    if (!user) {
        throw new Error('User not found');
    }

    // res.json() will be called automatically
    return users;
});

// Handles existing routes too - no refactoring required!
app.get('/foo', async function (req, res) {
    try {
        let user = await UserService.findById();
    } catch (e) {
        console.error('Unexpected');
        console.error(e);
        res.statusCode = 500;
        res.end('Internal Server Error');
    }

    if (!user) {
        res.statusCode = 404;
        res.json({ error: 'User not found' });
        return;
    }

    res.json(users);
});

// Handle errors (must come after associated routes)
app.use('/', function (err, req, res, next) {
    console.error('Unhandled Error');
    console.error(err);
    res.statusCode = 500;
    res.end(err.message);
});

// Start node.js express server
let server = express().use('/', app);
http.createServer(server).listen(3000, function () {
    console.info('Listening on', this.address());
});
```

Also, since it's useful to have this snippet for demos:

```js
async function sleep(ms) {
    await new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}
```

## API

### Router() - same as express.Router()

```js
let app = require('@root/async-router').Router();
```

This is just a wrapper around `express.Router()`, which is what provides the
default router and "mini apps" of express - so it has all of the same methods
and function signatures:

```js
app.use(path, middlewares);
app.route(path, minApp);
app.head(path, fns);
app.get(path, fns);
app.post(path, fns);
app.patch(path, fns);
app.delete(path, fns);
// ... etc
```

Any incompatibility should be file as a bug.

### NOT an express server

It does NOT copy the top-level express server API. You should still use express for that:

```js
// top-level options are still handled by the express server instance
let server = express()
    .set('trust proxy', 1)
    .set('view engine', 'pug')
    .use('/', app);

require('http')
    .createServer(server)
    .listen(3000, onListen);
    
function onListen() {
    console.info('Listening on', this.address());
}
```

### wrap(app)

The `wrap(app)` is the best way to add async/await
support to your Express app or Router.

```js
let syncApp = express.Router();
let app = require('@root/async-router').wrap(syncApp);
```

## [LICENSE](/LICENSE)

Fork of [`express-promisify-router`][fork] to [bugfix error handling][fix].

[fork]: https://github.com/michal-choluj/express-promisify-router#readme
[fix]: https://github.com/michal-choluj/express-promisify-router/pull/3

MIT License

See [LICENSE](/LICENSE).
