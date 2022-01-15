$durationRegex = '(duration:\s)(([0-9]+:)*[0-9]{1,2}:[0-9]{1,2})'
$bookLinksRegex = '<a target\=\\\"_blank\\\" href\=\\\"[-a-zA-Z0-9@:%_\+.~?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~?&//=]*)?(\?([-a-zA-Z0-9@:%_\+.~?&//=]+)|)\\\"><em>[A-z\s]*<\/em>\s?(&nbsp;)?(B|b)y [\(\)A-z''\.\s]*<\/a>'

$feedEntries = Invoke-RestMethod -Uri https://feeds.fireside.fm/bema/rss
Invoke-RestMethod -Uri https://feeds.fireside.fm/bema/rss -OutFile ./_data/bema-rss.xml

$feedEntries 
    | Select-Object title,subtitle,description,link,pubDate,duration,season,playerUrl,enclosure.url
    | ConvertTo-Yaml 
    | Set-Content ./_data/episodes.yaml

$yaml = Get-Content -Path ./_data/episodes.yaml
$yaml = $yaml -replace $durationRegex, '$1"$2"' 
$bookList = $yaml | Select-String -Pattern $bookLinksRegex
$yaml | Set-Content ./_data/episodes.yaml
$bookList | Set-Content ./_data/book-list.yaml