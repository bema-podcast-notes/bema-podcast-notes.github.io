#!/usr/bin/env python3
"""
Convert participant discussion guides ("Ep325 participant.md") into
_guides/325.md for the site's discussion guide pages (/guides/325).

    python3 _scripts/import_discussion_guides.py "path/Ep325 participant.md" ...

What changes on the way in:
  - The header (title, week, hosts, source link, texts) moves to front
    matter; the page builds it from that and _data/episodes.yaml.
  - The series table ("Where We Are" / "at a Glance" / "Full Map") becomes
    {% include guide-series.html %}, drawn from _data/series/<series>.yml.
  - "Session Flow" sections are dropped; the layout draws the plan from the
    timed headings ("Opening (10 minutes)"), or from a Session Flow table.
  - Headings shift so the top level is ### (like the notes); the time moves
    into a badge and each heading gets a stable id.
  - Question paragraphs (Q1, Opening/Closing Question, Reflection, Series
    Integration, Quick Observation) and "Before Week N" homework become
    cards; "(supplemental)" becomes an Optional tag.
  - Scripture references + block quotes, summary quotes and italic leader
    notes get classes for styling. Horizontal rules are dropped.
  - "Looking Ahead" episode titles link to the next guide (or episode).
  - Footnote "Ep. N notes" links to the episode page; absolute site links
    become relative. The trailing attribution line is dropped (the page
    footer credits the guide).
"""

import json
import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
GUIDES = SITE / "_guides"
SITE_URL = "https://bema-podcast-notes.github.io"

LABEL = re.compile(r'^\*\*(Q\d+|Opening Question|Closing Question|Quick Observation|'
                   r'Reflection \d+|Series Integration \d+|Before Week \d+)')
TIMED = re.compile(r'\s*\((\d+) minutes?\)\s*$')


def slug(text):
    text = re.sub(r'[*_`]', '', text.lower())
    text = re.sub(r'[^\w\s-]', '', text)
    return re.sub(r'[\s_]+', '-', text).strip('-')


def blocks_of(text):
    """Split markdown into blank-line-separated blocks; a paragraph that runs
    straight into a block quote (no blank line) is split in two."""
    out = []
    for raw in re.split(r'\n\s*\n', text.strip()):
        lines = raw.split('\n')
        cut = next((i for i, l in enumerate(lines) if i and l.startswith('>') and not lines[0].startswith('>')), None)
        if cut:
            out.append('\n'.join(lines[:cut]))
            out.append('\n'.join(lines[cut:]))
        else:
            out.append(raw)
    return out


def kind(block):
    first = block.split('\n')[0]
    if re.match(r'^#{1,6} ', first):
        return 'heading'
    if first.strip() == '---':
        return 'hr'
    if first.startswith('|'):
        return 'table'
    if first.startswith('>'):
        return 'quote'
    if first.startswith('[^'):
        return 'footnotes'
    if re.match(r'^(\d+\.|-|\*) ', first):
        return 'list'
    return 'para'


def is_italic_line(block):
    b = block.strip()
    return '\n' not in b and b.startswith('*') and b.endswith('*') and not b.startswith('**')


def session_index(episode):
    """episodeIndex from the episode's _session_*/N.md front matter."""
    for f in SITE.glob(f"_session_*/{episode}.md"):
        m = re.search(r'^episodeIndex:\s*(\d+)', f.read_text(), re.M)
        if m:
            return int(m.group(1))
    sys.exit(f"✗ no _session_*/{episode}.md with an episodeIndex")


