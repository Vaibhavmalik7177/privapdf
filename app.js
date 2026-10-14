pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

// --- TAB SWITCHING LOGIC ---
function switchTab(tab) {
  const mergeView = document.getElementById('view-merge');
  const convertView = document.getElementById('view-convert');
  const navMerge = document.getElementById('nav-merge');
  const navConvert = document.getElementById('nav-convert');

  if (tab === 'merge') {
    mergeView.classList.remove('hidden');
    convertView.classList.add('hidden');
    navMerge.className = "py-3 text-sm font-semibold border-b-2 border-indigo-500 text-indigo-400 transition";
    navConvert.className = "py-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition";
  } else {
    convertView.classList.remove('hidden');
    mergeView.classList.add('hidden');
    navConvert.className = "py-3 text-sm font-semibold border-b-2 border-emerald-500 text-emerald-400 transition";
    navMerge.className = "py-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition";
  }
}

// --- MERGE WORKSPACE LOGIC ---
let mergePageList = [];
const dropZoneMerge = document.getElementById('drop-zone-merge');
const fileInputMerge = document.getElementById('file-input-merge');
const workspaceMerge = document.getElementById('workspace-merge');
const gridMerge = document.getElementById('grid-merge');
const totalPagesMerge = document.getElementById('total-pages-merge');
const exportMergeBtn = document.getElementById('export-merge-btn');
const exportMergeText = document.getElementById('export-merge-text');

// Drag & Drop events for Merge
['dragenter', 'dragover'].forEach(e => dropZoneMerge.addEventListener(e, (ev) => { ev.preventDefault(); dropZoneMerge.classList.add('drag-over'); }));
['dragleave', 'drop'].forEach(e => dropZoneMerge.addEventListener(e, (ev) => { ev.preventDefault(); dropZoneMerge.classList.remove('drag-over'); }));
dropZoneMerge.addEventListener('drop', (e) => {
  const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
  if (files.length) processMergeFiles(files);
});
fileInputMerge.addEventListener('change', (e) => {
  if (e.target.files.length) processMergeFiles(Array.from(e.target.files));
});

async function processMergeFiles(files) {
  workspaceMerge.classList.remove('hidden');
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
    const pdfLibDoc = await PDFLib.PDFDocument.load(arrayBuffer);

    for (let i = 1; i <= pdfJsDoc.numPages; i++) {
      const page = await pdfJsDoc.getPage(i);
      const viewport = page.getViewport({ scale: 0.25 });
      const canvas = document.createElement('canvas');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

      mergePageList.push({ pdfLibDoc, pageIndex: i - 1, thumbUrl: canvas.toDataURL() });
    }
  }
  renderMergeGrid();
  fileInputMerge.value = '';
}

function renderMergeGrid() {
  gridMerge.innerHTML = '';
  totalPagesMerge.innerText = mergePageList.length;
  exportMergeBtn.disabled = mergePageList.length === 0;

  mergePageList.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'bg-slate-800 border border-slate-700/60 rounded-lg p-2 flex flex-col items-center relative group';
    card.innerHTML = `
      <div class="w-full aspect-[1/1.4] bg-slate-950 rounded flex items-center justify-center overflow-hidden mb-1">
        <img src="${item.thumbUrl}" class="object-contain h-full w-full" />
        <button onclick="removeMergePage(${index})" class="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
      </div>
      <span class="text-[10px] text-slate-400">Page ${index + 1}</span>
    `;
    gridMerge.appendChild(card);
  });
}

window.removeMergePage = function(index) {
  mergePageList.splice(index, 1);
  renderMergeGrid();
};

window.clearMergeWorkspace = function() {
  mergePageList = [];
  renderMergeGrid();
  workspaceMerge.classList.add('hidden');
};

