import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import OpenAI from 'openai';

export function formatTimestamp(seconds) {
  const clamped = Math.max(seconds, 0);
  const totalMilliseconds = Math.round(clamped * 1000);
  const hours = Math.floor(totalMilliseconds / 3_600_000);
  const minutes = Math.floor((totalMilliseconds % 3_600_000) / 60_000);
  const secs = Math.floor((totalMilliseconds % 60_000) / 1_000);
  const millis = totalMilliseconds % 1_000;
  const pad = (value, length = 2) => value.toString().padStart(length, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${pad(millis, 3)}`;
}

export function segmentsToVtt(segments) {
  const cues = segments.map((segment, index) => {
    const start = formatTimestamp(segment.start ?? 0);
    const end = formatTimestamp(segment.end ?? segment.start ?? 0);
    const text = segment.text?.trim() ?? '';
    return `${index + 1}\n${start} --> ${end}\n${text}`;
  });
  return `WEBVTT\n\n${cues.join('\n\n')}\n`;
}

function runFfmpeg(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const args = ['-y', '-i', inputPath, '-ac', '1', '-ar', '16000', outputPath];
    const ffmpeg = spawn('ffmpeg', args, { stdio: 'inherit' });
    ffmpeg.on('error', reject);
    ffmpeg.on('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });
}

async function transcribeAudio(openai, audioPath, model) {
  const response = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model,
    response_format: 'verbose_json'
  });
  return response;
}

export async function convertVideoToVtt({
  inputPath,
  outputPath,
  model = process.env.OPENAI_MODEL || 'gpt-4o-transcribe'
}) {
  if (!inputPath) {
    throw new Error('An inputPath is required to convert video to WebVTT.');
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable.');
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-to-vtt-'));
  const tempAudioPath = path.join(tempDir, 'audio.wav');

  try {
    await runFfmpeg(inputPath, tempAudioPath);

    const openai = new OpenAI({ apiKey });
    const transcription = await transcribeAudio(openai, tempAudioPath, model);

    if (!transcription?.segments?.length) {
      throw new Error('No transcription segments were returned.');
    }

    const vtt = segmentsToVtt(transcription.segments);

    if (outputPath) {
      fs.writeFileSync(outputPath, vtt, 'utf8');
    }

    return vtt;
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
