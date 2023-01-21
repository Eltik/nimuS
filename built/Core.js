"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const anisync_core_1 = require("anisync-core");
const AniList_1 = require("./AniList");
const API_1 = require("./API");
const Scraper_1 = require("./Scraper");
class Core extends API_1.default {
    constructor() {
        super();
        this.aniList = new AniList_1.default(AniList_1.Type.ANIME);
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
}
exports.default = Core;
//# sourceMappingURL=Core.js.map