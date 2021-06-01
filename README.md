# [@root/async-router](https://github.com/therootcompany/async-router)

A lightweight, zero-dependency JavaScript library to bring native `Promise`s and
`async`/`await` to Express.

Wraps the Express Router and provides a drop-in replacement to allow you to
progressively enhance your routes with Promise and await support.

```js
// Handle Async & Promise routes - and normal routes too!
app.get('/foo', async function (req, res) {
    let user = await UserService.findById();
    
    if (!user) {
        // no more 'unhandledRejection' errors!
        throw new Error('User not found');
    }

    // res.json() can be called automatically
    return users;
});
```

## Features

-   [x] API-compatible with `express.Router()`
    -   [x] NO refactoring required!
-   [x] supports `Promise`s
-   [x] supports `async`/`await`
-   [x] `res.json()` can be called automatically

## Usage

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
let server = express()
    // top-level server options
    .set('trust proxy', 1)
    // set async router
    .use('/', app);

require('http')
    .createServer(server)
    .listen(3000, function () {
        console.info('Listening on', this.address());
    });
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
