'use strict';

/**
 * slide-renderer.js — deterministic PPTX renderer for SlideDeck JSON
 *
 * Usage: node slide-renderer.js input.json output.pptx
 *
 * Handles slide types: title, section, content, comparison, split, image
 * Branding: evolvingselves (see branding.md)
 * PptxGenJS v4.x API
 *
 * NOTE ON ANIMATIONS: PptxGenJS v4 does not expose a public addAnimation()
 * method on slides. The animate:true flag on bullets is recorded as a comment
 * in the file but is not rendered as a click-to-appear animation. A future
 * implementation could manipulate the raw XML via a post-processing step.
 */

const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');

// ---------------------------------------------------------------------------
// Brand constants (from branding.md)
// ---------------------------------------------------------------------------
const C = {
  // Backgrounds
  DARK_BG:         '050505',
  LIGHT_BG:        'FFFFFF',

  // Text
  TEXT_ON_DARK:    'FFFFFF',
  TEXT_ON_LIGHT:   '111111',
  BODY:            '333333',
  SECONDARY:       '666666',
  MUTED:           'AAAAAA',
  SLIDE_NUM:       'BBBBBB',
  FOOTER:          '555555',
  SUBTITLE:        'A0A0A0',

  // Accents
  TEAL:            '00E5FF',
  TEAL_DEEP:       '2979FF',
  WARM:            'FF9E80',
  WARM_DEEP:       'FF6E40',
  TEAL_LABEL:      '0097A7',
  WARM_LABEL:      'E65100',

  // Structural
  BORDER:          'E5E5E5',
  CODE_BG:         '1A1A1A',
  BULLET_DOT:      'CCCCCC',
  SUB_DOT:         'DDDDDD',
  LOGO_GRAY:       '777777',
  VS_TEXT:         '0097A7',
  CAPTION:         '999999',

  // Code text
  CODE_TEXT:       'E0E0E0',
  CODE_INLINE:     '0097A7',
};

// Slide dimensions
const W = 10;       // inches
const H = 5.625;    // inches

// Typography
const FONT_BODY = 'Inter';
const FONT_CODE = 'Courier New';

// ---------------------------------------------------------------------------
// Inline markdown parser
// Parses **bold**, *italic*, `code` into PptxGenJS text run arrays.
// ---------------------------------------------------------------------------
function parseInline(text, baseColor, baseFontSize) {
  const runs = [];
  // Use a proper split approach
  const segments = [];
  let lastIndex = 0;
  // Note: nested/overlapping formatting (e.g., **bold *italic***) is not supported
  const fullRe = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
  let match;
  while ((match = fullRe.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'plain', text: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      segments.push({ type: 'bold', text: match[1] });
    } else if (match[2] !== undefined) {
      segments.push({ type: 'italic', text: match[2] });
    } else if (match[3] !== undefined) {
      segments.push({ type: 'code', text: match[3] });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'plain', text: text.slice(lastIndex) });
  }

  for (const seg of segments) {
    if (!seg.text) continue;
    if (seg.type === 'bold') {
      runs.push({ text: seg.text, options: { bold: true, color: C.TEXT_ON_LIGHT, fontFace: FONT_BODY, fontSize: baseFontSize } }); // Hardcoded to light-bg color — only used on light slides
    } else if (seg.type === 'italic') {
      runs.push({ text: seg.text, options: { italic: true, color: baseColor, fontFace: FONT_BODY, fontSize: baseFontSize } });
    } else if (seg.type === 'code') {
      runs.push({ text: seg.text, options: { fontFace: FONT_CODE, fontSize: 11, color: C.CODE_INLINE } });
    } else {
      runs.push({ text: seg.text, options: { color: baseColor, fontFace: FONT_BODY, fontSize: baseFontSize } });
    }
  }

  if (runs.length === 0) {
    runs.push({ text: text, options: { color: baseColor, fontFace: FONT_BODY, fontSize: baseFontSize } });
  }
  return runs;
}

