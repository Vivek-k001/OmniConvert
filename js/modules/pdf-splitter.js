/**
 * OmniConvert Module: PDF Splitter & Page Extractor
 * Uses pdf-lib in-browser to parse pages, preview, and extract ranges
 */

class PdfSplitter {
  constructor() {
    this.pdfBytes = null;
    this.pdfDoc = null;
    this.selectedPages = new Set();
    this.pageCount = 0;
    this.fileName = 'document';
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.dropZone = document.getElementById('pdf-split-dropzone');
    this.fileInput = document.getElementById('pdf-split-input');
    this.pageGrid = document.getElementById('pdf-split-grid');
    this.rangeInput = document.getElementById('pdf-split-range');
    this.btnExtract = document.getElementById('btn-extract-pdf');
    this.btnSelectAll = document.getElementById('btn-split-select-all');
    this.btnClear = document.getElementById('btn-split-clear');
    this.emptyState = document.getElementById('pdf-split-empty');
    this.controls = document.getElementById('pdf-split-controls');
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
      const file = Array.from(e.dataTransfer.files).find(f => f.name.endsWith('.pdf'));
      if (file) this.loadFile(file);
    });

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.loadFile(file);
    });

    if (this.btnSelectAll) {
      this.btnSelectAll.addEventListener('click', () => {
        for (let i = 1; i <= this.pageCount; i++) this.selectedPages.add(i);
        this.updateCheckboxes();
      });
    }

    if (this.btnClear) {
      this.btnClear.addEventListener('click', () => {
        this.selectedPages.clear();
        this.updateCheckboxes();
      });
    }

    if (this.rangeInput) {
      this.rangeInput.addEventListener('input', () => this.parseRangeInput());
    }

    if (this.btnExtract) {
      this.btnExtract.addEventListener('click', () => this.extractSelectedPages());
    }
  }

  async loadFile(file) {
    this.fileName = file.name.replace(/\.[^/.]+$/, '');
    this.pdfBytes = await file.arrayBuffer();

    try {
      const { PDFDocument } = window.PDFLib;
      this.pdfDoc = await PDFDocument.load(this.pdfBytes);
      this.pageCount = this.pdfDoc.getPageCount();
      this.selectedPages.clear();
      
      // Default: select all
      for (let i = 1; i <= this.pageCount; i++) this.selectedPages.add(i);

      if (this.emptyState) this.emptyState.classList.add('hidden');
      if (this.controls) this.controls.classList.remove('hidden');
      this.renderPages();
    } catch (err) {
      console.error('PDF load error:', err);
      alert('Error parsing PDF: ' + err.message);
    }
  }

  renderPages() {
    if (!this.pageGrid) return;
    this.pageGrid.innerHTML = '';

    for (let p = 1; p <= this.pageCount; p++) {
      const isSelected = this.selectedPages.has(p);
      const card = document.createElement('div');
      card.className = `ios-card p-3 flex flex-col items-center justify-center cursor-pointer transition-all border ${isSelected ? 'border-[#e50914] bg-[#e50914]/5' : 'border-[var(--border)]'}`;
      card.dataset.page = p;

      card.innerHTML = `
        <div class="w-16 h-20 rounded-md bg-[var(--pill-bg)] border border-[var(--border)] flex items-center justify-center mb-2">
          <span class="text-xs font-mono text-[var(--text-muted)]">P. ${p}</span>
        </div>
        <div class="flex items-center gap-1.5 text-xs">
          <input type="checkbox" ${isSelected ? 'checked' : ''} class="rounded text-[#e50914] pointer-events-none" />
          <span class="font-medium text-[var(--text-main)]">Page ${p}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        if (this.selectedPages.has(p)) {
          this.selectedPages.delete(p);
        } else {
          this.selectedPages.add(p);
        }
        this.updateCheckboxes();
      });

      this.pageGrid.appendChild(card);
    }
    this.updateRangeInputText();
  }

  updateCheckboxes() {
    const cards = this.pageGrid.querySelectorAll('[data-page]');
    cards.forEach(c => {
      const p = parseInt(c.dataset.page, 10);
      const isSelected = this.selectedPages.has(p);
      c.className = `ios-card p-3 flex flex-col items-center justify-center cursor-pointer transition-all border ${isSelected ? 'border-[#e50914] bg-[#e50914]/5' : 'border-[var(--border)]'}`;
      c.querySelector('input').checked = isSelected;
    });
    this.updateRangeInputText();
  }

  updateRangeInputText() {
    if (!this.rangeInput) return;
    const sorted = Array.from(this.selectedPages).sort((a,b) => a-b);
    this.rangeInput.value = sorted.join(', ');
  }

  parseRangeInput() {
    const val = this.rangeInput.value.trim();
    if (!val) return;
    this.selectedPages.clear();
    const parts = val.split(',');
    parts.forEach(part => {
      part = part.trim();
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
        if (start && end) {
          for (let i = start; i <= Math.min(end, this.pageCount); i++) this.selectedPages.add(i);
        }
      } else {
        const num = parseInt(part, 10);
        if (num && num <= this.pageCount) this.selectedPages.add(num);
      }
    });
    this.updateCheckboxes();
  }

  async extractSelectedPages() {
    if (!this.pdfDoc || this.selectedPages.size === 0) {
      alert('Select at least one page to extract.');
      return;
    }

    const { PDFDocument } = window.PDFLib;
    const newDoc = await PDFDocument.create();
    const sortedIndices = Array.from(this.selectedPages).sort((a,b) => a-b).map(p => p - 1);

    const copiedPages = await newDoc.copyPages(this.pdfDoc, sortedIndices);
    copiedPages.forEach(page => newDoc.addPage(page));

    const newPdfBytes = await newDoc.save();
    const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${this.fileName}_extracted.pdf`;
    a.click();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.pdfSplitter = new PdfSplitter();
});

