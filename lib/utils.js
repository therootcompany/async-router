const noop = () => {};
const last = (arr = []) => arr[arr.length - 1];
const findNext = (arr = []) => (arr.length === 5 ? arr[2] : last(arr)) || noop;
const findResponse = (arr = []) => arr[arr.length - 2];
const isPromise = (obj) => {
    return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
};

module.exports = { noop, last, findNext, findResponse, isPromise };
