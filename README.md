# bema-podcast-notes.github.io

## Generating `bemarss.json`

Navigate to https://npm.runkit.com/rss-to-json or (https://runkit.com/embed/nz54psgcana4) and execute the following Node.js script:

    var rssToJson = require("rss-to-json")

    const { parse } = require('rss-to-json');
    // async await
    (async () => {
        var rss = await parse('https://feeds.fireside.fm/bema/rss');
        console.log(JSON.stringify(rss, null, 3));
    })();

Output can be copied from the virtual console shown below the script on the screen and then pasted into the `/_data/bema-rss.json` file.