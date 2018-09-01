/**
 *  lib/extract.js
 *
 *  David Janes
 *  Consensas
 *  2018-09-01
 */

const _ = require("iotdb-helpers")

const assert = require("assert")

const cheerio = require("cheerio")

const _extract = _.promise.make(self => {
    const method = "extract"

    $ = self.$

    self.jsons = []

    const stories = $(self.rule.content || "body")
    stories.each((x, _story) => {
        const json = _.d.compose({
            document: [],
            url: self.url,
        }, self.rule.meta || {})

        let any = false

        const story = $(_story)

        if (self.rule.title) {
            story.find(self.rule.title).each((x, p) => {
                json.title = $(p).text()
                any = true
            })
        }

        if (self.rule.body) {
            story.find(self.rule.body).each((x, p) => {
                json.document.push($(p).text())
                any = true
            })
        }

        if (!any) {
            return
        }

        json.document = json.document.join("\n\n")
        self.jsons.push(json)
    })
})

/**
 */
const extract = _.promise.make((self, done) => {
    const method = "extract"

    assert.ok(_.is.Array(self.rules), `${method}: expected self.rules`)
    assert.ok(_.is.String(self.document), `${method}: expected self.document`)
    
    _.promise.make(self)
        .then(_.promise.add({
            "$": cheerio.load(self.document),
        }))
        .then(_.promise.series({
            method: _extract,
            inputs: "rules:rule",
            outputs: "jsonss",
            output_selector: sd => sd.jsons,
        }))
        .then(_.promise.make(sd => {
            sd.jsons = sd.jsonss.find(jsons => jsons.length)
        }))
        .then(_.promise.done(done, self, "jsons"))
        .catch(done)
})

/**
 *  API
 */
exports.extract = extract
