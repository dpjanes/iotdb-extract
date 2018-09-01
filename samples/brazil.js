/**
 *  brazil.js
 *
 *  David Janes
 *  Consensas
 *  2018-09-01
 */

const _ = require("iotdb-helpers")
const extract = require("iotdb-extract")
const fs = require("iotdb-fs")

_.promise.make({
    url: "https://www.bbc.com/news/world-latin-america-45380237"
})
    .then(fs.read.p("brazil.html", "utf-8"))

    .then(extract.initialize)
    .then(extract.load_rules.builtin)
    .then(extract.find)
    .then(extract.extract)
    .then(_.promise.make(sd => {
        console.log(JSON.stringify(sd.jsons, null, 2))
    }))
    .catch(error => {
        console.log("#", _.error.message(error))
    })
