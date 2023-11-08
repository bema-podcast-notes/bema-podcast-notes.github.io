---
layout: page
title: BEMA Session 8
permalink: /session8/
---

{% assign sorted_pages = site.session_8 | sort:"episodeIndex" %}
{% for page in sorted_pages %}
{%- if page.episodeIndex %}  
<a href="{{ page.url }}">{{ page.title }}</a><br />
{% endif -%}
{% endfor %}
