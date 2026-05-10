'use strict';

/**
 * slide-renderer.js — deterministic PPTX renderer for SlideDeck JSON
 *
 * Usage: node slide-renderer.js input.json output.pptx
 *
 * Handles slide types: title, section, content, comparison, split, image
 * Default theme: indigo/warm accent palette (see branding.md)
 * PptxGenJS v4.x API
 *
 * Bullets are rendered as paragraphs within a single text box per group,
 * enabling easy editing in PowerPoint and per-paragraph animation injection.
 * An animation manifest (output.animation.json) is written alongside the .pptx
 * for use by animation-injector.js.
 */

const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');

// ---------------------------------------------------------------------------
// Brand constants (from branding.md)
// ---------------------------------------------------------------------------
const C = {
  // Backgrounds
  DARK_BG:         '0F172A',  // Slate 900 — deep navy
  LIGHT_BG:        'FAFAFA',  // off-white, softer than pure white

  // Text
  TEXT_ON_DARK:    'F8FAFC',  // Slate 50
  TEXT_ON_LIGHT:   '111827',  // Gray 900
  BODY:            '374151',  // Gray 700
  SECONDARY:       '6B7280',  // Gray 500
  MUTED:           '9CA3AF',  // Gray 400
  SLIDE_NUM:       '9CA3AF',  // Gray 400
  FOOTER:          '6B7280',  // Gray 500
  SUBTITLE:        '94A3B8',  // Slate 400

  // Accents
  TEAL:            '818CF8',  // Indigo 400
  TEAL_DEEP:       '6366F1',  // Indigo 500
  WARM:            'FB923C',  // Orange 400
  WARM_DEEP:       'F97316',  // Orange 500
  TEAL_LABEL:      '6366F1',  // Indigo 500
  WARM_LABEL:      'EA580C',  // Orange 600
  QUOTE_BG:        'EEF2FF',  // Indigo 50 — subtle tint for quote blocks

  // Structural
  BORDER:          'E2E8F0',  // Slate 200
  CODE_BG:         '1E293B',  // Slate 800
  BULLET_DOT:      'CBD5E1',  // Slate 300
  SUB_DOT:         'CBD5E1',  // Slate 300
  LOGO_GRAY:       '94A3B8',  // Slate 400
  VS_TEXT:         '6366F1',  // Indigo 500
  CAPTION:         '94A3B8',  // Slate 400

  // Code text
  CODE_TEXT:       'E2E8F0',  // Slate 200
  CODE_INLINE:     '818CF8',  // Indigo 400
};

// Slide dimensions
const W = 10;       // inches
const H = 5.625;    // inches

// Typography
const FONT_BODY  = 'Inter';
const FONT_CODE  = 'Courier New';
const FONT_QUOTE = 'Georgia';

// ---------------------------------------------------------------------------
// Animation manifest tracking
// ---------------------------------------------------------------------------
let animationManifest = { slides: [] };

function resetManifest() {
  animationManifest = { slides: [] };
}

function trackAnimations(slideIndex, shapeName, flatParagraphs) {
  const clickMap = new Map();

  flatParagraphs.forEach((para, idx) => {
    if (para.clickGroup != null) {
      if (!clickMap.has(para.clickGroup)) {
        clickMap.set(para.clickGroup, []);
      }
      clickMap.get(para.clickGroup).push(idx);
    }
  });

  if (clickMap.size === 0) return;

  const clicks = Array.from(clickMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([_, indices]) => indices);

  let slideEntry = animationManifest.slides.find(s => s.slideIndex === slideIndex);
  if (!slideEntry) {
    slideEntry = { slideIndex, shapes: [] };
    animationManifest.slides.push(slideEntry);
  }

  slideEntry.shapes.push({ name: shapeName, clicks });
}