// ---------------------------------------------------------------------------
// Logo renderer
// ---------------------------------------------------------------------------
function addLogo(slide, logo, x, y) {
  if (!logo) return;

  if (logo === 'evolvingselves') {
    // "evolving" in teal, "selves" in warm, Inter 11pt SemiBold
    slide.addText([
      { text: 'evolving', options: { color: C.TEAL,       fontFace: FONT_BODY, fontSize: 11, bold: true } },
      { text: 'selves',   options: { color: C.WARM,       fontFace: FONT_BODY, fontSize: 11, bold: true } },
    ], { x, y, w: 1.8, h: 0.25, valign: 'middle' });

  } else if (typeof logo === 'string') {
    // Plain text logo
    slide.addText(logo, {
      x, y, w: 2.5, h: 0.25,
      fontFace: FONT_BODY, fontSize: 11, bold: true,
      color: C.LOGO_GRAY, valign: 'middle',
    });

  } else if (logo && typeof logo === 'object' && logo.image) {
    // Image logo
    const imgOpts = { x, y, h: 0.3, sizing: { type: 'contain', h: 0.3 } };
    if (fs.existsSync(logo.image)) {
      slide.addImage({ path: logo.image, ...imgOpts });
    } else {
      // Fallback to text if image not found
      slide.addText('[logo]', {
        x, y, w: 1.5, h: 0.25,
        fontFace: FONT_BODY, fontSize: 11,
        color: C.MUTED,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Shared header for content/comparison/split/image slides
// Teal accent bar + title text
// ---------------------------------------------------------------------------
function addContentHeader(slide, title) {
  // Teal vertical accent bar: 0.03" wide, 0.24" tall, x=0.38, y=0.32
  slide.addShape('rect', {
    x: 0.38, y: 0.32, w: 0.03, h: 0.24,
    fill: { color: C.TEAL },
    line: { type: 'none' },
  });

  // Title: Inter 22pt bold, #111111, x=0.56, y=0.28
  slide.addText(title, {
    x: 0.56, y: 0.28, w: 9.0, h: 0.45,
    fontFace: FONT_BODY, fontSize: 22, bold: true,
    color: C.TEXT_ON_LIGHT, valign: 'middle',
  });
}

// ---------------------------------------------------------------------------
// Slide number (bottom-right)
// ---------------------------------------------------------------------------
function addSlideNumber(slide, num) {
  slide.addText(String(num), {
    x: 9.3, y: 5.3, w: 0.5, h: 0.2,
    fontFace: FONT_BODY, fontSize: 9,
    color: C.SLIDE_NUM, align: 'right', valign: 'middle',
  });
}

// ---------------------------------------------------------------------------
// References footer
// ---------------------------------------------------------------------------
function addReferencesFooter(slide, references) {
  if (!references || references.length === 0) return;

  // Thin separator line
  slide.addShape('rect', {
    x: 0.56, y: 5.05, w: 8.88, h: 0.01,
    fill: { color: C.BORDER },
    line: { type: 'none' },
  });

  // Build reference text runs
  const runs = [];
  for (let i = 0; i < references.length; i++) {
    const ref = references[i];
    if (i > 0) runs.push({ text: '  ', options: { fontSize: 8 } });
    runs.push({ text: `[${ref.id}] `, options: { fontFace: FONT_BODY, fontSize: 8, color: C.MUTED } });
    if (ref.isUrl) {
      runs.push({ text: ref.text, options: { fontFace: FONT_BODY, fontSize: 8, color: C.TEAL_LABEL, hyperlink: { url: ref.text } } });
    } else {
      runs.push({ text: ref.text, options: { fontFace: FONT_BODY, fontSize: 8, color: C.MUTED } });
    }
  }

  slide.addText(runs, {
    x: 0.56, y: 5.08, w: 8.88, h: 0.22,
    valign: 'top', wrap: true,
  });
}

// ---------------------------------------------------------------------------
// Body item renderer
// Returns the new y position after rendering items.
// ---------------------------------------------------------------------------
function renderBodyItems(slide, items, startY, xOffset, maxW, depth) {
  if (!items || items.length === 0) return startY;
  depth = depth || 0;

  let y = startY;
  const indent = depth * 0.24;
  const itemX = xOffset + indent;
  const itemW = maxW - indent;

  for (const item of items) {
    if (!item) continue;

    if (item.kind === 'bullet') {
      y = renderBullet(slide, item, y, itemX, itemW, depth);
    } else if (item.kind === 'quote') {
      y = renderQuote(slide, item, y, itemX, itemW);
    } else if (item.kind === 'code') {
      y = renderCodeBlock(slide, item, y, itemX, itemW);
    } else if (item.kind === 'image') {
      y = renderBodyImage(slide, item, y, itemX, itemW);
    }
  }

  return y;
}

function renderBullet(slide, item, y, x, w, depth) {
  const isSubBullet = depth > 0;
  const dotColor = isSubBullet ? C.SUB_DOT : C.BULLET_DOT;
  const textColor = isSubBullet ? C.SECONDARY : C.BODY;
  const fontSize = isSubBullet ? 12 : 13;
  const lineH = isSubBullet ? 0.22 : 0.25;

  // Bullet dot (small circle)
  const dotR = isSubBullet ? 0.035 : 0.04;
  slide.addShape('ellipse', {
    x: x + 0.02,
    y: y + lineH / 2 - dotR,
    w: dotR * 2,
    h: dotR * 2,
    fill: { color: dotColor },
    line: { type: 'none' },
  });

  // Bullet text (with inline markdown)
  const textX = x + 0.18;
  const textW = w - 0.18;
  const runs = parseInline(item.text || '', textColor, fontSize);

  // Append ref markers if present
  if (item.refs && item.refs.length > 0) {
    runs.push({ text: ' ' + item.refs.map(r => `[${r}]`).join(''), options: { fontSize: 8, color: C.MUTED, fontFace: FONT_BODY } });
  }

  // Note: animate:true is not implemented (PptxGenJS v4 has no public animation API)
  slide.addText(runs, {
    x: textX, y, w: textW, h: lineH,
    fontFace: FONT_BODY, fontSize,
    valign: 'middle', wrap: true,
  });

  y += lineH;

  // Render children recursively
  if (item.children && item.children.length > 0) {
    y = renderBodyItems(slide, item.children, y, x + 0.24, w - 0.24, depth + 1);
  }

  return y;
}

function renderQuote(slide, item, y, x, w) {
  const lineH = 0.05;
  const quoteH = 0.35;
  const totalH = quoteH + (item.attribution ? 0.2 : 0);

  // Warm left border
  slide.addShape('rect', {
    x: x, y: y + 0.02, w: 0.03, h: quoteH,
    fill: { color: C.WARM },
    line: { type: 'none' },
  });

  // Quote text (italic)
  slide.addText(`"${item.text}"`, {
    x: x + 0.12, y, w: w - 0.12, h: quoteH,
    fontFace: FONT_BODY, fontSize: 13, italic: true,
    color: C.BODY, valign: 'middle', wrap: true,
  });

  y += quoteH;

  // Attribution
  if (item.attribution) {
    slide.addText(`— ${item.attribution}`, {
      x: x + 0.12, y, w: w - 0.12, h: 0.2,
      fontFace: FONT_BODY, fontSize: 11,
      color: C.SECONDARY, valign: 'middle',
    });
    y += 0.2;
  }

  y += lineH;
  return y;
}

function renderCodeBlock(slide, item, y, x, w) {
  const lineCount = item.lines ? item.lines.length : 1;
  const lineHeight = 0.19;
  const paddingV = 0.12;
  const blockH = lineCount * lineHeight + paddingV * 2;

  // Dark rounded background
  slide.addShape('roundRect', {
    x, y, w, h: blockH,
    rectRadius: 0.05,
    fill: { color: C.CODE_BG },
    line: { type: 'none' },
  });

  // Code lines
  const codeText = (item.lines || []).join('\n');
  slide.addText(codeText, {
    x: x + 0.12, y: y + paddingV, w: w - 0.24, h: blockH - paddingV * 2,
    fontFace: FONT_CODE, fontSize: 11,
    color: C.CODE_TEXT, valign: 'top', wrap: false,
  });

  y += blockH + 0.08;
  return y;
}

function renderBodyImage(slide, item, y, x, w) {
  const imgH = 1.5;
  const imgOpts = { x, y, w, h: imgH };

  if (item.src && fs.existsSync(item.src)) {
    slide.addImage({ path: item.src, ...imgOpts, sizing: { type: 'contain', w, h: imgH } });
  } else {
    // Placeholder rectangle
    slide.addShape('rect', {
      x, y, w, h: imgH,
      fill: { color: 'F0F0F0' },
      line: { color: C.BORDER, pt: 1 },
    });
    slide.addText(item.src ? `[Image: ${item.src}]` : '[Image]', {
      x, y, w, h: imgH,
      fontFace: FONT_BODY, fontSize: 11, color: C.MUTED,
      align: 'center', valign: 'middle',
    });
  }

  y += imgH;

  if (item.caption) {
    y += 0.05;
    slide.addText(item.caption, {
      x, y, w, h: 0.2,
      fontFace: FONT_BODY, fontSize: 10, color: C.MUTED,
      align: 'center',
    });
    y += 0.2;
  }

  y += 0.08;
  return y;
}

// ---------------------------------------------------------------------------
// Slide type renderers
// ---------------------------------------------------------------------------

function renderTitleSlide(pres, slideData, config, slideNum) {
  const slide = pres.addSlide();
  slide.background = { color: C.DARK_BG };

  // Title
  slide.addText(slideData.title || '', {
    x: 0, y: 1.8, w: W, h: 0.7,
    fontFace: FONT_BODY, fontSize: 34, bold: true,
    color: C.TEXT_ON_DARK, align: 'center', valign: 'middle',
  });

  // Teal accent line: 0.8" wide, 0.02" tall, centered below title
  slide.addShape('rect', {
    x: (W - 0.8) / 2, y: 2.6, w: 0.8, h: 0.02,
    fill: { color: C.TEAL },
    line: { type: 'none' },
  });

  // Subtitle
  if (slideData.subtitle) {
    slide.addText(slideData.subtitle, {
      x: 0.5, y: 3.0, w: W - 1, h: 0.45,
      fontFace: FONT_BODY, fontSize: 15,
      color: C.SUBTITLE, align: 'center', valign: 'middle',
    });
  }

  // Logo: bottom-left x=0.4, y=5.1
  addLogo(slide, config.logo, 0.4, 5.1);

  // Footer: author + affiliation + date, bottom-right x=7.5, y=5.1
  const footerParts = [config.author, config.affiliation, config.date].filter(Boolean);
  if (footerParts.length > 0) {
    slide.addText(footerParts.join('  ·  '), {
      x: 4.5, y: 5.1, w: 5.3, h: 0.3,
      fontFace: FONT_BODY, fontSize: 10,
      color: C.FOOTER, align: 'right', valign: 'middle',
    });
  }
}

function renderSectionSlide(pres, slideData, config, slideNum) {
  const slide = pres.addSlide();
  slide.background = { color: C.DARK_BG };

  // Warm accent line: 0.5" wide, 0.02" tall, centered above title
  slide.addShape('rect', {
    x: (W - 0.5) / 2, y: 2.1, w: 0.5, h: 0.02,
    fill: { color: C.WARM },
    line: { type: 'none' },
  });

  // Section title: Inter 32pt bold, centered, y=2.5
  slide.addText(slideData.title || '', {
    x: 0.5, y: 2.3, w: W - 1, h: 0.65,
    fontFace: FONT_BODY, fontSize: 32, bold: true,
    color: C.TEXT_ON_DARK, align: 'center', valign: 'middle',
  });

  // Section number: zero-padded, centered below title
  if (slideData.number !== undefined) {
    const numStr = String(slideData.number).padStart(2, '0');
    slide.addText(numStr, {
      x: 0, y: 3.1, w: W, h: 0.35,
      fontFace: FONT_BODY, fontSize: 13,
      color: C.FOOTER, align: 'center', valign: 'middle',
      charSpacing: 2,
    });
  }
}

function renderContentSlide(pres, slideData, config, slideNum) {
  const slide = pres.addSlide();
  slide.background = { color: C.LIGHT_BG };

  // Build title with continuation suffix
  let title = slideData.title || '';
  if (slideData.continuation) {
    title += ` (${slideData.continuation.part}/${slideData.continuation.of})`;
  }

  addContentHeader(slide, title);
  addSlideNumber(slide, slideNum);

  // Body area: starts y=1.0, x=0.56, width=8.88"
  const bodyX = 0.56;
  const bodyY = 1.0;
  const bodyW = 8.88;

  renderBodyItems(slide, slideData.body, bodyY, bodyX, bodyW, 0);

  addReferencesFooter(slide, slideData.references);
}

// ---------------------------------------------------------------------------
// Shared two-column layout helper (used by comparison and split slides)
// ---------------------------------------------------------------------------
function renderTwoColumnSlide(slide, slideData, slideNum, { showVsBadge }) {
  // Two equal columns
  const colY = 1.0;
  const colH = 4.3;
  const colW = 4.3;
  const leftX = 0.38;
  const rightX = 5.32;
  const centerX = leftX + colW;  // column border x

  // Column borders (outer rectangles with border)
  slide.addShape('rect', {
    x: leftX, y: colY, w: colW, h: colH,
    fill: { type: 'none' },
    line: { color: C.BORDER, pt: 1 },
  });
  slide.addShape('rect', {
    x: rightX, y: colY, w: colW, h: colH,
    fill: { type: 'none' },
    line: { color: C.BORDER, pt: 1 },
  });

  // Left label: Inter 13pt SemiBold, teal, sentence case
  const leftLabel = slideData.left ? slideData.left.label || '' : '';
  slide.addText(leftLabel, {
    x: leftX + 0.12, y: colY + 0.1, w: colW - 0.24, h: 0.3,
    fontFace: FONT_BODY, fontSize: 13, bold: true,
    color: C.TEAL_LABEL, valign: 'middle',
  });

  // Right label: Inter 13pt SemiBold, warm
  const rightLabel = slideData.right ? slideData.right.label || '' : '';
  slide.addText(rightLabel, {
    x: rightX + 0.12, y: colY + 0.1, w: colW - 0.24, h: 0.3,
    fontFace: FONT_BODY, fontSize: 13, bold: true,
    color: C.WARM_LABEL, valign: 'middle',
  });

  // Optional "vs" badge: circle on column border
  if (showVsBadge) {
    const badgeR = 0.18;
    const badgeCX = centerX;
    const badgeCY = colY + colH / 2;
    slide.addShape('ellipse', {
      x: badgeCX - badgeR, y: badgeCY - badgeR,
      w: badgeR * 2, h: badgeR * 2,
      fill: { color: C.LIGHT_BG },
      line: { color: C.BORDER, pt: 1 },
    });
    slide.addText('vs', {
      x: badgeCX - badgeR, y: badgeCY - badgeR,
      w: badgeR * 2, h: badgeR * 2,
      fontFace: FONT_BODY, fontSize: 9, bold: true,
      color: C.VS_TEXT, align: 'center', valign: 'middle',
    });
  }

  // Column body content
  const itemY = colY + 0.5;
  const itemPadX = 0.12;
  const itemW = colW - itemPadX * 2;

  if (slideData.left && slideData.left.items) {
    renderBodyItems(slide, slideData.left.items, itemY, leftX + itemPadX, itemW, 0);
  }
  if (slideData.right && slideData.right.items) {
    renderBodyItems(slide, slideData.right.items, itemY, rightX + itemPadX, itemW, 0);
  }
}

function renderComparisonSlide(pres, slideData, config, slideNum) {
  const slide = pres.addSlide();
  slide.background = { color: C.LIGHT_BG };

  addContentHeader(slide, slideData.title || '');
  addSlideNumber(slide, slideNum);

  renderTwoColumnSlide(slide, slideData, slideNum, { showVsBadge: true });
}

function renderSplitSlide(pres, slideData, config, slideNum) {
  const slide = pres.addSlide();
  slide.background = { color: C.LIGHT_BG };

  addContentHeader(slide, slideData.title || '');
  addSlideNumber(slide, slideNum);

  renderTwoColumnSlide(slide, slideData, slideNum, { showVsBadge: false });
}

function renderImageSlide(pres, slideData, config, slideNum) {
  const slide = pres.addSlide();
  slide.background = { color: C.LIGHT_BG };

  addContentHeader(slide, slideData.title || '');
  addSlideNumber(slide, slideNum);

  // Large image area: x=0.56, y=1.0, w=8.88"
  const imgX = 0.56;
  const imgY = 1.0;
  const imgW = 8.88;
  const captionH = slideData.caption ? 0.3 : 0;
  const imgH = Math.min(4.0, H - imgY - captionH - 0.2);

  if (slideData.src && fs.existsSync(slideData.src)) {
    slide.addImage({
      path: slideData.src,
      x: imgX, y: imgY, w: imgW, h: imgH,
      sizing: { type: 'contain', w: imgW, h: imgH },
    });
  } else {
    // Placeholder
    slide.addShape('roundRect', {
      x: imgX, y: imgY, w: imgW, h: imgH,
      rectRadius: 0.05,
      fill: { color: 'F5F5F5' },
      line: { color: C.BORDER, pt: 1 },
    });
    slide.addText(slideData.src ? `[Image: ${slideData.src}]` : '[Image]', {
      x: imgX, y: imgY, w: imgW, h: imgH,
      fontFace: FONT_BODY, fontSize: 13, color: C.MUTED,
      align: 'center', valign: 'middle',
    });
  }

  // Caption
  if (slideData.caption) {
    slide.addText(slideData.caption, {
      x: imgX, y: imgY + imgH + 0.08, w: imgW, h: 0.25,
      fontFace: FONT_BODY, fontSize: 10, color: C.CAPTION,
      align: 'center',
    });
  }
}

// ---------------------------------------------------------------------------
// Main render function
// ---------------------------------------------------------------------------
function renderDeck(deckJson, outputPath) {
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_16x9';

  const config = deckJson.config || {};
  let slideNum = 0;

  for (const slideData of (deckJson.slides || [])) {
    slideNum++;

    switch (slideData.type) {
      case 'title':
        renderTitleSlide(pres, slideData, config, slideNum);
        break;
      case 'section':
        renderSectionSlide(pres, slideData, config, slideNum);
        break;
      case 'content':
        renderContentSlide(pres, slideData, config, slideNum);
        break;
      case 'comparison':
        renderComparisonSlide(pres, slideData, config, slideNum);
        break;
      case 'split':
        renderSplitSlide(pres, slideData, config, slideNum);
        break;
      case 'image':
        renderImageSlide(pres, slideData, config, slideNum);
        break;
      default:
        console.warn(`Unknown slide type: ${slideData.type} (slide ${slideNum}) — skipped`);
    }
  }

  return pres.writeFile({ fileName: outputPath });
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node slide-renderer.js input.json output.pptx');
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1];

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  let deckJson;
  try {
    deckJson = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  } catch (e) {
    console.error(`Failed to parse JSON: ${e.message}`);
    process.exit(1);
  }

  renderDeck(deckJson, outputPath)
    .then(() => {
      console.log(`Saved: ${outputPath}`);
    })
    .catch(err => {
      console.error(`Render error: ${err.message}`);
      process.exit(1);
    });
}

module.exports = { renderDeck };
