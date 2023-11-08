---
layout: page
title: BEMA Session 5
permalink: /session5/
---

{% assign sorted_pages = site.session_5 | sort:"episodeIndex" %}
{% for page in sorted_pages %}
{%- if page.episodeIndex %}  
<a href="{{ page.url }}">{{ page.title }}</a><br />
{% endif %}
{% endfor %}
