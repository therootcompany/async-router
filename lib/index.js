const express = require('express');
const { typeOf, findNext, findResponse } = require('./utils');

module.exports = {
    Router: function asyncRouter() {
        return wrapRouter(express.Router.apply(express, arguments));
    },
    wrapRouter,
    wrapFunction
};

function wrapRouter(app, methods = ['use', 'get', 'post', 'put', 'patch', 'delete', 'head']) {
    const routeFn = app.route;
    app.route = function route(...options) {
        return wrapRouter(routeFn.apply(app, options));
    };
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
                return ret;
            case 'function':
                ret.push(wrapFunction(fn));
                continue;
        }
    }
    return ret;
}

function wrapFunction(fn) {
    return async function asyncWrapper(...args) {
        const next = findNext(args);
        const res = findResponse(args);
        try {
            const response = await fn.apply(fn, args);
            if (res.headersSent) {
                return;
            }
            if (response) {
                return res.send(response);
            }
        } catch (err) {
            if (!res.headersSent) {
                next(err);
            }
        }
    };
}
