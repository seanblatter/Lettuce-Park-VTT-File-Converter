const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const browseButton = document.getElementById('browse-button');
const statusEl = document.getElementById('status');
const downloadEl = document.getElementById('download');

function setStatus(message, type = 'info') {
  statusEl.textContent = message;
  statusEl.dataset.type = type;
}

function resetDownload() {
  downloadEl.innerHTML = '';
}

function createDownloadLink(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.textContent = `Download ${filename}`;
  link.addEventListener('click', () => {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  downloadEl.innerHTML = '';
  downloadEl.appendChild(link);
}

async function uploadFile(file) {
  if (!file) {
    return;
  }

  resetDownload();
  setStatus('Uploading video and generating captions…');

  const formData = new FormData();
  formData.append('video', file);

  try {
    const response = await fetch('/api/convert', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const { error } = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error || 'Unable to convert the provided video.');
    }

    const blob = await response.blob();
    const filename = `${file.name.replace(/\.[^.]+$/, '') || 'transcript'}.vtt`;
    createDownloadLink(blob, filename);
    setStatus('Conversion complete! Click below to download your WebVTT file.', 'success');
  } catch (error) {
    setStatus(error.message || 'Failed to convert the video.', 'error');
  }
}

function handleFiles(files) {
  const [file] = files;
  if (!file) {
    return;
  }

  if (!file.type.startsWith('video/')) {
    setStatus('Please upload a valid video file.', 'error');
    return;
  }

  uploadFile(file);
}

browseButton.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', event => {
  handleFiles(event.target.files);
  fileInput.value = '';
});

dropZone.addEventListener('dragover', event => {
  event.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', event => {
  event.preventDefault();
  dropZone.classList.remove('dragover');
  handleFiles(event.dataTransfer.files);
});

// Fallback click handler for entire drop zone

dropZone.addEventListener('click', event => {
  if (event.target === browseButton) {
    return;
  }
  fileInput.click();
});
