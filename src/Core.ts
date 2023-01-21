import { sync, Media } from "anisync-core";
import AniList, { Type } from "./AniList";

import API from "./API";
import Scraper from "./Scraper";

export default class Core extends API {
    private aniList = new AniList(Type.ANIME);

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