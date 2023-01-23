"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const API_1 = require("./API");
const cheerio_1 = require("cheerio");
/**
 * @class Scraper
 * @extends API
 * @description Scraper class for scraping Nyaa
 */
class Scraper extends API_1.default {
    constructor() {
        super();
        this.baseURL = "https://nyaa.si";
    }
    /**
     * @function search
     * @param query
     * @param page
     * @returns Promise<Array<SearchResponse>>
     * @description Search for torrents on Nyaa
     */
    async search(query, page = 1) {
        const req = await this.fetch(`${this.baseURL}/?f=0&c=0_0&q=${query}&s=seeders&o=desc&p=${page}`).catch((err) => {
            console.error(err);
            return null;
        });
        if (!req) {
            throw new Error("Couldn't fetch data.");
        }
        const $ = (0, cheerio_1.load)(req.text());
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
            });
        }
        return data;
    }
    /**
     * @function parseTitle
     * @param toParse
     * @returns string
     * @description Parse the title of the torrent
     * @private
    */
    parseTitle(toParse) {
        let title = toParse;
        if (title.startsWith("[") && title.includes("]")) {
            //title = title.split("]")[1];
        }
        if (title.includes("(") && title.includes(")")) {
            //title = title.split("(")[0];
        }
        return title;
    }
}
exports.default = Scraper;
//# sourceMappingURL=Scraper.js.map