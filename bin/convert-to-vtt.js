#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { convertVideoToVtt } from '../src/video-to-vtt.js';

function formatUsage() {
  return `Usage: convert-to-vtt <input-video> [output-vtt]\n\n` +
    `Environment variables:\n` +
    `  OPENAI_API_KEY  API key for the Whisper transcription service.\n` +
    `  OPENAI_MODEL    Optional. Whisper model to use (default: gpt-4o-transcribe).\n` +
    `Prerequisites:\n` +
    `  • ffmpeg must be installed and available on your PATH.\n` +
    `  • An OpenAI API key with access to the transcription model.`;
}

async function main() {
  const [,, input, outputArg] = process.argv;
  if (!input || ['-h', '--help'].includes(input)) {
    console.error(formatUsage());
    process.exit(input ? 0 : 1);
  }

  const inputPath = path.resolve(process.cwd(), input);
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const outputPath = outputArg
    ? path.resolve(process.cwd(), outputArg)
    : path.join(path.dirname(inputPath), `${path.parse(inputPath).name}.vtt`);

  try {
    console.log('Transcribing video and building WebVTT file...');
    await convertVideoToVtt({ inputPath, outputPath });
    console.log(`Created ${outputPath}`);
  } catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
  }
}

main();
