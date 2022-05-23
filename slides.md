---
theme: seriph
---

# Express + Async/Await, Promises, and Error Handling

<!--
You can view these slides by running `npx slidev` in the same directory as this file - `slides.md`.
-->

---

# Why @root/async-router?

```js
app.get('/profile', async function (req, res, next) {
    let results = await ProfileModel.get(req.user.id).catch(function (err) {
        if ('E_NO_RECORD' !== err.code) {
            throw err;
        }
        return Profile.create();
    });

    return await doStuff(results);
});
```

`@root/async-router`: <https://github.com/therootcompany/async-router>

---

## Default Router + Thunks (terribad)

```js
app.get('/profile', function (req, res, next) {
    ProfileModel.get(req.user.id, function (err, row) {
        function respond(err, results) {
            if (err) {
                handleErrors(err);
                return;
            }
            res.json(results);
        }
        if (err) {
            if ('E_NO_RECORD' !== err.code) {
                handleErrors(err);
                return;
            }
            Profile.create(function (err, row) {
                if (err) {
                    handleErrors(err);
                    return;
                }
                doStuff(row, respond);
            });
            return;
        }
        doStuff(row, respond);
    });
});
```

---

## Default Router + Thunks (worse than you think)

```js
app.get('/profile', function (req, res, next) {
    ProfileModel.get(req.user.id, function (err, rows) {
        if (err) {
            // some error handling code here
            res.statusCode = 500;
            res.json({ message: err.message });
            return;
        }

        doStuff(function (err, results) {
            if (err) {
                // some error handling code here
                res.statusCode = 500;
                res.json({ message: err.message });
                return;
            }
            res.json(rows);
        });
    });
});
```

---

## Step 1: Use Error Handlers

```js
app.get('/profile', function (req, res, next) {
    ProfileModel.get(req.user.id, function (err, rows) {
        if (err) {
            next(err);
            return;
        }

        doStuff(function (err, results) {
            if (err) {
                next(err);
                return;
            }
            res.json(rows);
        });
    });
});
```

```js
function handleErrors(err, req, res, next) {
    console.error('Unhandled Error:');
    console.error(err);
    res.statusCode = 500;
    res.end('Internal Server Error');
}

app.use('/', handleErrors);
```

---

## Default Router + Promises (meh)

```js
app.get('/profile', function (req, res, next) {
    return ProfileModel.get(req.user.id)
        .catch(function (err) {
            if ('E_NO_RECORD' !== err.code) {
                throw err;
            }
            return Profile.create();
        })
        .then(function (results) {
            return doStuff(results).then(function (results) {
                res.json(results);
            });
        })
        .catch(next);
});
```

---

## Default Router + Async/Await (worse)

```js
app.get('/profile', async function (req, res, next) {
    try {
        let results;
        try {
            results = await ProfileModel.get(req.user.id);
        } catch (err) {
            if ('E_NO_RECORD' !== err.code) {
                throw err;
            }
            results = Profile.create();
        }
        res.json(await doStuff(results));
    } catch (e) {
        next(err);
    }
});
```

---

## async-router (clean)

```js
app.get('/profile', async function (req, res, next) {
    let results = await ProfileModel.get(req.user.id).catch(function (err) {
        if ('E_NO_RECORD' !== err.code) {
            throw err;
        }
        return Profile.create();
    });

    return await doStuff(results);
});
```

---

## The Ideal Error

```js
app.get('/error', async function (req, res) {
    throw new Error('Life is hard...');
});
```

---

## Errors via Callbacks

```js
app.get('/error', function (req, res) {
    setTimeout(function () {
        next(new Error('Life is hard...'));
    });
});
```

---

## Sync and Non-Sync Errors

```js
app.get('/error', function (req, res) {
    try {
        doStuff(function (err) {
            next(err);
        });
    } catch (err) {
        next(err);
    }
});
```

---

## Custom Error Handling

```js
app.use('/', async function (err, req, res, next) {
    console.error('Unhandled Error:');
    console.error(err);
    res.statusCode = 500;
    res.end('Internal Server Error');
});
```

---

## The Ideal DataBase

```js
app.get('/profile', async function (req, res) {
    let results = await ProfileModel.get(req.user.id);
    return results;
});
```

---

## Handling Empty Data

```js
app.get('/profile', async function (req, res) {
    let results = await ProfileModel.get(req.user.id);
    if (!results) {
        results = { bio: '', followers: [], following: [] };
    }
    return results;
});
```

---

## Try Catch Madness

```js
app.get('/profile', async function (req, res, next) {
    let results;
    try {
        results = await ProfileModel.get(req.user.id);
    } catch (err) {
        if ('E_NO_RECORD' === err.code) {
            results = { bio: '', followers: [], following: [] };
        }

        next(err);
        return;
    }
    return results;
});
```

---

We could instead use Promises, and it actually gets a little bit better.

```js
app.get('/profile', function (req, res) {
    return ProfileModel.get(req.user.id).catch(function (err) {
        if ('E_NO_RECORD' === err.code) {
            return { bio: '', followers: [], following: [] };
        }
        next(err);
    });
});
```

---

But if our example was just a little more complex we'd have to start doing promise chains and that could get obnoxious

```js
app.get('/profile', function (req, res, next) {
    return ProfileModel.get(req.user.id)
        .catch(function (err) {
            if ('E_NO_RECORD' === err.code) {
                return { bio: '', followers: [], following: [] };
            }
            next(err);
        })
        .then(function (profile) {
            // ...
            return doMore(profile).then(function () {
                // ...
            });
        });
});
```

---

If we take the hybrid approach we start to get a lot cleaner

```js
app.get('/profile', async function (req, res) {
    let profile = await ProfileModel.get(req.user.id).catch(function (err) {
        if ('E_NO_RECORD' === err.code) {
            return { bio: '', followers: [], following: [] };
        }
        throw err;
    });
    return await doMore(profile);
});
```
