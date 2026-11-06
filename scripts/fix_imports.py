#!/usr/bin/env python3

file_path = "packages/coding-agent/src/modes/interactive/interactive-mode.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the unused TodoEntry type import
content = content.replace(
    'import { collectTodos, formatTodoEntry, groupTodosByFile, type TodoEntry } from "../../utils/todo-collector.ts";',
    'import { collectTodos, formatTodoEntry, groupTodosByFile } from "../../utils/todo-collector.ts";'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed unused TodoEntry import")
