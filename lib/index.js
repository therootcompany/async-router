const express = require('express');
const { typeOf, findNext, findResponse } = require('./utils');

module.exports = {
    Router: function asyncRouter() {
        return wrapRouter(express.Router.apply(express, arguments));
    },
    wrapRouter,
    wrapFunction: function (fn) {
        return wrapMiddleware('', '', fn);
    }
};

function wrapRouter(app, methods = ['use', 'get', 'post', 'put', 'patch', 'delete', 'head']) {
    const routeFn = app.route;
    app.route = function route(...options) {
        return wrapRouter(routeFn.apply(app, options));
    };
    for (const method of methods) {
        const fn = app[method];
        app[method] = function () {
            const args = wrapArgs(method, arguments);
            return fn.apply(app, args);
        };
    }
    return app;
}

function wrapArgs(method, args) {
    const ret = [];
    for (const fn of args) {
        switch (typeOf(fn)) {
            case 'string':
                ret.push(fn);
                continue;
            case 'array':
                ret.push(wrapArgs(method, fn));
                return ret;
            case 'function':
                ret.push(wrapMiddleware(method, args[0], fn));
                continue;
        }
    }
    return ret;
}

function wrapMiddleware(method, path, fn) {
    // response handler: function (req, res) { ... }
    if (fn.length === 2) {
        return function asyncWrapper2(req, res) {
            return handleResult(method, path, fn, arguments, res, arguments[2]);
        };
    }

    // middleware: function (req, res, next) { ... }
    if (fn.length === 3) {
        return function asyncWrapper3(req, res, next) {
            return handleResult(method, path, fn, arguments, res, next);
        };
    }

    // error handler: function (req, res, next) { ... }
    if (fn.length === 4) {
        /* eslint-disable node/handle-callback-err */
        return function asyncWrapper4(err, req, res, next) {
            return handleResult(method, path, fn, arguments, res, next);
        };
    }

    // other
    return function asyncWrapperN(...args) {
        const next = findNext(args);
        const res = findResponse(args);
        return handleResult(method, path, fn, args, res, next);
    };
}

async function handleResult(method, path, fn, args, res, next) {
    if (path !== 'string') {
        // implicit app.use(fn) or app.get(fn) rather than app.get('/', fn)
        path = '/';
    }
    try {
        const response = await fn.apply(fn, args);
        if (res.headersSent) {
            return;
        }
        if (response) {
            return res.send(response);
        }
        // otherwise expect that the middleware should call next()
    } catch (err) {
        let extra = '';
        if (method) {
            extra = ` '${method} ${path}'`;
        }
        if (!res.headersSent) {
            if (typeof next === 'function') {
                return next(err);
            }

            console.error(`express-promisify-router: Unhandled Error in Async Route${extra} without 'next':`);
            console.error(err);
            res.statusCode = 500;
            res.end();
            return;
        }

        // no sense in re-throwing at this point
        console.error(`express-promisify-router: Unhandled Error in Async Route${extra} after Headers Sent:`);
        console.error(err);
    }
}
