/**
 * OmniConvert Module: Client-Side Color Palette Extractor
 * Samples pixel data via HTML5 canvas and extracts dominant hex color swatches
 */

class ColorPaletteExtractor {
  constructor() {
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.dropZone = document.getElementById('palette-dropzone');
    this.fileInput = document.getElementById('palette-input');
    this.paletteContainer = document.getElementById('palette-swatches');
    this.imagePreview = document.getElementById('palette-image-preview');
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
      if (file) this.extractColors(file);
    });

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.extractColors(file);
    });
  }

  extractColors(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (this.imagePreview) {
          this.imagePreview.src = e.target.result;
          this.imagePreview.classList.remove('hidden');
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(img, 0, 0, 100, 100);

        const data = ctx.getImageData(0, 0, 100, 100).data;
        const colorCounts = {};

        for (let i = 0; i < data.length; i += 16) {
          const r = Math.round(data[i] / 24) * 24;
          const g = Math.round(data[i + 1] / 24) * 24;
          const b = Math.round(data[i + 2] / 24) * 24;
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }

        const sortedColors = Object.keys(colorCounts)
          .sort((a, b) => colorCounts[b] - colorCounts[a])
          .slice(0, 6);

        this.renderSwatches(sortedColors);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  renderSwatches(colors) {
    if (!this.paletteContainer) return;
    this.paletteContainer.innerHTML = '';

    colors.forEach(hex => {
      const swatch = document.createElement('div');
      swatch.className = 'flex flex-col items-center gap-1.5 cursor-pointer group';
      swatch.innerHTML = `
        <div class="w-14 h-14 rounded-xl border border-white/10 shadow-md group-hover:scale-110 transition-transform" style="background-color: ${hex}"></div>
        <span class="text-[11px] font-mono text-slate-300 group-hover:text-indigo-400">${hex.toUpperCase()}</span>
      `;
      swatch.addEventListener('click', () => {
        navigator.clipboard.writeText(hex.toUpperCase());
        alert(`Copied ${hex.toUpperCase()} to clipboard!`);
      });
      this.paletteContainer.appendChild(swatch);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.colorPaletteExtractor = new ColorPaletteExtractor();
});
