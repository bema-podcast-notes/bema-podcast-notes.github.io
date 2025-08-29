#!/usr/bin/env python3
"""
Script to update permalinks in all _session_* directories from `/number` to `/ep/number`
Skips files that already have `/ep/` in the permalink.
"""

import os
import re
import glob

def update_permalink_in_file(file_path):
    """Update permalink in a single markdown file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find permalink line using regex
        permalink_pattern = r'^permalink:\s*(/\d+)$'
        match = re.search(permalink_pattern, content, re.MULTILINE)
        
        if not match:
            return False, "No permalink found or not in expected format"
        
        old_permalink = match.group(1)
        
        # Skip if already has /ep/ prefix
        if '/ep/' in old_permalink:
            return False, f"Already has /ep/ prefix: {old_permalink}"
        
        # Extract the number from the permalink (e.g., /404 -> 404)
        number = old_permalink.strip('/')
        new_permalink = f"/ep/{number}"
        
        # Replace the permalink
        new_content = re.sub(
            permalink_pattern, 
            f"permalink: {new_permalink}", 
            content, 
            flags=re.MULTILINE
        )
        
        # Write back to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return True, f"Updated {old_permalink} -> {new_permalink}"
        
    except Exception as e:
        return False, f"Error processing file: {str(e)}"

def main():
    """Main function to process all _session_* directories"""
    base_dir = os.getcwd()
    session_dirs = glob.glob('_session_*')
    
    if not session_dirs:
        print("No _session_* directories found in current directory")
        return
    
    total_files = 0
    updated_files = 0
    skipped_files = 0
    error_files = 0
    
    print(f"Found {len(session_dirs)} session directories")
    print("Processing files...\n")
    
    for session_dir in sorted(session_dirs):
        print(f"Processing {session_dir}/")
        
        # Find all .md files in the session directory
        md_files = glob.glob(os.path.join(session_dir, "*.md"))
        
        for md_file in sorted(md_files):
            total_files += 1
            
            # Skip index.md files
            if os.path.basename(md_file) == 'index.md':
                continue
                
            success, message = update_permalink_in_file(md_file)
            
            if success:
                updated_files += 1
                print(f"  ✓ {os.path.basename(md_file)}: {message}")
            else:
                if "Already has /ep/ prefix" in message:
                    skipped_files += 1
                    print(f"  - {os.path.basename(md_file)}: {message}")
                else:
                    error_files += 1
                    print(f"  ✗ {os.path.basename(md_file)}: {message}")
    
    print(f"\nSummary:")
    print(f"  Total files processed: {total_files}")
    print(f"  Files updated: {updated_files}")
    print(f"  Files skipped (already have /ep/): {skipped_files}")
    print(f"  Files with errors: {error_files}")

if __name__ == "__main__":
    main()