// ---------------------------------------------------------------------------
// Inline markdown parser
// Parses **bold**, *italic*, `code` into PptxGenJS text run arrays.
// ---------------------------------------------------------------------------
function parseInline(text, baseColor, baseFontSize) {
  const runs = [];
  const segments = [];
  let lastIndex = 0;
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
      runs.push({ text: seg.text, options: { bold: true, color: C.TEXT_ON_LIGHT, fontFace: FONT_BODY, fontSize: baseFontSize } });
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
    slide.addText([
      { text: 'evolving', options: { color: C.TEAL,       fontFace: FONT_BODY, fontSize: 11, bold: true } },
      { text: 'selves',   options: { color: C.WARM,       fontFace: FONT_BODY, fontSize: 11, bold: true } },
    ], { x, y, w: 1.8, h: 0.25, valign: 'middle' });

  } else if (typeof logo === 'string') {
    slide.addText(logo, {
      x, y, w: 2.5, h: 0.25,
      fontFace: FONT_BODY, fontSize: 11, bold: true,
      color: C.LOGO_GRAY, valign: 'middle',
    });

  } else if (logo && typeof logo === 'object' && logo.image) {
    const imgOpts = { x, y, h: 0.3, sizing: { type: 'contain', h: 0.3 } };
    if (fs.existsSync(logo.image)) {
      slide.addImage({ path: logo.image, ...imgOpts });
    } else {
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
// ---------------------------------------------------------------------------
function addContentHeader(slide, title) {
  slide.addShape('rect', {
    x: 0.38, y: 0.28, w: 0.03, h: 0.45,
    fill: { color: C.TEAL },
    line: { type: 'none' },
  });

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

  slide.addShape('rect', {
    x: 0.56, y: 5.05, w: 8.88, h: 0.01,
    fill: { color: C.BORDER },
    line: { type: 'none' },
  });

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
// Body item grouping — consecutive bullets share a single text box
// ---------------------------------------------------------------------------
function groupBodyItems(items) {
  const groups = [];
  let currentBullets = [];

  function flush() {
    if (currentBullets.length > 0) {
      groups.push({ type: 'bullets', items: [...currentBullets] });
      currentBullets = [];
    }
  }

  for (const item of items) {
    if (!item) continue;
    if (item.kind === 'bullet' || item.kind === 'quote') {
      // Quotes flow inline with bullets — same text box, distinct styling
      currentBullets.push(item);
    } else {
      flush();
      groups.push({ type: item.kind, item });
    }
  }
  flush();

  return groups;
}

// ---------------------------------------------------------------------------
// Flatten bullet tree into paragraph list with click groups
//
// Rules:
// - Each ++ bullet starts a new click group (appears on its own click)
// - Non-++ children of a ++ bullet inherit the same click group
// - A ++ child within a ++ parent starts yet another click group
// - Non-animated bullets with no animated ancestor have clickGroup = null
// ---------------------------------------------------------------------------
function flattenBullets(items, depth, inheritedClickGroup, counter) {
  const result = [];
  // Track the most recent click group so non-++ bullets after a ++ bullet
  // ride along on the same click rather than appearing instantly.
  let lastClickGroup = inheritedClickGroup;

  for (const item of items) {
    if (!item) continue;

    if (item.kind === 'quote') {
      let clickGroup;
      if (item.animate) {
        counter.value++;
        clickGroup = counter.value;
        lastClickGroup = clickGroup;
      } else {
        clickGroup = lastClickGroup;
      }
      result.push({
        text: `”${item.text}”`,
        depth,
        clickGroup,
        refs: [],
        isQuote: true,
      });
      continue;
    }

    let clickGroup;
    if (item.animate) {
      counter.value++;
      clickGroup = counter.value;
      lastClickGroup = clickGroup;
    } else {
      // Non-++ bullet: attach to the most recent click group (or null = instant
      // if no ++ bullet has appeared yet on this slide)
      clickGroup = lastClickGroup;
    }

    result.push({
      text: item.text || '',
      depth,
      clickGroup,
      refs: item.refs || [],
      isQuote: false,
    });

    if (item.children && item.children.length > 0) {
      result.push(...flattenBullets(item.children, depth + 1, clickGroup, counter));
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Render a group of bullets as a single multi-paragraph text box
// ---------------------------------------------------------------------------
function renderBulletGroup(slide, flatParas, x, y, w, objectName) {
  const allRuns = [];

  for (let i = 0; i < flatParas.length; i++) {
    const para = flatParas[i];
    const fontSize = 13;
    const bulletColor = C.BULLET_DOT;

    let runs;
    if (para.isQuote) {
      // Quote: same font/style as regular bullets, orange highlight + quotation marks
      runs = parseInline(para.text, C.BODY, fontSize);
      // Apply highlight to all runs
      for (const run of runs) {
        run.options = { ...run.options, highlight: C.QUOTE_BG };
      }
    } else {
      runs = parseInline(para.text, C.BODY, fontSize);
    }

    // Append ref markers
    if (para.refs && para.refs.length > 0) {
      runs.push({
        text: ' ' + para.refs.map(r => `[${r}]`).join(''),
        options: { fontSize: 8, color: C.MUTED, fontFace: FONT_BODY }
      });
    }

    // Set paragraph-level options on first run
    runs[0].options = {
      ...runs[0].options,
      bullet: { code: '2022', color: bulletColor },
      indentLevel: para.depth,
      paraSpaceBefore: i === 0 ? 0 : 3,
    };

    // breakLine on last run ends this paragraph (except for the final paragraph)
    if (i < flatParas.length - 1) {
      runs[runs.length - 1].options = {
        ...runs[runs.length - 1].options,
        breakLine: true,
      };
    }

    allRuns.push(...runs);
  }

  let h = Math.max(flatParas.length * 0.28, 0.3);

  slide.addText(allRuns, {
    x, y, w, h,
    valign: 'top',
    wrap: true,
    objectName,
  });

  return y + h;
}

// ---------------------------------------------------------------------------
// Main body renderer — replaces old renderBodyItems
// Groups consecutive bullets into single text boxes, renders others as shapes
// ---------------------------------------------------------------------------
function renderBody(slide, items, startY, xOffset, maxW, slideIndex, namePrefix) {
  if (!items || items.length === 0) return startY;

  const groups = groupBodyItems(items);
  let y = startY;
  let groupIdx = 0;
  const clickCounter = { value: 0 };

  for (const group of groups) {
    if (group.type === 'bullets') {
      const flatParas = flattenBullets(group.items, 0, null, clickCounter);
      const shapeName = `${namePrefix}_${groupIdx}`;
      groupIdx++;

      y = renderBulletGroup(slide, flatParas, xOffset, y, maxW, shapeName);
      trackAnimations(slideIndex, shapeName, flatParas);
    } else if (group.type === 'quote') {
      y = renderQuote(slide, group.item, y, xOffset, maxW);
    } else if (group.type === 'code') {
      y = renderCodeBlock(slide, group.item, y, xOffset, maxW);
    } else if (group.type === 'image') {
      y = renderBodyImage(slide, group.item, y, xOffset, maxW);
    }
  }

  return y;
}

// ---------------------------------------------------------------------------
// Non-bullet body item renderers (quote, code, image)
// ---------------------------------------------------------------------------
function renderQuote(slide, item, y, x, w) {
  const padV = 0.06;
  const padH = 0.12;
  const textH = 0.3;
  const blockH = textH + padV * 2;

  // Light orange background pill
  slide.addShape('roundRect', {
    x, y, w, h: blockH,
    rectRadius: 0.04,
    fill: { color: C.QUOTE_BG },
    line: { type: 'none' },
  });

  // Quote text \u2014 not italic, with curly quotation marks
  slide.addText(`\u201C${item.text}\u201D`, {
    x: x + padH, y: y + padV, w: w - padH * 2, h: textH,
    fontFace: FONT_BODY, fontSize: 13, italic: false,
    color: C.BODY, valign: 'middle', wrap: true,
  });

  y += blockH;

  // Attribution
  if (item.attribution) {
    y += 0.03;
    slide.addText(`\u2014 ${item.attribution}`, {
      x: x + padH, y, w: w - padH * 2, h: 0.2,
      fontFace: FONT_BODY, fontSize: 11,
      color: C.SECONDARY, valign: 'middle',
    });
    y += 0.2;
  }

  y += 0.06;
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
      fontFace: FONT_BODY, fontSize: 10, color: C.CAPTION,
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

  slide.addText(slideData.title || '', {
    x: 0, y: 1.8, w: W, h: 0.7,
    fontFace: FONT_BODY, fontSize: 34, bold: true,
    color: C.TEXT_ON_DARK, align: 'center', valign: 'middle',
  });

  // Teal accent line
  slide.addShape('rect', {
    x: (W - 0.8) / 2, y: 2.6, w: 0.8, h: 0.02,
    fill: { color: C.TEAL },
    line: { type: 'none' },
  });

  if (slideData.subtitle) {
    slide.addText(slideData.subtitle, {
      x: 0.5, y: 3.0, w: W - 1, h: 0.45,
      fontFace: FONT_BODY, fontSize: 15,
      color: C.SUBTITLE, align: 'center', valign: 'middle',
    });
  }

  addLogo(slide, config.logo, 0.4, 5.1);

  const footerParts = [config.author, config.affiliation, config.date].filter(Boolean);
  if (footerParts.length > 0) {
    slide.addText(footerParts.join('  \u00B7  '), {
      x: 4.5, y: 5.1, w: 5.3, h: 0.3,
      fontFace: FONT_BODY, fontSize: 10,
      color: C.FOOTER, align: 'right', valign: 'middle',
    });
  }
}

function renderSectionSlide(pres, slideData, config, slideNum) {
  const slide = pres.addSlide();
  slide.background = { color: C.DARK_BG };

  // Warm accent line
  slide.addShape('rect', {
    x: (W - 0.5) / 2, y: 2.1, w: 0.5, h: 0.02,
    fill: { color: C.WARM },
    line: { type: 'none' },
  });

  slide.addText(slideData.title || '', {
    x: 0.5, y: 2.3, w: W - 1, h: 0.65,
    fontFace: FONT_BODY, fontSize: 32, bold: true,
    color: C.TEXT_ON_DARK, align: 'center', valign: 'middle',
  });

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

  let title = slideData.title || '';
  if (slideData.continuation) {
    title += ` (${slideData.continuation.part}/${slideData.continuation.of})`;
  }

  addContentHeader(slide, title);
  addSlideNumber(slide, slideNum);

  const bodyX = 0.56;
  const bodyY = 1.0;
  const bodyW = 8.88;

  renderBody(slide, slideData.body, bodyY, bodyX, bodyW, slideNum, 'body');

  addReferencesFooter(slide, slideData.references);
}

// ---------------------------------------------------------------------------
// Shared two-column layout helper (comparison and split slides)
// ---------------------------------------------------------------------------
function renderTwoColumnSlide(slide, slideData, slideNum, { showVsBadge }) {
  const colY = 1.0;
  const colH = 4.3;
  const colW = 4.3;
  const leftX = 0.38;
  const rightX = 5.32;
  const centerX = leftX + colW;

  // Column borders
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

  // Left label
  const leftLabel = slideData.left ? slideData.left.label || '' : '';
  slide.addText(leftLabel, {
    x: leftX + 0.12, y: colY + 0.1, w: colW - 0.24, h: 0.3,
    fontFace: FONT_BODY, fontSize: 13, bold: true,
    color: C.TEAL_LABEL, valign: 'middle',
  });

  // Right label
  const rightLabel = slideData.right ? slideData.right.label || '' : '';
  slide.addText(rightLabel, {
    x: rightX + 0.12, y: colY + 0.1, w: colW - 0.24, h: 0.3,
    fontFace: FONT_BODY, fontSize: 13, bold: true,
    color: C.WARM_LABEL, valign: 'middle',
  });

  // Optional "vs" badge
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
    renderBody(slide, slideData.left.items, itemY, leftX + itemPadX, itemW, slideNum, 'left');
  }
  if (slideData.right && slideData.right.items) {
    renderBody(slide, slideData.right.items, itemY, rightX + itemPadX, itemW, slideNum, 'right');
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
  resetManifest();

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

  // Write manifest alongside the pptx
  const manifestPath = outputPath.replace(/\.pptx$/i, '.animation.json');
  fs.writeFileSync(manifestPath, JSON.stringify(animationManifest, null, 2));
  console.log(`Animation manifest: ${manifestPath}`);

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
