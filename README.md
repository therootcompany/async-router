# express-async-await

Write Express middleware and route handlers using async/await

## Usage

```javascript
const { wrapRouter } = require('express-async-await');

const app = express();
const router = wrapRouter(express.Router());

router.get('/foo', async (req, res, next) => {
    throw new Error('Exception!');
});
```

### You can use array of middlewares

```javascript
const { wrapRouter } = require('express-async-await');

const app = express();
const router = wrapRouter(express.Router());

router.get('/foo', [
    async (req, res, next) => {
        next();
    },
    async (req, res, next) => {
        throw new Error('Exception!');
    }
]);

router.get('/boo', [
    async (req, res, next) => {
        next();
    },
    async (req, res, next) => {
        await UserService.find();
    }
]);
```

### You can use middleware without async/await

```javascript
const { wrapRouter } = require('express-async-await');

const app = express();
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

### wrap()

If you need more control you can use the `wrap()` function.
This function wraps an async Express middleware and adds async/await support.