exportMergeBtn.addEventListener('click', async () => {
  if (!mergePageList.length) return;
  exportMergeBtn.disabled = true;
  exportMergeText.innerText = "Merging in browser...";

  try {
    const outputPdf = await PDFLib.PDFDocument.create();
    for (const item of mergePageList) {
      const [page] = await outputPdf.copyPages(item.pdfLibDoc, [item.pageIndex]);
      outputPdf.addPage(page);
    }
    const bytes = await outputPdf.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `merged_${Date.now()}.pdf`;
    a.click();

    exportMergeText.innerText = "Success! Downloaded";
    setTimeout(() => { exportMergeText.innerText = "Export Merged PDF"; exportMergeBtn.disabled = false; }, 2000);
  } catch (err) {
    alert("Error: " + err.message);
    exportMergeText.innerText = "Export Merged PDF";
    exportMergeBtn.disabled = false;
  }
});


// --- CONVERT WORKSPACE LOGIC ---
let convertPages = [];
const dropZoneConvert = document.getElementById('drop-zone-convert');
const fileInputConvert = document.getElementById('file-input-convert');
const workspaceConvert = document.getElementById('workspace-convert');
const gridConvert = document.getElementById('grid-convert');
const totalPagesConvert = document.getElementById('total-pages-convert');
const exportConvertBtn = document.getElementById('export-convert-btn');
const exportConvertText = document.getElementById('export-convert-text');
const imageFormatSelect = document.getElementById('image-format');

// Drag & Drop events for Convert
['dragenter', 'dragover'].forEach(e => dropZoneConvert.addEventListener(e, (ev) => { ev.preventDefault(); dropZoneConvert.classList.add('drag-over'); }));
['dragleave', 'drop'].forEach(e => dropZoneConvert.addEventListener(e, (ev) => { ev.preventDefault(); dropZoneConvert.classList.remove('drag-over'); }));
dropZoneConvert.addEventListener('drop', (e) => {
  const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
  if (files.length) processConvertFile(files[0]);
});
fileInputConvert.addEventListener('change', (e) => {
  if (e.target.files.length) processConvertFile(e.target.files[0]);
});

async function processConvertFile(file) {
  workspaceConvert.classList.remove('hidden');
  convertPages = [];
  const arrayBuffer = await file.arrayBuffer();
  const pdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  for (let i = 1; i <= pdfJsDoc.numPages; i++) {
    const page = await pdfJsDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 }); // High res for image export
    const canvas = document.createElement('canvas');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

    convertPages.push({ canvas });
  }
  renderConvertGrid();
  fileInputConvert.value = '';
}

function renderConvertGrid() {
  gridConvert.innerHTML = '';
  totalPagesConvert.innerText = convertPages.length;
  exportConvertBtn.disabled = convertPages.length === 0;

  convertPages.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'bg-slate-800 border border-slate-700/60 rounded-lg p-2 flex flex-col items-center relative group';
    card.innerHTML = `
      <div class="w-full aspect-[1/1.4] bg-slate-950 rounded flex items-center justify-center overflow-hidden mb-1">
        <img src="${item.canvas.toDataURL()}" class="object-contain h-full w-full" />
      </div>
      <span class="text-[10px] text-slate-400">Page ${index + 1}</span>
    `;
    gridConvert.appendChild(card);
  });
}

window.clearConvertWorkspace = function() {
  convertPages = [];
  renderConvertGrid();
  workspaceConvert.classList.add('hidden');
};

exportConvertBtn.addEventListener('click', async () => {
  if (!convertPages.length) return;
  exportConvertBtn.disabled = true;
  exportConvertText.innerText = "Exporting images...";

  const format = imageFormatSelect.value;
  const ext = format === 'image/jpeg' ? 'jpg' : 'png';

  for (let i = 0; i < convertPages.length; i++) {
    const dataUrl = convertPages[i].canvas.toDataURL(format, 0.9);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `page_${i + 1}.${ext}`;
    a.click();
    await new Promise(r => setTimeout(r, 250)); // small delay between triggers
  }

  exportConvertText.innerText = "Success! All Images Downloaded";
  setTimeout(() => { exportConvertText.innerText = "Download All Pages as Images"; exportConvertBtn.disabled = false; }, 2000);
});