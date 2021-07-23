---
layout: page
title: Misc
permalink: /misc/
---

<!-- [Jewish Prayers and Liturgy]({{ '/misc/jewish-prayers-and-liturgy' | relative_url }})  
[Study Techniques]({{ 'misc/study-techniques' | relative_url }}) -->

{% for page in site.misc_pages %}
<a href="{{ page.url }}">{{ page.title }}</a><br />
{{ page.description }}
{% endfor %}