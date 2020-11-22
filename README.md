# express-promisify-router

An ultra-lightweight JavaScript library for Express. Write middleware and routes using async/await. You can return a promise directly from the router handler without try-catch block and send back the data to the user.

## Usage

```javascript
// Usage Example
const { Router } = require('express-promisify-router');
const router = Router();

router.get('/foo', async (req, res, next) => {
    const user = await UserService.findById();
    if (!user) {
        throw new NotFound('User not found');
    }
    return users;
});
```

```javascript
// Usage Example
const { wrapRouter } = require('express-promisify-router');
const router = wrapRouter(express.Router());

router.get('/foo', async (req, res, next) => {
    // Do something..
    throw new Error('Exception!');
});
```

```javascript
// Usage Example
const { Router } = require('express-promisify-router');
const router = Router();

router
    .route('/foo')
    .get((req, res, next) => {
        return UserService.fetch();
    })
    .post((req, res, next) => {
        return UserService.create();
    });
```

### You can just return the body and send back the data to the user.

```javascript
// Usage Example
const { wrapRouter } = require('express-promisify-router');
const router = wrapRouter(express.Router());

router.get('/foo', async (req) => {
    return await new Promise((resolve) => {
        resolve({ message: 'Hello!' });
    });
});
```

### You can use array of middlewares

Use `next()` callback if you want to jump to the next middleware

```javascript
// Usage Example
const { wrapRouter } = require('express-promisify-router');
const router = wrapRouter(express.Router());

router.get('/foo', [
    (req, res, next) => {
        next();
    },
    async (req, res, next) => {
        throw new Error('Exception!');
    }
]);
```

### Feel free and use middleware a classic way

```javascript
// Usage Example
const { wrapRouter } = require('express-promisify-router');
const router = wrapRouter(express.Router());

router.get('/foo', [
    (req, res, next) => {
        next();
    },
    (req, res, next) => {
        try {
            res.send();
        } catch (err) {
            next(err);
        }
    }
]);
```

## API

### wrapRouter()

The `wrapRouter()` is the best way to add async/await
support to your Express app or Router.

### wrapFunction()

If you need more control you can use the `wrapFunction()` function.
This function wraps an async Express middleware and adds async/await support.
