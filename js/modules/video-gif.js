/**
 * OmniConvert Module: Video to Real Animated GIF Maker
 * Uses standard gif.js engine with local worker to assemble real multi-frame animated GIFs
 */

class VideoToGifMaker {
  constructor() {
    this.videoFile = null;
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.dropZone = document.getElementById('gif-dropzone');
    this.fileInput = document.getElementById('gif-input');
    this.videoEl = document.getElementById('gif-video-preview');
    this.fpsInput = document.getElementById('gif-fps');
    this.widthInput = document.getElementById('gif-width');
    this.btnConvert = document.getElementById('btn-convert-gif');
    this.statusEl = document.getElementById('gif-status');
  }

  initEventListeners() {
    if (!this.dropZone) return;

    ['dragenter', 'dragover'].forEach(name => {
      this.dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        this.dropZone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      this.dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        this.dropZone.classList.remove('drag-over');
      });
    });

    this.dropZone.addEventListener('drop', (e) => {
      const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('video/'));
      if (file) this.loadVideo(file);
    });

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.loadVideo(file);
    });

    if (this.btnConvert) {
      this.btnConvert.addEventListener('click', () => this.generateGif());
    }
  }

  loadVideo(file) {
    this.videoFile = file;
    const url = URL.createObjectURL(file);
    if (this.videoEl) {
      this.videoEl.src = url;
      this.videoEl.classList.remove('hidden');
      if (this.btnConvert) this.btnConvert.disabled = false;
      if (this.statusEl) this.statusEl.textContent = `Loaded ${file.name} (${(file.size / (1024*1024)).toFixed(1)} MB). Click to convert.`;
    }
  }

  async generateGif() {
    if (!this.videoEl || !this.videoFile) {
      alert('Please select a video clip first.');
      return;
    }

    const video = this.videoEl;
    const btn = this.btnConvert;
    const status = this.statusEl;

    btn.disabled = true;
    status.textContent = 'Extracting video frames in browser...';

    try {
      const fps = parseInt(this.fpsInput ? this.fpsInput.value : 10, 10);
      const targetWidth = parseInt(this.widthInput ? this.widthInput.value : 320, 10);
      const aspect = (video.videoHeight || 9) / (video.videoWidth || 16);
      const targetHeight = Math.round(targetWidth * aspect);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      const duration = Math.min(video.duration || 4, 6); // Up to 6s
      const frameInterval = 1 / fps;
      const totalFrames = Math.floor(duration * fps);

      // Create Real GIF encoder instance using in-memory blob worker (bypasses file:/// origin null block)
      const workerUrl = window.GIF_WORKER_BLOB_URL || 'js/gif.worker.js';
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: targetWidth,
        height: targetHeight,
        workerScript: workerUrl
      });

      gif.on('progress', (p) => {
        status.textContent = `Encoding real animated GIF: ${Math.round(p * 100)}%`;
      });

      gif.on('finished', (blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${this.videoFile.name.replace(/\.[^/.]+$/, '')}_animated.gif`;
        a.click();
        status.textContent = 'Animated GIF compiled & downloaded successfully!';
        btn.disabled = false;
      });

      // Seek & capture each frame
      for (let i = 0; i < totalFrames; i++) {
        video.currentTime = i * frameInterval;
        await new Promise(r => { video.onseeked = r; });

        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        gif.addFrame(ctx, { copy: true, delay: Math.round(frameInterval * 1000) });

        status.textContent = `Captured frame ${i + 1} of ${totalFrames}...`;
      }

      status.textContent = 'Rendering multi-frame animated GIF...';
      gif.render();

    } catch (err) {
      console.error('GIF generation error:', err);
      status.textContent = 'Error: ' + err.message;
      btn.disabled = false;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.videoToGifMaker = new VideoToGifMaker();
});
