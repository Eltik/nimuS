import Fastify from "fastify";
import cors from '@fastify/cors';
import fastifyFormbody from "@fastify/formbody";
import { config } from "./config";
import Core from "./Core";

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

fastify.get("/stream/:magnet/:file_name", async(req, res) => {
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
    fastify.listen({ port: config.web_server.port }, (err, address) => {
        if (err) throw err;
        console.log(`Listening to ${address}.`);
    })
})