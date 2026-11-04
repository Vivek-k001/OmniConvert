/**
 * OmniConvert Module: Client-Side Aspect Ratio Cropper
 * Pre-calibrated social media dimensions: 1:1 Square, 16:9 Landscape, 9:16 Story/Reel, 4:5 Portrait
 */

class AspectRatioCropper {
  constructor() {
    this.img = null;
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.dropZone = document.getElementById('crop-dropzone');
    this.fileInput = document.getElementById('crop-input');
    this.ratioSelect = document.getElementById('crop-ratio');
    this.canvas = document.getElementById('crop-canvas');
    this.downloadBtn = document.getElementById('btn-download-cropped');
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
      if (file) this.loadImage(file);
    });

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.loadImage(file);
    });

    if (this.ratioSelect) {
      this.ratioSelect.addEventListener('change', () => this.applyCrop());
    }

    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => {
        if (!this.canvas) return;
        const a = document.createElement('a');
        a.href = this.canvas.toDataURL('image/jpeg', 0.95);
        a.download = 'cropped_image.jpg';
        a.click();
      });
    }
  }

  loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.img = img;
        this.applyCrop();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  applyCrop() {
    if (!this.img || !this.canvas) return;
    const ratio = this.ratioSelect ? this.ratioSelect.value : '1:1';
    let targetRatio = 1;

    if (ratio === '16:9') targetRatio = 16 / 9;
    else if (ratio === '9:16') targetRatio = 9 / 16;
    else if (ratio === '4:5') targetRatio = 4 / 5;
    else if (ratio === '4:3') targetRatio = 4 / 3;

    let sourceW = this.img.width;
    let sourceH = this.img.height;
    const currentRatio = sourceW / sourceH;

    let cropW = sourceW;
    let cropH = sourceH;
    let cropX = 0;
    let cropY = 0;

    if (currentRatio > targetRatio) {
      cropW = sourceH * targetRatio;
      cropX = (sourceW - cropW) / 2;
    } else {
      cropH = sourceW / targetRatio;
      cropY = (sourceH - cropH) / 2;
    }

    this.canvas.width = cropW;
    this.canvas.height = cropH;
    const ctx = this.canvas.getContext('2d');
    ctx.drawImage(this.img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.aspectRatioCropper = new AspectRatioCropper();
});
