// Entry program for make.fun's bring-the-humans-03 bounty.
//
// The entry is the video. This program only hands the video's address to the
// gate: it copies VIDEO.json from the repository root into the output folder.
// No network, no clock, no files outside the repository, and two runs write
// the same bytes.
//
// Outside the grader's container:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
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

  // Read the copy back, not the source, so the run proves the gate received it.
  const handedIn = JSON.parse(readFileSync(destination, 'utf8')) as { url?: unknown };
  if (typeof handedIn.url !== 'string' || handedIn.url.length === 0) {
    throw new Error('VIDEO.json has no url string');
  }

  console.log(handedIn.url);
  process.exit(0);
} catch (error) {
  console.error(`could not hand in ${source}: ${(error as Error).message}`);
  process.exit(1);
}
