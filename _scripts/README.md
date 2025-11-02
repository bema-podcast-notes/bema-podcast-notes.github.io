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


## import_study_notes.py

Purpose

- Import study notes files from `temp/` and `temp/episodes/*/` into the appropriate session files under the `_session_*` directories.

Behavior

- Searches for files named with the pattern `#-study-notes.md` (for example `134-study-notes.md`) in `temp/` and `temp/episodes/*/`.
- For each study notes file found, extracts the episode number from the filename and looks for a matching session file in any `_session_*` directory (e.g. `_session_4/134.md`).
- Only imports the notes if the target session file contains the literal string `No notes yet.` — otherwise the file is skipped to avoid overwriting existing notes.
- Before inserting, the script adjusts Markdown headings in the study notes by prepending two additional `#` characters to each heading line (so `# Heading` becomes `### Heading`).
- Replaces the `No notes yet.` placeholder in the session file with the adjusted study notes content.
- Prints a per-file status and a final summary of successes and failures.

Usage

- Run from the repository root (the script uses relative paths like `temp/` and `_session_*`):

```bash
python3 _scripts/import_study_notes.py
```

- If the script is executable (has the executable bit set), you can also run:

```bash
./_scripts/import_study_notes.py
```

Notes & recommendations

- The script expects filenames that match the regex `^(\d+)-study-notes\.md$`. Files that do not match will be skipped.
- The script will modify files in the `_session_*` directories. Make a git commit or backup before running so you can revert if needed.
- The script requires Python 3.6+ and uses only the Python standard library (no extra packages required).
- If no `temp/` or `temp/episodes/` directories are present the script will report that no files were found.

Example output

- On success the script prints lines like:

```
  ✓ 134-study-notes.md: Successfully imported notes for episode 134 into _session_4/134.md
```

- If skipped or failed, it prints a message explaining why.

Troubleshooting

- If the script reports `No session file found for episode N`, verify that the correct `_session_*` directory contains `N.md` and that you are running the command from the repository root.
- If session files do not contain `No notes yet.` the script will skip them to avoid overwrite; remove or edit that placeholder manually if you want to force an update.
