import { join } from "path";

export var config = {
    web_server: {
        port: 3000,
        cors: "*"
    },
    torrent: {
        cache: false, // Whether to cache torrents or not
        path: "/tmp/webtorrent", // Torrent storage path
        db: join(__dirname, "../db.db"), // Path to SQLite database
        loop_interval: 1000, // How often to check for torrents to remove in milliseconds
        cache_timeout: 14400000 // How long to cache torrents for in milliseconds (currently set to 4 hours)
    }
}