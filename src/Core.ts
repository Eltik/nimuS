import { sync, Media } from "anisync-core";
import AniList, { Type } from "./AniList";
import * as WebTorrent from "webtorrent";
import * as CryptoJS from "crypto-js";
import { Database } from "sqlite3";
import * as colors from "colors";
import * as gradient from "gradient-string";

import API from "./API";
import Scraper from "./Scraper";
import { config } from "./config";
import { FastifyReply } from "fastify";

export default class Core extends API {
    private aniList = new AniList(Type.ANIME);
    private client:WebTorrent = new WebTorrent();
    private password:string = "password";
    private db = new Database(config.torrent.db);

    constructor() {
        super();
    }

    public async search(query:string, stringThreshold:number = 0.25, comparisonThreshold:number = 0.25):Promise<Array<SearchResponse>> {
        const response:SearchResponse[] = [];

        const aniSearch = await this.aniList.search(query);
        const nyaa = new Scraper();
        const data = await nyaa.search(query);

        aniSearch.map((element) => {
            for (let i = 0; i < data.length; i++) {
                const ani:Media = {
                    title: {
                        english: element.title.english,
                        romaji: element.title.romaji,
                        native: element.title.native
                    }
                }
                const nyaa:Media = {
                    title: {
                        english: data[i].title,
                    }
                }
                if (sync(ani, nyaa, { stringThreshold: stringThreshold, comparisonThreshold: comparisonThreshold })) {
                    response.push({
                        anilist: element,
                        nyaa: data[i]
                    })
                }
            }
        })
        return response;
    }

    public async getFiles(magnet:string):Promise<Array<{name:string, length:number}>> {
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

    public getTorrent(magnet:string) {
        return this.client.get(magnet);
    }

    public listTorrents() {
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
            })
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
            })
        })
        return results;
    }

    public async addTorrent(magnet:string, path?:string) {
        path = path ? path : config.torrent.path;
        return new Promise((resolve, reject) => {
            this.client.add(magnet, { path: path }, async(torrent) => {
                if (config.torrent.cache) {
                    await this.cacheTorrent(magnet, path);
                }
                resolve(torrent);
            });
        })
    }

    public async removeTorrent(magnet:string) {
        return new Promise((resolve, reject) => {
            this.client.remove(magnet, async(err) => {
                if (err) {
                    reject(err);
                } else {
                    const torrent = await this.getCachedTorrent(magnet);
                    this.removeCachedTorrent(torrent.id);
                    resolve(true);
                }
            });
        })
    }

    /**
     * @deprecated
     * @param magnet 
     * @param range 
     * @param fileName 
     * @returns Buffer
     */
    public async streamTorrentOLD(magnet:string, range:string, fileName:string):Promise<Buffer> {
        return new Promise(async(resolve, reject) => {
            let torrent = this.client.get(magnet);
            if (!torrent) {
                torrent = await this.addTorrent(magnet);
            }
            if (!torrent.files) {
                reject({ error: "No files found." });
                return;
            }
            let file:any = null;
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
            }
            
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

    public async streamTorrent(magnet:string, fileName:string, res:FastifyReply) {
        let torrent = this.client.get(magnet);
        if (!torrent) {
            torrent = await this.addTorrent(magnet);
        }
        if (!torrent.files) {
            throw new Error("No files found.");
        }
        let file:any = null;
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

    public encrypt(url):string {
        const buff = Buffer.from(url);
        const encodedString = buff.toString("base64");
        const encrypted = CryptoJS.AES.encrypt(encodedString, this.password).toString();
        const b64 = CryptoJS.enc.Base64.parse(encrypted);
        return b64.toString(CryptoJS.enc.Hex);
    }

    public decrypt(url):string {
        const b64 = CryptoJS.enc.Hex.parse(url);
        const bytes = b64.toString(CryptoJS.enc.Base64);
        const decrypted = CryptoJS.AES.decrypt(bytes, this.password);
        const decodedString = Buffer.from(decrypted.toString(CryptoJS.enc.Utf8), "base64");
        return decodedString.toString();
    }

    private async cacheTorrent(magnet:string, path:string) {
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
            db.run(query, values, function(err) {
                if (err) {
                    reject(err);
                }
                console.log(colors.green(`Cached torrent ${magnet} to ${path}.`));
                resolve(true);
            });
        })
    }

    private async getCachedTorrent(magnet:string):Promise<any> {
        const db = this.db;
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM storage WHERE magnet=?", [magnet], (err, rows) => {
                if (err) {
                    reject(err);
                }
                resolve(rows);
            });
        })
    }

    private async removeCachedTorrent(id:string) {
        const db = this.db;

        const stmt = db.prepare(`DELETE FROM storage WHERE id = ?`);
        stmt.run(id);
        stmt.finalize();

        console.log(colors.red(`Removed torrent ${id} from cache.`));
        return true;
    }

    public title():string {
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

    public async runLoop() {
        setInterval(() => {
            const db = this.db;
            const query = `SELECT * FROM storage`;
            db.all(query, async(err, rows) => {
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
                    if (now - lastCached > config.torrent.cache_timeout) {
                        await this.removeTorrent(magnet);
                    }
                }
            });
        }, config.torrent.loop_interval)
    }
}

interface SearchResponse {
    anilist: {
        title: {
            english?: string;
            romaji?: string;
            native?: string;
        };
        data: {
            id: number;
            idMal: number;
            title: {
                romaji: string;
                english: string;
                native: string;
            };
        };
    };
    nyaa: {
        title: string;
        link: string;
        size: string;
        seeders: string;
        leechers: string;
        date: string;
        magnet: string;
        torrent: string;
    }
}

// CREATE TABLE IF NOT EXISTS storage (id INTEGER PRIMARY KEY, path longtext, lastCached bigint, magnet longtext);