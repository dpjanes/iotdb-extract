/**
 *  lib/links.js
 *
 *  David Janes
 *  Consensas
 *  2018-09-01
 *
 *  Copyright [2013-2018] [David P. Janes]
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

const assert = require("assert")
const url = require("url")

const cheerio = require("cheerio")

/**
 */
const _links = _.promise.make(self => {
    const method = "links"

    $ = self.$

    if (!self.rule.links) {
        self.links = null
        return
    }

    self.links = []

    $(self.rule.links).each((x, a) => {
        const href = $(a).attr("href")

        if (self.rule.filter) {
            if (!href.startsWith(self.rule.filter)) {
                return
            }
        }

        if (href.startsWith("/")) {
            self.links.push(new url.URL(href, self.url).toString())
        } else {
            self.links.push(href)
        }
    })

    self.links = _.uniq(self.links)
})

/**
 */
const links = _.promise.make((self, done) => {
    const method = "links"

    assert.ok(_.is.Array(self.rules), `${method}: expected self.rules`)
    assert.ok(_.is.String(self.document), `${method}: expected self.document`)

    _.promise.make(self)
        .then(_.promise.add({
            "$": cheerio.load(self.document),
        }))
        .then(_.promise.series({
            method: _links,
            inputs: "rules:rule",
            outputs: "linkss",
            output_selector: sd => sd.links,
            output_filter: links => links,
        }))
        .then(_.promise.make(sd => {
            console.log("HERE:XXX", sd.linkss)
            sd.links = sd.linkss.find(links => links.length) || []
        }))
        .then(_.promise.done(done, self, "links"))
        .catch(done)
})

/**
 *  API
 */
exports.links = links
