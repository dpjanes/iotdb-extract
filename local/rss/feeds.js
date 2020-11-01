/**
 *  samples/feeds.js
 *
 *  David Janes
 *  Consensas
 *  2020-11-01
 *
 *  Copyright (2013-2020) David P. Janes
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const _ = require("iotdb-helpers")
const extract = require("..")
const fs = require("iotdb-fs")
const fetch = require("iotdb-fetch")

const cheerio = require("cheerio")
const minimist = require("minimist")
const ad = minimist(process.argv.slice(2), {
    boolean: [ ],
})

if (!ad._.length) {
    console.log("#", "expected a domain name")
    process.exit()
}

/**
 *  This pulls sample RSS feeds
 */
_.promise({
    url: ad._[0],
    path: ad.out || "feeds.yaml",
})
    .then(fetch.document.get(null))
    .make(sd => {
        const $ = cheerio.load(sd.document)
        sd.json = {
            name: null,
            feeds: []
        }

        $("h2").each((x, e) => {
            if (!sd.json.name) {
                sd.json.name = $(e).text()
            }
        })
        $("table#fsb").find(".rss-block").each((x, e) => {
            const $rss = $(e)

            const d = {}

            $rss.find(".thumb img").each((x, e) => {
                const $img = $(e)

                d.name = $img.attr("alt")
            })

            $rss.find("a").each((x, e) => {
                const $a = $(e)
                // console.log($a.attr("href"), $a.attr("class") || null)

                if (!$a.attr("class")) {
                    if (!d.feed) {
                        d.feed = $a.attr("href")
                    } else {
                        d.url = $a.attr("href")
                    }
                }
            })

            sd.json.feeds.push(d)
        })
    })
    .then(fs.write.yaml)
    .log("wrote", "path")
    .catch(error => {
        console.log("#", _.error.message(error))

        delete error.self
        console.log(error)
    })
