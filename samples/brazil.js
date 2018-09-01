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
const aws = require("iotdb-awslib")

_.promise.make({
    // awsd: awsd,
    // url: 
})
    // aws setup
    .then(_.promise.add("awsd", require("./aws.json")))
    .then(aws.initialize)
    .then(aws.comprehend.initialize)

    // extract
    .then(extract.initialize)
    .then(extract.load_rules.builtin)

    // find the rule
    .then(extract.find.p("https://www.bbc.com/news/world-latin-america-45380237"))

    // parse the document
    .then(fs.read.p("brazil.html", "utf-8"))
    .then(extract.extract)

    // get entities & sentiment
    .then(extract.entities)
    .then(extract.sentiment)

    .then(_.promise.make(sd => {
        console.log(JSON.stringify(sd.jsons, null, 2))
    }))
    .catch(error => {
        console.log("#", _.error.message(error))
    })
