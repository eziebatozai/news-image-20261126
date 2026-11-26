// World news front page entry for Thursday 26 November 2026.
// Copies the pre-rendered 1024x1024 PNG beside this script into the output directory.

import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BYTES = 1024 * 1024;
const MAX_DIMENSION = 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_IEND_TAIL = Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);

function validateSourcePng(filePath: string): number {
  const data = readFileSync(filePath);
  if (data.length < 33 || data.length > MAX_BYTES) {
    throw new Error(`Invalid entry.png size: ${data.length} bytes (must be 33..${MAX_BYTES})`);
  }
  if (!data.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('entry.png does not start with a valid PNG signature');
  }
  if (data.subarray(12, 16).toString('ascii') !== 'IHDR') {
    throw new Error('entry.png is missing its leading IHDR chunk');
  }
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  if (width < 1 || width > MAX_DIMENSION || height < 1 || height > MAX_DIMENSION) {
    throw new Error(`Invalid entry.png dimensions: ${width}x${height} (max ${MAX_DIMENSION}x${MAX_DIMENSION})`);
  }
  if (!data.subarray(data.length - 8).equals(PNG_IEND_TAIL)) {
    throw new Error('entry.png is truncated or missing its IEND chunk');
  }
  return data.length;
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const sourceImage = join(scriptDir, 'entry.png');
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const destinationImage = join(outputDir, 'entry.png');

const expectedBytes = validateSourcePng(sourceImage);
mkdirSync(outputDir, { recursive: true });
copyFileSync(sourceImage, destinationImage);

const writtenBytes = statSync(destinationImage).size;
if (writtenBytes !== expectedBytes) {
  throw new Error(`Copied size mismatch: expected ${expectedBytes} bytes, wrote ${writtenBytes} bytes`);
}
