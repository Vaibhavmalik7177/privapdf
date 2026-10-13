# 🔒 PrivaPDF

> **Zero Cloud Uploads. 100% In-Browser Privacy.**  
> A fast, lightweight, client-side PDF utility suite designed for absolute privacy and local speed.

---

## 🌟 Overview

Most online PDF tools force you to upload sensitive documents—such as salary slips, bank statements, tax records, and government IDs—to remote third-party servers. 

**PrivaPDF** solves this critical security risk by executing all file parsing, merging, splitting, and rendering **100% inside your browser memory**. Your files never touch a cloud server or external backend, ensuring total privacy, zero data leaks, and lightning-fast local execution.

---

## ✨ Key Features

* **🔒 Absolute Privacy:** File processing is performed entirely in local browser runtime via JavaScript and WebAssembly.
* **⚡ Instant Execution:** Zero network latency or upload wait times—even for large multi-page PDF documents.
* **🧩 PDF Merging & Combining:** Seamlessly combine multiple PDF files into a single unified document with custom page ordering.
* **📱 Responsive & Lightweight UI:** Modern, clean, drag-and-drop interface powered by Tailwind CSS.
* **🌐 Offline Support:** Functions seamlessly without an active internet connection once loaded in the browser.

---

## 🚀 Tech Stack

* **Frontend:** HTML5, Modern ES6+ JavaScript, Tailwind CSS (Styling)
* **PDF Processing Engine:** [`pdf-lib`](https://github.com/Hopding/pdf-lib) (In-browser PDF manipulation)
* **Document Rendering & Thumbnails:** [`pdfjs-dist`](https://mozilla.github.io/pdf.js/) (Mozilla PDF.js engine)
* **Deployment & Hosting:** Vercel / Cloudflare Pages

---

## 🛠️ Getting Started & Installation

### Prerequisites
You only need a modern web browser (Google Chrome, Mozilla Firefox, Brave, or Apple Safari). No local backend or Node.js runtime is required for basic local execution.
