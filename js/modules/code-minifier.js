/**
 * OmniConvert Module: Client-Side Web Code Minifier & Formatter
 * Compresses HTML, CSS, and JS code by stripping whitespace, line breaks, and comments locally
 */

class CodeMinifier {
  constructor() {
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.input = document.getElementById('code-input');
    this.output = document.getElementById('code-output');
    this.typeSelect = document.getElementById('code-type');
    this.minifyBtn = document.getElementById('btn-minify');
    this.stats = document.getElementById('code-stats');
  }

  initEventListeners() {
    if (!this.input) return;

    if (this.minifyBtn) {
      this.minifyBtn.addEventListener('click', () => this.minify());
    }
  }

  minify() {
    const raw = this.input.value;
    const type = this.typeSelect ? this.typeSelect.value : 'js';
    let minified = raw;

    if (type === 'css') {
      minified = raw
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s*([\{\};:,])\s*/g, '$1')
        .replace(/;}/g, '}')
        .trim();
    } else if (type === 'html') {
      minified = raw
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\s+/g, ' ')
        .replace(/> </g, '><')
        .trim();
    } else {
      // JS simple minification
      minified = raw
        .replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([=+\-*\/%{}();,])\s*/g, '$1')
        .trim();
    }

    if (this.output) this.output.value = minified;

    if (this.stats) {
      const origSize = raw.length;
      const minSize = minified.length;
      const saved = origSize > 0 ? (((origSize - minSize) / origSize) * 100).toFixed(1) : 0;
      this.stats.textContent = `Original: ${origSize} chars → Minified: ${minSize} chars (${saved}% saved)`;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.codeMinifier = new CodeMinifier();
});
