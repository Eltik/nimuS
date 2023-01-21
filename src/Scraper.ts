import API from "./API";
import { load } from "cheerio";

export default class Scraper extends API {
    private baseURL = "https://nyaa.si";

    constructor() {
        super();
    }

    public async search(query: string, page: number = 1): Promise<Array<SearchResponse>> {
        const req = await this.fetch(`${this.baseURL}/?f=0&c=0_0&q=${query}&s=seeders&o=desc&p=${page}`).catch((err) => {
            console.error(err);
            return null;
        });
        if (!req) {
            throw new Error("Couldn't fetch data.");
        }
        const $ = load(req.text());
        const data = [];
        
        const a = $("div.table-responsive table tbody tr");
        for (let i = 0; i < a.length; i++) {
            const title = this.parseTitle($(a).eq(i).find("td").eq(1).find("a").eq(1).text());
            const link = $(a).eq(i).find("td").eq(1).find("a").eq(1).attr("href");
            const size = $(a).eq(i).find("td").eq(3).text();
            const seeders = $(a).eq(i).find("td").eq(5).text();
            const leechers = $(a).eq(i).find("td").eq(6).text();
            const date = $(a).eq(i).find("td").eq(4).text();
            const torrent = $(a).eq(i).find("td").eq(2).find("a").eq(0).attr("href");
            const magnet = $(a).eq(i).find("td").eq(2).find("a").eq(1).attr("href");
            data.push({
                title,
                link,
                size,
                seeders,
                leechers,
                date,
                magnet,
                torrent
            })
        }
        return data;
    }

    private parseTitle(toParse:string):string {
        let title:string = toParse;
        if (title.startsWith("[") && title.includes("]")) {
            //title = title.split("]")[1];
        }
        if (title.includes("(") && title.includes(")")) {
            //title = title.split("(")[0];
        }
        return title;
    }
}

interface SearchResponse {
    title: string;
    link: string;
    size: string;
    seeders: string;
    leechers: string;
    date: string;
    magnet: string;
    torrent: string;
}