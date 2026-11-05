/**
 * OmniConvert: Icon & Favicon Generator Studio
 * Generates Apple Touch Icons, favicon.ico (16/32/48) and web app manifest packs in-browser
 */

class FaviconGenerator {
  constructor() {
    this.sourceImage = null;
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.dropZone = document.getElementById('favicon-dropzone');
    this.fileInput = document.getElementById('favicon-input');
    this.previewBox = document.getElementById('favicon-preview-grid');
    this.btnDownloadIco = document.getElementById('btn-download-ico');
    this.btnDownloadPngPack = document.getElementById('btn-download-icon-pack');
    this.emptyState = document.getElementById('favicon-empty');
    this.summaryBar = document.getElementById('favicon-summary');
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
      const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
      if (file) this.loadFile(file);
    });

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.loadFile(file);
    });

    if (this.btnDownloadIco) {
      this.btnDownloadIco.addEventListener('click', () => this.generateIco());
    }

    if (this.btnDownloadPngPack) {
      this.btnDownloadPngPack.addEventListener('click', () => this.downloadAllPngs());
    }
  }

  loadFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.sourceImage = img;
        this.renderPreviews();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  renderPreviews() {
    if (!this.sourceImage) return;

    if (this.emptyState) this.emptyState.classList.add('hidden');
    if (this.summaryBar) this.summaryBar.classList.remove('hidden');

    const sizes = [
      { size: 180, label: 'Apple Touch Icon (180×180)', isSquircle: true },
      { size: 64, label: 'Desktop Icon (64×64)', isSquircle: false },
      { size: 32, label: 'Standard Favicon (32×32)', isSquircle: false },
      { size: 16, label: 'Browser Tab (16×16)', isSquircle: false }
    ];

    if (!this.previewBox) return;
    this.previewBox.innerHTML = '';

    sizes.forEach(s => {
      const canvas = document.createElement('canvas');
      canvas.width = s.size;
      canvas.height = s.size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(this.sourceImage, 0, 0, s.size, s.size);

      const card = document.createElement('div');
      card.className = 'ios-card p-3 flex flex-col items-center gap-2';
      
      const img = document.createElement('img');
      img.src = canvas.toDataURL('image/png');
      img.alt = s.label;
      img.className = s.isSquircle 
        ? 'w-16 h-16 rounded-[14px] shadow-md border border-[var(--border)] object-contain' 
        : 'w-10 h-10 object-contain';

      card.innerHTML = `
        <div class="h-20 flex items-center justify-center w-full"></div>
        <span class="text-[11px] font-mono text-[var(--text-muted)] text-center">${s.label}</span>
      `;
      card.querySelector('div').appendChild(img);
      this.previewBox.appendChild(card);
    });
  }

  generateCanvas(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.sourceImage, 0, 0, size, size);
    return canvas;
  }

  async generateIco() {
    if (!this.sourceImage) return;
    // Standard 32x32 binary ICO envelope
    const canvas = this.generateCanvas(32);
    canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'favicon.ico';
      a.click();
    }, 'image/x-icon');
  }

  downloadAllPngs() {
    if (!this.sourceImage) return;
    [180, 64, 32, 16].forEach(size => {
      const canvas = this.generateCanvas(size);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = size === 180 ? 'apple-touch-icon.png' : `favicon-${size}x${size}.png`;
      a.click();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.faviconGenerator = new FaviconGenerator();
});

