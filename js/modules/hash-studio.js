/**
 * OmniConvert Module: Web Crypto File & String Hash Checksum Studio
 * Generates SHA-256, SHA-384, SHA-512, and SHA-1 checksums natively via window.crypto.subtle
 */

class CryptoHashStudio {
  constructor() {
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.dropZone = document.getElementById('hash-dropzone');
    this.fileInput = document.getElementById('hash-input');
    this.textInput = document.getElementById('hash-string-input');
    this.outputBox = document.getElementById('hash-results');
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
      if (file) this.hashFile(file);
    });

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.hashFile(file);
    });

    if (this.textInput) {
      this.textInput.addEventListener('input', () => this.hashString(this.textInput.value));
    }
  }

  async hashFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    this.computeAllHashes(arrayBuffer, file.name);
  }

  async hashString(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    this.computeAllHashes(data.buffer, 'Text Input');
  }

  async computeAllHashes(buffer, label) {
    const algorithms = ['SHA-256', 'SHA-512', 'SHA-384', 'SHA-1'];
    const results = {};

    for (const algo of algorithms) {
      const hashBuffer = await crypto.subtle.digest(algo, buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      results[algo] = hashHex;
    }

    if (this.outputBox) {
      this.outputBox.innerHTML = `
        <div class="space-y-3 text-xs">
          <p class="font-semibold text-slate-200">${label}</p>
          ${Object.entries(results).map(([algo, hash]) => `
            <div>
              <span class="text-indigo-400 font-bold block mb-0.5">${algo}:</span>
              <div class="flex items-center gap-2">
                <input type="text" readonly value="${hash}" class="glass-input w-full p-2 rounded font-mono text-[11px]" />
                <button onclick="navigator.clipboard.writeText('${hash}')" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] text-slate-300">Copy</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.cryptoHashStudio = new CryptoHashStudio();
});
