---
layout: page
title: Additional Resources
description: Study guides, Jewish prayers, teaching methods, and other resources to enhance your BEMA journey
permalink: /misc/
---

Below are curated resources to help deepen your understanding of the Bible in its ancient Hebrew context. These guides cover Jewish prayers and liturgy, rabbinical teaching methods, and effective study techniques for engaging with the BEMA podcast.

<div class="card-grid resource-cards">
{% for page in site.misc_pages %}
  <div class="card card-bordered">
    <h3><a href="{{ page.url }}">{{ page.title }}</a></h3>
    <p>{{ page.description }}</p>
    <a href="{{ page.url }}" class="resource-link">Read more →</a>
  </div>
{% endfor %}
</div>