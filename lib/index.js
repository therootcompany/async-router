'use strict';

const express = require('express');
const { findNext, findResponse } = require('./utils');

module.exports = {
    /**
     * @param {import('express').RouterOptions} [options]
     * @returns import('express').Router
     */
    Router: function asyncRouter(options) {
        return wrapRouter(express.Router(options));
    },
    wrap: wrapRouter,
    // exported for tests
    _wrapFunction: function (fn) {
        return wrapMiddleware('', '', fn);
    }
};

function wrapRouter(app, methods = ['use', 'get', 'post', 'put', 'patch', 'delete', 'head']) {
    const routeFn = app.route;
    /**
     * @param {Array<any>} options
     * @returns import('express').Router
     */
    app.route = function route(...options) {
        return wrapRouter(routeFn.apply(app, options));
    };
    methods.forEach(function (method) {
        const fn = app[method];
        /**
         * @returns import('express').Router
         */
        app[method] = function () {
            const args = wrapArgs(method, arguments);
            return fn.apply(app, args);
        };
    });
    return app;
}

function typeOf(arg) {
    if (arg instanceof RegExp) {
        return 'regexp';
    }

    if (Array.isArray(arg)) {
        return 'array';
    }

    return typeof arg;
}

function wrapArgs(method, args) {
    const ret = [];
    for (let i = 0; i < args.length; i += 1) {
        let arg = args[i];
        let typ = typeOf(arg);
        switch (typ) {
            case 'regex':
                ret.push(arg);
                continue;
            case 'string':
                ret.push(arg);
                continue;
            case 'array':
                ret.push(wrapArgs(method, arg));
                return ret;
            case 'function':
                ret.push(wrapMiddleware(method, args[0], arg));
                continue;
            default:
                throw new Error(`argument ${i} has the unexpected type '${typ}': ` + JSON.stringify(arg));
        }
    }
    return ret;
}

function wrapMiddleware(method, path, fn) {
    // response handler: function (req, res) { ... }
    if (fn.length === 2) {
        return async function asyncWrapper2(req, res) {
            await handleResult(method, path, fn, arguments, res, arguments[2]);
        };
    }

    // middleware: function (req, res, next) { ... }
    if (fn.length === 3) {
        return async function asyncWrapper3(req, res, next) {
            await handleResult(method, path, fn, arguments, res, next);
        };
    }

    // error handler: function (req, res, next) { ... }
    if (fn.length === 4) {
        /* eslint-disable node/handle-callback-err */
        return async function asyncWrapper4(err, req, res, next) {
            await handleResult(method, path, fn, arguments, res, next);
        };
    }

    // other
    return async function asyncWrapperN(...args) {
        const next = findNext(args);
        const res = findResponse(args);
        await handleResult(method, path, fn, args, res, next);
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
            res.send(response);
            return;
        }
        // otherwise expect that the middleware should call next()
    } catch (e) {
        let err = e;
        if (!err) {
            let errType = typeof err;
            err = new Error(`'${err}' (${errType}) was thrown`);
        }

        let extra = '';
        if (method) {
            extra = ` '${method} ${path}'`;
        }

        if (res.headersSent) {
            // no sense in re-throwing at this point
            console.error(`@root/async-router: Unhandled Error in Async Route${extra} after Headers Sent:`);
            console.error(err);
            return;
        }

        if (typeof next === 'function') {
            next(err);
            return;
        }

        console.error(`@root/async-router: Unhandled Error in Async Route${extra} without 'next':`);
        console.error(err);
        res.statusCode = 500;
        res.end();
    }
}
