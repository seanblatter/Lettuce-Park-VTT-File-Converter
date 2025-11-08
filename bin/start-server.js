#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'node:url';
import { convertVideoToVtt } from '../src/video-to-vtt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');
const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vtt-upload-'));

const app = express();
const upload = multer({ dest: uploadDir });

app.use(express.static(publicDir));

app.post('/api/convert', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file was uploaded.' });
  }

  const tempVideoPath = req.file.path;
  const downloadName = `${path.parse(req.file.originalname).name || 'transcript'}.vtt`;

  try {
    const vtt = await convertVideoToVtt({ inputPath: tempVideoPath });
    res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.send(vtt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to convert the uploaded video.' });
  } finally {
    fs.unlink(tempVideoPath, () => {});
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`WebVTT converter available at http://localhost:${port}`);
});

function cleanupUploads() {
  fs.rm(uploadDir, { recursive: true, force: true }, () => {});
}

process.on('SIGINT', () => {
  cleanupUploads();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanupUploads();
  process.exit(0);
});
