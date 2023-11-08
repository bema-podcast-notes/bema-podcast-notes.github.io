---
layout: page
title: BEMA Session 7
permalink: /session7/
---

{% assign sorted_pages = site.session_7 | sort:"episodeIndex" %}
{% for page in sorted_pages %}
{%- if page.episodeIndex %}  
<a href="{{ page.url }}">{{ page.title }}</a><br />
{% endif -%}
{% endfor %}
