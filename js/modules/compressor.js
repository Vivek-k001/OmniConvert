/**
 * OmniConvert Core Module: Image Compressor & Format Converter
 * Accurate byte difference calculation and format handling
 */

class ImageCompressor {
  constructor() {
    this.items = [];
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.dropZone = document.getElementById('compress-dropzone');
    this.fileInput = document.getElementById('compress-input');
    this.previewContainer = document.getElementById('compress-preview-grid');
    this.emptyState = document.getElementById('compress-empty');
    this.summaryBar = document.getElementById('compress-summary');
    this.clearBtn = document.getElementById('btn-clear-compress');
    this.downloadAllBtn = document.getElementById('btn-download-compress');
    this.qualitySlider = document.getElementById('compress-quality');
    this.qualityVal = document.getElementById('compress-quality-val');
    this.formatSelect = document.getElementById('compress-format');
    this.maxDimInput = document.getElementById('compress-max-dim');
    this.formatHint = document.getElementById('compress-format-hint');
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
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      this.handleFiles(files);
    });

    this.fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      this.handleFiles(files);
      this.fileInput.value = '';
    });

    this.qualitySlider.addEventListener('input', (e) => {
      this.qualityVal.textContent = `${e.target.value}%`;
      this.recompressAll();
    });

    this.formatSelect.addEventListener('change', () => {
      const fmt = this.formatSelect.value;
      if (this.formatHint) {
        if (fmt === 'image/png') {
          this.formatHint.textContent = 'ℹ️ Note: PNG is uncompressed/lossless. Re-encoding compressed WebP/JPG to PNG often increases file size.';
          this.formatHint.classList.remove('hidden');
        } else {
          this.formatHint.classList.add('hidden');
        }
      }
      this.recompressAll();
    });

    this.maxDimInput.addEventListener('change', () => this.recompressAll());
    this.clearBtn.addEventListener('click', () => this.clearAll());
    this.downloadAllBtn.addEventListener('click', () => this.downloadAll());
  }

  async handleFiles(files) {
    if (!files.length) return;

    for (const file of files) {
      try {
        const item = await this.loadImageItem(file);
        this.items.push(item);
        await this.compressItem(item);
      } catch (err) {
        console.error('Compressor file load error:', err);
      }
    }

    this.render();
  }

  loadImageItem(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            id: 'cmp_' + Math.random().toString(36).substr(2, 9),
            file,
            name: file.name,
            originalSize: file.size,
            originalImg: img,
            width: img.width,
            height: img.height,
            previewUrl: e.target.result,
            compressedBlob: null,
            compressedSize: 0,
            percentChange: 0
          });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async compressItem(item) {
    const quality = parseFloat(this.qualitySlider.value) / 100;
    const format = this.formatSelect.value;
    const maxDimension = parseInt(this.maxDimInput.value, 10) || 0;

    let targetWidth = item.width;
    let targetHeight = item.height;

    if (maxDimension > 0 && (targetWidth > maxDimension || targetHeight > maxDimension)) {
      if (targetWidth > targetHeight) {
        targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
        targetWidth = maxDimension;
      } else {
        targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
        targetHeight = maxDimension;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    ctx.drawImage(item.originalImg, 0, 0, targetWidth, targetHeight);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        item.compressedBlob = blob;
        item.compressedSize = blob.size;
        
        // Exact mathematical calculation:
        // Negative delta means file got smaller (saved)
        // Positive delta means file got larger
        const delta = ((blob.size - item.originalSize) / item.originalSize) * 100;
        item.percentChange = delta;
        item.newWidth = targetWidth;
        item.newHeight = targetHeight;
        resolve();
      }, format, quality);
    });
  }

  async recompressAll() {
    if (!this.items.length) return;
    for (const item of this.items) {
      await this.compressItem(item);
    }
    this.render();
  }

  formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }

  render() {
    if (this.items.length === 0) {
      this.emptyState.classList.remove('hidden');
      this.summaryBar.classList.add('hidden');
      this.previewContainer.innerHTML = '';
      return;
    }

    this.emptyState.classList.add('hidden');
    this.summaryBar.classList.remove('hidden');
    this.previewContainer.innerHTML = '';

    let totalOriginal = 0;
    let totalCompressed = 0;

    this.items.forEach((item) => {
      totalOriginal += item.originalSize;
      totalCompressed += item.compressedSize;

      const card = document.createElement('div');
      card.className = 'surface-elevated rounded-xl p-3 flex flex-col justify-between border border-white/5 hover:border-white/15 transition-all';
      
      const isSmaller = item.compressedSize < item.originalSize;
      const absPercent = Math.abs(item.percentChange).toFixed(1);
      
      // Clear visual distinction: Green for reduction, Amber for increase
      const badge = isSmaller
        ? `<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[11px] font-mono font-medium">-${absPercent}%</span>`
        : `<span class="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded text-[11px] font-mono font-medium">+${absPercent}%</span>`;

      card.innerHTML = `
        <div>
          <div class="relative w-full h-36 bg-[#090b0e] rounded-lg overflow-hidden flex items-center justify-center border border-white/5">
            <img src="${item.previewUrl}" alt="${item.name}" class="max-w-full max-h-full object-contain pointer-events-none" />
            <div class="absolute top-2 right-2">
              ${badge}
            </div>
          </div>
          <div class="mt-2.5">
            <p class="text-xs font-medium text-slate-200 truncate" title="${item.name}">${item.name}</p>
            <div class="mt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>${this.formatBytes(item.originalSize)}</span>
              <span class="text-slate-600">→</span>
              <span class="${isSmaller ? 'text-emerald-400 font-medium' : 'text-amber-300 font-medium'}">${this.formatBytes(item.compressedSize)}</span>
            </div>
          </div>
        </div>

        <div class="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
          <button type="button" class="btn-download-one flex-1 py-1.5 px-3 rounded-lg bg-white text-black hover:bg-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Save
          </button>
          <button type="button" class="btn-remove-one p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition" title="Remove">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      `;

      card.querySelector('.btn-download-one').addEventListener('click', () => this.downloadSingle(item));
      card.querySelector('.btn-remove-one').addEventListener('click', () => {
        this.items = this.items.filter(i => i.id !== item.id);
        this.render();
      });

      this.previewContainer.appendChild(card);
    });

    const statsEl = document.getElementById('compress-total-stats');
    if (statsEl) {
      const netSavings = (((totalOriginal - totalCompressed) / totalOriginal) * 100).toFixed(1);
      const isSaved = totalCompressed <= totalOriginal;
      statsEl.innerHTML = `
        <span class="text-slate-400">Total:</span> 
        <span class="text-slate-300 font-mono">${this.formatBytes(totalOriginal)}</span> 
        <span class="text-slate-600">→</span> 
        <span class="font-mono ${isSaved ? 'text-emerald-400 font-medium' : 'text-amber-300 font-medium'}">${this.formatBytes(totalCompressed)}</span>
        <span class="font-mono text-[11px] ${isSaved ? 'text-emerald-400' : 'text-amber-300'}">(${isSaved ? '-' + netSavings : '+' + Math.abs(netSavings)}%)</span>
      `;
    }
  }

  downloadSingle(item) {
    const ext = this.formatSelect.value.split('/')[1];
    const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
    const downloadName = `${baseName}_optimized.${ext}`;
    
    const a = document.createElement('a');
    a.href = URL.createObjectURL(item.compressedBlob);
    a.download = downloadName;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  downloadAll() {
    this.items.forEach(item => {
      this.downloadSingle(item);
    });
  }

  clearAll() {
    this.items = [];
    this.render();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.imageCompressor = new ImageCompressor();
});
