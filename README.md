# pi-webwatch

Pi extension for watching RSS/Atom feeds from agents.

## Tools

### `webwatch_add`

Registers a feed watch.

Parameters:

- `url` — RSS/Atom feed URL to watch.
- `name` — optional display name. Defaults to the URL.

Result: `watching <url>`.

### `webwatch_list`

Lists active watches.

Result:

- one `- <name> (<url>)` line per watch, or
- `(no watches)` when nothing is registered.

### `webwatch_check`

Polls every registered watch and reports new items since the last check.

Behavior:

- fetches each URL with a 20 second timeout;
- parses RSS `<item>` and Atom `<entry>` entries;
- reports up to 8 fresh items per watch;
- updates `checked_at` after each attempted poll;
- advances `last_seen` to the newest item ID/link when fresh items are found;
- includes `fetch failed` lines for watches that cannot be fetched;
- returns `(nothing new)` when no watch has fresh items.

### `webwatch_remove`

Removes a registered watch by URL.

Parameters:

- `url` — feed URL to stop watching.

Result: `removed <url>`.

## State

State is stored as JSON in:

```text
~/.local/state/telegram-agent/webwatch/watches.json
```

Set `PI_WEBWATCH_DIR` to override the state directory. The file name remains `watches.json`.

Each watch is stored by URL and contains:

- `url` — feed URL;
- `name` — display name;
- `last_seen` — last item ID/link seen by `webwatch_check`;
- `checked_at` — last check time as a Unix timestamp in milliseconds.

`webwatch_add` creates the directory on first save. If the state file is missing or cannot be parsed, the extension starts with an empty watch list.

## Scheduling

Use Pi cron to run `webwatch_check` on a schedule. New feed items then appear in the scheduled job output.
