/**
 *  lib/strategy/name.meta.js
 *
 *  David Janes
 *  IOTDB.org
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

const cheerio = require("cheerio")

const logger = require("../../logger")(__filename)
const _util = require("./../_util")

/**
 */
const strategy = _.promise(self => {
    _.promise.validate(self, strategy)

    const $ = cheerio.load(self.document)

    $("meta").each((x, e) => {
        const $e = $(e)

        ;[ "name", "property" ].forEach(pkey => {
            const key = $e.attr(pkey)
            if (!key) {
                return
            }

            const content = $e.attr("content")
            if (!content) {
                return
            }

            let score = 0
            switch (key) {
            case "sailthru.title":
                score = 0.85
                break
            case "og:title":
                score = 0.875
                break
            case "twitter:title":
                score = 0.9
                break
            }

            if (score) {
                self.extracts.push({
                    $strategy: "name.meta",
                    $score: score,
                    name: {
                        root: `meta[${pkey}='${key}']`,
                        attribute: "content",
                    },
                })
            }
        })
    })
})

strategy.method = "strategy"
strategy.description = `Figure out the structure of a web page`
strategy.requires = {
    document: _.is.String,
    extracts: _.is.Array,
}
strategy.accepts = {
}
strategy.produces = {
    extracts: _.is.Array,
}

/**
 *  API
 */
exports.strategy = strategy
