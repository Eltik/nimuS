"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Genres = exports.Sort = exports.Format = exports.Type = void 0;
const API_1 = require("./API");
class AniList extends API_1.default {
    constructor(type, format) {
        super();
        this.api = "https://graphql.anilist.co";
        this.id = undefined;
        this.type = undefined;
        this.format = undefined;
        this.isMal = false;
        this.query = `
    id
    idMal
    title {
        romaji
        english
        native
    }
    `;
        this.type = type ? type : Type.ANIME;
        this.format = format ? format : Format.TV;
    }
    async search(query, type, format, sort) {
        type = type ? type : this.type;
        format = format ? format : this.format;
        sort = sort ? sort : Sort.POPULARITY_DESC;
        this.format = format;
        if (!this.type || !this.format) {
            throw new Error("No format/type provided.");
        }
        const aniListArgs = {
            query: `
            query($page: Int, $perPage: Int, $search: String, $type: MediaType, $sort: [MediaSort], $format: MediaFormat) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        currentPage
                        lastPage
                        hasNextPage
                        perPage
                    }
                    media(type: $type, search: $search, sort: $sort, format: $format) {
                        ${this.query}
                    }
                }
            }
            `,
            variables: {
                search: query,
                page: 0,
                perPage: 15,
                type: type,
                format: format,
                sort: sort
            }
        };
        try {
            const req = await this.fetch(this.api, {
                body: JSON.stringify(aniListArgs),
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });
            const data = req.json();
            if (!data || !data.data || !data.data.Page.pageInfo || !data.data.Page.media) {
                throw new Error(req.text());
            }
            return data.data.Page.media.map((result) => ({
                title: {
                    english: result.title.english,
                    romaji: result.title.romaji,
                    native: result.title.native,
                },
                data: result
            }));
        }
        catch (e) {
            throw new Error(e);
        }
    }
}
exports.default = AniList;
var Type;
(function (Type) {
    Type["ANIME"] = "ANIME";
    Type["MANGA"] = "MANGA";
})(Type = exports.Type || (exports.Type = {}));
var Format;
(function (Format) {
    Format["TV"] = "TV";
    Format["TV_SHORT"] = "TV_SHORT";
    Format["MOVIE"] = "MOVIE";
    Format["SPECIAL"] = "SPECIAL";
    Format["OVA"] = "OVA";
    Format["ONA"] = "ONA";
    Format["MUSIC"] = "MUSIC";
    Format["MANGA"] = "MANGA";
    Format["NOVEL"] = "NOVEL";
    Format["ONE_SHOT"] = "ONE_SHOT";
})(Format = exports.Format || (exports.Format = {}));
var Sort;
(function (Sort) {
    Sort["ID"] = "ID";
    Sort["ID_DESC"] = "ID_DESC";
    Sort["TITLE_ROMAJI"] = "TITLE_ROMAJI";
    Sort["TITLE_ROMAJI_DESC"] = "TITLE_ROMAJI_DESC";
    Sort["TYPE"] = "TYPE";
    Sort["FORMAT"] = "FORMAT";
    Sort["FORMAT_DESC"] = "FORMAT_DESC";
    Sort["SCORE"] = "SCORE";
    Sort["SCORE_DESC"] = "SCORE_DESC";
    Sort["POPULARITY"] = "POPULARITY";
    Sort["POPULARITY_DESC"] = "POPULARITY_DESC";
    Sort["TRENDING"] = "TRENDING";
    Sort["TRENDING_DESC"] = "TRENDING_DESC";
    Sort["CHAPTERS"] = "CHAPTERS";
    Sort["CHAPTERS_DESC"] = "CHAPTERS_DESC";
    Sort["VOLUMES"] = "VOLUMES";
    Sort["UPDATED_AT"] = "UPDATED_AT";
    Sort["UPDATED_AT_DESC"] = "UPDATED_AT_DESC";
})(Sort = exports.Sort || (exports.Sort = {}));
var Genres;
(function (Genres) {
    Genres["ACTION"] = "Action";
    Genres["ADVENTURE"] = "Adventure";
    Genres["COMEDY"] = "Comedy";
    Genres["DRAMA"] = "Drama";
    Genres["ECCHI"] = "Ecchi";
    Genres["FANTASY"] = "Fantasy";
    Genres["HORROR"] = "Horror";
    Genres["MAHOU_SHOUJO"] = "Mahou Shoujo";
    Genres["MECHA"] = "Mecha";
    Genres["MUSIC"] = "Music";
    Genres["MYSTERY"] = "Mystery";
    Genres["PSYCHOLOGICAL"] = "Psychological";
    Genres["ROMANCE"] = "Romance";
    Genres["SCI_FI"] = "Sci-Fi";
    Genres["SLICE_OF_LIFE"] = "Slice of Life";
    Genres["SPORTS"] = "Sports";
    Genres["SUPERNATURAL"] = "Supernatural";
    Genres["THRILLER"] = "Thriller";
})(Genres = exports.Genres || (exports.Genres = {}));
;
//# sourceMappingURL=AniList.js.map