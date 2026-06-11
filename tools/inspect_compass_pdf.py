from pathlib import Path

from pypdf import PdfReader


pdf_path = Path("deliverables/Compass_Role_Walkthrough.pdf")
reader = PdfReader(pdf_path)

for page_number, page in enumerate(reader.pages, start=1):
    print(f"\n===== PAGE {page_number} =====\n")
    print(page.extract_text())
