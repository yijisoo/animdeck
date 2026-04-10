# pptx-slides

A Claude Code plugin that converts bullet-list markdown into polished PowerPoint presentations with evolvingselves branding.

## Usage

- `/slides [bullets or file path]` — Generate a presentation
- `/slides help` — Show notation reference

## Architecture

Two-phase pipeline:
1. Claude parses bullet notation → JSON intermediate schema
2. Deterministic Node.js renderer converts JSON → .pptx (PptxGenJS)

## Dependencies

- Node.js (runtime)
- pptxgenjs (npm package — installed on first run)
