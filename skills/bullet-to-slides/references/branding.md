# Default Theme Specification

All colors are 6-character hex (no `#` prefix) for PptxGenJS compatibility.

## Color Palette

### Backgrounds
| Name | Hex | Usage |
|------|-----|-------|
| Dark | `050505` | Title and section slide backgrounds |
| Light | `FFFFFF` | Content slide backgrounds |

### Text Colors
| Name | Hex | Usage |
|------|-----|-------|
| Primary on Dark | `FFFFFF` | Titles on dark slides |
| Primary on Light | `111111` | Titles on light slides |
| Body | `333333` | Body text on light slides |
| Secondary | `666666` | Sub-bullets on light slides |
| Muted | `AAAAAA` | References, slide numbers, captions |

### Accent Colors
| Name | Hex | Usage |
|------|-----|-------|
| Teal | `00E5FF` | Primary accent — bars, code highlights, left column labels |
| Teal Deep | `2979FF` | Gradient endpoint for teal |
| Warm | `FF9E80` | Secondary accent — section slides, quote borders, right column labels |
| Warm Deep | `FF6E40` | Gradient endpoint for warm |

### Structural Colors
| Name | Hex | Usage |
|------|-----|-------|
| Border | `E5E5E5` | Dividers, column separators on light slides |
| Code BG | `1A1A1A` | Code block background |
| Bullet Dot | `CCCCCC` | Primary bullet dots |
| Sub Dot | `DDDDDD` | Sub-bullet dots |

## Typography

Single font family: Inter (all weights from one family).
Fallback: Calibri (available on all PowerPoint installations).

| Element | Font | Size (pt) | Weight | Color (hex) |
|---------|------|-----------|--------|-------------|
| Title (dark bg) | Inter | 34 | Bold | `FFFFFF` |
| Section title | Inter | 32 | Bold | `FFFFFF` |
| Content title | Inter | 22 | Bold | `111111` |
| Subtitle | Inter | 15 | Light (300) | `A0A0A0` |
| Body bullet | Inter | 13 | Regular | `333333` |
| Sub-bullet | Inter | 12 | Regular | `666666` |
| Bold text | Inter | inherit | SemiBold (600) | `111111` |
| Code (inline) | Courier New | 11 | Regular | `0097A7` |
| Code (block text) | Courier New | 11 | Regular | `E0E0E0` |
| Reference footer | Inter | 8 | Light (300) | `AAAAAA` |
| Slide number | Inter | 9 | Light (300) | `BBBBBB` |
| Column label (teal) | Inter | 13 | SemiBold (600) | `0097A7` |
| Column label (warm) | Inter | 13 | SemiBold (600) | `E65100` |

Note: PptxGenJS does not support Inter by default. The font must be installed on
the system where the .pptx is opened. Courier New is used for code instead of
SF Mono/Fira Code because Courier New is universally available in PowerPoint.

## Slide Layouts (16:9 = 10" x 5.625")

### Title Slide
- Background: `050505`
- Title: Inter 34pt bold, `FFFFFF`, centered, y=1.8
- Teal gradient accent line: 0.8" wide, 0.02" tall, centered below title
- Subtitle: Inter 15pt, `A0A0A0`, centered, y=3.0
- Logo: bottom-left (x=0.4, y=5.1) — see Logo Variants
- Footer: author + affiliation + date, Inter 10pt, `555555`, bottom-right (x=7.5, y=5.1)

### Section Divider
- Background: `050505`
- Warm gradient accent line: 0.5" wide, 0.02" tall, centered above title
- Section title: Inter 32pt bold, `FFFFFF`, centered, y=2.5
- Section number: Inter 13pt, `555555`, centered below title, letter-spacing 2px

### Content Slide
- Background: `FFFFFF`
- Teal gradient vertical accent bar: 0.03" wide, 0.24" tall, x=0.38, y=0.32
- Title: Inter 22pt bold, `111111`, x=0.56, y=0.28
- Body area: starts y=1.0, x=0.56, width=8.88"
- Bullet dot: 5pt round, `CCCCCC`, before each bullet
- Sub-bullet dot: 4pt round, `DDDDDD`, indented 0.24"
- Reference footer: Inter 8pt, `AAAAAA`, bottom, x=0.56, thin border-top `E5E5E5`
- Slide number: Inter 9pt, `BBBBBB`, bottom-right

### Comparison Slide
- Same header as content slide (accent bar, title, position)
- Two equal columns separated by 1px `E5E5E5` vertical line
- Left column label: Inter 13pt SemiBold, `0097A7`, sentence case
- Right column label: Inter 13pt SemiBold, `E65100`, sentence case
- "vs" badge: circle on column border, white bg, border `E5E5E5`, teal text

### Split Slide
- Same as comparison without the "vs" badge

### Image Slide
- Same header as content slide
- Large image area: x=0.56, y=1.0, w=8.88", rounded corners
- Caption: Inter 10pt, `999999`, centered below image

## Logo Variants

| Config | Rendering |
|--------|-----------|
| `null` | No logo |
| `"text string"` | Plain text, Inter 11pt SemiBold, `777777` |
| `{"image": "path"}` | Image file, max height 0.3" |

## Design Principles

1. Single font family — Inter everywhere, hierarchy through weight and size
2. Teal for primary accent, warm for secondary — never mixed in the same element
3. Dark backgrounds only on title and section slides — print-friendly
4. Consistent positioning — accent bar, title, body at same coordinates on all light slides
5. Sentence case everywhere — no all-caps labels
6. Code blocks stay dark on light slides for contrast
