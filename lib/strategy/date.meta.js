/**
 *  lib/strategy/date.meta.js
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

const datemap = {
    "DC.date.issued": [ "created", .8 ],
    "LastModifiedDate": [ "modified", .8 ],
    "article:modified_time": [ "modified", .8 ],
    "article:published_time": [ "created", .8 ],
    "bricolage-publish-date": [ "created", .8 ],
    "date": [ "updated", .5 ],
    "date.available": [ "created", .8 ],
    "date.created": [ "created", .8 ],
    "date.modified": [ "modified", .8 ],
    "date.updated": [ "modified", .8 ],
    "datemodified": [ "modified", .8 ],
    "dc.date": [ "created", .6 ],
    "dc.date.modified": [ "modified", .8 ],
    "last_updated_date": [ "modified", .8 ],
    "lastmod": [ "modified", .8 ],
    "og:article:modified_time": [ "modified", .8 ],
    "og:article:published_time": [ "created", .8 ],
    "og:pubdate": [ "createcreated", .8 ],
    "og:updated_time": [ "modified", .8 ],
    "pubdate": [ "created", .8 ],
    "publish-date": [ "created", .8 ],
    "publishDate": [ "createcreated", .8 ],
    "publisheddate": [ "created", .8 ],
    "sailthru.date": [ "created", .6 ],
    "shareaholic:article_modified_time": [ "modified", .7 ],
    "shareaholic:article_published_time": [ "created", .7 ],
}

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

            const dt = datemap[key]
            if (!dt) {
                return
            }

            const dkey = dt[0]
            let score = dt[1]

            if (content.match(/^\d\d\d\d-\d\d-\d\dT/)) {
                score += .1
            } else if (content.match(/^\d\d\d\d-\d\d-\d\d/)) {
                score += .05
            } else if (_.is.NaN(Date.parse(content))) {
                score -= .2
            }

            self.extracts.push({
                $strategy: "date.meta",
                $score: score,
                [ dkey ]: {
                    root: `meta[${pkey}='${key}']`,
                    attribute: "content",
                },
            })
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
