/**
 * OmniConvert Core Module: Image-to-PDF Converter
 * Clean, minimal, zero-server architecture
 */

class ImageToPdfConverter {
  constructor() {
    this.images = [];
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

    // Confirm Modal Elements
    this.modal = document.getElementById('filename-confirm-modal');
    this.modalInput = document.getElementById('modal-filename-input');
    this.modalConfirmBtn = document.getElementById('btn-modal-confirm-download');
    this.modalCancelBtn = document.getElementById('btn-modal-cancel');
    this.modalKeepDefaultBtn = document.getElementById('btn-modal-keep-default');
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

    this.clearBtn.addEventListener('click', () => this.clearAll());
    
    // Convert button triggers confirmation modal if filename is empty/untitled
    this.convertBtn.addEventListener('click', () => this.onGenerateClick());

    if (this.modalCancelBtn) {
      this.modalCancelBtn.addEventListener('click', () => this.closeModal());
    }

    if (this.modalConfirmBtn) {
      this.modalConfirmBtn.addEventListener('click', () => {
        const val = this.modalInput.value.trim();
        if (val) {
          this.outputFilename.value = val;
        }
        this.closeModal();
        this.generatePdf();
      });
    }

    if (this.modalKeepDefaultBtn) {
      this.modalKeepDefaultBtn.addEventListener('click', () => {
        this.closeModal();
        this.generatePdf();
      });
    }

    // Sortable drag-and-drop
    if (window.Sortable && this.previewContainer) {
      new Sortable(this.previewContainer, {
        animation: 160,
        ghostClass: 'sortable-ghost',
        handle: '.drag-handle',
        onEnd: (evt) => {
          const moved = this.images.splice(evt.oldIndex, 1)[0];
          this.images.splice(evt.newIndex, 0, moved);
          this.updateBadges();
        }
      });
    }
  }

  onGenerateClick() {
    if (this.images.length === 0) {
      this.showToast('Please add at least one image first', 'error');
      return;
    }

    const currentName = this.outputFilename.value.trim();
    // Prompt confirmation if filename is blank or contains untitled
    if (!currentName || currentName.toLowerCase().includes('untitled')) {
      this.openModal(currentName || 'untitled-1');
    } else {
      this.generatePdf();
    }
  }

  openModal(defaultName) {
    if (!this.modal) {
      this.generatePdf();
      return;
    }
    this.modalInput.value = defaultName;
    this.modal.classList.remove('hidden');
    this.modal.classList.add('flex');
    this.modalInput.focus();
    this.modalInput.select();
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
    this.modal.classList.remove('flex');
  }

  async handleFiles(files) {
    if (!files.length) return;

    for (const file of files) {
      try {
        const item = await this.processFile(file);
        this.images.push(item);
      } catch (err) {
        console.error('File load error:', err);
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
      card.className = 'surface-elevated rounded-xl p-3 flex flex-col group relative transition-all duration-150 border border-white/5 hover:border-white/20';
      card.dataset.id = img.id;

      card.innerHTML = `
        <div class="relative w-full h-36 bg-[#090b0e] rounded-lg overflow-hidden flex items-center justify-center border border-white/5">
          <img src="${img.dataUrl}" alt="${img.name}" style="transform: rotate(${img.rotation}deg);" class="max-w-full max-h-full object-contain pointer-events-none transition-transform duration-150" />
          
          <div class="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-mono font-medium text-slate-300 border border-white/10 page-badge">
            #${index + 1}
          </div>

          <div class="drag-handle absolute top-2 right-2 p-1.5 rounded-md bg-black/70 backdrop-blur-md text-slate-400 hover:text-white cursor-grab active:cursor-grabbing border border-white/10" title="Drag to reorder">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" /></svg>
          </div>
        </div>

        <div class="mt-2.5 flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-slate-200 truncate" title="${img.name}">${img.name}</p>
            <p class="text-[11px] text-slate-500 font-mono mt-0.5">${img.width}×${img.height} • ${img.size}</p>
          </div>
        </div>

        <div class="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
          <button type="button" class="btn-rotate p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 transition flex items-center gap-1" title="Rotate 90°">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            <span class="text-[10px]">Rotate</span>
          </button>
          
          <button type="button" class="btn-delete p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition" title="Remove page">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      `;

      card.querySelector('.btn-rotate').addEventListener('click', () => {
        img.rotation = (img.rotation + 90) % 360;
        card.querySelector('img').style.transform = `rotate(${img.rotation}deg)`;
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
    btn.innerHTML = `Compiling...`;

    try {
      const { jsPDF } = window.jspdf;
      const pageSize = this.pageSizeSelect.value;
      const orientationSetting = this.orientationSelect.value;
      const marginMm = parseFloat(this.marginSelect.value) || 0;
      const fitMode = this.fitSelect.value;

      let doc = null;

      for (let i = 0; i < this.images.length; i++) {
        const item = this.images[i];
        
        let imgData = item.dataUrl;
        let imgWidth = item.width;
        let imgHeight = item.height;

        if (item.rotation % 360 !== 0) {
          const rotated = await this.rotateImageData(item.dataUrl, item.rotation);
          imgData = rotated.dataUrl;
          imgWidth = rotated.width;
          imgHeight = rotated.height;
        }

        let pageOrientation = 'p';
        if (orientationSetting === 'portrait') {
          pageOrientation = 'p';
        } else if (orientationSetting === 'landscape') {
          pageOrientation = 'l';
        } else {
          pageOrientation = imgWidth > imgHeight ? 'l' : 'p';
        }

        let pageWidthMm, pageHeightMm;
        if (pageSize === 'original') {
          pageWidthMm = imgWidth * 0.264583;
          pageHeightMm = imgHeight * 0.264583;
          pageOrientation = pageWidthMm > pageHeightMm ? 'l' : 'p';
        } else {
          const stdDim = pageSize === 'letter' ? [215.9, 279.4] : [210, 297];
          if (pageOrientation === 'l') {
            pageWidthMm = stdDim[1];
            pageHeightMm = stdDim[0];
          } else {
            pageWidthMm = stdDim[0];
            pageHeightMm = stdDim[1];
          }
        }

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

      const inputVal = this.outputFilename.value.trim();
      const filename = (inputVal || 'untitled-1') + '.pdf';
      doc.save(filename);
      this.showToast(`Saved ${filename}`, 'success');
    } catch (err) {
      console.error('PDF Generation Failed:', err);
      this.showToast('Error: ' + err.message, 'error');
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
    const colorClass = type === 'success' 
      ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200' 
      : 'bg-rose-950/90 border-rose-800 text-rose-200';
    toast.className = `fixed bottom-6 right-6 ${colorClass} px-4 py-2.5 rounded-lg shadow-xl border text-xs font-mono z-50 transition-all duration-200 translate-y-2 opacity-0`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
    setTimeout(() => {
      toast.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => toast.remove(), 200);
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.imageToPdfConverter = new ImageToPdfConverter();
});
