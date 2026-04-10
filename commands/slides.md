---
description: Convert bullet-listed notes into a branded PowerPoint presentation
allowed-tools: Read, Write, Edit, Bash(node:*), Bash(npm:*), Bash(ls:*), Bash(mkdir:*), Bash(cp:*), Bash(mv:*), Bash(libreoffice:*), Bash(pdftoppm:*), Task, Glob, Grep
argument-hint: [bullet-list-text-or-file-path] or "help"
---

Convert bullet-listed notes into a polished, evolvingselves-branded PowerPoint presentation.

## Modes

### Help Mode

If $ARGUMENTS starts with "help", print the notation reference:

- `help` → read and print `${CLAUDE_PLUGIN_ROOT}/skills/bullet-to-slides/references/notation-reference.md`
- `help notation` → print Slide Types and Inline Content sections only
- `help config` → print Config and Title Slide Children sections only
- `help slides` → print a brief description of each of the 6 slide types

Do NOT read the full skill. Just print the relevant section from notation-reference.md.

### Generate Mode

If $ARGUMENTS is not "help":

1. Read the `bullet-to-slides` skill definition for parsing rules
2. If $ARGUMENTS looks like a file path, read the file. Otherwise use $ARGUMENTS as bullet text.
3. Parse bullets → JSON following the skill's parsing rules
4. Validate: check overflow, references, image paths
5. If issues found, report to user and iterate
6. Write JSON to a temp file
7. Ensure pptxgenjs is installed: `cd ${CLAUDE_PLUGIN_ROOT} && npm ls pptxgenjs 2>/dev/null || npm install pptxgenjs`
8. Render: `node ${CLAUDE_PLUGIN_ROOT}/skills/bullet-to-slides/references/slide-renderer.js <json> <output.pptx>`
9. QA: convert to images and inspect if tools available
10. Report the output file path to the user
