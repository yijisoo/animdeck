# Slide Notation Reference

## Slide Types (first-level bullets)

```
* # Title                → Title slide (dark)
* ## Section             → Section divider (dark)
* Slide Title            → Content slide (light)
* ![] Title              → Image slide
* |split| Title          → Two-column slide
* |vs| Title             → Comparison slide
```

## Inline Content (child bullets, usable in any slide)

```
* Regular bullet         → Normal text
* ++ Animated bullet     → Appear on click
  * Sub-bullet           → Indented child
* **bold** *italic*      → Markdown formatting
* `code`                 → Inline code
* > "Quote" — Author     → Styled quote block
* ```python ... ```      → Code block
* ![caption](path/url)   → Image
* [1] reference text     → Footer reference (URL → hyperlink)
```

## Config (on title slide)

```
* # Title                           → No logo
* # Title {logo: evolvingselves}    → Gradient wordmark
* # Title {logo: KAIST}             → Plain text logo
* # Title {logo: ![](path)}         → Image logo
```

## Title Slide Children (positional)

```
* # Title {logo: evolvingselves}
  * Subtitle               ← 1st child = subtitle
  * Author Name             ← 2nd child = author
  * Affiliation             ← 3rd child = affiliation
  * Date                    ← 4th child = date
```

All optional. 1 child = subtitle only. 2 = subtitle + author. Etc.

## Special Notations

```
* ---                     → Column separator (inside |split| or |vs|)
* [N] url-or-text         → Reference (URL auto-hyperlinked)
* ++ at any depth         → Appear-on-click animation
```

## Overflow

Slides auto-split when they have too much content:
- Content: > 6 body items → "Title (1/2)", "Title (2/2)"
- Comparison/split: > 5 items per column
- Code: > 12 lines → split or reduce font
