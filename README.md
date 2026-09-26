# pi-webwatch

Pi extension for watching RSS and Atom feeds.

## Tools

- `webwatch_add` — register an RSS/Atom feed URL. Optional `name` controls the display name.
- `webwatch_list` — list registered watches with their URL and last checked timestamp.
- `webwatch_check` — poll all registered feeds and return new items since the previous check.
- `webwatch_remove` — remove a registered feed by URL.

## State

Watches are stored as JSON at:

```text
~/.local/state/telegram-agent/webwatch/watches.json
```

Set `PI_WEBWATCH_DIR` to use a different directory. Each watch stores the feed URL, display name, last seen item id/link, and `checked_at` timestamp.

## Usage

Add a feed:

```text
webwatch_add({ "url": "https://example.com/feed.xml", "name": "Example releases" })
```

List watches:

```text
webwatch_list({})
```

Poll feeds:

```text
webwatch_check({})
```

Remove a feed:

```text
webwatch_remove({ "url": "https://example.com/feed.xml" })
```

To monitor feeds regularly, schedule `webwatch_check` with pi cron, for example daily or hourly. The check output includes grouped new feed items, or `(nothing new)` when no new items are found.

## Limitations

This extension parses RSS `<item>` and Atom `<entry>` XML. It does not watch arbitrary web pages or detect page snapshots.
