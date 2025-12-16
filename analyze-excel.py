import pandas as pd
import json

# Read Excel file
df = pd.read_excel('c:/Users/miked/Team Budget App/Ontario Associations List.xlsx')

# Set first row as column headers and remove it from data
df.columns = df.iloc[0]
df = df[1:].reset_index(drop=True)

print(f'Total associations in Excel: {len(df)}')
print(f'\nColumns: {list(df.columns)}')

# Load our previously extracted associations
with open('all-extraction-results.json', 'r') as f:
    extracted = json.load(f)

extracted_names = set(result['association'].lower() for result in extracted)

print(f'\nAlready extracted: {len(extracted_names)} associations')

# Find new associations
new_associations = []
for i, row in df.iterrows():
    assoc_name = str(row['Association Name'])
    if assoc_name.lower() not in extracted_names and assoc_name != 'nan':
        new_associations.append({
            'name': assoc_name,
            'location': str(row['Location']),
            'league': str(row['League Name'])
        })

print(f'New associations to process: {len(new_associations)}')

print('\nFirst 30 new associations:')
for i, assoc in enumerate(new_associations[:30], 1):
    print(f'{i}. {assoc["name"]} - {assoc["location"]} ({assoc["league"]})')

# Save list of new associations
with open('new-associations-to-process.json', 'w') as f:
    json.dump(new_associations, f, indent=2)

print(f'\nSaved {len(new_associations)} new associations to: new-associations-to-process.json')
