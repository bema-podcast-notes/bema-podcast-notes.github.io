#!/usr/bin/env python3
"""
Script to import study notes from temp/episodes/ into corresponding _session_* files.
Only replaces content if the target file contains "No notes yet."
Shifts markdown headings so the top level is ### and adds hard line breaks
to the opening episode details lines.
"""

import os
import re
import glob
from pathlib import Path

HEADING = re.compile(r'^(#{1,6})(\s+\S.*)$')
DETAIL = re.compile(r'^\*\*[^*]+:\*\*')
TOP_LEVEL = 3  # site convention: sections are ###, subsections ####


def adjust_markdown_headings(content):
    """Shift headings so the shallowest one lands at ### (TOP_LEVEL).

    Notes arrive with different top levels (older ones start at #, the
    current notes agent starts at ##); a fixed offset put the newer ones
    two levels too deep. Relative levels are kept, results are capped at
    ######, and lines inside ``` fences are left alone.
    """
    lines = content.split('\n')
    in_fence = False
    levels = []
    for line in lines:
        if line.lstrip().startswith('```'):
            in_fence = not in_fence
        elif not in_fence and HEADING.match(line):
            levels.append(len(HEADING.match(line).group(1)))
    if not levels:
        return content
    shift = TOP_LEVEL - min(levels)

    adjusted, in_fence = [], False
    for line in lines:
        if line.lstrip().startswith('```'):
            in_fence = not in_fence
        m = None if in_fence else HEADING.match(line)
        if m:
            level = max(1, min(6, len(m.group(1)) + shift))
            line = '#' * level + m.group(2)
        adjusted.append(line)
    return '\n'.join(adjusted)


def add_detail_line_breaks(content):
    """End the opening **Episode:** / **Hosts:** / **Focus:** lines with two
    spaces so they render on separate lines, as they read in the markdown."""
    lines = content.split('\n')
    start = next((i for i, l in enumerate(lines) if DETAIL.match(l)), None)
    if start is None:
        return content
    end = start
    while end + 1 < len(lines) and DETAIL.match(lines[end + 1]):
        end += 1
    for i in range(start, end):
        # Leave lines that already break (backslash or two trailing spaces)
        if not (lines[i].endswith('\\') or lines[i].endswith('  ')):
            lines[i] = lines[i].rstrip() + '  '
    return '\n'.join(lines)

def find_session_file(episode_number):
    """Find the corresponding session file for an episode number"""
    # Search all _session_* directories for the episode file
    session_dirs = glob.glob('_session_*')
    
    for session_dir in session_dirs:
        episode_file = os.path.join(session_dir, f"{episode_number}.md")
        if os.path.exists(episode_file):
            return episode_file
    
    return None

def process_study_notes_file(study_notes_path):
    """Process a single study notes file"""
    filename = os.path.basename(study_notes_path)
    
    # Extract episode number from filename (e.g., "134-study-notes.md" -> "134")
    match = re.match(r'^(\d+)-study-notes\.md$', filename)
    if not match:
        return False, f"Filename {filename} doesn't match expected pattern (#-study-notes.md)"
    
    episode_number = match.group(1)
    
    # Find corresponding session file
    session_file = find_session_file(episode_number)
    if not session_file:
        return False, f"No session file found for episode {episode_number}"
    
    # Read the study notes content
    try:
        with open(study_notes_path, 'r', encoding='utf-8') as f:
            study_content = f.read()
    except Exception as e:
        return False, f"Error reading study notes file: {str(e)}"
    
    # Read the session file
    try:
        with open(session_file, 'r', encoding='utf-8') as f:
            session_content = f.read()
    except Exception as e:
        return False, f"Error reading session file: {str(e)}"
    
    # Check if session file contains "No notes yet."
    if "### BEMA Episode" in session_content:
        return False, f"Session file {session_file} already contains '### BEMA Episode' notes - skipping"
    elif "No notes yet." not in session_content:
        return False, f"Session file {session_file} doesn't contain 'No notes yet.' - skipping"
    
    # Adjust markdown headings in study content
    adjusted_study_content = add_detail_line_breaks(adjust_markdown_headings(study_content))
    
    # Replace "No notes yet." with the adjusted study content
    updated_content = session_content.replace("No notes yet.", adjusted_study_content.strip())
    
    # Write back to session file
    try:
        with open(session_file, 'w', encoding='utf-8') as f:
            f.write(updated_content)
    except Exception as e:
        return False, f"Error writing to session file: {str(e)}"
    
    return True, f"Successfully imported notes for episode {episode_number} into {session_file}"

def find_study_notes_files():
    """Find all study notes files in temp/ directory and temp/episodes/ subdirectories"""
    study_notes_files = []
    
    # Look for study notes files directly in temp/
    temp_path = "temp"
    if os.path.exists(temp_path):
        for file in os.listdir(temp_path):
            if file.endswith('-study-notes.md'):
                study_notes_files.append(os.path.join(temp_path, file))
    
    # Look for study notes files in temp/episodes/*/
    temp_episodes_path = "temp/episodes"
    if os.path.exists(temp_episodes_path):
        # Search recursively for *-study-notes.md files
        for root, dirs, files in os.walk(temp_episodes_path):
            for file in files:
                if file.endswith('-study-notes.md'):
                    study_notes_files.append(os.path.join(root, file))
    
    return study_notes_files

def main():
    """Main function to process all study notes files"""
    study_notes_files = find_study_notes_files()
    
    if not study_notes_files:
        print("No study notes files found in temp/episodes/")
        return
    
    print(f"Found {len(study_notes_files)} study notes files")
    print("Processing files...\n")
    
    successful = 0
    failed = 0
    
    for study_notes_file in sorted(study_notes_files):
        success, message = process_study_notes_file(study_notes_file)
        
        if success:
            successful += 1
            print(f"  ✓ {os.path.basename(study_notes_file)}: {message}")
        else:
            failed += 1
            print(f"  ✗ {os.path.basename(study_notes_file)}: {message}")
    
    print(f"\nSummary:")
    print(f"  Successfully imported: {successful}")
    print(f"  Failed or skipped: {failed}")

if __name__ == "__main__":
    main()