---
name: bullet-to-slides
description: >
  Convert bullet-listed notes into branded PowerPoint slides. Use when
  the user asks to "make slides", "create a presentation", "convert notes to
  slides", or wants to turn bullet-list content into a .pptx file.
version: 1.0.0
---

# Bullet-to-Slides

Convert bullet-listed notes into polished PowerPoint presentations using a two-phase pipeline: parse to JSON, then render to .pptx.

## Two-Phase Pipeline

1. **Parse** — read the bullet input, apply notation rules, produce a JSON SlideDeck
2. **Render** — run the deterministic renderer (`slide-renderer.js`) to produce .pptx

The JSON step is where you validate, check overflow, and iterate with the user.

## Parsing Rules

Read `references/notation-reference.md` for the complete notation syntax.

### Slide Detection

Each first-level bullet (`*`) starts a new slide. The prefix determines the type:

| Pattern | Type |
|---------|------|
| `* # Text` | `title` |
| `* ## Text` | `section` |
| `* ![] Text` | `image` |
| `* \|split\| Text` | `split` |
| `* \|vs\| Text` | `comparison` |
| `* Text` (anything else) | `content` |

### Title Slide Config Parsing

Parse `{logo: value}` from the title text. Supported values:
- `{logo: My Company}` → plain text logo
- `{logo: KAIST}` → plain text logo
- `{logo: ![](path/to/logo.png)}` → image logo
- No `{logo:}` → no logo

Parse children positionally:
1st = subtitle, 2nd = author, 3rd = affiliation, 4th = date. All optional.

### Body Item Detection

For child bullets of content/split/comparison slides:

| Pattern | Body Item Kind |
|---------|---------------|
| `* > "text" — author` | `quote` |
| `` * ```lang `` (start) ... `` * ``` `` (end) | `code` |
| `* ![caption](src)` | `image` |
| `* [N] text` | reference (not a body item — goes to `references` array) |
| `* ++ text` | `bullet` with `animate: true` |
| `* text` | `bullet` with `animate: false` |

### Column Separator

In `|split|` and `|vs|` slides, `* ---` separates left from right column items.
The first `---` splits the children into left and right groups.

### Reference Detection

- Inline `[N]` in bullet text → add N to bullet's `refs` array
- Child bullet matching `[N] text` → add to slide's `references` array
- If text starts with `http` → set `isUrl: true`

### Section Numbering

Auto-increment section numbers starting from 1.

### Nested Bullets

Child bullets (deeper indentation under a bullet) become `children` array on the parent bullet item.

## Validation & Overflow

After parsing, check the JSON before rendering:

1. **Content slides**: if `body.length > 6`, auto-split into continuation slides
2. **Comparison/split**: if either column has `> 5` items, auto-split
3. **Code blocks**: if `lines.length > 12`, warn the user (split or reduce font)
4. **Long bullets**: if any bullet `text.length > 80`, warn (may wrap)
5. **Image paths**: check that local file paths exist
6. **Reference consistency**: verify all `[N]` refs in bullets have matching entries in `references`

When auto-splitting:
- Set `continuation: {"part": N, "of": M}` on each resulting slide
- Keep animation groups together (all `++` items in a sequence stay on the same slide)
- References stay on the slide where they're cited

## Rendering

Save the validated JSON to a temp file, then run:

```bash
# Step 1: Render slides (also writes output.animation.json manifest)
node ${CLAUDE_PLUGIN_ROOT}/skills/bullet-to-slides/references/slide-renderer.js input.json output.pptx

# Step 2: Inject click-to-appear animations for ++ bullets
node ${CLAUDE_PLUGIN_ROOT}/skills/bullet-to-slides/references/animation-injector.js output.pptx output.animation.json
```

Ensure pptxgenjs is installed before rendering:
```bash
cd ${CLAUDE_PLUGIN_ROOT} && npm ls pptxgenjs 2>/dev/null || npm install pptxgenjs
```

Read `references/branding.md` for the full visual specification.

## QA Process

After rendering:

1. Convert .pptx to images (if LibreOffice or pdftoppm available):
   ```bash
   libreoffice --headless --convert-to pdf output.pptx
   pdftoppm -png output.pdf slide
   ```
2. Inspect each slide image for:
   - Text overflow or truncation
   - Misaligned elements
   - Missing images
   - Font rendering issues
3. If issues found: adjust the JSON and re-render
4. If tools not available: inform the user to check the .pptx manually

## Help Text

When the user runs `/slides help`, print the contents of `references/notation-reference.md`.
When they run `/slides help notation`, print the Slide Types and Inline Content sections.
When they run `/slides help config`, print the Config and Title Slide Children sections.
When they run `/slides help slides`, print a brief description of each slide type with an example.

## Known Limitations

- **Animations**: Bullets marked with `++` get click-to-appear animations via post-processing (animation-injector.js). A `++` bullet and its children appear together on one click. Multiple `++` bullets each get their own click in sequence.
- **Nested inline markdown**: Overlapping formatting like `**bold *italic***` is not supported. Keep formatting simple and non-overlapping.
- **Inter font**: The renderer uses Inter. If Inter is not installed on the machine opening the .pptx, PowerPoint will substitute Calibri automatically.

## Workflow Summary

1. Read input (text or file path)
2. Parse bullets → JSON (following rules above)
3. Validate JSON (overflow, references, images)
4. Report any issues to user, auto-split if needed
5. Save JSON to temp file
6. Run `slide-renderer.js input.json output.pptx` (also writes animation manifest)
7. Run `animation-injector.js output.pptx output.animation.json` (injects click-to-appear for `++` bullets)
8. QA: convert to images and inspect (if tools available)
9. Save final .pptx to workspace
