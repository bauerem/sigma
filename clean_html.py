import json
from bs4 import BeautifulSoup
import re
import ftfy

def preprocess(html_content):
    """
    Preprocesses the HTML content by extracting human-readable text
    and the title of the document.

    Parameters:
    - html_content: The HTML content to be preprocessed.

    Returns:
    - A dictionary with keys 'content' and 'title', containing the
      extracted human-readable text and the title of the document.
    """
    # Create a BeautifulSoup object and parse the HTML content
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Extract text from <p> tags only
    paragraphs = soup.find_all('p')
    text = ' '.join(paragraph.text for paragraph in paragraphs)

    # Find and include phone numbers from <a> tags
    a_tags = soup.find_all('a', href=True)
    for a in a_tags:
        if a['href'].startswith('tel:'):
            text += 'telefon nummer ' + a.text.strip()

    # Normalize the text by replacing multiple newline characters with a single newline
    text = re.sub(r'\n+', '\n', text)
    
    # Normalize the text by replacing multiple spaces with a single space
    text = re.sub(r' +', ' ', text)

    text = ftfy.fix_text(text)
    
    # Extract the title, prioritizing the text content of the div with classname "page-header"
    # If not found, use the text content of the first h1 tag
    title = soup.find('div', class_='page-header')
    if title is None:
        title = soup.find('h1')
    if title is not None:
        title = title.get_text()
    else:
        title = ""
    
    return {
        'content': text,
        'title': title
    }

def process_jsonl_file(old_jsonl_file, new_jsonl_file):
    """
    Processes each JSON object in the JSONL file by applying the preprocess
    function to the 'html' key.

    Parameters:
    - old_jsonl_file: The path to the old JSONL file to be processed.
    - new_jsonl_file: The path to the new JSONL file with the processed data.
    """
    
    # Open the original file for reading and the temporary file for writing
    with open(old_jsonl_file, 'r') as read_file, open(new_jsonl_file, 'w') as write_file:
        for line in read_file:
            json_obj = json.loads(line)
            # Apply the preprocess function to the 'html' key
            processed_obj = preprocess(json_obj['html'])
            # Update the JSON object with the processed content and title
            json_obj.update(processed_obj)
            # Write the processed JSON object to the temporary file
            write_file.write(json.dumps(json_obj) + '\n')

# Call the function to start the process
process_jsonl_file('data.jsonl', 'preprocessed_data.jsonl')