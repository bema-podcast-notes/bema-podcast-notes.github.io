Run this command to copy the generated notes from bema-transcrbe to _study-notes:

```
mkdir -p ~/iCloud/repos/github/bema-podcast-notes.github.io/_study-notes && \
find ~/iCloud/repos/github/bema-transcribe/episodes -type f -name '*-study-notes.md' -print0 | \
xargs -0 -I{} cp "{}" ~/iCloud/repos/github/bema-podcast-notes.github.io/_study-notes/
```
