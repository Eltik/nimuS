import API from "./API";
import { Media } from "anisync-core";

export default class AniList extends API {
    private api:string = "https://graphql.anilist.co";
    public id:string = undefined;
    private type:Type = undefined;
    private format:Format = undefined;
    public isMal:boolean = false;

    private query:string = `
    id
    idMal
    title {
        romaji
        english
        native
    }
    `;

    constructor(type:Type, format?:Format) {
        super();
        this.type = type ? type : Type.ANIME;
        this.format = format ? format : Format.TV;
    }

    public async search(query:string, type?:Type, format?:Format, sort?:Sort): Promise<Array<Media>> {
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
        }

        try {
            const req = await this.fetch(this.api, {
                body: JSON.stringify(aniListArgs),
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });
    
            const data:SearchResponse = req.json();
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
        } catch (e) {
            throw new Error(e);
        }
    }
}

export enum Type {
    ANIME = "ANIME",
    MANGA = "MANGA"
}

export enum Format {
    TV = "TV",
    TV_SHORT = "TV_SHORT",
    MOVIE = "MOVIE",
    SPECIAL = "SPECIAL",
    OVA = "OVA",
    ONA = "ONA",
    MUSIC = "MUSIC",
    MANGA = "MANGA",
    NOVEL = "NOVEL",
    ONE_SHOT = "ONE_SHOT"
}

export enum Sort {
    ID = "ID",
    ID_DESC = "ID_DESC",
    TITLE_ROMAJI = "TITLE_ROMAJI",
    TITLE_ROMAJI_DESC = "TITLE_ROMAJI_DESC",
    TYPE = "TYPE",
    FORMAT = "FORMAT",
    FORMAT_DESC = "FORMAT_DESC",
    SCORE = "SCORE",
    SCORE_DESC = "SCORE_DESC",
    POPULARITY = "POPULARITY",
    POPULARITY_DESC = "POPULARITY_DESC",
    TRENDING = "TRENDING",
    TRENDING_DESC = "TRENDING_DESC",
    CHAPTERS = "CHAPTERS",
    CHAPTERS_DESC = "CHAPTERS_DESC",
    VOLUMES = "VOLUMES",
    UPDATED_AT = "UPDATED_AT",
    UPDATED_AT_DESC = "UPDATED_AT_DESC"
}

export enum Genres {
    ACTION = "Action",
    ADVENTURE = "Adventure",
    COMEDY = "Comedy",
    DRAMA = "Drama",
    ECCHI = "Ecchi",
    FANTASY = "Fantasy",
    HORROR = "Horror",
    MAHOU_SHOUJO = "Mahou Shoujo",
    MECHA = "Mecha",
    MUSIC = "Music",
    MYSTERY = "Mystery",
    PSYCHOLOGICAL = "Psychological",
    ROMANCE = "Romance",
    SCI_FI = "Sci-Fi",
    SLICE_OF_LIFE = "Slice of Life",
    SPORTS = "Sports",
    SUPERNATURAL = "Supernatural",
    THRILLER = "Thriller"
}

interface Query {
    id:number;
    idMal:number;
    title: Title;
};

interface Title {
    english?: string;
    romaji?: string;
    native?: string;
}

interface SearchResponse {
    data: {
        Page: {
            pageInfo: {
                total: number;
                currentPage: number;
                lastPage: number;
                hasNextPage: boolean;
                perPage: number;
            }
            media: Array<Query>
        }
    }
}

export type { Query, SearchResponse };