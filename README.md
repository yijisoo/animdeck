# md-anim-slides

A Claude Code plugin that converts bullet-list markdown into PowerPoint presentations with **click-to-appear animations**.

## What makes this different

- **Real .pptx output** -- editable text boxes, not images
- **Click-to-appear animations** -- `++` bullets appear one-by-one on click (the only markdown-to-pptx tool that does this)
- **6 slide types** -- title, section, content, image, two-column, comparison
- **Deterministic rendering** -- same input always produces the same output
- **Inline content** -- bold, italic, code, quotes, code blocks, images, references

## Install

Requires [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and Node.js.

```bash
claude plugin add github:yijisoo/md-anim-slides
```

## Usage

```
/slides [bullet text or file path]
/slides help
```

## Quick example

```markdown
* # Introduction to Machine Learning
  * A Practical Overview
  * Jane Doe
  * ACME University
  * Spring 2026
* ## Supervised Learning
* What is Regression?
  * Predicts **continuous** values
    * Uses mathematical functions to model relationships
    * Common in forecasting and trend analysis
  * ++ **Linear regression** -- fits a line
  * ++ **Polynomial regression** -- fits a curve
  * > "All models are wrong, but some are useful." -- George Box
  * [1] https://en.wikipedia.org/wiki/Regression
* |vs| Classification vs Regression
  * Predicts **categories**
  * Discrete output
  * ---
  * Predicts **numbers**
  * Continuous output
```

This produces 4 slides:
1. **Title** (dark) -- with author and affiliation
2. **Section** (dark) -- "Supervised Learning"
3. **Content** (light) -- static bullet, 2 animated bullets that appear on click, quote, reference
4. **Comparison** (light) -- two columns with "vs" badge

## Notation reference

| Notation | Effect |
|----------|--------|
| `* # Title` | Title slide |
| `* ## Section` | Section divider |
| `* Slide Title` | Content slide |
| `* \|vs\| Title` | Comparison (two columns + vs badge) |
| `* \|split\| Title` | Two-column slide |
| `* ![] Title` | Image slide |
| `* ++ text` | Appear on click |
| `* > "Quote" -- Author` | Quote block |
| `` * ```python `` | Code block |
| `* ![caption](path)` | Inline image |
| `* [1] url-or-text` | Footer reference |
| `* ---` | Column separator (in split/vs) |
| `{logo: Text}` | Text logo on title slide |
| `{logo: ![](path)}` | Image logo on title slide |

Run `/slides help` for the full reference.

## Architecture

Two-phase pipeline:

1. **Parse** -- Claude reads bullet notation and produces a JSON intermediate schema
2. **Render** -- `slide-renderer.js` (PptxGenJS) produces the .pptx deterministically, then `animation-injector.js` post-processes it to inject OOXML `<p:timing>` for click-to-appear animations

The JSON step is the validation and iteration point -- Claude checks for overflow, missing references, and image paths before rendering.

## Dependencies

- **Node.js** -- runtime for the renderer
- **pptxgenjs** -- installed automatically on first run
- **LibreOffice** (optional) -- for QA image conversion

## Development

If you've installed this plugin via a local-directory marketplace (e.g. for in-place editing), Claude Code maintains a separate cache at `~/.claude/plugins/cache/local-plugins/md-anim-slides/<version>/` that does **not** auto-refresh when you edit source files. Edits to `skills/`, `commands/`, or references will not take effect until the cache is updated.

After editing, run:

```bash
npm run sync
```

This rsyncs source → cache, so the next `/slides` invocation picks up the latest renderer, SKILL.md, and references.

If you bump the version in `package.json` and `.claude-plugin/plugin.json`, also update the cache path inside the `sync` script to match the new version.

## License

ISC
