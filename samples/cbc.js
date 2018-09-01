/**
 *  cbc.js
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
    url: "https://www.cbc.ca/news/politics/does-mexico-throw-canada-under-the-bus-1.4807073",
})
    // aws setup
    .then(_.promise.add("awsd", require("./aws.json")))
    .then(aws.initialize)
    .then(aws.comprehend.initialize)

    // extract
    .then(extract.initialize)
    .then(extract.load_rules.builtin)

    // find the rule, fetch
    .then(extract.find)
    .then(extract.fetch)

    // analyze
    .then(extract.extract)
    .then(extract.entities)

    .then(_.promise.make(sd => {
        console.log(JSON.stringify(sd.jsons, null, 2))
    }))
    .catch(error => {
        console.log("#", _.error.message(error))

        delete error.self
        console.log(error)
    })
