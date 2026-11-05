/**
 * OmniConvert Module: Client-Side Archive Studio (ZIP Creator & Inspector)
 * Powered by JSZip completely in-browser
 */

class ArchiveStudio {
  constructor() {
    this.queuedFiles = [];
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.dropZone = document.getElementById('zip-dropzone');
    this.fileInput = document.getElementById('zip-input');
    this.fileList = document.getElementById('zip-file-list');
    this.btnCreateZip = document.getElementById('btn-create-zip');
    this.btnClear = document.getElementById('btn-clear-zip');
    this.zipNameInput = document.getElementById('zip-filename');
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
      const files = Array.from(e.dataTransfer.files);
      this.handleFiles(files);
    });

    this.fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      this.handleFiles(files);
      this.fileInput.value = '';
    });

    if (this.btnClear) {
      this.btnClear.addEventListener('click', () => {
        this.queuedFiles = [];
        this.renderList();
      });
    }

    if (this.btnCreateZip) {
      this.btnCreateZip.addEventListener('click', () => this.generateZip());
    }
  }

  handleFiles(files) {
    files.forEach(f => this.queuedFiles.push(f));
    this.renderList();
  }

  renderList() {
    if (!this.fileList) return;
    this.fileList.innerHTML = '';

    if (this.queuedFiles.length === 0) {
      this.fileList.innerHTML = `<p class="text-xs text-[var(--text-dim)] text-center py-4">No files queued for zip.</p>`;
      if (this.btnCreateZip) this.btnCreateZip.disabled = true;
      return;
    }

    if (this.btnCreateZip) this.btnCreateZip.disabled = false;

    this.queuedFiles.forEach((file, index) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between p-2 rounded-lg bg-[var(--pill-bg)] border border-[var(--border)] text-xs';
      row.innerHTML = `
        <div class="truncate flex-1 mr-2">
          <span class="font-medium text-[var(--text-main)]">${file.name}</span>
          <span class="font-mono text-[var(--text-dim)] ml-2">(${(file.size / 1024).toFixed(1)} KB)</span>
        </div>
        <button type="button" class="text-slate-400 hover:text-rose-400 transition" title="Remove">✕</button>
      `;

      row.querySelector('button').addEventListener('click', () => {
        this.queuedFiles.splice(index, 1);
        this.renderList();
      });

      this.fileList.appendChild(row);
    });
  }

  async generateZip() {
    if (this.queuedFiles.length === 0 || !window.JSZip) return;

    const zip = new JSZip();
    this.queuedFiles.forEach(file => {
      zip.file(file.name, file);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const name = (this.zipNameInput ? this.zipNameInput.value.trim() : '') || 'archive';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = `${name}.zip`;
    a.click();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.archiveStudio = new ArchiveStudio();
});

