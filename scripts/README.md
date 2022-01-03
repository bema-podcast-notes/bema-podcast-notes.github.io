# Scripts

## gen-episodes-yaml.ps1

The gen-episodes-yaml script fetches the BEMA Discipleship Podcast RSS Feed and converts it to a YAML document, `/_data/episodes.yaml`, used by the Jekyll site and saves the current RSS feed as `/_data/bema-rss.xml`.

`PS> /gen-episodes-yaml.ps1`

### Use

The best way to execute this script is with make:

`make buildyaml`

Note: The script should be executed in the same directory that contains the `_data` directory where the results will be stored.

### Dependencies
 1. Powershell Core
 2. Powershell-Yaml Module `Install-Module -Name powershell-yaml -Force -Repository PSGallery -Scope CurrentUser`