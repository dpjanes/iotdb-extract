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

    $content.find("p,div").each((x, e) => {
        const $e = $(e)
        $e.parentsUntil("body").each((x, p) => {
            p.__EXCLUDE = true
        })
    })

    $content.find("p,div").each((x, e) => {
        if (e.__EXCLUDE) {
            return
        }
        const $e = $(e)
        const text = _util.text($, $e)
            .replace(/[^A-Za-z]/g, " ")
            .split(" ")
            .filter(x => x.length)

        $e.parentsUntil("body").each((x, p) => {
            if (x < 2) {
                p.__SCORE = (p.__SCORE || 0) + 1
            }
        })
    })

    let max = null
    let max_score = 0

    $content.find("div").each((x, e) => {
        if (!e.__SCORE) {
            return
        }

        if (e.__SCORE < max_score) {
            return
        }

        const $e = $(e)
        let eclass = $e.attr("class")
        let eid = $e.attr("id")

        max_score = e.__SCORE
        if (max_score < 4) {
            max = "article"
        } else if (eid) {
            max = `article ${e.tagName}#${eid}`
        } else if (eclass) {
            eclass = eclass.split(" ").filter(x => x.length).join(".")
            max = `article ${e.tagName}.${eclass}`
        } else {
            max = `article ${e.tagName}`
        }
    })

    if (max_score > 0) {
        self.extracts.push({
            $strategy: "document.article",
            $score: 0.8,
            document: max,
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
