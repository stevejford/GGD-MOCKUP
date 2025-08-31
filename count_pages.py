import os

brands = ['b-and-d', 'steel-line', '4ddoors', 'centurion', 'taurean', 'eco-garage-doors']
total = 0

for brand in brands:
    brand_dir = f"crawlforai/output_markdown/{brand}"
    if os.path.exists(brand_dir):
        md_files = [f for f in os.listdir(brand_dir) if f.endswith('.md')]
        count = len(md_files)
        print(f"{brand}: {count} pages")
        total += count

print(f"\nTotal: {total} pages")
