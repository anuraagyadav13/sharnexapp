import os
import re
root = r'e:\Krushna\sharnexapp\HRT\src\app\api'
paths=[]
for dirpath, dirnames, filenames in os.walk(root):
    if 'route.js' in filenames:
        rel = os.path.relpath(dirpath, root).replace('\\','/')
        paths.append('/' + rel if rel != '.' else '/')
paths.sort()
print('BACKEND ROUTES:')
for p in paths:
    print(p)
frontend = open(r'e:\Krushna\sharnexapp\MyApp\src\constants\api.ts','r', encoding='utf-8').read()
print('\nFRONTEND ENDPOINT TEMPLATES:')
for m in re.finditer(r'\b([A-Z_]+):\s*`?/?([^`"\n]+)`?', frontend):
    print(m.group(2))
