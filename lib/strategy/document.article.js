/**
 *  lib/strategy/document.article.js
 *
 *  David Janes
 *  IOTDB.org
 *  2020-10-31
 *  🎃🕸👻
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

    let $content = $("article:first-of-type")
    if (!$content.length) {
        return
    }

    $content.find("script").remove()

    $content.find("p,div").each((x, e) => {
        const $e = $(e)
        $e.parentsUntil("body").each((x, p) => {
            // don't exclude immediate parent
            if (x === 0) {
                p.__NOEXCLUDE = true
                return
            }

            p.__EXCLUDE = true
        })
    })

    let p = false
    $content.find("p,div").each((x, e) => {
        if (e.__EXCLUDE && !e.__NOEXCLUDE) {
            return
        }
        const $e = $(e)
        const text = _util.text($, $e)
            .replace(/[^A-Za-z]/g, " ")
            .split(" ")
            .filter(x => x.length)

        if (self.trace) {
            logger.debug({
                method: strategy.method,
                d: {
                    text: text.join(" "),
                    length: text.length,
                    parents: _util.node_path($, $e).join(" "),
                },
            }, "found text")
        }

        p = p || (e.tagName === "p")

        $e.parentsUntil("article").each((x, p) => {
            if (x < 2) {
                p.__SCORE = (p.__SCORE || 0) + 1
            }
        })
    })

    let max = null
    let max_score = 0
    
    $content.find("div,section").each((x, e) => {
        if (!e.__SCORE) {
            return
        }

        if (e.__SCORE < max_score) {
            return
        }

        const $e = $(e)

        max_score = e.__SCORE
        if (max_score < 4) {
            max = "article"
        } else {
            max = `article ${_util.node_name($, $e)}`
        }
    })

    if (max_score > 0) {
        self.extracts.push({
            $strategy: "document.article",
            $score: 0.8,
            document: {
                select: max,
                content: p ? "p" : "*",
            },
        })
    }
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
