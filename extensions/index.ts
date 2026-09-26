/**
 * pi-webwatch — RSS/Atom feed watching for pi agents.
 *
 *   webwatch_add    — subscribe to an RSS/Atom feed
 *   webwatch_list   — active watches + last-seen
 *   webwatch_check  — poll now → new items since last check
 *   webwatch_remove — unsubscribe
 *
 * State: ~/.local/state/telegram-agent/webwatch/watches.json
 * (PI_WEBWATCH_DIR overrides). Pairs with cron: schedule a
 * "webwatch_check" job → new items become events/report lines.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { Type } from "typebox";

const DIR =
	process.env.PI_WEBWATCH_DIR ??
	join(homedir(), ".local/state/telegram-agent/webwatch");
const FILE = join(DIR, "watches.json");

interface Watch {
	url: string;
	name: string;
	last_seen: string; // last item id/link seen
	checked_at: number;
}

function load(): Record<string, Watch> {
	try {
		return JSON.parse(readFileSync(FILE, "utf-8"));
	} catch {
		return {};
	}
}

function save(w: Record<string, Watch>): void {
	mkdirSync(DIR, { recursive: true });
	writeFileSync(FILE, JSON.stringify(w, null, 2));
}

async function fetchItems(url: string): Promise<{ id: string; title: string; link: string }[]> {
	const r = await fetch(url, { signal: AbortSignal.timeout(20_000) });
	const xml = await r.text();
	const items: { id: string; title: string; link: string }[] = [];
	// RSS items + Atom entries
	for (const m of xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>|<entry[\s>]([\s\S]*?)<\/entry>/g)) {
		const b = m[1] ?? m[2] ?? "";
		const title = (b.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? "")
			.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
		const link =
			b.match(/<link[^>]*href="([^"]+)"/)?.[1] ??
			b.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1] ??
			b.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] ?? "";
		const id = b.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] ?? link;
		if (title) items.push({ id, title, link: link.trim() });
		if (items.length >= 20) break;
	}
	return items;
}

export default function piWebwatch(pi: ExtensionAPI) {
	pi.registerTool({
		name: "webwatch_add",
		label: "Webwatch Add",
		description: "Watch an RSS/Atom feed — releases, changelogs, blogs.",
		parameters: Type.Object({
			url: Type.String(),
			name: Type.Optional(Type.String()),
		}),
		async execute(_id, p) {
			const w = load();
			w[p.url] = {
				url: p.url, name: p.name ?? p.url, last_seen: "",
				checked_at: 0,
			};
			save(w);
			return { content: [{ type: "text" as const, text: `watching ${p.url}` }], details: null };
		},
	});

	pi.registerTool({
		name: "webwatch_list",
		label: "Webwatch List",
		description: "Active watches + last-checked.",
		parameters: Type.Object({}),
		async execute() {
			const w = Object.values(load());
			return {
				content: [{
					type: "text" as const,
					text: w.length
						? w.map((x) => `- ${x.name} (${x.url})`).join("\n")
						: "(no watches)",
				}],
				details: null,
			};
		},
	});

	pi.registerTool({
		name: "webwatch_check",
		label: "Webwatch Check",
		description: "Poll all watches → new items since last check.",
		parameters: Type.Object({}),
		async execute() {
			const watches = load();
			const out: string[] = [];
			for (const [key, w] of Object.entries(watches)) {
				try {
					const items = await fetchItems(w.url);
					const fresh = items.filter((i) => i.id > w.last_seen);
					if (fresh.length) {
						out.push(`### ${w.name}`);
						out.push(...fresh.slice(0, 8).map((i) => `- ${i.title}\n  ${i.link}`));
						watches[key].last_seen = items[0]?.id ?? w.last_seen;
					}
					watches[key].checked_at = Date.now();
				} catch (e) {
					out.push(`### ${w.name} — fetch failed: ${e}`);
				}
			}
			save(watches);
			return {
				content: [{
					type: "text" as const,
					text: out.join("\n") || "(nothing new)",
				}],
				details: null,
			};
		},
	});

	pi.registerTool({
		name: "webwatch_remove",
		label: "Webwatch Remove",
		description: "Stop watching a feed.",
		parameters: Type.Object({ url: Type.String() }),
		async execute(_id, p) {
			const w = load();
			delete w[p.url];
			save(w);
			return { content: [{ type: "text" as const, text: `removed ${p.url}` }], details: null };
		},
	});
}
