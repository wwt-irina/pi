/**
 * Slash command for finding TODO, FIXME, XXX, and HACK comments in the codebase.
 * Usage: /todo
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

const execAsync = promisify(exec);

interface TodoMatch {
	file: string;
	line: number;
	text: string;
}

async function findTodos(cwd: string): Promise<TodoMatch[]> {
	const patterns = ["TODO", "FIXME", "XXX", "HACK"];
	const regexPattern = patterns.join("|");

	try {
		const { stdout } = await execAsync(`rg -n -i "\\b(${regexPattern})\\b" --no-heading`, {
			cwd,
			maxBuffer: 10 * 1024 * 1024,
		});

		const matches: TodoMatch[] = [];
		const lines = stdout.trim().split("\n");

		for (const line of lines) {
			if (!line) continue;

			const match = line.match(/^([^:]+):(\d+):(.*)$/);
			if (match) {
				const [, file, lineNum, text] = match;
				matches.push({
					file,
					line: Number.parseInt(lineNum, 10),
					text: text.trim(),
				});
			}
		}

		return matches;
	} catch (error: unknown) {
		if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
			throw new Error("ripgrep (rg) is not installed. Install it to use /todo.");
		}
		if (error && typeof error === "object" && "code" in error && error.code === 1) {
			return [];
		}
		throw error;
	}
}

function formatTodos(matches: TodoMatch[]): string {
	if (matches.length === 0) {
		return "No TODOs found in the codebase.";
	}

	const lines = [`Found ${matches.length} TODO${matches.length === 1 ? "" : "s"}:\n`];

	for (const match of matches) {
		lines.push(`${match.file}:${match.line}: ${match.text}`);
	}

	return lines.join("\n");
}

export default function (pi: ExtensionAPI) {
	pi.registerCommand("todo", {
		description: "Find all TODO, FIXME, XXX, and HACK comments in the codebase",
		handler: async (args: string, ctx: ExtensionCommandContext) => {
			if (args.trim()) {
				ctx.ui.notify("Usage: /todo (no arguments)", "error");
				return;
			}

			try {
				ctx.ui.notify("Searching for TODOs...", "info");
				const matches = await findTodos(ctx.cwd);
				const output = formatTodos(matches);
				ctx.ui.notify(output, "info");
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				ctx.ui.notify(`Error finding TODOs: ${message}`, "error");
			}
		},
	});
}
