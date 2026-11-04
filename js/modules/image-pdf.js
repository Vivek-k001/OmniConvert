/**
 * OmniConvert Core Module: Image-to-PDF & PDF Operations
 * Pure client-side processing using jsPDF and pdf-lib
 */

class ImageToPdfConverter {
  constructor() {
    this.images = []; // Array of { id, file, dataUrl, name, size, width, height }
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.dropZone = document.getElementById('img-pdf-dropzone');
    this.fileInput = document.getElementById('img-pdf-input');
    this.previewContainer = document.getElementById('img-pdf-preview-grid');
    this.emptyState = document.getElementById('img-pdf-empty');
    this.summaryBar = document.getElementById('img-pdf-summary');
    this.convertBtn = document.getElementById('btn-convert-img-pdf');
    this.clearBtn = document.getElementById('btn-clear-img-pdf');
    this.countBadge = document.getElementById('img-pdf-count');

    // Controls
    this.pageSizeSelect = document.getElementById('pdf-page-size');
    this.orientationSelect = document.getElementById('pdf-orientation');
    this.marginSelect = document.getElementById('pdf-margin');
    this.fitSelect = document.getElementById('pdf-fit');
    this.outputFilename = document.getElementById('pdf-filename');
    this.statusContainer = document.getElementById('img-pdf-status');
  }

