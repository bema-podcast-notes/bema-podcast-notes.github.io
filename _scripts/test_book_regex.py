#!/usr/bin/env python3
"""
Test script to develop and verify book link regex pattern
"""

import re

# Sample data from the actual episodes.yaml (after YAML parsing)
test_samples = [
    r'<a href=\"https://amzn.to/2sfziLd\" target=\"_blank\"><em>Sabbath as Resistance</em> by Walter Brueggemann</a>',
    r'<a target=\"_blank\" href=\"https://amzn.to/2bE8RUZ\"><em>The Sabbath</em> by Abraham Joshua Heschel</a>',
    r'<a href=\"https://amzn.to/2ksgjJ0\" target=\"_blank\"><em>The Exodus You Almost Passed Over</em> by Rabbi David Fohrman</a>',
    r'<a target=\"_blank\" href=\"https://amzn.to/3zLGYDc\"><em>The Beast that Crouches at the Door</em> by Rabbi David Fohrman</a>',
    r'<a href=\"https://amzn.to/40zqkXp\" target=\"_blank\"><em>The Lost World of the Flood</em> by Tremper Longman III & John H. Walton</a>',
    # Non-book links (should not match)
    r'<a href=\"https://bema.fireside.fm/groups\" target=\"_blank\">BEMA Discipleship — Groups</a>',
    r'<a target=\"_blank\" href=\"https://bemadiscipleship.s3.us-east-2.amazonaws.com/BEMA+001+Trust+the+Story.pdf\">Trust the Story Presentation (PDF)</a>',
]

# Test different regex patterns
patterns = [
    # Pattern 1: Simple pattern matching <em>...</em> by ...
    (
        "Pattern 1: Basic <em> by pattern",
        r'<a[^>]*href=\\"([^"\\]+)\\"[^>]*><em>([^<]+)</em>\s*by\s+([^<]+)</a>'
    ),
    # Pattern 2: More flexible spacing
    (
        "Pattern 2: Flexible spacing",
        r'<a[^>]*href=\\"([^"\\]+)\\"[^>]*><em>([^<]+)</em>\\s*by\\s+([^<]+)</a>'
    ),
    # Pattern 3: Handle optional &nbsp;
    (
        "Pattern 3: With optional &nbsp;",
        r'<a[^>]*href=\\"([^"\\]+)\\"[^>]*><em>([^<]+)</em>\\s*(&nbsp;)?\\s*(B|b)y\\s+([^<]+)</a>'
    ),
]

print("=" * 80)
print("Testing Book Link Regex Patterns")
print("=" * 80)

for pattern_name, pattern in patterns:
    print(f"\n{pattern_name}")
    print(f"Pattern: {pattern}")
    print("-" * 80)

    match_count = 0
    for i, sample in enumerate(test_samples, 1):
        matches = re.findall(pattern, sample)
        if matches:
            match_count += 1
            print(f"✓ Sample {i} MATCHED:")
            print(f"  {matches}")
        else:
            # Check if this should have matched (has <em> and "by")
            if '<em>' in sample and ' by ' in sample.lower():
                print(f"✗ Sample {i} FAILED (should match):")
                print(f"  {sample[:100]}...")

    print(f"\nTotal matches: {match_count}/7 samples")
    print(f"Expected: 5 book links, 2 non-book links should not match")
    print("=" * 80)

# Test the best pattern with actual usage
print("\n\nRECOMMENDED PATTERN TEST")
print("=" * 80)

recommended_pattern = r'<a[^>]*href=\\"([^"\\]+)\\"[^>]*><em>([^<]+)</em>\s*by\s+([^<]+)</a>'
print(f"Pattern: {recommended_pattern}\n")

for i, sample in enumerate(test_samples, 1):
    matches = re.findall(recommended_pattern, sample)
    if matches:
        url, title, author = matches[0]
        print(f"Book {i}:")
        print(f"  Title:  {title}")
        print(f"  Author: {author}")
        print(f"  URL:    {url}")
        print()
