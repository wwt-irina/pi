// Extension for finding TODO comments across the codebase.
import { Container, Text, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

interface TodoMatch {
	file: string;
	line: number;
	text: string;
}

function parseTodos(output: string): TodoMatch[] {
	const matches: TodoMatch[] = [];
	const lines = output.trim().split("\n");

	for (const line of lines) {
		const match = line.match(/^([^:]+):(\d+):(.+)$/);
		if (match) {
			matches.push({
				file: match[1].trim(),
				line: Number.parseInt(match[2], 10),
				text: match[3].trim(),
			});
		}
	}

	return matches;
}

export default function todoExtension(pi: ExtensionAPI) {
	pi.registerCommand("todo", {
		description: "Find all TODO/FIXME/XXX/HACK comments in the codebase",
		handler: async (_args, ctx) => {
			if (ctx.mode !== "tui") {
				ctx.ui.notify("/todo is available in interactive mode", "warning");
				return;
			}

			// Use ripgrep to find TODO comments
			// -n = line numbers, -i = case insensitive, -e = pattern
			const result = await pi.exec("rg", [
				"-n",
				"-i",
				"-e",
				"TODO",
				"-e",
				"FIXME",
				"-e",
				"XXX",
				"-e",
				"HACK",
				ctx.cwd,
			]);

			if (result.code !== 0 && !result.stdout) {
				ctx.ui.notify("No TODOs found", "info");
				return;
			}

			const todos = parseTodos(result.stdout ?? "");

			if (todos.length === 0) {
				ctx.ui.notify("No TODOs found", "info");
				return;
			}

			// Group by file for better organization
			const byFile = new Map<string, TodoMatch[]>();
			for (const todo of todos) {
				const existing = byFile.get(todo.file) ?? [];
				existing.push(todo);
				byFile.set(todo.file, existing);
			}

			// Display with TUI components
			await ctx.ui.custom<void>(
				(tui, theme, keybindings, done) => {
					const lines: string[] = [];
					lines.push(theme.fg("accent", `Found ${todos.length} TODOs in ${byFile.size} files:\n`));

					for (const [file, fileTodos] of byFile.entries()) {
						lines.push(theme.fg("primary", `\n${file}`));
						for (const todo of fileTodos) {
							const lineNum = theme.fg("muted", `  ${todo.line}:`);
							lines.push(`${lineNum} ${todo.text}`);
						}
					}

					lines.push(theme.fg("dim", "\n[Press any key to close]"));

					const container = new Container();
					const text = new Text(lines.join("\n"));
					container.addChild(text);

					tui.on("data", () => {
						done();
					});

					return container;
				},
				{ overlay: true },
			);
		},
	});
}
