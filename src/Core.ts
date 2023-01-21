import { sync, Media } from "anisync-core";
import AniList, { Type } from "./AniList";
import * as WebTorrent from "webtorrent";
import * as CryptoJS from "crypto-js";

import API from "./API";
import Scraper from "./Scraper";

export default class Core extends API {
    private aniList = new AniList(Type.ANIME);
    private client:WebTorrent = new WebTorrent();
    private password:string = "password";

    constructor() {
        super();
    }

    public async search(query:string, stringThreshold:number = 0.5, comparisonThreshold:number = 0.5):Promise<Array<SearchResponse>> {
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
        })
    }

    public getTorrent(magnet:string) {
        return this.client.get(magnet);
    }

    public async addMagnet(magnet:string) {
        return new Promise((resolve, reject) => {
            this.client.add(magnet, (torrent) => {
                resolve(torrent);
            });
        })
        
    }

    public async streamTorrent(magnet:string, range:string, fileName:string):Promise<Buffer> {
        return new Promise(async(resolve, reject) => {
            let torrent = this.client.get(magnet);
            if (!torrent) {
                torrent = await this.addMagnet(magnet);
            }
            if (!torrent.files) {
                console.log(torrent);
                reject("No files found!");
            }
            let file:any = {};
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

    // Basic stream code
    /*
        app.get("/stream*", (req, res, next) => {
            let magnet = req.url.split("/stream/")[1];
            let tor = client.get(magnet);

            if (!tor) {
                res.status(404).send("Torrent not found!").end();
                return;
            }

            let file = tor.files[0];

            let range = req.headers.range;

            if(!range) {
                //let err = new Error("Wrong range");
                //err.status = 416;
                //return next(err);
                range = "bytes=567140-1196488";
            }

            let positions = range.replace(/bytes=/, "").split("-");
            let start = parseInt(positions[0], 10);
            let file_size = file.length;
            let end = positions[1] ? parseInt(positions[1], 10) : file_size - 1;

            let chunksize = (end - start) + 1;
            let head = {
                "Content-Range": "bytes " + start + "-" + end + "/" + file_size,
                "Accept-Ranges": "bytes",
                "Content-Length": chunksize,
                "Content-Type": "video/mp4"
            }

            res.writeHead(206, head);
            let stream_position = {
                start: start,
                end: end
            }

            let stream = file.createReadStream(stream_position)
            stream.pipe(res);

            stream.on("error", function(err) {
                console.error(err);
                return next(err);
            });
        })

        app.post('/add*', (req, res) => {
            let magnet = req.body.magnet;

            let tor = client.get(magnet, function(torrent) {
                return torrent;
            });

            if (tor) {
                let files = [];
                tor.files.forEach(function(data) {
                    files.push({
                        name: data.name,
                        length: data.length
                    });
                });

                res.status(200)
                res.json(files);
            } else {
                client.add(magnet, function (torrent) {
                    let files = [];
                    torrent.files.forEach(function(data) {
                        files.push({
                            name: data.name,
                            length: data.length
                        });
                    });
            
                    res.status(200)
                    res.json(files);
                });
            }
        });
    */
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