#!/usr/bin/env python3

file_path = "packages/coding-agent/src/modes/interactive/interactive-mode.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the line that tries to get rgPath from settings manager
content = content.replace(
    '\t\tconst rgPath = this.settingsManager.getRgPath();\n',
    ''
)

# Update the collectTodos call to not pass rgPath
content = content.replace(
    'const entries = await collectTodos(cwd, rgPath);',
    'const entries = await collectTodos(cwd);'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed rgPath usage")
