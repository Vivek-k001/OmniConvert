/**
 * OmniConvert Module: Client-Side Image Filter & Enhancement Engine
 * Direct pixel array adjustments: Grayscale, Invert, Sepia, Brightness & Contrast
 */

class ImageFilterEngine {
  constructor() {
    this.img = null;
    this.canvas = null;
    this.ctx = null;
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.dropZone = document.getElementById('filter-dropzone');
    this.fileInput = document.getElementById('filter-input');
    this.canvas = document.getElementById('filter-canvas');
    if (this.canvas) this.ctx = this.canvas.getContext('2d');

    this.brightness = document.getElementById('filter-brightness');
    this.contrast = document.getElementById('filter-contrast');
    this.grayscale = document.getElementById('filter-grayscale');
    this.invert = document.getElementById('filter-invert');
    this.sepia = document.getElementById('filter-sepia');
    this.downloadBtn = document.getElementById('btn-download-filtered');
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

    [this.brightness, this.contrast, this.grayscale, this.invert, this.sepia].forEach(slider => {
      if (slider) slider.addEventListener('input', () => this.applyFilters());
    });

    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => {
        if (!this.canvas) return;
        const a = document.createElement('a');
        a.href = this.canvas.toDataURL('image/jpeg', 0.95);
        a.download = 'filtered_image.jpg';
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
        this.applyFilters();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  applyFilters() {
    if (!this.img || !this.canvas) return;

    this.canvas.width = this.img.width;
    this.canvas.height = this.img.height;

    const b = this.brightness ? this.brightness.value : 100;
    const c = this.contrast ? this.contrast.value : 100;
    const g = this.grayscale ? this.grayscale.value : 0;
    const i = this.invert ? this.invert.value : 0;
    const s = this.sepia ? this.sepia.value : 0;

    this.ctx.filter = `brightness(${b}%) contrast(${c}%) grayscale(${g}%) invert(${i}%) sepia(${s}%)`;
    this.ctx.drawImage(this.img, 0, 0);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.imageFilterEngine = new ImageFilterEngine();
});
