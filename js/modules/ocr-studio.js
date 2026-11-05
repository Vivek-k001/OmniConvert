/**
 * OmniConvert Module: Client-Side OCR (Image to Text)
 * Uses Tesseract.js WebAssembly entirely in-browser
 */

class ImageOcrStudio {
  constructor() {
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.dropZone = document.getElementById('ocr-dropzone');
    this.fileInput = document.getElementById('ocr-input');
    this.previewImg = document.getElementById('ocr-preview-img');
    this.outputText = document.getElementById('ocr-output-text');
    this.statusText = document.getElementById('ocr-status-text');
    this.btnCopy = document.getElementById('btn-copy-ocr');
    this.btnStart = document.getElementById('btn-start-ocr');
    this.selectedFile = null;
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
      if (file) this.loadFile(file);
    });

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.loadFile(file);
    });

    if (this.btnStart) {
      this.btnStart.addEventListener('click', () => this.runOcr());
    }

    if (this.btnCopy) {
      this.btnCopy.addEventListener('click', () => {
        if (!this.outputText) return;
        navigator.clipboard.writeText(this.outputText.value);
        this.btnCopy.textContent = 'Copied!';
        setTimeout(() => { this.btnCopy.textContent = 'Copy Text'; }, 2000);
      });
    }
  }

  loadFile(file) {
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (this.previewImg) {
        this.previewImg.src = e.target.result;
        this.previewImg.classList.remove('hidden');
      }
      if (this.btnStart) this.btnStart.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  async runOcr() {
    if (!this.selectedFile || !window.Tesseract) return;

    this.btnStart.disabled = true;
    this.statusText.textContent = 'Recognizing text via WebAssembly...';

    try {
      const { data: { text } } = await Tesseract.recognize(
        this.selectedFile,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              this.statusText.textContent = `Processing: ${Math.round(m.progress * 100)}%`;
            }
          }
        }
      );

      this.outputText.value = text;
      this.statusText.textContent = 'Recognition complete!';
    } catch (err) {
      console.error('OCR Error:', err);
      this.statusText.textContent = 'Error: ' + err.message;
    } finally {
      this.btnStart.disabled = false;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.imageOcrStudio = new ImageOcrStudio();
});

