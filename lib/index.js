const noop = () => {};
const last = (arr = []) => arr[arr.length - 1];
const typeOf = (arg) => (Array.isArray(arg) ? 'array' : typeof arg);
const findNext = (arr = []) => (arr.length === 5 ? arr[2] : last(arr)) || noop;
const findResponse = (arr = []) => arr[arr.length - 2];

module.exports = {
    wrapRouter,
    wrap
};

function wrapRouter(app, methods = ['use', 'get', 'post', 'put', 'patch', 'delete', 'head']) {
    for (const method of methods) {
        const fn = app[method];
        app[method] = function () {
            const args = wrapArgs(arguments);
            return fn.apply(app, args);
        };
    }
    return app;
}

function wrapArgs(args) {
    const ret = [];
    for (const fn of args) {
        switch (typeOf(fn)) {
            case 'string':
                ret.push(fn);
                continue;
            case 'array':
                ret.push(wrapArgs(fn));
                continue;
            case 'function':
                ret.push(wrap(fn));
                continue;
        }
    }
    return ret;
}

function wrap(fn) {
    return async function wrappedMiddleware(...args) {
        const next = findNext(args);
        const res = findResponse(args);
        try {
            const response = await fn(...args);
            if (res.headersSent) {
                return;
            }
            if (response) {
                return res.send(response);
            }
            return next();
        } catch (err) {
            next(err);
        }
    };
}
