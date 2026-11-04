/**
 * OmniConvert Module: Client-Side Image Watermark Studio
 * Generates custom text watermarks with opacity, placement, and angle controls
 */

class WatermarkStudio {
  constructor() {
    this.originalImage = null;
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.dropZone = document.getElementById('watermark-dropzone');
    this.fileInput = document.getElementById('watermark-input');
    this.textInput = document.getElementById('watermark-text');
    this.opacityInput = document.getElementById('watermark-opacity');
    this.colorInput = document.getElementById('watermark-color');
    this.fontSizeInput = document.getElementById('watermark-fontsize');
    this.positionSelect = document.getElementById('watermark-pos');
    this.previewCanvas = document.getElementById('watermark-canvas');
    this.downloadBtn = document.getElementById('btn-download-watermarked');
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

    [this.textInput, this.opacityInput, this.colorInput, this.fontSizeInput, this.positionSelect].forEach(el => {
      if (el) el.addEventListener('input', () => this.renderWatermark());
    });

    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => {
        if (!this.previewCanvas) return;
        const a = document.createElement('a');
        a.href = this.previewCanvas.toDataURL('image/png');
        a.download = 'watermarked_image.png';
        a.click();
      });
    }
  }

  loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.originalImage = img;
        this.renderWatermark();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  renderWatermark() {
    if (!this.originalImage || !this.previewCanvas) return;

    const canvas = this.previewCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = this.originalImage.width;
    canvas.height = this.originalImage.height;

    // Draw base image
    ctx.drawImage(this.originalImage, 0, 0);

    const text = this.textInput ? this.textInput.value || 'CONFIDENTIAL' : 'CONFIDENTIAL';
    const opacity = this.opacityInput ? parseFloat(this.opacityInput.value) / 100 : 0.4;
    const color = this.colorInput ? this.colorInput.value : '#ffffff';
    const fontSize = this.fontSizeInput ? parseInt(this.fontSizeInput.value, 10) : 36;
    const pos = this.positionSelect ? this.positionSelect.value : 'center';

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let x = canvas.width / 2;
    let y = canvas.height / 2;

    if (pos === 'bottom-right') {
      x = canvas.width - (fontSize * 3);
      y = canvas.height - fontSize;
    } else if (pos === 'top-left') {
      x = fontSize * 3;
      y = fontSize * 1.5;
    } else if (pos === 'diagonal') {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);
      x = 0;
      y = 0;
    }

    ctx.fillText(text, x, y);
    ctx.restore();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.watermarkStudio = new WatermarkStudio();
});
