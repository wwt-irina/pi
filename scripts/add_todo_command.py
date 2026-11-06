#!/usr/bin/env python3
import sys

def add_todo_command(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Find where to add the import
    import_added = False
    for i, line in enumerate(lines):
        if 'from "../../utils/changelog.ts"' in line:
            # Add our import after the changelog import
            lines.insert(i + 1, 'import { collectTodos, formatTodoEntry, groupTodosByFile, type TodoEntry } from "../../utils/todo-collector.ts";\n')
            import_added = True
            break
    
    if not import_added:
        print("Could not find changelog import line", file=sys.stderr)
        return False
    
    # Find where to add the command handler call (after /changelog)
    handler_call_added = False
    for i, line in enumerate(lines):
        if 'if (text === "/changelog")' in line:
            # Find the closing brace and add after it
            j = i
            brace_count = 0
            while j < len(lines):
                if '{' in lines[j]:
                    brace_count += lines[j].count('{')
                if '}' in lines[j]:
                    brace_count -= lines[j].count('}')
                    if brace_count == 0:
                        # Insert after this closing brace
                        lines.insert(j + 1, '\t\t\tif (text === "/todo") {\n')
                        lines.insert(j + 2, '\t\t\t\tvoid this.handleTodoCommand();\n')
                        lines.insert(j + 3, '\t\t\t\tthis.editor.setText("");\n')
                        lines.insert(j + 4, '\t\t\t\treturn;\n')
                        lines.insert(j + 5, '\t\t\t}\n')
                        handler_call_added = True
                        break
                j += 1
            break
    
    if not handler_call_added:
        print("Could not find /changelog command handler", file=sys.stderr)
        return False
    
    # Find where to add the handler method (after handleChangelogCommand)
    handler_method_added = False
    for i, line in enumerate(lines):
        if 'private handleChangelogCommand():' in line:
            # Find the end of this method
            j = i + 1
            brace_count = 1  # Start with 1 for the opening brace
            while j < len(lines):
                brace_count += lines[j].count('{')
                brace_count -= lines[j].count('}')
                if brace_count == 0:
                    # Insert after this method
                    lines.insert(j + 1, '\n')
                    lines.insert(j + 2, '\tprivate async handleTodoCommand(): Promise<void> {\n')
                    lines.insert(j + 3, '\t\tconst cwd = this.sessionManager.getCwd();\n')
                    lines.insert(j + 4, '\t\tconst rgPath = this.settingsManager.getRgPath();\n')
                    lines.insert(j + 5, '\n')
                    lines.insert(j + 6, '\t\ttry {\n')
                    lines.insert(j + 7, '\t\t\tconst entries = await collectTodos(cwd, rgPath);\n')
                    lines.insert(j + 8, '\n')
                    lines.insert(j + 9, '\t\t\tif (entries.length === 0) {\n')
                    lines.insert(j + 10, '\t\t\t\tthis.showStatus("No TODOs found in workspace");\n')
                    lines.insert(j + 11, '\t\t\t\treturn;\n')
                    lines.insert(j + 12, '\t\t\t}\n')
                    lines.insert(j + 13, '\n')
                    lines.insert(j + 14, '\t\t\t// Group by file\n')
                    lines.insert(j + 15, '\t\t\tconst byFile = groupTodosByFile(entries);\n')
                    lines.insert(j + 16, '\t\t\tconst sortedFiles = Array.from(byFile.keys()).sort();\n')
                    lines.insert(j + 17, '\n')
                    lines.insert(j + 18, '\t\t\t// Build markdown output\n')
                    lines.insert(j + 19, '\t\t\tconst lines: string[] = [];\n')
                    lines.insert(j + 20, '\t\t\tlines.push(`Found ${entries.length} TODO comment${entries.length === 1 ? "" : "s"} in ${sortedFiles.length} file${sortedFiles.length === 1 ? "" : "s"}:\\n`);\n')
                    lines.insert(j + 21, '\n')
                    lines.insert(j + 22, '\t\t\tfor (const file of sortedFiles) {\n')
                    lines.insert(j + 23, '\t\t\t\tconst fileEntries = byFile.get(file)!;\n')
                    lines.insert(j + 24, '\t\t\t\tconst relativePath = formatTodoEntry(fileEntries[0]!, cwd).split(":")[0];\n')
                    lines.insert(j + 25, '\t\t\t\tlines.push(`\\n**${relativePath}**\\n`);\n')
                    lines.insert(j + 26, '\n')
                    lines.insert(j + 27, '\t\t\t\tfor (const entry of fileEntries) {\n')
                    lines.insert(j + 28, '\t\t\t\t\tconst location = formatTodoEntry(entry, cwd);\n')
                    lines.insert(j + 29, '\t\t\t\t\tconst typeLabel = entry.type === "TODO" ? "" : `[${entry.type}] `;\n')
                    lines.insert(j + 30, '\t\t\t\t\tconst text = entry.text || "(no description)";\n')
                    lines.insert(j + 31, '\t\t\t\t\tlines.push(`- \\`${location}\\`: ${typeLabel}${text}`);\n')
                    lines.insert(j + 32, '\t\t\t\t}\n')
                    lines.insert(j + 33, '\t\t\t}\n')
                    lines.insert(j + 34, '\n')
                    lines.insert(j + 35, '\t\t\tconst markdown = lines.join("\\n");\n')
                    lines.insert(j + 36, '\n')
                    lines.insert(j + 37, '\t\t\tthis.chatContainer.addChild(new Spacer(1));\n')
                    lines.insert(j + 38, '\t\t\tthis.chatContainer.addChild(new DynamicBorder());\n')
                    lines.insert(j + 39, '\t\t\tthis.chatContainer.addChild(new ThemedText(() => theme.bold(theme.fg("accent", "TODO Comments")), 1, 0));\n')
                    lines.insert(j + 40, '\t\t\tthis.chatContainer.addChild(new Spacer(1));\n')
                    lines.insert(j + 41, '\t\t\tthis.chatContainer.addChild(\n')
                    lines.insert(j + 42, '\t\t\t\tnew Markdown(markdown, 1, 0, this.getMarkdownThemeWithSettings()),\n')
                    lines.insert(j + 43, '\t\t\t);\n')
                    lines.insert(j + 44, '\t\t\tthis.chatContainer.addChild(new DynamicBorder());\n')
                    lines.insert(j + 45, '\t\t\tthis.ui.requestRender();\n')
                    lines.insert(j + 46, '\t\t} catch (error: unknown) {\n')
                    lines.insert(j + 47, '\t\t\tconst message = error instanceof Error ? error.message : String(error);\n')
                    lines.insert(j + 48, '\t\t\tthis.showError(`Failed to collect TODOs: ${message}`);\n')
                    lines.insert(j + 49, '\t\t}\n')
                    lines.insert(j + 50, '\t}\n')
                    handler_method_added = True
                    break
                j += 1
            break
    
    if not handler_method_added:
        print("Could not find handleChangelogCommand method", file=sys.stderr)
        return False
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    return True

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: add_todo_command.py <file_path>", file=sys.stderr)
        sys.exit(1)
    
    if add_todo_command(sys.argv[1]):
        print("Successfully added /todo command")
    else:
        print("Failed to add /todo command", file=sys.stderr)
        sys.exit(1)
