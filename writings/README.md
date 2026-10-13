# Writings

Each essay is one folder with one text file you edit: `writings/<slug>/article.md`.
The folder name is the URL, so `writings/instinct-survival-instincts/` is
`ysunkara.com/writings/instinct-survival-instincts`.

## Editing an essay

1. Open `writings/<slug>/article.md` and change the text.
2. Commit and push. Vercel rebuilds the page, the `/writings` list and the homepage card.

To preview locally first, run `node scripts/build-writings.mjs`, then open the folder's `index.html`
through any static server (for example `python3 -m http.server`). Never edit the generated
`index.html` by hand; it is rewritten from `article.md` on every build.

## Adding a new essay

Make a new folder with an `article.md` that starts like this:

```
---
title: My New Essay
dek: One or two sentences that show under the title and on the listing card.
date: 2026-11-02
reading_time: 6 min read
kicker: Policy · Essay
---

First paragraph goes here.
```

Optional settings at the top:

| Setting | What it does |
|---|---|
| `listing_dek` | Different summary for the /writings list and homepage than the one under the title |
| `description` | Text for link previews and search results (defaults to `dek`) |
| `draft: true` | Hides the essay everywhere until you remove it |
| `about` | Replaces the bio line at the bottom of the page |
| `styles` / `scripts` | Extra CSS or JS files in the folder, comma-separated (for calculators and charts) |
| `date: 2026-11-02 18:00` | A time breaks ties between essays published the same day |

Put an `og.png` (1200×630) in the folder to give the essay a link-preview image.

## What you can write in article.md

- `## Heading` for a section, `### Smaller heading`
- `[link text](https://...)` for citations; outside links open in a new tab
- `**bold**`, `*italic*`
- Tables with `| a | b |` rows; columns 3 and up are right-aligned for numbers
- `![what the image shows](photo.png "Caption under the image")` with the image in the same folder
- A small formula box:
  ````
  ```formula
  Line one
  Line two
  ```
  ````
- `<!-- include: parts/thing.html -->` drops in an HTML block (calculators, embeds) from the folder
- `## Sources` starts the grey sources section at the end

Straight quotes become curly ones automatically.

## Hand-built essays

The Gigawatt Standard has custom scroll animations, so its text lives in its own `index.html`.
Its `article.md` has `page: custom`, which means it only controls the listing card.