def convert(path, available):
    text = Path(path).read_text(encoding='utf-8')
    blocks = blocks_of(text)

    # ---- Header: everything before the first rule ----
    hr = next(i for i, b in enumerate(blocks) if kind(b) == 'hr')
    header, body = blocks[:hr], blocks[hr + 1:]
    head_text = '\n'.join(header)
    m = re.search(r'^## BEMA Episode (\d+) — (.+)$', head_text, re.M)
    episode, full_title = int(m.group(1)), m.group(2).strip()
    series_name = full_title.split(':')[0].strip()
    m = re.search(r'^### Week (\d+) of (\d+) \| (.+)$', head_text, re.M)
    week, weeks, theme = int(m.group(1)), int(m.group(2)), m.group(3).strip()
    m = re.search(r'\*\*Texts:\*\*\s*(.+)$', head_text, re.M)
    texts = m.group(1).strip() if m else ''
    intro = [b for b in header if kind(b) == 'para' and not re.search(r'Source Episode|\*\*Hosts:\*\*|\*\*Texts:\*\*|^- Ep\.', b)]

    out, table_flow, flow = [], [], []
    for b in intro:
        out.append(b + '\n{: .guide-note}' if is_italic_line(b) else b)

    section = None
    skipping = False
    in_refs = False
    i = 0
    while i < len(body):
        b = body[i]
        k = kind(b)

        if k == 'heading':
            level, title = re.match(r'^(#+) (.*)$', b).groups()
            level = len(level)
            if level == 2:
                section = title
                skipping = title.startswith('Session Flow')
                if skipping:
                    # A Session Flow table is the most accurate plan (it can
                    # include untimed parts like a series introduction)
                    for nb in body[i + 1:]:
                        if kind(nb) == 'heading' and nb.startswith('## '):
                            break
                        if kind(nb) == 'table':
                            for row in nb.split('\n')[2:]:
                                cells = [re.sub(r'^\*\*(.*)\*\*$', r'\1', c.strip()) for c in row.strip('|').split('|')]
                                mm = re.match(r'(\d+) min', cells[1]) if len(cells) > 1 else None
                                if mm and cells[0].lower() != 'total':
                                    table_flow.append({'label': cells[0], 'minutes': int(mm.group(1))})
                    i += 1
                    continue
                if title == 'References':
                    in_refs = True
                    out.append('### References {#references}')
                    i += 1
                    continue
            elif skipping:
                i += 1
                continue
            tm = TIMED.search(title)
            clean = TIMED.sub('', title).strip()
            hid = slug(clean)
            new_level = '#' * min(6, level + 1)
            if tm:
                minutes = int(tm.group(1))
                flow.append({'label': clean, 'minutes': minutes, 'id': hid})
                out.append(f'{new_level} {clean} <span class="guide-time">{minutes} min</span> {{#{hid}}}')
            else:
                out.append(f'{new_level} {clean} {{#{hid}}}')
            i += 1
            continue

        if skipping or k == 'hr':
            i += 1
            continue

        if in_refs:
            if k == 'footnotes':
                fn = b
                fn = re.sub(r'Ep\. (\d+) notes\.\s*\[bema-podcast-notes\.github\.io/ep/\1\]\([^)]*\)\.?',
                            lambda mm: f'[Ep. {mm.group(1)} notes](/ep/{mm.group(1)}).', fn)
                fn = re.sub(r'(?<!\[)Ep\. (\d+) notes\.', lambda mm: f'[Ep. {mm.group(1)} notes](/ep/{mm.group(1)}).', fn)
                fn = fn.replace(SITE_URL, '')
                out.append(fn)
            # anything after the footnotes is the attribution line: drop it
            i += 1
            continue

        if k == 'table' and re.match(r'^\|\s*Week\s*\|', b):
            out.append('{% include guide-series.html %}')
            i += 1
            continue

        if k == 'para' and 'Overview Card' in b:
            i += 1
            continue

        if k == 'para' and LABEL.match(b):
            group = [b]
            j = i + 1
            while j < len(body) and kind(body[j]) in ('para', 'list') and not LABEL.match(body[j]):
                group.append(body[j])
                j += 1
            label = LABEL.match(b).group(1)
            classes = ['guide-q']
            if label.startswith('Before Week'):
                classes = ['guide-homework']
            elif label == 'Opening Question':
                classes.append('guide-q-opening')
            elif label == 'Closing Question':
                classes.append('guide-q-closing')
            elif label.startswith('Reflection'):
                classes.append('guide-q-reflection')
            first = group[0]
            if '(supplemental)' in first:
                classes.append('guide-q-optional')
                first = first.replace(' (supplemental)', '', 1)
                first = re.sub(r'^(\*\*[^*]+\*\*)', r'\1 <span class="guide-tag">Optional</span>', first, count=1)
            group[0] = first
            inner = '\n\n'.join(group)
            out.append(f'<div class="{" ".join(classes)}" markdown="1">\n\n{inner}\n\n</div>')
            i = j
            continue

        if k == 'para' and is_italic_line(b):
            nxt = body[i + 1] if i + 1 < len(body) else ''
            if kind(nxt) == 'quote' and b.strip().rstrip('*').endswith(':'):
                out.append(b + '\n{: .guide-ref}')
                out.append(nxt + '\n{: .guide-scripture}')
                i += 2
                continue
            out.append(b + '\n{: .guide-note}')
            i += 1
            continue

        if k == 'quote':
            out.append(b + '\n{: .guide-summary}')
            i += 1
            continue

        if k == 'para':
            mm = re.match(r'^\*\*Ep\. (\d+) — (.+?)\*\*(.*)$', b, re.S)
            if mm:
                n = int(mm.group(1))
                href = f'/guides/{n}' if n in available else f'/ep/{n}'
                b = f'**[Ep. {n} — {mm.group(2)}]({href})**{mm.group(3)}'
            b = b.replace(SITE_URL, '')
        out.append(b)
        i += 1

    if table_flow:
        # Link table rows to their sections where the names line up
        ids = [(slug(f['label']), f['id']) for f in flow]
        for f in table_flow:
            s_ = slug(f['label'])
            hit = next((hid for hs, hid in ids if s_ == hs or s_.startswith(hs + '-') or hs.startswith(s_ + '-')), None)
            if hit:
                f['id'] = hit
        flow = table_flow

    fm = {
        'layout': 'discussion_guide',
        'title': f'Discussion Guide: {episode} {full_title}',
        'episode': episode,
        'episodeIndex': session_index(episode),
        'series': slug(series_name),
        'week': week,
        'weeks': weeks,
        'theme': theme,
        'texts': texts,
        'minutes': sum(f['minutes'] for f in flow),
        'permalink': f'/guides/{episode}',
    }
    lines = ['---'] + [f'{k}: {json.dumps(v, ensure_ascii=False)}' for k, v in fm.items()]
    lines.append('flow:')
    for f in flow:
        lines.append('  - ' + json.dumps(f, ensure_ascii=False))
    lines.append('---')
    GUIDES.mkdir(exist_ok=True)
    dest = GUIDES / f'{episode}.md'
    dest.write_text('\n'.join(lines) + '\n' + '\n\n'.join(out).strip() + '\n', encoding='utf-8')
    return dest, fm['minutes'], len(flow)


def main():
    paths = sys.argv[1:]
    if not paths:
        sys.exit(__doc__)
    # Episodes that will have a guide (for "Looking Ahead" links)
    available = {int(m.group(1)) for p in paths if (m := re.search(r'Ep(\d+)', Path(p).name))}
    available |= {int(f.stem) for f in GUIDES.glob('*.md') if f.stem.isdigit()}
    for p in paths:
        dest, minutes, parts = convert(p, available)
        print(f'✓ {Path(p).name} → {dest.relative_to(SITE)} ({parts} parts, {minutes} min)')


if __name__ == '__main__':
    main()
