import argparse
from pathlib import Path

from pypdf import PdfReader


parser = argparse.ArgumentParser()
parser.add_argument("pdf_path", type=Path)
args = parser.parse_args()

pdf_path = args.pdf_path
reader = PdfReader(pdf_path)

for page_number, page in enumerate(reader.pages, start=1):
    print(f"\n===== PAGE {page_number} =====\n")
    print(page.extract_text())
