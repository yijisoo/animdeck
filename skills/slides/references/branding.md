# Default Theme Specification

All colors are 6-character hex (no `#` prefix) for PptxGenJS compatibility.

## Color Palette

### Backgrounds
| Name | Hex | Usage |
|------|-----|-------|
| Dark | `0F172A` | Title and section slide backgrounds (Slate 900 — deep navy) |
| Light | `FAFAFA` | Content slide backgrounds (off-white) |

### Text Colors
| Name | Hex | Usage |
|------|-----|-------|
| Primary on Dark | `F8FAFC` | Titles on dark slides (Slate 50) |
| Primary on Light | `111827` | Titles on light slides (Gray 900) |
| Body | `374151` | Body text on light slides (Gray 700) |
| Secondary | `6B7280` | Quote attribution text (Gray 500) |
| Muted | `9CA3AF` | References, slide numbers, captions (Gray 400) |

### Accent Colors
| Name | Hex | Usage |
|------|-----|-------|
| Indigo | `818CF8` | Primary accent — bars, code highlights, left column labels (Indigo 400) |
| Indigo Deep | `6366F1` | Gradient endpoint, vs-badge text, column labels (Indigo 500) |
| Warm | `FB923C` | Secondary accent — section slides, quote borders, right column labels (Orange 400) |
| Warm Deep | `F97316` | Gradient endpoint for warm (Orange 500) |

### Structural Colors
| Name | Hex | Usage |
|------|-----|-------|
| Border | `E2E8F0` | Dividers, column separators on light slides (Slate 200) |
| Code BG | `1E293B` | Code block background (Slate 800) |
| Bullet Dot | `CBD5E1` | All bullet dots (top-level and sub-bullets) (Slate 300) |

## Typography

Single font family: Inter (all weights from one family).
Fallback: Calibri (available on all PowerPoint installations).

| Element | Font | Size (pt) | Weight | Color (hex) |
|---------|------|-----------|--------|-------------|
| Title (dark bg) | Inter | 34 | Bold | `F8FAFC` |
| Section title | Inter | 32 | Bold | `F8FAFC` |
| Content title | Inter | 22 | Bold | `111827` |
| Subtitle | Inter | 15 | Light (300) | `94A3B8` |
| Body bullet | Inter | 13 | Regular | `374151` |
| Sub-bullet | Inter | 13 | Regular | `374151` (same as top-level — only indent differs) |
| Bold text | Inter | inherit | SemiBold (600) | `111827` |
| Code (inline) | Courier New | 11 | Regular | `818CF8` |
| Code (block text) | Courier New | 11 | Regular | `E2E8F0` |
| Reference footer | Inter | 8 | Light (300) | `9CA3AF` |
| Slide number | Inter | 9 | Light (300) | `9CA3AF` |
| Column label (indigo) | Inter | 13 | SemiBold (600) | `6366F1` |
| Column label (warm) | Inter | 13 | SemiBold (600) | `EA580C` |

Note: PptxGenJS does not support Inter by default. The font must be installed on
the system where the .pptx is opened. Courier New is used for code instead of
SF Mono/Fira Code because Courier New is universally available in PowerPoint.

## Slide Layouts (16:9 = 10" x 5.625")

### Title Slide
- Background: `0F172A`
- Title: Inter 34pt bold, `F8FAFC`, centered, y=1.8
- Indigo gradient accent line: 0.8" wide, 0.02" tall, centered below title
- Subtitle: Inter 15pt, `94A3B8`, centered, y=3.0
- Logo: bottom-left (x=0.4, y=5.1) — see Logo Variants
- Footer: author + affiliation + date, Inter 10pt, `6B7280`, bottom-right (x=7.5, y=5.1)

### Section Divider
- Background: `0F172A`
- Warm gradient accent line: 0.5" wide, 0.02" tall, centered above title
- Section title: Inter 32pt bold, `F8FAFC`, centered, y=2.5
- Section number: Inter 13pt, `6B7280`, centered below title, letter-spacing 2px

### Content Slide
- Background: `FAFAFA`
- Indigo gradient vertical accent bar: 0.03" wide, 0.24" tall, x=0.38, y=0.32
- Title: Inter 22pt bold, `111827`, x=0.56, y=0.28
- Body area: starts y=1.0, x=0.56, width=8.88"
- Bullet dot: 5pt round, `CBD5E1`, before each bullet
- Sub-bullet dot: 5pt round, `CBD5E1` (same as top-level — only indent differs)
- Reference footer: Inter 8pt, `9CA3AF`, bottom, x=0.56, thin border-top `E2E8F0`
- Slide number: Inter 9pt, `9CA3AF`, bottom-right

### Comparison Slide
- Same header as content slide (accent bar, title, position)
- Two equal columns separated by 1px `E2E8F0` vertical line
- Left column label: Inter 13pt SemiBold, `6366F1`, sentence case
- Right column label: Inter 13pt SemiBold, `EA580C`, sentence case
- "vs" badge: circle on column border, white bg, border `E2E8F0`, indigo text

### Split Slide
- Same as comparison without the "vs" badge

### Image Slide
- Same header as content slide
- Large image area: x=0.56, y=1.0, w=8.88", rounded corners
- Caption: Inter 10pt, `94A3B8`, centered below image

## Logo Variants

| Config | Rendering |
|--------|-----------|
| `null` | No logo |
| `"text string"` | Plain text, Inter 11pt SemiBold, `94A3B8` |
| `{"image": "path"}` | Image file, max height 0.3" |

## Design Principles

1. Single font family — Inter everywhere, hierarchy through weight and size
2. Indigo for primary accent, warm orange for secondary — never mixed in the same element
3. Dark backgrounds only on title and section slides — print-friendly
4. Consistent positioning — accent bar, title, body at same coordinates on all light slides
5. Sentence case everywhere — no all-caps labels
6. Code blocks stay dark (Slate 800) on light slides for contrast
