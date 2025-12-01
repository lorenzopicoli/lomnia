# Obsidian JSON snapshot

I started tracking my habits through obsidian, but maintaining it was super annoying. So I exported the data into a simple JSON format. This importer handles that very specific format:

```
      date: string;
      recordedAt: string;
      key: string;
      value: unknown;
      source: string;
      timezone: string;
      isFullDay: boolean;
```