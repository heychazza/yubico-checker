var request = require('request');
const { json } = require('stream/consumers');
require('dotenv').config()

function checkStock() {
    return new Promise(function (resolve, reject) {
        request({
            url: 'https://www.yubico.com/gb/api/catalog/details?url_key=' + process.env.ITEM_ID,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:94.0) Gecko/20100101 Firefox/94.0',
                'Accept': '*/*',
                'Accept-Language': 'en-GB,en;q=0.5',
                'Content-Type': 'application/json',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'TE': 'trailers',
            },
            json: true
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let status = body.extension_attributes.stock_item.is_in_stock;
                return resolve({ body, status })
            }

            reject(error)
        });
    })
}

function notifyAvailability(name, img, msg) {
    request({
        url: process.env.WEBHOOK_URL,
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            username: name,
            avatar_url: img,
            content: msg + '\r\n' + `https://www.yubico.com/gb/product/${process.env.ITEM_ID}/`,
        })
    })
}

async function run() {
    let { body, status } = await checkStock();

    let itemName = body.custom_attributes.meta_title;
    let itemImg = body.extension_attributes.media_absolute_url.image;

    notifyAvailability(itemName, itemImg, status ? 'This item is now in stock.' : 'This item is still unavailable.');
}

// Check every 5 minutes.
setInterval(run, 60000 * 5);
run()
