/*
 *  bin/extract-build.js
 *
 *  David Janes
 *  Consensas
 *  2019-07-26
 */

"use strict"

const _ = require("iotdb-helpers")
const fs = require("iotdb-fs")
const fetch = require("iotdb-fetch")
const extract = require("..")

const yaml = require("js-yaml")
const path = require("path")
const os = require("os")
const URL = require("url").URL

const cheerio = require("cheerio")

const minimist = require("minimist")
const ad = minimist(process.argv.slice(2), {
    boolean: [
        "verbose", "dump", "trace", "debug",
        "dry-run",
        "guess",
        "guess-h1",
        "guess-h2",
        "guess-h3",
        "write",
    ],
    string: [
        "url", 
        "document", "title",
    ],
    alias: {
        "dry-run": "dry_run",
    }, 
})

const help = message => {
    const name = "extract-build"

    if (message) {
        console.log(`${name}: ${message}`)
        console.log()
    }

    console.log(`usage: ${name} [options] --url <url>`)
    console.log("")
    console.log("Options:")
    console.log("--url <url>                URL to pull (cached)")
    console.log("--write                    Write the YAML file")
    console.log("")
    console.log("--document <selector>")
    console.log("--title <selector>")
    console.log("")
    console.log("--guess                    Try and figure out what's what")
    console.log("--guess-h[123]             Force H1/H2/H3 for guessing title (H1 default")

    process.exit(message ? 1 : 0)
}

if (ad.help) {
    help()
}
if (!ad.url) {
    help("--url <url> is required")
}
_.logger.levels({
    debug: ad.debug || ad.verbose,
    trace: ad.trace || ad.verbose,
})
const logger = require("../logger")(__filename)

/**
 */
const _load = _.promise((self, done) => {
    _.promise(self)
        .validate(_load)

        .add("path", path.join(self.cache_folder, self.url_hash + ".html"))
        .then(fs.make.directory.parent)
        
        .add("otherwise", null)
        .then(fs.read.utf8)
        .conditional(sd => sd.document, _.promise.bail)

        .then(fetch.document)
        .then(fs.write.utf8)

        .end(done, self, "document")
})

_load.method = "_load"
_load.requires = {
    cache_folder: _.is.String,
    url: _.is.String,
    url_hash: _.is.String,
}
_load.accepts = {
}
_load.produces = {
    $: _.is.Object,
    document: _.is.String,
}

/**
 */
const _guess_title = _.promise(self => {
    _.promise.validate(self, _guess_title)
    
    if (self.rule.title) {
        return
    }

    const $ = self.$

    let name = "h1"
    if (ad["guess-h2"]) {
        let name = "h2"
    } else if (ad["guess-h3"]) {
        let name = "h3"
    }

    $(name).each((index, element) => {
        const e$ = $(element)
        const ead = e$.attr()

        self.rule.title = name
        if (ead.class) {
            self.rule.title = name + "." + ead.class.split(" ").filter(x => x.length).join(".")
        }
    })
})

_guess_title.method = "_guess_title"
_guess_title.requires = {
    rule: _.is.Dictionary,
    $: _.is.Object,
}
_guess_title.accepts = {
}
_guess_title.produces = {
}

/**
 */
const _guess_document = _.promise(self => {
    _.promise.validate(self, _guess_document)
    
    if (self.rule.document) {
        return
    }

    const $ = self.$

    let max = 0

    $("*").each((index, element) => {
        const e$ = $(element)

        const n = e$.children("p").length
        if (n <= max) {
            return
        }

        for (let i = 0; i < 20; i++) {
            if (!element || (element.tagName === "html") || !element.tagName) {
                break
            }

            const e$ = $(element)
            const ead = e$.attr();

            const oks = [ "div", "section", "article" ];
            if (ead.class && (oks.indexOf(element.tagName) > -1)) {
                self.rule.document = element.tagName + "." + ead.class.split(" ").filter(x => x.length).join(".")
                max = n
                break
            }

            element = element.parentNode

        }
    })
})

_guess_document.method = "_guess_document"
_guess_document.requires = {
    rule: _.is.Dictionary,
    $: _.is.Object,
}
_guess_document.accepts = {
}
_guess_document.produces = {
}

/**
 */
const _guess_published = _.promise(self => {
    _.promise.validate(self, _guess_published)
    
    const $ = self.$

    $("meta").each((index, element) => {
        const e$ = $(element)
        const ead = e$.attr()

        if (!ead.content) {
            return
        } else if (!ead.content.match(/^20[012][0-9]-?\d\d-?\d\d/)) {
            return
        }

        const key_key = ead.name ? "name" : "property"
        const key_value = ead[key_key]

        switch (key_value) {
        case "pubdate":
        case "og:pubdate":
        case "datePublished":
        case "date.created":
        case "article:published_time":
        case "og:article:published_time":
            if (self.rule.published) {
                break
            }

            self.rule.published = {
                root: 'meta[' + key_key + '="' + key_value + '"]',
                attribute: "content"
            }
            break


        case "lastmod":
        case "dateModified":
        case "article:modified_time":
        case "LastModifiedDate":
        case "date.updated":
        case "og:article:modified_time":
            if (self.rule.updated) {
                break
            }

            self.rule.updated = {
                root: 'meta[' + key_key + '="' + key_value + '"]',
                attribute: "content"
            }
            break
        }
    })
})

