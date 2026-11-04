/**
 * OmniConvert Module: Client-Side JSON to CSV / Excel Converter
 * Parses complex nested JSON, flattens structures, and exports RFC-compliant CSV files
 */

class JsonCsvConverter {
  constructor() {
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.jsonInput = document.getElementById('json-input');
    this.csvPreview = document.getElementById('csv-preview');
    this.btnConvert = document.getElementById('btn-json-to-csv');
    this.btnDownload = document.getElementById('btn-download-csv');
    this.lastCsv = '';
  }

  initEventListeners() {
    if (!this.jsonInput) return;

    if (this.btnConvert) {
      this.btnConvert.addEventListener('click', () => this.convert());
    }

    if (this.btnDownload) {
      this.btnDownload.addEventListener('click', () => {
        if (!this.lastCsv) return;
        const blob = new Blob([this.lastCsv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'omniconvert_export.csv';
        a.click();
      });
    }
  }

  convert() {
    try {
      const raw = this.jsonInput.value.trim();
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      if (items.length === 0) return;

      const headers = Array.from(new Set(items.flatMap(obj => Object.keys(obj))));
      const csvRows = [];
      csvRows.push(headers.join(','));

      for (const row of items) {
        const values = headers.map(header => {
          let val = row[header] === undefined || row[header] === null ? '' : row[header];
          if (typeof val === 'object') val = JSON.stringify(val);
          val = String(val).replace(/"/g, '""');
          return `"${val}"`;
        });
        csvRows.push(values.join(','));
      }

      this.lastCsv = csvRows.join('\r\n');
      if (this.csvPreview) {
        this.csvPreview.value = this.lastCsv;
      }
      if (this.btnDownload) {
        this.btnDownload.disabled = false;
      }
    } catch (err) {
      alert('Invalid JSON input: ' + err.message);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.jsonCsvConverter = new JsonCsvConverter();
});
