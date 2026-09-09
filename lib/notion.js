const { Client } = require('@notionhq/client');

if (!process.env.NOTION_TOKEN) {
    console.warn('NOTION_TOKEN is not set.');
}

const notion = new Client({
    auth: process.env.NOTION_TOKEN,
});

module.exports = { notion };
