---
layout: page
title: Settings
description: "Your data on this site: back it up, move it, or restore it"
permalink: /settings/
---

## Your data

Everything you save on this site, such as your own notes on episodes and your color mode, is stored only in this browser. It isn't sent to a server, and it isn't shared between your devices or browsers. Clearing this browser's data for the site erases it.

<div class="site-data" data-site-data>
  <h3>Export</h3>
  <p>Download everything this site has saved in this browser as one JSON file, as a backup or to keep a copy of your notes.</p>
  <dl class="site-data-summary">
    <div><dt>My notes</dt><dd data-site-data-notes>…</dd></div>
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
      <legend>Notes already in this browser</legend>
      <label><input type="radio" name="import-mode" value="merge" checked> <span><strong>Merge</strong>: add the file's notes; where an episode has notes in both, keep whichever was edited more recently</span></label>
      <label><input type="radio" name="import-mode" value="replace"> <span><strong>Replace</strong>: delete every note in this browser, then add the file's notes. Export first if you might want them back.</span></label>
    </fieldset>
    <label class="site-import-color" data-import-color-row><input type="checkbox" data-import-color checked> <span>Also set the color mode to <strong data-import-color-name></strong></span></label>
    <p class="site-import-actions">
      <button type="button" class="btn btn-primary" data-import-apply>Import</button>
      <button type="button" class="btn btn-outline" data-import-cancel>Cancel</button>
    </p>
  </div>
  <p class="site-data-status" data-import-status role="status" aria-live="polite"></p>
</div>

<script src="{{ '/assets/js/site-data.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
