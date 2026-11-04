/**
 * OmniConvert Module: Base64 / Data URI Studio
 * Converts files/images into clean base64 data URIs for embedding in HTML/CSS, and decodes them back
 */

class Base64Studio {
  constructor() {
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.dropZone = document.getElementById('b64-dropzone');
    this.fileInput = document.getElementById('b64-input');
    this.textArea = document.getElementById('b64-output');
    this.copyBtn = document.getElementById('btn-copy-b64');
    this.previewBox = document.getElementById('b64-preview');
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
      const file = e.dataTransfer.files[0];
      if (file) this.encodeFile(file);
    });

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.encodeFile(file);
    });

    if (this.textArea) {
      this.textArea.addEventListener('input', () => {
        const str = this.textArea.value.trim();
        if (str.startsWith('data:image/')) {
          this.previewBox.innerHTML = `<img src="${str}" class="max-h-48 rounded object-contain" />`;
        }
      });
    }

    if (this.copyBtn) {
      this.copyBtn.addEventListener('click', () => {
        if (!this.textArea) return;
        navigator.clipboard.writeText(this.textArea.value);
        this.copyBtn.textContent = 'Copied!';
        setTimeout(() => { this.copyBtn.textContent = 'Copy Data URI'; }, 2000);
      });
    }
  }

  encodeFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const uri = e.target.result;
      if (this.textArea) this.textArea.value = uri;
      if (this.previewBox && file.type.startsWith('image/')) {
        this.previewBox.innerHTML = `<img src="${uri}" class="max-h-48 rounded object-contain" />`;
      }
    };
    reader.readAsDataURL(file);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.base64Studio = new Base64Studio();
});
