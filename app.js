pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

// --- TAB SWITCHING LOGIC ---
function switchTab(tab) {
  const mergeView = document.getElementById('view-merge');
  const convertView = document.getElementById('view-convert');
  const img2pdfView = document.getElementById('view-img2pdf');

  const navMerge = document.getElementById('nav-merge');
  const navConvert = document.getElementById('nav-convert');
  const navImg2Pdf = document.getElementById('nav-img2pdf');

  // Reset tabs
  mergeView.classList.add('hidden');
  convertView.classList.add('hidden');
  img2pdfView.classList.add('hidden');
  navMerge.className = "py-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition";
  navConvert.className = "py-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition";
  navImg2Pdf.className = "py-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition";

  if (tab === 'merge') {
    mergeView.classList.remove('hidden');
    navMerge.className = "py-3 text-sm font-semibold border-b-2 border-indigo-500 text-indigo-400 transition";
  } else if (tab === 'convert') {
    convertView.classList.remove('hidden');
    navConvert.className = "py-3 text-sm font-semibold border-b-2 border-emerald-500 text-emerald-400 transition";
  } else if (tab === 'img2pdf') {
    img2pdfView.classList.remove('hidden');
    navImg2Pdf.className = "py-3 text-sm font-semibold border-b-2 border-indigo-500 text-indigo-400 transition";
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


// --- CONVERT PDF TO IMAGES WORKSPACE LOGIC ---
let convertPages = [];
const dropZoneConvert = document.getElementById('drop-zone-convert');
const fileInputConvert = document.getElementById('file-input-convert');
const workspaceConvert = document.getElementById('workspace-convert');
const gridConvert = document.getElementById('grid-convert');
const totalPagesConvert = document.getElementById('total-pages-convert');
const exportConvertBtn = document.getElementById('export-convert-btn');
const exportConvertText = document.getElementById('export-convert-text');
const imageFormatSelect = document.getElementById('image-format');

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
    const viewport = page.getViewport({ scale: 1.5 });
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
    await new Promise(r => setTimeout(r, 250));
  }

  exportConvertText.innerText = "Success! All Images Downloaded";
  setTimeout(() => { exportConvertText.innerText = "Download All Pages as Images"; exportConvertBtn.disabled = false; }, 2000);
});


// --- IMAGES TO PDF WORKSPACE LOGIC ---
let img2PdfList = [];
const dropZoneImg2Pdf = document.getElementById('drop-zone-img2pdf');
const fileInputImg2Pdf = document.getElementById('file-input-img2pdf');
const workspaceImg2Pdf = document.getElementById('workspace-img2pdf');
const gridImg2Pdf = document.getElementById('grid-img2pdf');
const totalImagesImg2Pdf = document.getElementById('total-images-img2pdf');
const exportImg2PdfBtn = document.getElementById('export-img2pdf-btn');
const exportImg2PdfText = document.getElementById('export-img2pdf-text');

['dragenter', 'dragover'].forEach(e => dropZoneImg2Pdf.addEventListener(e, (ev) => { ev.preventDefault(); dropZoneImg2Pdf.classList.add('drag-over'); }));
['dragleave', 'drop'].forEach(e => dropZoneImg2Pdf.addEventListener(e, (ev) => { ev.preventDefault(); dropZoneImg2Pdf.classList.remove('drag-over'); }));
dropZoneImg2Pdf.addEventListener('drop', (e) => {
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  if (files.length) processImg2PdfFiles(files);
});
fileInputImg2Pdf.addEventListener('change', (e) => {
  if (e.target.files.length) processImg2PdfFiles(Array.from(e.target.files));
});

async function processImg2PdfFiles(files) {
  workspaceImg2Pdf.classList.remove('hidden');
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    img2PdfList.push({ file, arrayBuffer, name: file.name });
  }
  renderImg2PdfGrid();
  fileInputImg2Pdf.value = '';
}

function renderImg2PdfGrid() {
  gridImg2Pdf.innerHTML = '';
  totalImagesImg2Pdf.innerText = img2PdfList.length;
  exportImg2PdfBtn.disabled = img2PdfList.length === 0;

  img2PdfList.forEach((item, index) => {
    const blobUrl = URL.createObjectURL(item.file);
    const card = document.createElement('div');
    card.className = 'bg-slate-800 border border-slate-700/60 rounded-lg p-2 flex flex-col items-center relative group';
    card.innerHTML = `
      <div class="w-full aspect-[1/1.4] bg-slate-950 rounded flex items-center justify-center overflow-hidden mb-1">
        <img src="${blobUrl}" class="object-contain h-full w-full" />
        <button onclick="removeImg2PdfItem(${index})" class="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
      </div>
      <span class="text-[10px] text-slate-400 truncate w-full text-center">${item.name}</span>
    `;
    gridImg2Pdf.appendChild(card);
  });
}

window.removeImg2PdfItem = function(index) {
  img2PdfList.splice(index, 1);
  renderImg2PdfGrid();
};

window.clearImg2PdfWorkspace = function() {
  img2PdfList = [];
  renderImg2PdfGrid();
  workspaceImg2Pdf.classList.add('hidden');
};

exportImg2PdfBtn.addEventListener('click', async () => {
  if (!img2PdfList.length) return;
  exportImg2PdfBtn.disabled = true;
  exportImg2PdfText.innerText = "Generating PDF from Images...";

  try {
    const pdfDoc = await PDFLib.PDFDocument.create();

    for (const item of img2PdfList) {
      let embeddedImage;
      if (item.file.type === 'image/png') {
        embeddedImage = await pdfDoc.embedPng(item.arrayBuffer);
      } else {
        embeddedImage = await pdfDoc.embedJpg(item.arrayBuffer);
      }

      // Create a page matching standard A4 dimensions or image aspect ratio
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 points
      const { width, height } = page.getSize();

      // Scale image to fit neatly within A4 margins
      const imgDims = embeddedImage.scaleToFit(width - 80, height - 80);

      page.drawImage(embeddedImage, {
        x: (width - imgDims.width) / 2,
        y: (height - imgDims.height) / 2,
        width: imgDims.width,
        height: imgDims.height,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `images_to_pdf_${Date.now()}.pdf`;
    a.click();

    exportImg2PdfText.innerText = "Success! PDF Downloaded";
    setTimeout(() => { exportImg2PdfText.innerText = "Generate PDF from Images"; exportImg2PdfBtn.disabled = false; }, 2000);
  } catch (err) {
    alert("Error generating PDF: " + err.message);
    exportImg2PdfText.innerText = "Generate PDF from Images";
    exportImg2PdfBtn.disabled = false;
  }
});