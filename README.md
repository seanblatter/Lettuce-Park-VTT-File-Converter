# Lettuce-Park-VTT-File-Converter

A minimal Node.js toolchain that can be used as either a CLI or a drag-and-drop web app to turn videos into WebVTT subtitle files using OpenAI's Whisper transcription service.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- [ffmpeg](https://ffmpeg.org/) available on your `PATH`
- An OpenAI API key with access to the Whisper transcription model (set `OPENAI_API_KEY`)

## Installation

```bash
npm install
```

## Usage

### Browser experience

The project now includes a lightweight Express server that hosts a drag-and-drop interface for generating subtitles.

```bash
OPENAI_API_KEY="sk-..." npm start
```

Then visit [http://localhost:3000](http://localhost:3000) and drop a video onto the page. Once the conversion completes, the WebVTT file will download directly from the browser.

The server respects the same `OPENAI_MODEL` override described below.

### CLI

```bash
OPENAI_API_KEY="sk-..." npx convert-to-vtt /path/to/video.mp4 [output.vtt]
```

- If `output.vtt` is omitted, the tool saves the WebVTT file next to the input video with the same base name.
- Set `OPENAI_MODEL` to override the default transcription model (`gpt-4o-transcribe`).

## Notes

- Both the CLI and the web server create temporary working directories that are cleaned up automatically.
- API usage may incur costs; monitor your OpenAI usage dashboard.
