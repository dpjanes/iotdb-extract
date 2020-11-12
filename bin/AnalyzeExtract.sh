#
#   bin/AnalyzeExtract.sh
#
#   David Janes
#   IOTDB
#   2020-11-12
#
#   Run Analyze and Extract
#   

if [ $# != 1 ]
then
    echo "$0: exactly one url argument required"
    exit 1
fi

node analyze.js --url "$1" --rule rule.yaml
node extract.js --url "$1" --rule rule.yaml
