$feedEntries = Invoke-RestMethod -Uri https://feeds.fireside.fm/bema/rss
Invoke-RestMethod -Uri https://feeds.fireside.fm/bema/rss -OutFile ./_data/bema-rss.xml

$feedEntries 
    | Select-Object title,subtitle,description,link,pubDate,duration,season,playerUrl,enclosure.url
    | ConvertTo-Yaml 
    | Set-Content ./_data/episodes.yaml

$yaml = Get-Content -Path ./_data/episodes.yaml
$yaml = $yaml -replace '(duration:\s)(([0-9]+:)*[0-9]{1,2}:[0-9]{1,2})', '$1"$2"' 
$yaml | Set-Content ./_data/episodes.yaml
