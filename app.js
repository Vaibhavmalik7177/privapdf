// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

// DOM Element References
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const workspace = document.getElementById('workspace');
const pagesGrid = document.getElementById('pages-grid');
const totalPagesLabel = document.getElementById('total-pages');
const exportBtn = document.getElementById('export-btn');
const exportText = document.getElementById('export-text');
const clearAllBtn = document.getElementById('clear-all-btn');

// State Storage: Array of objects { id, pdfLibDoc, pageIndex, thumbUrl, fileName }
let pageList = [];

// Drag and Drop Zone Event Handlers
['dragenter', 'dragover'].forEach(event => {
  dropZone.addEventListener(event, (e) => { 
    e.preventDefault(); 
    dropZone.classList.add('drag-over'); 
  });
});

['dragleave', 'drop'].forEach(event => {
  dropZone.addEventListener(event, (e) => { 
    e.preventDefault(); 
    dropZone.classList.remove('drag-over'); 
  });
});

dropZone.addEventListener('drop', (e) => {
  const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
  if (files.length > 0) processFiles(files);
});

fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  if (files.length > 0) processFiles(files);
});

// Load PDF files & Render Thumbnails into browser memory
async function processFiles(files) {
  workspace.classList.remove('hidden');

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load in PDF.js for rendering thumbnails
    const pdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
    
    // Load in pdf-lib for page copying & merging
    const pdfLibDoc = await PDFLib.PDFDocument.load(arrayBuffer);

    for (let pageNum = 1; pageNum <= pdfJsDoc.numPages; pageNum++) {
      const page = await pdfJsDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.3 }); // Thumbnail scale
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport }).promise;

      pageList.push({
        id: 'page-' + Math.random().toString(36).substr(2, 9),
        pdfLibDoc: pdfLibDoc,
        pageIndex: pageNum - 1,
        thumbUrl: canvas.toDataURL(),
        fileName: file.name
      });
    }
  }

  renderGrid();
  fileInput.value = '';
}

// Render Page Thumbnails Grid
function renderGrid() {
  pagesGrid.innerHTML = '';
  totalPagesLabel.innerText = pageList.length;

  if (pageList.length === 0) {
    workspace.classList.add('hidden');
    exportBtn.disabled = true;
    return;
  }

  exportBtn.disabled = false;

  pageList.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'bg-slate-800 border border-slate-700/60 rounded-lg p-2 flex flex-col items-center relative group';
    card.innerHTML = `
      <div class="relative w-full aspect-[1/1.4] bg-slate-950 rounded flex items-center justify-center overflow-hidden mb-2">
        <img src="${item.thumbUrl}" class="object-contain h-full w-full" />
        <button onclick="removePage(${index})" class="absolute top-1 right-1 bg-rose-600/80 hover:bg-rose-600 text-white p-1 rounded-full text-xs shadow opacity-0 group-hover:opacity-100 transition">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <span class="text-[10px] text-slate-400 font-mono">Page ${index + 1}</span>
    `;
    pagesGrid.appendChild(card);
  });
}

// Remove a single page from workspace
window.removePage = function(index) {
  pageList.splice(index, 1);
  renderGrid();
};

// Clear all pages
clearAllBtn.addEventListener('click', () => {
  pageList = [];
  renderGrid();
});

// Export / Combine PDF entirely client-side
exportBtn.addEventListener('click', async () => {
  if (pageList.length === 0) return;

  exportBtn.disabled = true;
  exportText.innerText = "Processing inside browser memory...";

  try {
    const outputPdf = await PDFLib.PDFDocument.create();

    for (const item of pageList) {
      const [copiedPage] = await outputPdf.copyPages(item.pdfLibDoc, [item.pageIndex]);
      outputPdf.addPage(copiedPage);
    }

    const mergedBytes = await outputPdf.save();

    // Direct Download via Browser Blob
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `privapdf_export_${Date.now()}.pdf`;
    a.click();

    exportText.innerText = "Success! PDF Downloaded";
    setTimeout(() => {
      exportText.innerText = "Export Merged PDF";
      exportBtn.disabled = false;
    }, 2000);

  } catch (err) {
    alert("Error exporting PDF: " + err.message);
    exportText.innerText = "Export Merged PDF";
    exportBtn.disabled = false;
  }
});