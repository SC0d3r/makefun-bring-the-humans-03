// Entry program for make.fun's bring-the-humans-03 bounty.
//
// The entry is the video. This program only hands the video's address to the
// gate: it copies VIDEO.json from the repository root into the output folder.
// No network, no clock, no files outside the repository, and two runs write
// the same bytes.
//
// Outside the grader's container:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const botDir = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const source = join(botDir, 'VIDEO.json');
const destination = join(outputDir, 'VIDEO.json');

if (!existsSync(source)) {
  console.error(`VIDEO.json is missing at ${source}`);
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });

try {
  copyFileSync(source, destination);
} catch (error) {
  console.error(`could not copy ${source} to ${destination}: ${(error as Error).message}`);
  process.exit(1);
}
