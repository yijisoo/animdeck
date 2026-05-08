# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Workflow

After editing any source file, sync to the Claude Code plugin cache:

```bash
npm run sync
```

The cache at `~/.claude/plugins/cache/local-plugins/md-anim-slides/<version>/` is **not** auto-refreshed on source edits — the sync is required for changes to take effect in `/slides`. If the version in `package.json` and `.claude-plugin/plugin.json` is bumped, also update the cache path inside the `sync` script in `package.json`.

## Architecture

Two-phase pipeline triggered by `/slides`:

1. **Parse** — Claude reads bullet notation and produces a JSON `SlideDeck` intermediate. This is the validation/iteration point.
2. **Render** — `slide-renderer.js` (PptxGenJS) produces the .pptx deterministically, then `animation-injector.js` post-processes the zip to inject OOXML `<p:timing>` for click-to-appear animations.

Key files:
- `commands/slides.md` — slash command definition; declares allowed tools and the two modes (help / generate)
- `skills/bullet-to-slides/SKILL.md` — parsing rules, validation rules, render invocation, QA process
- `skills/bullet-to-slides/references/slide-renderer.js` — Node.js renderer; takes `input.json output.pptx`; also writes `output.animation.json`
- `skills/bullet-to-slides/references/animation-injector.js` — post-processes the .pptx zip to inject OOXML timing
- `skills/bullet-to-slides/references/branding.md` — complete visual spec (colors, typography, layout coordinates)
- `skills/bullet-to-slides/references/notation-reference.md` — user-facing syntax reference (printed by `/slides help`)
- `.claude-plugin/plugin.json` — plugin manifest (name, version, author)

## Slide Types

Six types determined by first-level bullet prefix: `title` (`# Text`), `section` (`## Text`), `image` (`![] Text`), `split` (`|split| Text`), `comparison` (`|vs| Text`), `content` (anything else).

`++` bullets get click-to-appear animations; a `++` bullet and all its children appear together on one click.

## Validation Rules (never auto-split)

- Content slides: warn if `body.length > 6`
- Comparison/split columns: warn if either column has `> 5` items
- Code blocks: warn if `lines.length > 12`
- Long bullets: warn if `text.length > 80`
- Always verify local image paths exist and `[N]` refs have matching entries
