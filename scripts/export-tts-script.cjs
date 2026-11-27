#!/usr/bin/env node
/* Export data/campaign-voice-manifest.json into a clean CSV script sheet for external TTS tools
 * (CosyVoice, Fish Speech, ElevenLabs, Azure TTS, etc.). */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const manifestPath = path.join(ROOT, 'data', 'campaign-voice-manifest.json');
const outPath = path.join(ROOT, 'data', 'tts-export-sheet.csv');

const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const rows = [
  ['id', 'chapter', 'speakerId', 'speaker', 'emotion', 'audioFile', 'ready', 'textZh', 'textEn'].join(','),
];
for (const ln of data.lines || []) {
  rows.push([
    esc(ln.id),
    esc(ln.chapter),
    esc(ln.speakerId),
    esc(ln.speaker),
    esc(ln.emotion),
    esc(ln.audioFile),
    esc(ln.ready ? 'true' : 'false'),
    esc(ln.textZh),
    esc(ln.textEn),
  ].join(','));
}

fs.writeFileSync(outPath, '\uFEFF' + rows.join('\n') + '\n', 'utf8');
console.log(`✅ 已导出 ${data.lines.length} 条战役与队友指令台词至: ${outPath}`);
