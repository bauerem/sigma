import os
import json

def traverse_and_write_html_files(root_dir, jsonl_file):
    """
    Traverses through the directory hierarchy starting from root_dir,
    finds all HTML files, and writes their content and relative path
    to a JSONL file.

    Parameters:
    - root_dir: The root directory from where the traversal starts.
    - jsonl_file: The path to the JSONL file where the data will be written.
    """
    with open(jsonl_file, 'w') as file:
        for dirpath, dirnames, filenames in os.walk(root_dir):
            for filename in filenames:
                if filename.endswith('.html'):
                    # Construct the full path to the HTML file
                    file_path = os.path.join(dirpath, filename)
                    # Calculate the relative path
                    rel_path = os.path.relpath(file_path, root_dir)
                    # Read the HTML file content
                    with open(file_path, 'r', encoding='utf-8') as html_file:
                        html_content = html_file.read()
                    # Prepare the JSON object
                    json_obj = {
                        'html': html_content,
                        'rel_path': rel_path
                    }
                    # Write the JSON object to the JSONL file
                    file.write(json.dumps(json_obj) + '\n')

# Specify the root directory and the JSONL file path
root_dir = './data'
jsonl_file = 'data.jsonl'

# Call the function to start the process
traverse_and_write_html_files(root_dir, jsonl_file)