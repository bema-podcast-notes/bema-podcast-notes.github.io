$durationRegex = '(duration:\s)(([0-9]+:)*[0-9]{1,2}:[0-9]{1,2})'
$bookLinksRegex = '<a target\=\\\"_blank\\\" href\=\\\"[-a-zA-Z0-9@:%_\+.~?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~?&//=]*)?(\?([-a-zA-Z0-9@:%_\+.~?&//=]+)|)\\\"><em>[A-z\s]*<\/em>\s?(&nbsp;)?(B|b)y [\(\)A-z''\.\s]*<\/a>'

$feedEntries = Invoke-RestMethod -Uri https://feeds.fireside.fm/bema/rss
Invoke-RestMethod -Uri https://feeds.fireside.fm/bema/rss -OutFile ./_data/bema-rss.xml

$feedEntries = $feedEntries
    | Select-Object title,subtitle,description,link,pubDate,duration,season,playerUrl,enclosure.url,episodeIndex

foreach ($entry in $feedEntries) {
    $entry.episodeIndex = $entry.link
}

$feedEntries
    | ConvertTo-Yaml 
    | Set-Content ./_data/episodes.yaml

$yaml = Get-Content -Path ./_data/episodes.yaml
$yaml = $yaml -replace $durationRegex, '$1"$2"' 
$yaml = $yaml -replace "episodeIndex: https://www.bemadiscipleship.com/", "episodeIndex: "
$bookList = $yaml | Select-String -Pattern $bookLinksRegex
$yaml | Set-Content ./_data/episodes.yaml
$bookList | Set-Content ./_data/book-list.yaml