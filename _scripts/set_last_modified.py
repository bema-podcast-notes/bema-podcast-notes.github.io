#!/usr/bin/env python3
"""
Set `last_modified_at` in the front matter of every site page from git history,
so jekyll-sitemap emits a real <lastmod> per page instead of the build time.

The date used is the committer date of the last commit that changed the file
other than the `last_modified_at` line itself, so re-running this script (and
committing its output) never moves a date by itself.

Files with uncommitted changes are skipped (they have no commit date yet; the
next run after they are committed picks them up). Run from the repo root:

    python3 _scripts/set_last_modified.py           # update files
    python3 _scripts/set_last_modified.py --check   # report only, exit 1 if stale
"""

import re
import subprocess
import sys
from pathlib import Path

# Page sources: every collection directory plus root-level pages.
SKIP_DIRS = {'_layouts', '_includes', '_data', '_scripts', '_site', '_sass',
             '_study-notes', '_drafts'}
SKIP_FILES = {'README.md', 'CSS_REFACTORING_ANALYSIS.md', '404.html'}
FIELD = re.compile(r'^last_modified_at:.*$', re.M)


def git(*args):
    return subprocess.run(['git', *args], check=True, capture_output=True,
                          text=True).stdout


def page_files():
    files = []
    for path in git('ls-files', '*.md', '*.markdown', '*.html').splitlines():
        parts = Path(path).parts
        if len(parts) == 1:
            if path in SKIP_FILES:
                continue
        elif not (len(parts) == 2 and parts[0].startswith('_')
                  and parts[0] not in SKIP_DIRS):
            continue
        if Path(path).read_text(encoding='utf-8').startswith('---\n'):
            files.append(path)
    return files


def last_content_change(files):
    """Map file -> ISO date of the newest commit with a real content change.

    One pass over `git log -p` (newest first); hunk lines touching only the
    last_modified_at field don't count."""
    wanted, dates = set(files), {}
    log = subprocess.Popen(
        ['git', 'log', '-p', '--no-renames', '--format=@@COMMIT %cI', '-U0',
         '--', *files], stdout=subprocess.PIPE, text=True, encoding='utf-8',
        errors='replace')
    date = current = None
    for line in log.stdout:
        if line.startswith('@@COMMIT '):
            date, current = line.split(' ', 1)[1].strip(), None
        elif line.startswith('+++ ') or line.startswith('--- '):
            name = line[4:].strip()
            if name != '/dev/null':
                current = name[2:]  # strip a/ or b/
        elif line.startswith('diff --git'):
            current = None
        elif (current in wanted and current not in dates
              and line[:1] in '+-' and not line.startswith(('+++', '---'))
              and not FIELD.match(line[1:])):
            dates[current] = date
    log.wait()
    return dates


def content_dirty():
    """Files whose uncommitted changes go beyond the last_modified_at line."""
    dirty, current = set(), None
    for line in git('diff', '-U0', '--no-renames', 'HEAD').splitlines():
        if line.startswith('+++ '):
            current = line[6:] if line != '+++ /dev/null' else None
        elif line.startswith('diff --git'):
            current = None
        elif (current and line[:1] in '+-' and not line.startswith(('+++', '---'))
              and not FIELD.match(line[1:])):
            dirty.add(current)
    untracked = git('ls-files', '--others', '--exclude-standard').splitlines()
    return dirty | set(untracked)


def set_field(text, value):
    end = text.index('\n---', 3)
    front, rest = text[:end], text[end:]
    line = f'last_modified_at: {value}'
    if FIELD.search(front):
        front = FIELD.sub(line, front, count=1)
    else:
        front += '\n' + line
    return front + rest


def main():
    check = '--check' in sys.argv
    dirty = content_dirty()
    files = [f for f in page_files() if f not in dirty]
    dates = last_content_change(files)
    changed = []
    for f in files:
        if f not in dates:
            continue
        text = Path(f).read_text(encoding='utf-8')
        new = set_field(text, dates[f])
        if new != text:
            changed.append(f)
            if not check:
                Path(f).write_text(new, encoding='utf-8')
    skipped = sorted(dirty & set(page_files()))  # page_files: tracked only
    print(f'{"Stale" if check else "Updated"}: {len(changed)} of {len(files)} pages')
    if skipped:
        print(f'Skipped {len(skipped)} with uncommitted changes: {", ".join(skipped)}')
    sys.exit(1 if check and changed else 0)


if __name__ == '__main__':
    main()
