"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hello = (_, res) => {
    const json = {
        message: 'Hello from vidcraft backend!',
        data: null,
        error: null
    };
    res.json(json);
};
exports.default = {
    hello
};
