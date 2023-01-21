"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = require("fastify");
const cors_1 = require("@fastify/cors");
const formbody_1 = require("@fastify/formbody");
const config_1 = require("./config");
const Core_1 = require("./Core");
const fs_1 = require("fs");
const path_1 = require("path");
const core = new Core_1.default();
const fastify = (0, fastify_1.default)({
    logger: false
});
const fastifyPlugins = [];
const corsPlugin = new Promise((resolve, reject) => {
    fastify.register(cors_1.default, {
        origin: config_1.config.web_server.cors,
        methods: ['POST', 'GET', 'PATCH', 'DELETE', 'OPTIONS'],
    }).then(() => {
        resolve(true);
    });
});
const formBody = new Promise((resolve, reject) => {
    fastify.register(formbody_1.default).then(() => {
        resolve(true);
    });
});
fastifyPlugins.push(corsPlugin);
fastifyPlugins.push(formBody);
fastify.get("/", async (req, res) => {
    res.type("application/json").code(200);
    return "Welcome to nimuS.";
});
fastify.get("/test", async (req, res) => {
    const stream = (0, fs_1.createReadStream)((0, path_1.join)(__dirname, "../src/testing/index.html"), "utf-8");
    res.type("text/html").code(200);
    return stream;
});
fastify.get("/cryptojs", async (req, res) => {
    const stream = (0, fs_1.createReadStream)((0, path_1.join)(__dirname, "../src/testing/libraries/cryptojs.min.js"), "utf-8");
    res.type("text/javascript").code(200);
    return stream;
});
fastify.get("/stream", async (req, res) => {
    const magnet = core.decrypt(req.query["magnet"]);
    const range = req.headers.range ? req.headers.range : "bytes=0-50, 100-150";
    if (!range) {
        res.type("application/json").code(416);
        return { error: "Wrong range" };
    }
    console.log("Now streaming with range " + range);
    const torStream = await core.streamTorrent(magnet, range, core.decrypt(req.query["file"]));
    return torStream;
});
Promise.all(fastifyPlugins).then(() => {
    fastify.listen({ port: config_1.config.web_server.port }, (err, address) => {
        if (err)
            throw err;
        console.log(`Listening to ${address}.`);
    });
});
//# sourceMappingURL=server.js.map