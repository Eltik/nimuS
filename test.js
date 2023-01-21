const Scraper = require("./built/Scraper").default;
let scraper = new Scraper();
scraper.search("test").then((data) => {
    data.map((element, index) => {
        console.log(element);
    })
})