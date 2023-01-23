"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const path_1 = require("path");
exports.config = {
    web_server: {
        port: 3000,
        cors: "*"
    },
    torrent: {
        cache: false,
        path: "/tmp/webtorrent",
        db: (0, path_1.join)(__dirname, "../db.db"),
        loop_interval: 1000,
        cache_timeout: 14400000 // How long to cache torrents for in milliseconds (currently set to 4 hours)
    }
};
//# sourceMappingURL=config.js.map