import zipfile
import xml.etree.ElementTree as ET
import sys

def extract_text():
    docx_path = r'assets\LQS_Assessment_Clinical_Dietitian.docx'
    out_path = r'lqs_out.txt'
    
    with zipfile.ZipFile(docx_path) as docx:
        tree = ET.fromstring(docx.read('word/document.xml'))
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        with open(out_path, 'w', encoding='utf-8') as f:
            for p in tree.findall('.//w:p', ns):
                texts = [t.text for t in p.findall('.//w:t', ns) if t.text]
                if texts:
                    f.write(''.join(texts) + '\n')

if __name__ == '__main__':
    extract_text()
