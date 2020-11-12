/**
 *  lib/extract.js
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

const cheerio = require("cheerio")

const logger = require("../logger")(__filename)
const _util = require("./_util")

/**
 */
const _extract_elements = ($, $story, part_rule) => {
    let parts = []

    if (_.is.String(part_rule)) {
        part_rule = {
            select: part_rule,
        }
    }

    logger.debug({
        method: _extract_elements.method,
        part_rule: part_rule,
    }, "called")

    if (_.is.Dictionary(part_rule)) {
        if (part_rule.content) {
            parts = []
            $story = $story.find(part_rule.select).first()

            if (part_rule.removes) {
                $story = $story.clone()
                _.coerce.list(part_rule.removes).forEach(remove => $story.find(remove).remove())

                console.log($story.html())
            }

            $story.find(part_rule.content).each((x, e) => {
                parts.push($(e))
            })
        } else {
            parts = []
            $story.find(part_rule.select).each((x, e) => {
                parts.push($(e))
            })
        }

        if (part_rule.attribute) {
            parts = parts.map(part => part.attr(part_rule.attribute))
        } else if (part_rule.jsonld) {
            parts = parts.map(part => part.html())
        } else {
            parts = parts.map(part => _util.text($, part))
        }

        if (part_rule.jsonld && parts.length) {
            try {
                const json = _util.parse(parts[0])
                parts = [ json[part_rule.jsonld] ]
            } catch (x) {
                logger.warn({
                    method: "_extract_elements",
                    error: _.error.message(x),
                }, "couldn't parse JSON-LD")

                parts = []
            }
        }

        if (part_rule.split) {
            parts = _.flatten(parts.map(part => part.split(part_rule.split)))
        }
    }

    const _scrub = o => {
        if (_.is.String(o)) {
            o = o.replace(/[\s|\u00A0]+/g, " ")
            o = o.trim()
            return o
        } else if (_.is.Array(o)) {
            return o.map(so => _scrub(so)).filter(so => !_.is.Empty(so))
        } else {
            return o
        }
    }

    return _.flatten(_scrub(parts))
}

/**
 */
const _extract = _.promise(self => {
    _.promise.validate(self, _extract)

    if (!self.rule.extract) {
        self.jsons = null
        return
    }

    $ = self.$

    self.jsons = []

    const stories = $(self.rule.extract.$select || "html")
    logger.debug({
        method: _extract.method,
        rule: self.rule,
        n_stories: stories.length,
    }, "called")

    stories.each((x, _story) => {
        const json = _.d.compose({
            url: self.url,
        }, self.rule.meta || {})

        let $story = $(_story)

        /*
        if (self.rule.extract.$removes) {
            $story = $story.clone()

            _.d.list(self.rule.extract, "$removes", [])
                .forEach(remove => $story.find(remove).remove())
        }
        */

        _.mapObject(self.rule.extract, (part_rule, key) => {
            if (key.startsWith("$")) {
                return
            }

            const parts = _extract_elements($, $story, part_rule)
            if (!parts.length) {
                return
            }

            if (key === "name") {
                json[key] = parts[0]
            } else if (part_rule.first) {
                json[key] = parts[0]
            } else if (part_rule.list) {
                json[key] = parts
            } else {
                json[key] = parts.join("\n")
            }

            /*
            if (_.is.Array(part_rule.edit)) {
                _.coerce.list(part_rule.removes).forEach(remove => {
                    json[key] = json[key].replace(remove, "")
                })
            }
            */
        })

        if (self.rule.$name_required && _.is.Empty(json.name)) {
            return
        }

        if (self.rule.$document_required && _.is.Empty(json.document)) {
            return
        }

        json._rule = self.rule
        self.jsons.push(json)
    })
})

_extract.method = "extract/_extract"
_extract.requires = {
    rule: _.is.Dictionary,
}
_extract.accepts = {
}
_extract.produces = {
}

/**
 */
const extract = _.promise((self, done) => {
    logger.debug({
        method: extract.method,
        rules: self.rules,
    }, "called")

    _.promise(self)
        .validate(extract)

        .add({
            "$": cheerio.load(self.document),
        })
        .each({
            method: _extract,
            inputs: "rules:rule",
            outputs: "jsonss",
            output_selector: sd => sd.jsons,
            output_filter: jsons => jsons && jsons.length,
        })
        .make(sd => {
            sd.jsons = sd.jsonss.length ? sd.jsonss[0] : []
        })
        .end(done, self, "jsons")
})

extract.method = "extract"
extract.requires = {
    rules: _.is.Array,
    document: _.is.String,
}
extract.accepts = {
}
extract.produces = {
    jsons: _.is.Array,
}

/**
 *  API
 */
exports.extract = extract
