"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const anisync_core_1 = require("anisync-core");
const AniList_1 = require("./AniList");
const WebTorrent = require("webtorrent");
const CryptoJS = require("crypto-js");
const sqlite3_1 = require("sqlite3");
const colors = require("colors");
const gradient = require("gradient-string");
const API_1 = require("./API");
const Scraper_1 = require("./Scraper");
const config_1 = require("./config");
class Core extends API_1.default {
    constructor() {
        super();
        this.aniList = new AniList_1.default(AniList_1.Type.ANIME);
        this.client = new WebTorrent();
        this.password = "password";
        this.db = new sqlite3_1.Database(config_1.config.torrent.db);
    }
    async search(query, stringThreshold = 0.25, comparisonThreshold = 0.25) {
        const response = [];
        const aniSearch = await this.aniList.search(query);
        const nyaa = new Scraper_1.default();
        const data = await nyaa.search(query);
        aniSearch.map((element) => {
            for (let i = 0; i < data.length; i++) {
                const ani = {
                    title: {
                        english: element.title.english,
                        romaji: element.title.romaji,
                        native: element.title.native
                    }
                };
                const nyaa = {
                    title: {
                        english: data[i].title,
                    }
                };
                if ((0, anisync_core_1.sync)(ani, nyaa, { stringThreshold: stringThreshold, comparisonThreshold: comparisonThreshold })) {
                    response.push({
                        anilist: element,
                        nyaa: data[i]
                    });
                }
            }
        });
        return response;
    }
    async getFiles(magnet) {
        let torrent = this.getTorrent(magnet);
        if (!torrent) {
            torrent = await this.addTorrent(magnet);
        }
        let files = [];
        torrent.files.forEach(function (data) {
            files.push({
                name: data.name,
                length: data.length,
            });
        });
        return files;
    }
    getTorrent(magnet) {
        return this.client.get(magnet);
    }
    listTorrents() {
        const torrents = this.client.torrents;
        const results = [];
        torrents.map((element, index) => {
            const announce = element.announce;
            const path = element.path;
            const files = element.files;
            const fileResult = [];
            files.map((file, index) => {
                const name = file.name;
                const path = file.path;
                const length = file.length;
                fileResult.push({
                    name: name,
                    path: path,
                    length: length
                });
            });
            const totalLength = element.length;
            const name = element.name;
            const infoHash = element.infoHash;
            results.push({
                name: name,
                hash: infoHash,
                length: totalLength,
                announcers: announce,
                file_path: path,
                files: fileResult
            });
        });
        return results;
    }
    async addTorrent(magnet, path) {
        path = path ? path : config_1.config.torrent.path;
        return new Promise((resolve, reject) => {
            this.client.add(magnet, { path: path }, async (torrent) => {
                if (config_1.config.torrent.cache) {
                    await this.cacheTorrent(magnet, path);
                }
                resolve(torrent);
            });
        });
    }
    async removeTorrent(magnet) {
        return new Promise((resolve, reject) => {
            this.client.remove(magnet, async (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    const torrent = await this.getCachedTorrent(magnet);
                    this.removeCachedTorrent(torrent.id);
                    resolve(true);
                }
            });
        });
    }
    /**
     * @deprecated
     * @param magnet
     * @param range
     * @param fileName
     * @returns Buffer
     */
    async streamTorrentOLD(magnet, range, fileName) {
        return new Promise(async (resolve, reject) => {
            let torrent = this.client.get(magnet);
            if (!torrent) {
                torrent = await this.addTorrent(magnet);
            }
            if (!torrent.files) {
                reject({ error: "No files found." });
                return;
            }
            let file = null;
            for (let i = 0; i < torrent.files.length; i++) {
                if (torrent.files[i].name == fileName) {
                    file = torrent.files[i];
                }
            }
            if (!file) {
                reject({ error: "File not found." });
                return;
            }
            let positions = range.replace(/bytes=/, "").split("-");
            let start = parseInt(positions[0], 10);
            let file_size = file.length;
            let end = positions[1] ? parseInt(positions[1], 10) : file_size - 1;
            let stream_position = {
                start: start,
                end: end
            };
            let stream = file.createReadStream(stream_position);
            let buffer = Buffer.alloc(0);
            stream.on("data", (chunk) => {
                buffer = Buffer.concat([buffer, chunk]);
            });
            stream.on("end", () => {
                resolve(buffer);
            });
        });
    }
    async streamTorrent(magnet, fileName, res) {
        let torrent = this.client.get(magnet);
        if (!torrent) {
            torrent = await this.addTorrent(magnet);
        }
        if (!torrent.files) {
            throw new Error("No files found.");
        }
        let file = null;
        for (let i = 0; i < torrent.files.length; i++) {
            if (torrent.files[i].name == fileName) {
                file = torrent.files[i];
            }
        }
        if (!file) {
            throw new Error("File not found.");
        }
        const stream = file.createReadStream();
        res.header('Accept-Ranges', 'bytes');
        res.header('Content-Type', 'video/mp4');
        res.send(stream);
        stream.on("error", function (err) {
            // New error handling system needs to be implemented
            console.log(err);
        });
    }
    encrypt(url) {
        const buff = Buffer.from(url);
        const encodedString = buff.toString("base64");
        const encrypted = CryptoJS.AES.encrypt(encodedString, this.password).toString();
        const b64 = CryptoJS.enc.Base64.parse(encrypted);
        return b64.toString(CryptoJS.enc.Hex);
    }
    decrypt(url) {
        const b64 = CryptoJS.enc.Hex.parse(url);
        const bytes = b64.toString(CryptoJS.enc.Base64);
        const decrypted = CryptoJS.AES.decrypt(bytes, this.password);
        const decodedString = Buffer.from(decrypted.toString(CryptoJS.enc.Utf8), "base64");
        return decodedString.toString();
    }
    async cacheTorrent(magnet, path) {
        const db = this.db;
        const possible = await this.getCachedTorrent(magnet);
        if (possible) {
            return;
        }
        const id = this.getRandomInt(10);
        const lastCached = Date.now();
        const query = `INSERT INTO storage (id, path, lastCached, magnet) VALUES (?, ?, ?, ?)`;
        const values = [id, path, lastCached, magnet];
        return new Promise((resolve, reject) => {
            db.run(query, values, function (err) {
                if (err) {
                    reject(err);
                }
                console.log(colors.green(`Cached torrent ${magnet} to ${path}.`));
                resolve(true);
            });
        });
    }
    async getCachedTorrent(magnet) {
        const db = this.db;
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM storage WHERE magnet=?", [magnet], (err, rows) => {
                if (err) {
                    reject(err);
                }
                resolve(rows);
            });
        });
    }
    async removeCachedTorrent(id) {
        const db = this.db;
        const stmt = db.prepare(`DELETE FROM storage WHERE id = ?`);
        stmt.run(id);
        stmt.finalize();
        console.log(colors.red(`Removed torrent ${id} from cache.`));
        return true;
    }
    title() {
        const title = `        _            ____
        ___  (_)_ _  __ __/ __/
       / _ \/ /  ' \/ // /\ \  
      /_//_/_/_/_/_/\_,_/___/  
                               `;
        const poimandresTheme = {
            blue: "#add7ff",
            cyan: "#89ddff",
            green: "#5de4c7",
            magenta: "#fae4fc",
            red: "#d0679d",
            yellow: "#fffac2",
        };
        const titleGradient = gradient(Object.values(poimandresTheme));
        return titleGradient.multiline(title);
    }
    async runLoop() {
        setInterval(() => {
            const db = this.db;
            const query = `SELECT * FROM storage`;
            db.all(query, async (err, rows) => {
                if (err) {
                    throw err;
                }
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    const magnet = row.magnet;
                    const path = row.path;
                    if (!this.getTorrent(magnet)) {
                        // We want to add all torrents first, then remove them if necessary.
                        await this.addTorrent(magnet, path);
                    }
                }
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    const lastCached = row.lastCached;
                    const now = Date.now();
                    const magnet = row.magnet;
                    if (now - lastCached > config_1.config.torrent.cache_timeout) {
                        await this.removeTorrent(magnet);
                    }
                }
            });
        }, config_1.config.torrent.loop_interval);
    }
}
exports.default = Core;
// CREATE TABLE IF NOT EXISTS storage (id INTEGER PRIMARY KEY, path longtext, lastCached bigint, magnet longtext);
//# sourceMappingURL=Core.js.map