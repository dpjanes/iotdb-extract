/**
 *  samples/download.js
 *
 *  David Janes
 *  Consensas
 *  2020-11-02
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
const extract = require("../..")
const fs = require("iotdb-fs")
const fetch = require("iotdb-fetch")
const document = require("iotdb-document")

const rss_parser = require("rss-parser")
const node_url = require("url")
const path = require("path")

const minimist = require("minimist")
const ad = minimist(process.argv.slice(2), {
    boolean: [ ],
    string: [
        "_",
    ],
})

/**
 */
const _one_item = _.promise((self, done) => {
    _.promise(self)
        .validate(_one_item)

        .make(sd => {
            sd.hash = _.hash.md5(sd.json.link)
            sd.path = path.join("outputs", sd.hostname, `${sd.hash}.json`)
            sd.url = sd.json.link
        })
        .then(fs.exists)
        .conditional(sd => sd.exists, _.promise.bail)
        .then(fs.make.directory.parent)
        .then(fs.write.json)

        .log("downloading", "url")
        .then(fetch.document)
        .then(document.to.string.utf8) // just in case
        .make(sd => {
            sd.path = path.join("outputs", sd.hostname, `${sd.hash}.html`)
        })
        .then(fs.write.utf8)
        .log("wrote", "path")

        .end(done, self, _one_item)
})

_one_item.method = "_one_item"
_one_item.description = ``
_one_item.requires = {
    hostname: _.is.String,
    json: {
        link: _.is.String,
    },
}
_one_item.accepts = {
}
_one_item.produces = {
}
_one_item.params = {
}
_one_item.p = _.p(_one_item)


/**
 */
const _one_feed = _.promise((self, done) => {
    _.promise(self)
        .validate(_one_feed)

        .log("-----------------")
        .log("url", "url")
        .then(fetch.document)
        .make((sd, sdone) => {
            sd.hostname = new URL(sd.url).hostname
            sd.items = []

            const parser = new rss_parser()
            parser.parseString(sd.document, (error, parsed) => {
                if (error) {
                    console.log("#", "can't parse", self.url)
                    return sdone(null, sd)
                }

                sd.items = parsed.items
                sd.items.length = Math.max(10, sd.items.length)
                return sdone(null, sd)
            })
        })
        .each({
            method: _one_item,
            inputs: "items:json",
            input_filter: item => item.link,
        })

        .end(done, self, _one_feed)
})

_one_feed.method = "_one_feed"
_one_feed.description = ``
_one_feed.requires = {
    url: _.is.AbsoluteURL,
}
_one_feed.accepts = {
}
_one_feed.produces = {
}

/**
 *  Downloads RSS feeds
 */
_.promise({
    paths: ad._,
})
    .each({
        method: fs.read.json.magic,
        inputs: "paths:path",
        outputs: "urls",
        output_selector: sd => sd.json.feeds.map(d => d.feed),
        output_flatten: true,
    })
    .each({
        method: _one_feed,
        inputs: "urls:url",
        error: error => {
            console.log("#", "error with", error.self.url, error)
        }
    })
    .catch(error => {
        console.log("#", _.error.message(error))

        delete error.self
        console.log(error)
    })
