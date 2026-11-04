/**
 * OmniConvert Module: EXIF & Privacy Metadata Stripper
 * Scrubs GPS, device models, timestamps, and camera serials entirely in-browser
 */

class MetadataStripper {
  constructor() {
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.dropZone = document.getElementById('exif-dropzone');
    this.fileInput = document.getElementById('exif-input');
    this.previewBox = document.getElementById('exif-preview');
    this.infoBox = document.getElementById('exif-details');
    this.downloadBtn = document.getElementById('btn-download-sanitized');
    this.currentCleanBlob = null;
    this.currentFileName = 'sanitized.jpg';
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
      if (file) this.processFile(file);
    });

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.processFile(file);
    });

    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => {
        if (!this.currentCleanBlob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(this.currentCleanBlob);
        a.download = `sanitized_${this.currentFileName}`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
    }
  }

  processFile(file) {
    this.currentFileName = file.name;
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Strip EXIF by redrawing cleanly onto an isolated canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          this.currentCleanBlob = blob;
          if (this.downloadBtn) this.downloadBtn.disabled = false;
          
          if (this.infoBox) {
            this.infoBox.innerHTML = `
              <div class="space-y-2 text-xs">
                <div class="flex justify-between border-b border-white/5 pb-1">
                  <span class="text-slate-400">Filename:</span>
                  <span class="text-slate-200 font-medium">${file.name}</span>
                </div>
                <div class="flex justify-between border-b border-white/5 pb-1">
                  <span class="text-slate-400">Dimensions:</span>
                  <span class="text-slate-200 font-mono">${img.naturalWidth} × ${img.naturalHeight}px</span>
                </div>
                <div class="flex justify-between border-b border-white/5 pb-1">
                  <span class="text-slate-400">GPS / Location tags:</span>
                  <span class="text-emerald-400 font-semibold">SCRUBBED (0 bytes)</span>
                </div>
                <div class="flex justify-between border-b border-white/5 pb-1">
                  <span class="text-slate-400">Camera & Device EXIF:</span>
                  <span class="text-emerald-400 font-semibold">REMOVED</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Privacy Status:</span>
                  <span class="text-emerald-300 font-bold">100% Sanitized</span>
                </div>
              </div>
            `;
          }

          if (this.previewBox) {
            this.previewBox.innerHTML = `<img src="${URL.createObjectURL(blob)}" class="max-h-48 rounded-lg object-contain" />`;
          }
        }, file.type || 'image/jpeg', 0.95);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.metadataStripper = new MetadataStripper();
});
