# iotdb-extract
Extract text articles from newspapers


## Commands

All commands are found in the folder and are run e.g. `node extract.js`

### Extract

Extract structured data from an HTML document, using rules.

	usage: extract [options]

	Extract structured data from an HTML document, using rules.
	
    Source options:
    
    One of these is required. If used together, the document will
    be read from the file, but the url is assumed to be the source
    of the file - this is useful in case, e.g. in looking up rules..
    
    --url <url>     url to extract from
    --file <file>   file to extract from
    
    Rule options:
    
    If --rule is specified, the rules in that file will
    be used for better or for worse. If --rules is specified, all the
    rules in that folder will be used (narrowed by --url). If neither is
    specified, the default rules will be which handle a few well-known
    news sites (e.g. cnn, cbc, bbc)
    
    --rules <folder> load 
    --rule <file>    read the parsing rule from this file
    
    Output options (by default, output is YAML):
    
    --first          only output the first result
    --json           output the data as JSON
    --jsonl          output the data as JSON Lines
    --as <type>      as a schema.org type in JSON-LD (as much as possible,
                     most plausibly NewsArticle)
    
    Debugging info:
    
    --verbose        increase debugging information
    --no-cache       don't cache URL fetch
    
Try this example:

	node extract --url 'https://grapevine.is/mag/feature/2019/07/19/of-monsters-and-men-fever-dream/'



### Analyze

Try to construct extraction rules for an HTML document.

    usage: analyze [options]
    
    Try to construct extraction rules for an HTML document.
    
    Source options:
    
    One of these is required. If used together, the document will
    be read from the file, but the url is assumed to be the source
    of the file - this is useful in case, e.g. in looking up rules..
    
    --url <url>     url to extract from
    --file <file>   file to extract from
    
    Rule options:
    
    --rule <file>   write the rule to this file (otherwise stdout)
    --parts         write the raw parts to stdout as JSON
    
    Debugging info:
    
    --verbose       increase debugging information
    --no-cache      don't cache URL fetch
    
Try these:

    node analyze --url 'https://edition.cnn.com/2019/07/27/africa/rwanda-opposition-disappearances-intl/index.html'
    node analyze --url 'https://www.bbc.com/news/world-asia-49136211'
    node analyze --url 'https://www.cbc.ca/news/politics/snc-lavalin-bellegarde-2019-election-1.5226179'
	node analyze --url 'https://grapevine.is/mag/feature/2019/07/19/of-monsters-and-men-fever-dream/'

### Examine

Examine the structure of an HTML document. This is useful
when the Analyze tool does not figure out everything.

    usage: examine [options]

    Examine the structure of an HTML document.
    The most likely way you want to use this is:

        node examine --url <url> --find p

    Source options:

    One of these is required, with --file getting precedence

    --url <url>      url to extract from
    --file <file>    file to extract from

    Output options (one of these is required):

    --raw            just dump the document
    --html           dump document, after structuring
    --find <tag>[,<tag>...]
                     find tag(s), print the text and the CSS path

    Structuring options:

    --remove <tag>[,<tag>...]
                     remove tags from the document first, the
                     default being "svg,script,style,form"
    --scrub          remove all attributes except "class" and "id"
    --root <tag>     start at the root tag, default is "body"

    Debugging info:

    --verbose        increase debugging information
    --no-cache       don't cache URL fetch


### Validate

Validate will make sure that one or more rules that you have saved are still valid.

## Rules

### The Analyze Tool

The Analyze tool can help you figure out the proper rule to extract data from a website. It's heuristic driven, but generally gets you there without hand tweaks 90% of the time.

Here's an example of using it:

	node analyze --url 'https://www.bbc.com/news/world-africa-37243190' --rule rule.yaml
    
It creates `rule.yaml` which looks like

    ---
    apiVersion: extract/v1
    urls: bbc.com
    samples:
    - 'https://www.bbc.com/news/world-africa-37243190'
    extract:
    document:
        select: article
        content: p
    name:
        select: 'script[type="application/ld+json"]'
        jsonld: headline
        list: false
        first: true
    datePublished:
        select: 'script[type="application/ld+json"]'
        jsonld: datePublished
        list: false
        first: true
        

When you extract

	node extract --url 'https://www.bbc.com/news/world-africa-37243190' --rule rule.yaml

you get the following output:

    --
    name: 'Vote rigging: How to spot the tell-tale signs'
    url: 'https://www.bbc.com/news/world-africa-37243190'
    datePublished: '2016-09-02T01:06:42.000Z'
    document: >-
    Gabon's opposition says it was cheated of victory, after official results
    showed a turnout of 99.93% in President Ali Bongo's home region, with 95% of
    votes in his favour. Elizabeth Blunt has witnessed many elections across
    Africa, as both a BBC journalist and election observer and looks at six signs
    of possible election rigging.
    
    Watch the turnout figures ‒ they can be a big giveaway.
    
    You never get a 98% or 99% turnout in an honest election. You just don't.
    
    ...
    
    Delay is certainly dangerous, fuelling rumours of results being "massaged"
    before release and increasing tensions, but this is not incontrovertible proof
    of rigging.
    
    Gabon presidential guard 'bombed Jean Ping's party HQ'


### Broken Rules

Here's an example of an autogenerated rule that doesn't work

	URL='https://www.upi.com/Science_News/2020/11/04/Small-rocket-company-Rocket-Lab-	aims-for-orbital-reusability/3961604426951/' 
    node analyze -url $URL --rule rule.yaml 
    cat rule.yaml
    
Which looks like
    
    apiVersion: extract/v1
    urls: upi.com
    samples:
      - >-
        https://www.upi.com/Science_News/2020/11/04/Small-rocket-company-Rocket-Lab-aims-for-orbital-reusability/3961604426951/
    extract:
      document:
        select: article div.upi-slider.story_sl
        content: p
      name:
        select: 'script[type="application/ld+json"]'
        jsonld: headline
        list: false
        first: true
      datePublished:
        select: 'script[type="application/ld+json"]'
        jsonld: datePublished
        list: false
        first: true


The issue is the the heuristic for analyzing the document body got confused by a slideshow with lots of text. Not only do we want to correct this, but we want to make sure that slideshow text doesn't get included in the output - this can be done with `removes`

	...
    extract:
      document:
        select: article
        content: p
        removes: div.upi-slider.story_sl
	...

Run this command 

	node extract --url $URL --rule rule.yaml

And we get

    --
    name: Small rocket company Rocket Lab aims for orbital reusability
    url: >-
    https://www.upi.com/Science_News/2020/11/04/Small-rocket-company-Rocket-Lab-aims-for-orbital-reusability/3961604426951/
    datePublished: '2020-11-04T03:00:08-05:00'
    document: >-
    ORLANDO, Fla., Nov. 4 (UPI) -- Small launch company Rocket Lab has a big
    agenda for the end of 2020, including plans for its first liftoff from U.S.
    soil and its first attempt to recover a first-stage booster after launch.
    
    The California-based company, known for launching in New Zealand, is on target
    to tackle both goals this year, founder and CEO Peter Beck said in an
    interview Tuesday.
    
    ...
        
    The first attempt to recover a booster, still intended for 2020, will be on a
    flight with a paying customer, but none of the systems needed for booster
    recovery will be activated until the payload is deployed, Beck said.
