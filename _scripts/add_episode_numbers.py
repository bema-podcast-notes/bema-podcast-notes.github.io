#!/usr/bin/env python3
"""
Script to add episodeNumber field to all BEMA episode markdown files.
The episodeNumber is extracted from the title field (the part before the first colon).
"""

import os
import re
from pathlib import Path


def extract_episode_number(title):
    """
    Extract episode number from title string.
    Example: "1: Trust the Story" -> "1"
    Example: "21b: Jesus Shema" -> "21b"
    Example: "-1: What Is BEMA?" -> "-1"
    Example: "66. Ezra/Nehemiah - Passionate Leadership" -> "66"
    """
    # Remove the opening quote and any leading/trailing whitespace
    title = title.strip().strip('"').strip("'")

    # Find the part before the first colon or period
    if ':' in title:
        episode_num = title.split(':', 1)[0].strip()
        return episode_num
    elif '.' in title:
        # Handle format like "66. Title"
        episode_num = title.split('.', 1)[0].strip()
        return episode_num
    return None


def process_markdown_file(filepath):
    """
    Process a single markdown file to add/update episodeNumber field.
    """
    print(f"Processing: {filepath}")

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if file has front matter
    if not content.startswith('---'):
        print(f"  Skipping (no front matter): {filepath}")
        return False

    # Split content into front matter and body
    parts = content.split('---', 2)
    if len(parts) < 3:
        print(f"  Skipping (invalid front matter): {filepath}")
        return False

    front_matter = parts[1]
    body = parts[2]

    # Extract title
    title_match = re.search(r'^title:\s*["\']?(.+?)["\']?\s*$', front_matter, re.MULTILINE)
    if not title_match:
        print(f"  Skipping (no title found): {filepath}")
        return False

    title = title_match.group(1)
    episode_number = extract_episode_number(title)

    if episode_number is None:
        print(f"  Skipping (could not extract episode number from title: {title})")
        return False

    print(f"  Extracted episode number: {episode_number}")

    # Check if episodeNumber already exists
    episode_number_exists = re.search(r'^episodeNumber:\s*.+$', front_matter, re.MULTILINE)

    if episode_number_exists:
        # Update existing episodeNumber
        print(f"  Updating existing episodeNumber")
        front_matter = re.sub(
            r'^episodeNumber:\s*.+$',
            f'episodeNumber: {episode_number}',
            front_matter,
            flags=re.MULTILINE
        )
    else:
        # Insert episodeNumber just before episodeIndex
        episode_index_match = re.search(r'^(episodeIndex:.+)$', front_matter, re.MULTILINE)
        if episode_index_match:
            # Insert before episodeIndex
            print(f"  Adding episodeNumber before episodeIndex")
            front_matter = re.sub(
                r'^(episodeIndex:.+)$',
                f'episodeNumber: {episode_number}\n\\1',
                front_matter,
                flags=re.MULTILINE
            )
        else:
            # No episodeIndex found, add at the end of front matter
            print(f"  Adding episodeNumber at end of front matter")
            front_matter = front_matter.rstrip() + f'\nepisodeNumber: {episode_number}\n'

    # Reconstruct the file
    new_content = f"---{front_matter}---{body}"

    # Write back to file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"  ✓ Updated: {filepath}")
    return True


def main():
    """
    Main function to process all episode files in _session_* directories.
    """
    # Get the script directory
    script_dir = Path(__file__).parent

    # Find all _session_* directories
    session_dirs = sorted(script_dir.glob('_session_*'))

    if not session_dirs:
        print("No _session_* directories found!")
        return

    print(f"Found {len(session_dirs)} session directories")
    print()

    total_processed = 0
    total_updated = 0

    for session_dir in session_dirs:
        print(f"\n{'='*60}")
        print(f"Processing directory: {session_dir.name}")
        print(f"{'='*60}")

        # Find all .md files except index.md
        md_files = [
            f for f in session_dir.glob('*.md')
            if f.name.lower() != 'index.md'
        ]

        print(f"Found {len(md_files)} markdown files (excluding index.md)")
        print()

        for md_file in sorted(md_files):
            total_processed += 1
            if process_markdown_file(md_file):
                total_updated += 1
            print()

    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Total files processed: {total_processed}")
    print(f"  Total files updated: {total_updated}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
