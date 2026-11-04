/**
 * OmniConvert Core Module: Markdown & Text to Document/PDF Converter
 * Uses marked.js for Markdown parsing and html2pdf / jsPDF for client-side document creation
 */

class MarkdownToPdfConverter {
  constructor() {
    this.initElements();
    this.initEventListeners();
    this.loadSample();
  }

  initElements() {
    this.mdInput = document.getElementById('md-editor-input');
    this.mdPreview = document.getElementById('md-preview-pane');
    this.docTitleInput = document.getElementById('doc-title-input');
    this.themeSelect = document.getElementById('md-theme-select');
    this.btnExportPdf = document.getElementById('btn-export-md-pdf');
    this.btnExportHtml = document.getElementById('btn-export-md-html');
    this.fileUpload = document.getElementById('md-file-upload');
  }

  initEventListeners() {
    if (!this.mdInput) return;

    this.mdInput.addEventListener('input', () => this.updatePreview());
    this.themeSelect.addEventListener('change', () => this.updateTheme());
    this.btnExportPdf.addEventListener('click', () => this.exportToPdf());
    this.btnExportHtml.addEventListener('click', () => this.exportToHtml());

    this.fileUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          this.mdInput.value = evt.target.result;
          this.docTitleInput.value = file.name.replace(/\.[^/.]+$/, "");
          this.updatePreview();
        };
        reader.readAsText(file);
      }
    });
  }

  loadSample() {
    if (!this.mdInput) return;
    this.mdInput.value = `# OmniConvert Project Brief 🚀

Welcome to **OmniConvert** — the private, zero-server file converter that runs entirely in your web browser!

---

### Key Capabilities:
1. **Zero Uploads**: All processing stays locally inside WebAssembly & Canvas.
2. **Lightning Fast**: No network overhead or waitlists.
3. **Multi-Format Support**:
   - \`Image to PDF\`
   - \`SVG to Raster (PNG/JPG/WebP)\`
   - \`Markdown & Docs to PDF\`
   - \`Client-Side Image Optimization\`

### Sample Code Snippet:
\`\`\`javascript
// Client-side image compression with Canvas API
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.drawImage(img, 0, 0, width, height);
canvas.toBlob(blob => download(blob), 'image/webp', 0.85);
\`\`\`

> *"True privacy means your data never leaves your computer."*
`;
    this.updatePreview();
  }

  updatePreview() {
    if (!this.mdPreview || !window.marked) return;
    const raw = this.mdInput.value;
    const html = window.marked.parse(raw);
    this.mdPreview.innerHTML = html;
  }

  updateTheme() {
    const theme = this.themeSelect.value;
    this.mdPreview.className = `prose max-w-none p-8 transition-colors duration-200 ${
      theme === 'dark' 
        ? 'prose-invert bg-slate-900 text-slate-100' 
        : theme === 'sepia' 
        ? 'bg-[#fbf0d9] text-[#433422] prose-stone' 
        : 'bg-white text-slate-900'
    }`;
  }

  async exportToPdf() {
    if (!this.mdPreview) return;
    const originalText = this.btnExportPdf.innerHTML;
    this.btnExportPdf.disabled = true;
    this.btnExportPdf.innerHTML = `Compiling PDF...`;

    const title = (this.docTitleInput.value.trim() || 'omniconvert-document') + '.pdf';

    const element = this.mdPreview;
    const opt = {
      margin:       [12, 12, 12, 12],
      filename:     title,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      if (window.html2pdf) {
        await window.html2pdf().set(opt).from(element).save();
      } else {
        alert('PDF generator library not loaded.');
      }
    } catch (err) {
      console.error('Failed to export Markdown to PDF:', err);
      alert('Error creating document: ' + err.message);
    } finally {
      this.btnExportPdf.disabled = false;
      this.btnExportPdf.innerHTML = originalText;
    }
  }

  exportToHtml() {
    const title = this.docTitleInput.value.trim() || 'omniconvert-document';
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tailwindcss/typography@0.5.10/dist/typography.min.css">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6; }
    pre { background: #1e293b; color: #f8fafc; padding: 1rem; border-radius: 8px; overflow-x: auto; }
    code { font-family: monospace; }
  </style>
</head>
<body>
  ${this.mdPreview.innerHTML}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${title}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.markdownToPdfConverter = new MarkdownToPdfConverter();
});
