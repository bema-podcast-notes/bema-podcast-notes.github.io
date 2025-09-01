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

$episodeIndex = 0
foreach ($episode in $feedEntries) {
    $episodeNumberRegex = '([0-9]{1,})'
    $episodeNumberNotMatchRegex = '[A-z]'

    $episodeNumber = If ($episode.title -match $episodeNumberRegex) { $Matches.0 } Else { "" }
    If ($episodeNumber -ne "") {
        $episodeTitle = $episode.title
        $episodeFilePath = "./_session_" + $episode.season + "/" + $episodeNumber + ".md"
        $fileExists = Test-Path $episodeFilePath -PathType Leaf
        If (!$fileExists) {
            $newEpisodeFileContent = @"
---
layout: episode_notes
title: "$episodeTitle"
episodeIndex: $episodeIndex
permalink: /ep/$episodeNumber
---
No notes yet.
"@
            Write-Host "Creating new episode file for $episodeTitle ($episodeFilePath)"
            $newEpisodeFileContent | Set-Content $episodeFilePath
        }   
    }
    $episodeIndex++
}