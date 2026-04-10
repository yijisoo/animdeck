# JSON Intermediate Schema

The contract between Claude's parser and the deterministic renderer.

## SlideDeck (top level)

```json
{
  "title": "string",
  "config": {
    "logo": "evolvingselves" | "string" | {"image": "path"} | null,
    "author": "string" | null,
    "affiliation": "string" | null,
    "date": "string" | null
  },
  "slides": [Slide, ...]
}
```

## Slide Types

### title
```json
{
  "type": "title",
  "title": "string",
  "subtitle": "string" | null
}
```

### section
```json
{
  "type": "section",
  "title": "string",
  "number": integer
}
```
Section numbers are auto-incremented (1, 2, 3...).

### content
```json
{
  "type": "content",
  "title": "string",
  "body": [BodyItem, ...],
  "references": [Reference, ...],
  "continuation": {"part": integer, "of": integer} | null
}
```

### comparison
```json
{
  "type": "comparison",
  "title": "string",
  "left": {"label": "string", "items": [BodyItem, ...]},
  "right": {"label": "string", "items": [BodyItem, ...]}
}
```

### split
```json
{
  "type": "split",
  "title": "string",
  "left": {"label": "string", "items": [BodyItem, ...]},
  "right": {"label": "string", "items": [BodyItem, ...]}
}
```

### image
```json
{
  "type": "image",
  "title": "string",
  "src": "path-or-url",
  "caption": "string" | null
}
```

## Body Item Types

### bullet
```json
{
  "kind": "bullet",
  "text": "string (supports **bold**, *italic*, `code`)",
  "animate": boolean,
  "refs": [integer, ...] | null,
  "children": [bullet, ...]
}
```

### quote
```json
{
  "kind": "quote",
  "text": "string",
  "attribution": "string" | null
}
```

### code
```json
{
  "kind": "code",
  "language": "string" | null,
  "lines": ["string", ...]
}
```

### image
```json
{
  "kind": "image",
  "src": "path-or-url",
  "caption": "string" | null
}
```

## Reference
```json
{
  "id": integer,
  "text": "string",
  "isUrl": boolean
}
```

## Overflow Continuation

When auto-split, the continuation field is set:
```json
{"part": 1, "of": 2}
```
Title becomes: "Original Title (1/2)".
