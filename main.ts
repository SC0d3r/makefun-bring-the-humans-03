// make.fun bring-the-humans-03 entry program.
//
// The video is the entry. This program checks that VIDEO.json beside it holds a
// real TikTok video address and hands the exact same bytes to the gate. After
// writing, it reads the copy back and proves the bytes arrived unchanged. No
// network, no clock, no files outside the repository.
//
// Local run:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Full video addresses only: no vm.tiktok.com short links, no /photo/ posts,
// and no query string or fragment on the end.
const TIKTOK_VIDEO = /^https:\/\/www\.tiktok\.com\/@([A-Za-z0-9._]{1,24})\/video\/([0-9]+)$/;

const sourcePath = join(import.meta.dirname, 'VIDEO.json');
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const destinationPath = join(outputDir, 'VIDEO.json');

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function loadSource(): Buffer {
  let bytes: Buffer;
  try {
    bytes = readFileSync(sourcePath);
  } catch (error) {
    fail(`cannot read ${sourcePath}: ${(error as Error).message}`);
  }
  return bytes;
}

function checkVideoUrl(bytes: Buffer): string {
  let document: unknown;
  try {
    document = JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    fail(`VIDEO.json is not valid JSON: ${(error as Error).message}`);
  }
  if (typeof document !== 'object' || document === null || Array.isArray(document)) {
    fail('VIDEO.json must hold a JSON object');
  }

  const url = (document as { url?: unknown }).url;
  if (typeof url !== 'string' || url.length === 0) {
    fail('VIDEO.json must hold a non-empty url string');
  }
  if (!TIKTOK_VIDEO.test(url)) {
    fail(`not a full TikTok video address: ${url}`);
  }
  return url;
}

function copyVerified(source: Buffer): void {
  mkdirSync(outputDir, { recursive: true });
  try {
    writeFileSync(destinationPath, source);
  } catch (error) {
    fail(`cannot write ${destinationPath}: ${(error as Error).message}`);
  }

  // Compare the bytes that landed on disk with the bytes we read, so a short
  // write or an encoding surprise cannot pass silently.
  let written: Buffer;
  try {
    written = readFileSync(destinationPath);
  } catch (error) {
    fail(`cannot read back ${destinationPath}: ${(error as Error).message}`);
  }

  if (written.length !== source.length) {
    fail(`byte length mismatch: source ${source.length}, written ${written.length}`);
  }
  const sourceHash = sha256(source);
  const writtenHash = sha256(written);
  if (writtenHash !== sourceHash) {
    fail(`sha256 mismatch: source ${sourceHash}, written ${writtenHash}`);
  }
}

const source = loadSource();
const url = checkVideoUrl(source);
copyVerified(source);

console.log(`wrote ${destinationPath} (${source.length} bytes, sha256 ${sha256(source)})`);
console.log(`video url: ${url}`);
