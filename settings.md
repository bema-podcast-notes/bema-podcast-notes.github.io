---
layout: page
title: Settings
description: "Your data, tips, and everything this site can do"
permalink: /settings/
---

## Your data

Everything you save on this site, such as your own notes on episodes and discussion guides, the episodes you've marked as listened, and your color mode, is stored only in this browser. It isn't sent to a server, and it isn't shared between your devices or browsers. Clearing this browser's data for the site erases it.

<div class="site-data" data-site-data>
  <h3>Export</h3>
  <p>Download everything this site has saved in this browser as one JSON file, as a backup or to keep a copy of your notes.</p>
  <dl class="site-data-summary">
    <div><dt>My notes</dt><dd data-site-data-notes>…</dd></div>
    <div><dt>Listened</dt><dd data-site-data-listened>…</dd></div>
    <div><dt>Color mode</dt><dd data-site-data-mode>…</dd></div>
  </dl>
  <p>
    <button type="button" class="btn btn-primary" data-site-data-export>{% include icon.html name="download" %} Export data (JSON)</button>
  </p>
  <p class="site-data-status" data-site-data-status role="status" aria-live="polite"></p>
  <noscript><p>Exporting needs JavaScript, which is turned off in this browser.</p></noscript>
</div>

<div class="site-data" data-site-import>
  <h3>Import</h3>
  <p>Restore data from a file exported from this site, in this browser or another one. You'll see what's in the file before anything changes.</p>
  <p>
    <button type="button" class="btn btn-outline" data-import-choose>{% include icon.html name="upload" %} Choose a file…</button>
    <input type="file" accept=".json,application/json" data-import-file hidden>
  </p>
  <div class="site-import-review" data-import-review hidden>
    <p data-import-summary></p>
    <fieldset class="site-import-modes" data-import-modes>
      <legend>Notes and listened history already in this browser</legend>
      <label><input type="radio" name="import-mode" value="merge" checked> <span><strong>Merge</strong>: add the file's data; where a page has notes in both, keep whichever was edited more recently, and keep the higher listen count</span></label>
      <label><input type="radio" name="import-mode" value="replace"> <span><strong>Replace</strong>: delete this browser's notes and listened history, then add the file's. Export first if you might want them back.</span></label>
    </fieldset>
    <label class="site-import-color" data-import-color-row><input type="checkbox" data-import-color checked> <span>Also set the color mode to <strong data-import-color-name></strong></span></label>
    <p class="site-import-actions">
      <button type="button" class="btn btn-primary" data-import-apply>Import</button>
      <button type="button" class="btn btn-outline" data-import-cancel>Cancel</button>
    </p>
  </div>
  <p class="site-data-status" data-import-status role="status" aria-live="polite"></p>
</div>

## Tips & features {#tips}

<div class="site-data tips-settings" data-tips-settings>
  <label class="tips-switch">
    <input type="checkbox" role="switch" data-tips-toggle checked>
    <span><strong>Show tips</strong><br><span class="tips-switch-desc">Small hints that appear once, right when they're useful, and short tips in empty spaces like a blank notes box.</span></span>
  </label>
  <p><button type="button" class="btn btn-outline btn-sm" data-tips-reset>Show hints again</button></p>
  <p class="site-data-status" data-tips-status role="status" aria-live="polite"></p>
</div>

Everything the site can do, in one place:

<dl class="feature-list">
  <div><dt>Quick open</dt><dd>Press <kbd data-tip-key>⌘K</kbd> on any page (or use Search in the header) and type an episode number like <code>201</code>, a session like <code>s3</code>, a page name, or words from a title. The last result always searches the full notes.</dd></div>
  <div><dt>Keyboard shortcuts</dt><dd><kbd>←</kbd> <kbd>→</kbd> (or <kbd>P</kbd> <kbd>N</kbd>) move between episodes, and between sessions on session pages. Press <kbd>?</kbd> to see them all.</dd></div>
  <div><dt>Exact phrases</dt><dd>On the <a href="/search/">search page</a>, put words in "quotes" to find that exact phrase.</dd></div>
  <div><dt>My Notes</dt><dd>Every episode page and discussion guide has a box at the bottom for your own notes. They save as you type. Download one page's notes, or Export all of them as one file.</dd></div>
  <div><dt>Episode list filter</dt><dd>On the home page, All Sessions &amp; Episodes can show just the episodes with notes, or with discussion guides. Each episode is labeled Notes or Guide, and session headers count them.</dd></div>
  <div><dt>Mark as listened</dt><dd>Use the Mark as listened button under the player. Listened episodes get a ✓ in the episode lists, and session headers on the home page count them. Press + when you listen again.</dd></div>
  <div><dt>Copy episode info</dt><dd>On an episode page, the clock icon next to the length copies the episode's session, title, subtitle and length.</dd></div>
  <div><dt>Previous versions</dt><dd>Some episodes' notes have been rewritten. The earlier versions are kept under Previous versions at the end of the notes.</dd></div>
  <div><dt>Printing</dt><dd>Episode pages print cleanly: the notes, with link addresses, and your own note if you wrote one.</dd></div>
  <div><dt>Color mode</dt><dd>System, Light or Dark, from the switch in the header (in the menu on phones).</dd></div>
  <div><dt>Your data</dt><dd>Export everything to a file, and import it in another browser, from <a href="#your-data">Your data</a> above.</dd></div>
</dl>

<script src="{{ '/assets/js/site-data.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>

## About this site {#about}

{%- comment -%}
  The version is the deployed git commit, from GitHub Pages
  (site.github.build_revision, the same value Google Analytics gets as
  site_version). Local builds don't have it and say so.
{%- endcomment -%}
{%- assign site_version = site.github.build_revision | slice: 0, 7 -%}
{%- assign repo_url = site.github_repo | split: '/blob/' | first %}

<dl class="site-data-summary site-version">
  <div><dt>Version</dt><dd>{% if site_version != '' %}<a href="{{ repo_url }}/commit/{{ site.github.build_revision }}"><code>{{ site_version }}</code><span class="visually-hidden"> (view this version's changes on GitHub)</span></a>{% else %}Local build{% endif %}</dd></div>
  <div><dt>Updated</dt><dd><time datetime="{{ site.time | date_to_xmlschema }}">{{ site.time | date: "%B %-d, %Y" }}</time></dd></div>
  <div><dt>Source</dt><dd><a href="{{ repo_url }}">GitHub repository</a></dd></div>
</dl>
