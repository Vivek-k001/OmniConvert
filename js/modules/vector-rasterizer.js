/**
 * OmniConvert Core Module: Vector & Media Rasterizer
 * Converts SVGs into PNG, JPG, or WebP with customizable scale multipliers & transparency options
 */

class VectorRasterizer {
  constructor() {
    this.svgString = null;
    this.originalWidth = 512;
    this.originalHeight = 512;
    this.fileName = 'vector';
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.dropZone = document.getElementById('svg-dropzone');
    this.fileInput = document.getElementById('svg-input');
    this.codeTextarea = document.getElementById('svg-code');
    this.previewBox = document.getElementById('svg-preview-box');
    this.svgMeta = document.getElementById('svg-dimensions-info');
    this.scaleSelect = document.getElementById('svg-scale');
    this.customWidthInput = document.getElementById('svg-custom-width');
    this.customHeightInput = document.getElementById('svg-custom-height');
    this.formatSelect = document.getElementById('svg-export-format');
    this.bgToggle = document.getElementById('svg-transparent-bg');
    this.bgColorInput = document.getElementById('svg-bg-color');
    this.rasterizeBtn = document.getElementById('btn-rasterize-svg');
  }

  initEventListeners() {
    if (!this.dropZone) return;

    ['dragenter', 'dragover'].forEach(name => {
      this.dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      this.dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('drag-over');
      });
    });

    this.dropZone.addEventListener('drop', (e) => {
      const file = Array.from(e.dataTransfer.files).find(f => f.type.includes('svg') || f.name.endsWith('.svg'));
      if (file) this.loadFile(file);
    });

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.loadFile(file);
    });

    this.codeTextarea.addEventListener('input', () => {
      const val = this.codeTextarea.value.trim();
      if (val.startsWith('<svg') || val.includes('<svg')) {
        this.parseAndDisplaySvg(val, 'custom-vector');
      }
    });

    this.scaleSelect.addEventListener('change', () => {
      const scale = parseFloat(this.scaleSelect.value);
      this.customWidthInput.value = Math.round(this.originalWidth * scale);
      this.customHeightInput.value = Math.round(this.originalHeight * scale);
    });

    this.customWidthInput.addEventListener('input', () => {
      const w = parseInt(this.customWidthInput.value, 10);
      if (w > 0 && this.originalWidth > 0) {
        this.customHeightInput.value = Math.round((w * this.originalHeight) / this.originalWidth);
      }
    });

    this.bgToggle.addEventListener('change', () => {
      this.bgColorInput.disabled = this.bgToggle.checked;
      this.bgColorInput.style.opacity = this.bgToggle.checked ? '0.4' : '1';
    });

    this.rasterizeBtn.addEventListener('click', () => this.rasterizeAndDownload());
  }

  loadFile(file) {
    this.fileName = file.name.replace(/\.[^/.]+$/, "");
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      this.codeTextarea.value = text;
      this.parseAndDisplaySvg(text, this.fileName);
    };
    reader.readAsText(file);
  }

  parseAndDisplaySvg(svgContent, name) {
    this.svgString = svgContent;
    this.fileName = name || 'vector';

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');

    if (!svgEl) {
      alert('Invalid SVG content.');
      return;
    }

    // Determine dimensions
    let w = parseFloat(svgEl.getAttribute('width'));
    let h = parseFloat(svgEl.getAttribute('height'));

    if ((!w || !h) && svgEl.hasAttribute('viewBox')) {
      const vb = svgEl.getAttribute('viewBox').split(/[\s,]+/).filter(Boolean);
      if (vb.length === 4) {
        w = parseFloat(vb[2]);
        h = parseFloat(vb[3]);
      }
    }

    this.originalWidth = Math.round(w) || 512;
    this.originalHeight = Math.round(h) || 512;

    this.customWidthInput.value = this.originalWidth;
    this.customHeightInput.value = this.originalHeight;
    this.scaleSelect.value = '1';

    if (this.svgMeta) {
      this.svgMeta.textContent = `Original: ${this.originalWidth}×${this.originalHeight}px`;
    }

    // Render Preview
    this.previewBox.innerHTML = svgContent;
    const renderedSvg = this.previewBox.querySelector('svg');
    if (renderedSvg) {
      renderedSvg.setAttribute('width', '100%');
      renderedSvg.setAttribute('height', '100%');
      renderedSvg.style.maxHeight = '280px';
    }
  }

  async rasterizeAndDownload() {
    if (!this.svgString) {
      alert('Please upload or paste an SVG first.');
      return;
    }

    const targetW = parseInt(this.customWidthInput.value, 10) || this.originalWidth;
    const targetH = parseInt(this.customHeightInput.value, 10) || this.originalHeight;
    const format = this.formatSelect.value; // 'png', 'jpeg', 'webp'
    const isTransparent = this.bgToggle.checked;
    const bgColor = this.bgColorInput.value || '#ffffff';

    const blob = new Blob([this.svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      if (!isTransparent || format === 'jpeg') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, targetW, targetH);
      }

      ctx.drawImage(img, 0, 0, targetW, targetH);
      URL.revokeObjectURL(url);

      const mimeType = `image/${format}`;
      canvas.toBlob((outBlob) => {
        const downloadUrl = URL.createObjectURL(outBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${this.fileName}_${targetW}x${targetH}.${format}`;
        a.click();
        URL.revokeObjectURL(downloadUrl);
      }, mimeType, 0.95);
    };

    img.src = url;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.vectorRasterizer = new VectorRasterizer();
});
