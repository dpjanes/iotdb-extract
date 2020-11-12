/**
 *  lib/links.js
 *
 *  David Janes
 *  IOTDB
 *  2018-09-01
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

const URL = require("url").URL

const cheerio = require("cheerio")

/**
 */
const _links = _.promise(self => {
    $ = self.$

    if (!self.rule.links) {
        self.links = null
        return
    }

    self.links = []

    $(self.rule.links).each((x, a) => {
        const href = $(a).attr("href")
        if (!href) {
            return
        }

        if (self.rule.filter_re) {
            const rex = new RegExp(self.rule.filter_re)
            if (!href.match(rex)) {
                return
            }
        } else if (self.rule.filter) {
            if (!href.startsWith(self.rule.filter)) {
                return
            }
        }

        if (href.startsWith("/")) {
            self.links.push(new URL(href, self.url).toString())
        } else {
            self.links.push(href)
        }
    })

    self.links = _.uniq(self.links)
})

/**
 */
const links = _.promise((self, done) => {
    _.promise(self)
        .validate(links)

        .add({
            "$": cheerio.load(self.document),
        })
        .each({
            method: _links,
            inputs: "rules:rule",
            outputs: "linkss",
            output_selector: sd => sd.links,
            output_filter: links => links,
        })
        .make(sd => {
            sd.links = sd.linkss.find(links => links.length) || []
        })
        .end(done, self, "links")
})

links.method = "links"
links.requires = {
    rules: _.is.Array,
    document: _.is.String,
}
links.accepts = {
}
links.produces = {
    links: _.is.Array.of.String,
}

/**
 *  API
 */
exports.links = links
