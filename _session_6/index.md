---
layout: page
title: BEMA Session 6
permalink: /session6/
---

{% assign sorted_pages = site.session_6 | sort:"episodeIndex" %}
{% for page in sorted_pages %}
{%- if page.episodeIndex %}  
<a href="{{ page.url }}">{{ page.title }}</a><br />
{% endif -%}
{% endfor %}