  initEventListeners() {
    if (!this.dropZone) return;

    // Drag and drop events
    ['dragenter', 'dragover'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, (e) => {
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

    this.clearBtn.addEventListener('click', () => this.clearAll());
    this.convertBtn.addEventListener('click', () => this.generatePdf());

    // Initialize Sortable for drag-and-drop page reordering
    if (window.Sortable && this.previewContainer) {
      new Sortable(this.previewContainer, {
        animation: 180,
        ghostClass: 'sortable-ghost',
        handle: '.drag-handle',
        onEnd: (evt) => {
          const movedItem = this.images.splice(evt.oldIndex, 1)[0];
          this.images.splice(evt.newIndex, 0, movedItem);
          this.updateBadges();
        }
      });
    }
  }

  async handleFiles(files) {
    if (!files.length) return;

    for (const file of files) {
      try {
        const item = await this.processFile(file);
        this.images.push(item);
      } catch (err) {
        console.error('Error loading image:', err);
      }
    }

    this.render();
  }

  processFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const img = new Image();
        img.onload = () => {
          resolve({
            id: 'img_' + Math.random().toString(36).substr(2, 9),
            file,
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            width: img.width,
            height: img.height,
            dataUrl: dataUrl,
            rotation: 0
          });
        };
        img.onerror = reject;
        img.src = dataUrl;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  render() {
    if (this.images.length === 0) {
      this.emptyState.classList.remove('hidden');
      this.summaryBar.classList.add('hidden');
      this.previewContainer.innerHTML = '';
      if (this.countBadge) this.countBadge.textContent = '0 files';
      return;
    }

    this.emptyState.classList.add('hidden');
    this.summaryBar.classList.remove('hidden');
    if (this.countBadge) this.countBadge.textContent = `${this.images.length} file${this.images.length > 1 ? 's' : ''}`;

    this.previewContainer.innerHTML = '';

    this.images.forEach((img, index) => {
      const card = document.createElement('div');
      card.className = 'glass-card rounded-xl p-3 flex flex-col group relative transition-all duration-200 border border-slate-700/60 hover:border-indigo-500/40';
      card.dataset.id = img.id;

      card.innerHTML = `
        <div class="relative w-full h-40 bg-slate-950/60 rounded-lg overflow-hidden flex items-center justify-center border border-white/5">
          <img src="${img.dataUrl}" alt="${img.name}" style="transform: rotate(${img.rotation}deg);" class="max-w-full max-h-full object-contain transition-transform duration-200 pointer-events-none" />
          
          <div class="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded text-xs font-semibold text-indigo-300 border border-indigo-500/30 page-badge">
            #${index + 1}
          </div>

          <div class="drag-handle absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white cursor-grab border border-white/10 active:cursor-grabbing">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" /></svg>
          </div>
        </div>

        <div class="mt-3 flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="text-xs font-medium text-slate-200 truncate" title="${img.name}">${img.name}</p>
            <p class="text-[11px] text-slate-400 font-mono">${img.width}×${img.height} • ${img.size}</p>
          </div>
        </div>

        <div class="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
          <button type="button" class="btn-rotate p-1 text-slate-400 hover:text-indigo-400 rounded hover:bg-white/5 transition" title="Rotate 90° Clockwise">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          
          <button type="button" class="btn-delete p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition" title="Remove page">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      `;

      // Event listeners for actions
      card.querySelector('.btn-rotate').addEventListener('click', () => {
        img.rotation = (img.rotation + 90) % 360;
        const imgEl = card.querySelector('img');
        imgEl.style.transform = `rotate(${img.rotation}deg)`;
      });

      card.querySelector('.btn-delete').addEventListener('click', () => {
        this.images = this.images.filter(item => item.id !== img.id);
        this.render();
      });

      this.previewContainer.appendChild(card);
    });
  }

  updateBadges() {
    const badges = this.previewContainer.querySelectorAll('.page-badge');
    badges.forEach((b, idx) => {
      b.textContent = `#${idx + 1}`;
    });
  }

  clearAll() {
    this.images = [];
    this.render();
  }

  async generatePdf() {
    if (this.images.length === 0) return;

    const btn = this.convertBtn;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Compiling PDF...
    `;

    try {
      const { jsPDF } = window.jspdf;
      const pageSize = this.pageSizeSelect.value; // 'a4', 'letter', 'original'
      const orientationSetting = this.orientationSelect.value; // 'auto', 'portrait', 'landscape'
      const marginMm = parseFloat(this.marginSelect.value) || 0;
      const fitMode = this.fitSelect.value; // 'fit', 'stretch', 'fill'

      let doc = null;

      for (let i = 0; i < this.images.length; i++) {
        const item = this.images[i];
        
        // Prepare rotated canvas if rotation != 0
        let imgData = item.dataUrl;
        let imgWidth = item.width;
        let imgHeight = item.height;

        if (item.rotation % 360 !== 0) {
          const rotated = await this.rotateImageData(item.dataUrl, item.rotation);
          imgData = rotated.dataUrl;
          imgWidth = rotated.width;
          imgHeight = rotated.height;
        }

        // Determine Page Orientation
        let pageOrientation = 'p';
        if (orientationSetting === 'portrait') {
          pageOrientation = 'p';
        } else if (orientationSetting === 'landscape') {
          pageOrientation = 'l';
        } else {
          // Auto: match image aspect ratio
          pageOrientation = imgWidth > imgHeight ? 'l' : 'p';
        }

        // Configure Page Dimensions
        let pageWidthMm, pageHeightMm;
        if (pageSize === 'original') {
          // 1 px = 0.264583 mm
          pageWidthMm = imgWidth * 0.264583;
          pageHeightMm = imgHeight * 0.264583;
          pageOrientation = pageWidthMm > pageHeightMm ? 'l' : 'p';
        } else {
          // standard dimensions for A4 / Letter in mm
          const stdDim = pageSize === 'letter' ? [215.9, 279.4] : [210, 297]; // A4 default
          if (pageOrientation === 'l') {
            pageWidthMm = stdDim[1];
            pageHeightMm = stdDim[0];
          } else {
            pageWidthMm = stdDim[0];
            pageHeightMm = stdDim[1];
          }
        }

        // Initialize or Add Page
        if (i === 0) {
          doc = new jsPDF({
            orientation: pageOrientation,
            unit: 'mm',
            format: pageSize === 'original' ? [pageWidthMm, pageHeightMm] : pageSize
          });
        } else {
          doc.addPage(
            pageSize === 'original' ? [pageWidthMm, pageHeightMm] : pageSize,
            pageOrientation
          );
        }

        // Calculate Image Rendering bounds
        const availableWidth = pageWidthMm - (marginMm * 2);
        const availableHeight = pageHeightMm - (marginMm * 2);

        let renderWidth = availableWidth;
        let renderHeight = availableHeight;
        let renderX = marginMm;
        let renderY = marginMm;

        if (fitMode === 'fit') {
          const imgRatio = imgWidth / imgHeight;
          const pageRatio = availableWidth / availableHeight;

          if (imgRatio > pageRatio) {
            renderWidth = availableWidth;
            renderHeight = availableWidth / imgRatio;
            renderY = marginMm + (availableHeight - renderHeight) / 2;
          } else {
            renderHeight = availableHeight;
            renderWidth = availableHeight * imgRatio;
            renderX = marginMm + (availableWidth - renderWidth) / 2;
          }
        }

        const format = item.file.type === 'image/png' ? 'PNG' : 'JPEG';
        doc.addImage(imgData, format, renderX, renderY, renderWidth, renderHeight, undefined, 'FAST');
      }

      const filename = (this.outputFilename.value.trim() || 'omniconvert-document') + '.pdf';
      doc.save(filename);
      this.showToast(`✨ Generated ${filename} successfully!`, 'success');
    } catch (err) {
      console.error('PDF Generation Failed:', err);
      this.showToast('Failed to generate PDF: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  rotateImageData(dataUrl, degrees) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const rads = (degrees * Math.PI) / 180;
        const sin = Math.abs(Math.sin(rads));
        const cos = Math.abs(Math.cos(rads));

        canvas.width = img.width * cos + img.height * sin;
        canvas.height = img.width * sin + img.height * cos;

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rads);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', 0.95),
          width: canvas.width,
          height: canvas.height
        });
      };
      img.src = dataUrl;
    });
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colorClass = type === 'success' ? 'bg-emerald-600/90 border-emerald-400' : 'bg-rose-600/90 border-rose-400';
    toast.className = `fixed bottom-6 right-6 ${colorClass} text-white px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md border text-sm font-medium z-50 flex items-center gap-2 transform transition-all duration-300 translate-y-4 opacity-0`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  window.imageToPdfConverter = new ImageToPdfConverter();
});
