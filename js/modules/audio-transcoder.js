/**
 * OmniConvert Module: Client-Side Audio Converter & Waveform Visualizer
 * Reads MP3/WAV/OGG/AAC, extracts PCM buffer via Web Audio API, and encodes uncompressed WAV
 */

class AudioTranscoder {
  constructor() {
    this.audioCtx = null;
    this.audioBuffer = null;
    this.currentFileName = 'audio';
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.dropZone = document.getElementById('audio-dropzone');
    this.fileInput = document.getElementById('audio-input');
    this.canvas = document.getElementById('audio-waveform');
    this.metaInfo = document.getElementById('audio-info');
    this.convertBtn = document.getElementById('btn-export-wav');
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
      const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('audio/'));
      if (file) this.processAudio(file);
    });

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.processAudio(file);
    });

    if (this.convertBtn) {
      this.convertBtn.addEventListener('click', () => this.exportWav());
    }
  }

  async processAudio(file) {
    this.currentFileName = file.name.replace(/\.[^/.]+$/, '');
    const arrayBuffer = await file.arrayBuffer();

    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    try {
      this.audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
      this.drawWaveform();

      if (this.metaInfo) {
        this.metaInfo.innerHTML = `
          <div class="text-xs text-slate-300 space-y-1">
            <p><span class="text-slate-400">Duration:</span> ${this.audioBuffer.duration.toFixed(2)}s</p>
            <p><span class="text-slate-400">Channels:</span> ${this.audioBuffer.numberOfChannels}</p>
            <p><span class="text-slate-400">Sample Rate:</span> ${this.audioBuffer.sampleRate} Hz</p>
          </div>
        `;
      }
      if (this.convertBtn) this.convertBtn.disabled = false;
    } catch (err) {
      console.error('Audio decode error:', err);
    }
  }

  drawWaveform() {
    if (!this.audioBuffer || !this.canvas) return;
    const ctx = this.canvas.getContext('2d');
    const width = this.canvas.width;
    const height = this.canvas.height;
    const data = this.audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#6366f1';

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }
  }

  exportWav() {
    if (!this.audioBuffer) return;
    const wavBlob = this.bufferToWave(this.audioBuffer);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(wavBlob);
    a.download = `${this.currentFileName}_lossless.wav`;
    a.click();
  }

  bufferToWave(abuffer) {
    const numOfChan = abuffer.numberOfChannels;
    const length = abuffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    const channels = [];
    let sampleRate = abuffer.sampleRate;
    let offset = 0;
    let pos = 0;

    function setUint16(data) { out.setUint16(pos, data, true); pos += 2; }
    function setUint32(data) { out.setUint32(pos, data, true); pos += 4; }

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16);         // length = 16
    setUint16(1);          // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(sampleRate);
    setUint32(sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2);              // block-align
    setUint16(16);                         // 16-bit
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4);

    for (let i = 0; i < abuffer.numberOfChannels; i++) {
      channels.push(abuffer.getChannelData(i));
    }

    while (offset < abuffer.length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        out.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([out], { type: 'audio/wav' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.audioTranscoder = new AudioTranscoder();
});
