// Collects TODO, FIXME, and other marker comments from source files.

import { spawn } from "node:child_process";
import * as path from "node:path";

export interface TodoEntry {
	file: string;
	line: number;
	column: number;
	type: "TODO" | "FIXME" | "HACK" | "XXX" | "NOTE" | "BUG";
	text: string;
}

const TODO_PATTERNS = [/\b(TODO|FIXME|HACK|XXX|NOTE|BUG)\b:?\s*(.*)/i];

/**
 * Collect TODO markers from the workspace using ripgrep.
 */
export async function collectTodos(cwd: string, rgPath?: string): Promise<TodoEntry[]> {
	const rg = rgPath || "rg";

	return new Promise((resolve, reject) => {
		const args = [
			"--line-number",
			"--column",
			"--no-heading",
			"--color",
			"never",
			"--case-sensitive",
			"-e",
			"TODO",
			"-e",
			"FIXME",
			"-e",
			"HACK",
			"-e",
			"XXX",
			"-e",
			"NOTE",
			"-e",
			"BUG",
			"--",
			".",
		];

		const proc = spawn(rg, args, {
			cwd,
			stdio: ["ignore", "pipe", "pipe"],
		});

		let stdout = "";
		let stderr = "";

		proc.stdout.on("data", (data) => {
			stdout += data.toString();
		});

		proc.stderr.on("data", (data) => {
			stderr += data.toString();
		});

		proc.on("error", (error) => {
			reject(new Error(`Failed to run ripgrep: ${error.message}`));
		});

		proc.on("close", (code) => {
			// ripgrep exits with 1 when no matches found, 0 when matches found
			if (code !== 0 && code !== 1) {
				reject(new Error(`ripgrep exited with code ${code}: ${stderr}`));
				return;
			}

			const entries: TodoEntry[] = [];
			const lines = stdout.split("\n").filter((line) => line.trim().length > 0);

			for (const line of lines) {
				const match = line.match(/^([^:]+):(\d+):(\d+):(.*)$/);
				if (!match) continue;

				const [, file, lineNum, column, content] = match;
				const contentMatch = content.match(TODO_PATTERNS[0]);
				if (!contentMatch) continue;

				const [, type, text] = contentMatch;
				entries.push({
					file: file!,
					line: parseInt(lineNum!, 10),
					column: parseInt(column!, 10),
					type: type!.toUpperCase() as TodoEntry["type"],
					text: text!.trim(),
				});
			}

			resolve(entries);
		});
	});
}

/**
 * Format a TODO entry for display.
 */
export function formatTodoEntry(entry: TodoEntry, cwd: string): string {
	const relativePath = path.relative(cwd, path.resolve(cwd, entry.file));
	return `${relativePath}:${entry.line}:${entry.column}`;
}

/**
 * Group TODOs by type.
 */
export function groupTodosByType(entries: TodoEntry[]): Map<TodoEntry["type"], TodoEntry[]> {
	const groups = new Map<TodoEntry["type"], TodoEntry[]>();

	for (const entry of entries) {
		const list = groups.get(entry.type) || [];
		list.push(entry);
		groups.set(entry.type, list);
	}

	return groups;
}

/**
 * Group TODOs by file.
 */
export function groupTodosByFile(entries: TodoEntry[]): Map<string, TodoEntry[]> {
	const groups = new Map<string, TodoEntry[]>();

	for (const entry of entries) {
		const list = groups.get(entry.file) || [];
		list.push(entry);
		groups.set(entry.file, list);
	}

	return groups;
}
