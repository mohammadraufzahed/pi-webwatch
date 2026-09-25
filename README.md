# pi-webwatch

Pi extension for watching RSS and Atom feeds.

## Tools

- `webwatch_add` — subscribe to an RSS/Atom feed.
- `webwatch_list` — list active watches.
- `webwatch_check` — poll watched feeds and report new RSS items or Atom entries.
- `webwatch_remove` — stop watching a feed.

State is stored in `~/.local/state/telegram-agent/webwatch/watches.json` unless `PI_WEBWATCH_DIR` is set.
