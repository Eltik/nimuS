"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const anisync_core_1 = require("anisync-core");
const AniList_1 = require("./AniList");
const WebTorrent = require("webtorrent");
const CryptoJS = require("crypto-js");
const API_1 = require("./API");
const Scraper_1 = require("./Scraper");
class Core extends API_1.default {
    constructor() {
        super();
        this.aniList = new AniList_1.default(AniList_1.Type.ANIME);
        this.client = new WebTorrent();
        this.password = "password";
    }
    async search(query, stringThreshold = 0.5, comparisonThreshold = 0.5) {
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
        return new Promise((resolve, reject) => {
            this.client.add(magnet, (torrent) => {
                let files = [];
                torrent.files.forEach(function (data) {
                    files.push({
                        name: data.name,
                        length: data.length,
                    });
                });
                resolve(files);
            });
        });
    }
    getTorrent(magnet) {
        return this.client.get(magnet);
    }
    async addMagnet(magnet) {
        return new Promise((resolve, reject) => {
            this.client.add(magnet, (torrent) => {
                resolve(torrent);
            });
        });
    }
    async streamTorrent(magnet, range, fileName) {
        return new Promise(async (resolve, reject) => {
            let torrent = this.client.get(magnet);
            if (!torrent) {
                torrent = await this.addMagnet(magnet);
            }
            if (!torrent.files) {
                console.log(torrent);
                reject("No files found!");
            }
            let file = {};
            for (let i = 0; i < torrent.files.length; i++) {
                if (torrent.files[i].name == fileName) {
                    file = torrent.files[i];
                }
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
}
exports.default = Core;
//# sourceMappingURL=Core.js.map