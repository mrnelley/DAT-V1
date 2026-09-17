"""Read draft workplan objective/target columns only; never copy personal attribution."""
import hashlib, json, pathlib, re, sys
import pdfplumber

root = pathlib.Path(sys.argv[1])
output = pathlib.Path('supabase/seeds/2026/workplan-source.json')
documents = []
for name in ['Community Relations', 'Finance', 'HR', 'Property Management', 'Real Estate Development', 'Resident Services']:
    path = root / (name + '.pdf')
    document = {'id': 'workplan-' + name.lower().replace(' ', '-'), 'filename': path.name,
                'department': 'Human Resources' if name == 'HR' else name,
                'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'objectives': []}
    with pdfplumber.open(path) as pdf:
        document['pages'] = len(pdf.pages)
        for page_number, page in enumerate(pdf.pages, 1):
            for table_number, table in enumerate(page.extract_tables(), 1):
                for row_number, row in enumerate(table, 1):
                    if name == 'Finance':
                        number_col, title_col, target_col, start_col, end_col = 0, 1, 2, 3, 4
                    elif name == 'Community Relations' and page_number == 2:
                        number_col, title_col, target_col, start_col, end_col = 1, 2, 4, 5, 6
                    elif name in ['HR', 'Property Management']:
                        number_col, title_col, target_col, start_col, end_col = 2, 3, 4, 5, 6
                    else:
                        number_col, title_col, target_col, start_col, end_col = 2, 3, 5, 6, 7
                    def cell(index):
                        return re.sub(r'\s+', ' ', row[index] or '').strip() if index < len(row) else ''
                    title, number = cell(title_col), cell(number_col)
                    if len(title) < 15 or not re.match(r'^\d+(?:\.?[a-zA-Z])?$', number):
                        continue
                    document['objectives'].append({'id': f"{document['id']}-p{page_number}-t{table_number}-r{row_number}",
                        'page': page_number, 'sourceNumber': number, 'title': title,
                        'targetText': cell(target_col), 'startText': cell(start_col), 'endText': cell(end_col),
                        'authority': 'early-draft-reference-only'})
    # Page two's merged table does not expose these two objective cells.
    if name == 'HR':
        for number, title in [('2.b', 'Monthly Property Spotlight during FMM: site staff present their property'),
                              ('2.c', 'Employee spotlight or show and tell on FMM')]:
            document['objectives'].append({'id': f"workplan-hr-p2-{number}", 'page': 2, 'sourceNumber': number,
                'title': title, 'targetText': '>50% employee engagement', 'startText': '1/1/2026',
                'endText': '12/31/2026', 'authority': 'early-draft-reference-only'})
    documents.append(document)
output.write_text(json.dumps(documents, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(json.dumps({d['filename']: len(d['objectives']) for d in documents}))
