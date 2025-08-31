import re

# Test the improved regex pattern
test_content = '''[Download Manual](https://admin.bnd.com.au/media/3sdb0snl/press-release-final.pdf "B&D Business Press Release")
[Simple PDF](https://example.com/simple.pdf)
[Another Doc](https://example.com/doc.pdf "Title with spaces")
[No Title](https://example.com/notitle.pdf)'''

print("Test content:")
print(test_content)
print("\n" + "="*50)

# New improved pattern
pdf_pattern = r'\[[^\]]*\]\(([^\s\)]*\.pdf)(?:\s[^\)]*)?\)'
matches = re.findall(pdf_pattern, test_content, re.IGNORECASE)

print('Improved regex results:')
for i, match in enumerate(matches):
    print(f'{i+1}. {match}')

# Test with real B&D content
print("\n" + "="*50)
print("Testing with real B&D content:")

try:
    with open('crawlforai/output_markdown/b-and-d/_media.md', 'r', encoding='utf-8') as f:
        real_content = f.read()
    
    real_matches = re.findall(pdf_pattern, real_content, re.IGNORECASE)
    print(f'Found {len(real_matches)} PDF URLs in _media.md:')
    for i, match in enumerate(real_matches):
        print(f'{i+1}. {match}')
        
except Exception as e:
    print(f"Error reading real file: {e}")
