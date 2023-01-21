import Fastify from "fastify";
import cors from '@fastify/cors';
import fastifyFormbody from "@fastify/formbody";
import { config } from "./config";
import Core from "./Core";
import { createReadStream } from "fs";
import { join } from "path";

const core = new Core();

const fastify = Fastify({
    logger: false
});

const fastifyPlugins = [];

const corsPlugin = new Promise((resolve, reject) => {
    fastify.register(cors, {
        origin: config.web_server.cors,
        methods: ['POST', 'GET', 'PATCH', 'DELETE', 'OPTIONS'],
    }).then(() => {
        resolve(true);
    })
});

const formBody = new Promise((resolve, reject) => {
    fastify.register(fastifyFormbody).then(() => {
        resolve(true);
    })
})

fastifyPlugins.push(corsPlugin);
fastifyPlugins.push(formBody);

fastify.get("/", async(req, res) => {
    res.type("application/json").code(200);
    return "Welcome to nimuS.";
})

fastify.get("/test", async(req, res) => {
    const stream = createReadStream(join(__dirname, "../src/testing/index.html"), "utf-8");
    res.type("text/html").code(200);
    return stream;
})

fastify.get("/cryptojs", async(req, res) => {
    const stream = createReadStream(join(__dirname, "../src/testing/libraries/cryptojs.min.js"), "utf-8");
    res.type("text/javascript").code(200);
    return stream;
})

fastify.get("/stream", async(req, res) => {
    const magnet = core.decrypt(req.query["magnet"]);

    const range = req.headers.range ? req.headers.range : "bytes=0-50, 100-150";

    if (!range) {
        res.type("application/json").code(416);
        return { error: "Wrong range" };
    }

    console.log("Now streaming with range " + range)
    const torStream = await core.streamTorrent(magnet, range, core.decrypt(req.query["file"]));
    return torStream;
});

Promise.all(fastifyPlugins).then(() => {
    fastify.listen({ port: config.web_server.port }, (err, address) => {
        if (err) throw err;
        console.log(`Listening to ${address}.`);
    })
})