/**
 */
const _guess_keywords = _.promise(self => {
    _.promise.validate(self, _guess_keywords)
    
    const $ = self.$

    $("meta").each((index, element) => {
        const e$ = $(element)
        const ead = e$.attr()

        if (!ead.content) {
            return
        }

        let key_key
        if (ead.name) {
            key_key = "name"
        } else if (ead.property) {
            key_key = "property"
        } else if (ead.itemprop) {
            key_key = "itemprop"
        } else {
            return
        }
        const key_value = ead[key_key]

        switch (key_value) {
        case "keywords":
        case "news_keywords":
        case "article:tag":
        case "og:article:tag":
            if (self.rule.keywords) {
                break
            }

            self.rule.keywords = {
                root: 'meta[' + key_key + '="' + key_value + '"]',
                attribute: "content"
                split: ",",
                list: true,
            }
            break
        }
    })
})

_guess_keywords.method = "_guess_keywords"
_guess_keywords.requires = {
    rule: _.is.Dictionary,
    $: _.is.Object,
}
_guess_keywords.accepts = {
}
_guess_keywords.produces = {
}

/**
 */
const _guess_jsonld = _.promise(self => {
    _.promise.validate(self, _guess_jsonld)
    
    const $ = self.$
    const selector = 'script[type="application/ld+json"]'
    const element = $(selector)
    if (!element.length) {
        return
    }

    const e$ = $(element)

    let d
    try {
        d = JSON.parse(e$.html())
    } catch (x) {
        return
    }

    if (!self.rule.title && d.headline) {
        self.rule.title = {
            root: selector,
            jsonld: "headline",
        }
    }
        
    if (!self.rule.published && d.datePublished) {
        self.rule.published = {
            root: selector,
            jsonld: "datePublished",
        }
    }
        
    if (!self.rule.updated && d.dateModified) {
        self.rule.updated = {
            root: selector,
            jsonld: "dateModified",
        }
    }
})

_guess_jsonld.method = "_guess_jsonld"
_guess_jsonld.requires = {
    rule: _.is.Dictionary,
    $: _.is.Object,
}
_guess_jsonld.accepts = {
}
_guess_jsonld.produces = {
}

const _guess = _.promise((self, done) => {
    _.promise(self)
        .validate(_guess)

        .make(sd => {
            sd.$ = cheerio.load(self.document)
        })
        .then(_guess_jsonld)
        .then(_guess_title)
        .then(_guess_document)
        .then(_guess_published)
        .then(_guess_keywords)

        .end(done, self)
})

_guess.method = "_guess"
_guess.requires = {
}
_guess.accepts = {
}
_guess.produces = {
}

/**
 */
const _write = _.promise((self, done) => {
    _.promise(self)
        .validate(_write)

        .make(sd => {
            const hostname = new URL(sd.url).hostname.replace(/^www[.]/, "")

            sd.path = hostname + ".yaml"
            sd.document = "---\n" + yaml.safeDump({
                urls: hostname,
                samples: [ sd.url ],
                extract: sd.rule,
            },
            sd.rule, {
                sortKeys: true,
            })

            console.log("--")
            console.log("-", "wrote:", sd.path)
        })
        .then(fs.write.utf8)

        .end(done, self)
})

_write.method = "yyy._write"
_write.requires = {
}
_write.accepts = {
}
_write.produces = {
}


/**
 *  main
 */
_.promise({
    trace: ad.trace,
    verbose: ad.verbose,
    dry_run: ad.dry_run,

    cache_folder: path.join(os.homedir(), "var", "iotdb-extract"),
    url: ad.url,
    url_hash: _.hash.md5(ad.url),
})
    .then(_load)
    .make(sd => {
        sd.rule = {
            _document_required: false,
            _title_required: false,
        }

        if (ad.document) {
            sd.rule.document = ad.document
        }
        if (ad.title) {
            sd.rule.title = ad.title
        }

        sd.rules = [
            {
                extract: sd.rule,
            }
        ]
    })
    .conditional(ad.guess, _guess)
    .then(extract.extract)

    .make(sd => {
        sd.jsons.forEach(json => {
            _.keys(json)
                .filter(key => key.startsWith("_"))
                .forEach(key => delete json[key])

            console.log("--")
            console.log(yaml.safeDump(json, {
                sortKeys: true,
            }))

        })

        _.keys(sd.rule)
            .filter(key => key.startsWith("_"))
            .forEach(key => delete sd.rule[key])

        console.log("--")
        console.log(yaml.safeDump(sd.rule, {
            sortKeys: true,
        }))

    })
    .conditional(ad.write, _write)

    // done
    .catch(error => {
        delete error.self
        console.log("===")
        console.trace()
        console.log("===")
        console.log()

        help(_.error.message(error))
    })


/*
*/

