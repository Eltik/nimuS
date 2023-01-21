"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = require("fastify");
const cors_1 = require("@fastify/cors");
const formbody_1 = require("@fastify/formbody");
const config_1 = require("./config");
const Core_1 = require("./Core");
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
fastify.get("/stream/:magnet/:file_name", async (req, res) => {
    const magnet = req.params["magnet"];
    const range = req.headers.range;
    console.log(range);
    if (!range) {
        res.type("application/json").code(416);
        return { error: "Wrong range" };
    }
    const torStream = await core.streamTorrent(magnet, range, req.params["file_name"]);
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