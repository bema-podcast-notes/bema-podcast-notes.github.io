---
layout: page
title: All BEMA Podcast Episodes
---
{% assign hasNotes = false %}
{% assign pageUrl = "foo" %}
{% assign notesHtml = "[notes]" %}
{% for episode in site.data.episodes %}
  {% assign notesPage = null %}
  {% case episode.season %}
    {% when "1" %}
      {% assign session = site.session_1 %}
    {% when "2" %}
      {% assign session = site.session_2 %}
    {% when "3" %}
      {% assign session = site.session_3 %}
    {% when "4" %}
      {% assign session = site.session_4 %}
    {% when "5" %}
      {% assign session = site.session_5 %}
    {% when "6" %}
      {% assign session = site.session_6 %}
  {% endcase %}
  {% assign notesPage = site.session_1 | where: 'episodeIndex', -1 %}
  {%- if notesPage %}
<a href="{{ notesPage.url }}">[notes]</a>&nbsp;
  {% endif -%}
<a href="{{ episode.link }}">{{ episode.title }}</a>: {{ episode.subtitle }}<br />

{% endfor %}

<!-- {% for page in site.pages %} -->
  <!-- { % if page.title == episode.title %} -->
  <!-- {% assign hasNote = true %} -->
  <!-- {% assign pageUrl = page.url %} -->
  <!-- { % endif %} -->
<!-- {% endfor %} -->
