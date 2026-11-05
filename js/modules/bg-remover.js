/**
 * OmniConvert Module: In-Browser AI Background Remover
 * Uses Canvas luminance/chroma thresholding and transparent alpha rendering locally
 */

class BackgroundRemover {
  constructor() {
    this.sourceImg = null;
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.dropZone = document.getElementById('bg-dropzone');
    this.fileInput = document.getElementById('bg-input');
    this.canvas = document.getElementById('bg-canvas');
    this.thresholdSlider = document.getElementById('bg-threshold');
    this.thresholdVal = document.getElementById('bg-threshold-val');
    this.btnDownload = document.getElementById('btn-download-nobg');
    this.emptyState = document.getElementById('bg-empty');
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
      const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
      if (file) this.loadFile(file);
    });

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.loadFile(file);
    });

    if (this.thresholdSlider) {
      this.thresholdSlider.addEventListener('input', (e) => {
        if (this.thresholdVal) this.thresholdVal.textContent = e.target.value;
        this.removeBackground();
      });
    }

    if (this.btnDownload) {
      this.btnDownload.addEventListener('click', () => {
        if (!this.canvas) return;
        const a = document.createElement('a');
        a.href = this.canvas.toDataURL('image/png');
        a.download = 'transparent_subject.png';
        a.click();
      });
    }
  }

  loadFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.sourceImg = img;
        if (this.emptyState) this.emptyState.classList.add('hidden');
        if (this.canvas) this.canvas.classList.remove('hidden');
        if (this.btnDownload) this.btnDownload.disabled = false;
        this.removeBackground();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeBackground() {
    if (!this.sourceImg || !this.canvas) return;

    const canvas = this.canvas;
    const ctx = canvas.getContext('2d');
    canvas.width = this.sourceImg.width;
    canvas.height = this.sourceImg.height;

    ctx.drawImage(this.sourceImg, 0, 0);

    const threshold = parseInt(this.thresholdSlider ? this.thresholdSlider.value : 30, 10);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;

    // Corner sample background key
    const bgR = d[0];
    const bgG = d[1];
    const bgB = d[2];

    for (let i = 0; i < d.length; i += 4) {
      const diff = Math.sqrt(
        Math.pow(d[i] - bgR, 2) +
        Math.pow(d[i + 1] - bgG, 2) +
        Math.pow(d[i + 2] - bgB, 2)
      );

      if (diff < threshold * 2.5) {
        d[i + 3] = 0; // Transparent alpha
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.backgroundRemover = new BackgroundRemover();
});

