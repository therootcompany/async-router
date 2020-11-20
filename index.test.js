import express from 'express';
import supertest from 'supertest';
import { wrapRouter } from '.';

describe('Router', () => {
    it('creates a async router', async () => {
        const app = express();
        const router = wrapRouter(express.Router());

        router.get('/test', async (req, res, next) => {
            throw new Error('Oops!');
        });

        app.use(router);
        app.use((err, req, res, next) => {
            res.status(500).send(err.message);
        });

        const request = supertest(app);
        const res = await request.get('/test');

        expect(res.constructor.name).toBe('Response');
        expect(res.statusCode).toBe(500);
        expect(res.error.text).toBe('Oops!');
    });

    it('handle an array of middlewares as async functions', async () => {
        const app = express();
        const router = wrapRouter(express.Router());

        router.get('/test', [
            async (req, res, next) => {
                next();
            },
            async (req, res, next) => {
                throw new Error('Oops!');
            }
        ]);

        app.use(router);
        app.use((err, req, res, next) => {
            res.status(500).send(err.message);
        });

        const request = supertest(app);
        const res = await request.get('/test');

        expect(res.constructor.name).toBe('Response');
        expect(res.statusCode).toBe(500);
        expect(res.error.text).toBe('Oops!');
    });

    it('handle many middlewares as async functions', async () => {
        const app = express();
        const router = wrapRouter(express.Router());

        router.get(
            '/test',
            async (req, res, next) => {
                next();
            },
            async (req, res, next) => {
                throw new Error('Oops!');
            }
        );

        app.use(router);
        app.use((err, req, res, next) => {
            res.status(500).send(err.message);
        });

        const request = supertest(app);
        const res = await request.get('/test');

        expect(res.constructor.name).toBe('Response');
        expect(res.statusCode).toBe(500);
        expect(res.error.text).toBe('Oops!');
    });

    it('handle an array of middlewares as mixed functions', async () => {
        const app = express();
        const router = wrapRouter(express.Router());

        router.get('/test', [
            (req, res, next) => {
                next();
            },
            async (req, res, next) => {
                next();
            },
            async (req, res, next) => {
                throw new Error('Oops!');
            }
        ]);

        app.use(router);
        app.use((err, req, res, next) => {
            res.status(500).send(err.message);
        });

        const request = supertest(app);
        const res = await request.get('/test');

        expect(res.constructor.name).toBe('Response');
        expect(res.statusCode).toBe(500);
        expect(res.error.text).toBe('Oops!');
    });
    it('handle middleware without async/await block', async () => {
        const app = express();
        const router = wrapRouter(express.Router());

        router.get('/test', [
            (req, res, next) => {
                next();
            },
            (req, res, next) => {
                try {
                    throw new Error('Oops!');
                } catch (error) {
                    next(error);
                }
            }
        ]);

        app.use(router);
        app.use((err, req, res, next) => {
            res.status(500).send(err.message);
        });

        const request = supertest(app);
        const res = await request.get('/test');

        expect(res.constructor.name).toBe('Response');
        expect(res.statusCode).toBe(500);
        expect(res.error.text).toBe('Oops!');
    });
});
