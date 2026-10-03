<div align="center">

# 🔲 QR Code Generator Studio

**Aplikasi generator kode QR modern beresolusi tinggi (HD 1300px) dengan kustomisasi visual instan, performa ringan, dan antarmuka studio yang ergonomis.**

[![Version](https://img.shields.io/badge/Release-v1.2.1-15D8B3?style=for-the-badge&logo=git&logoColor=080B1F)](https://github.com)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.x-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## 📌 Sekilas Proyek

**QR Code Generator Studio** adalah aplikasi pembuat kode QR kustom berbasis **Python (Flask)** untuk backend pemrosesan gambar dan **Modern Frontend** (HTML5, Tailwind CSS, Vanilla JS). Dirancang dengan estetika studio yang bersih (*anti-slop*), bebas dari ornamen berlebih, dan mengedepankan fungsionalitas murni dengan pembaruan *live preview* secepat kilat.

---

## ✨ Fitur Utama

- ⚡ **Real-Time Live Preview**: QR Code langsung diperbarui secara instan saat mengetik atau mengubah opsi (*debounced* dengan *AbortController* anti race-condition).
- 🎨 **Palet Warna Presisi**:
  - Pengaturan mandiri untuk warna modul/titik (*Foreground*), sudut (*Eyes*), dan kanvas (*Background*).
  - Quick presets: *Classic Mono, Indigo Studio, Steel Blue, dan Sky Deep*.
- 🧩 **6 Variasi Bentuk Titik (Module Shapes)**:
  - `Square` (Klasik) • `Circle` (Bulat) • `Rounded` (Sudut Melengkung)
  - `Vertical` (Batang Tegak) • `Horizontal` (Batang Datar) • `Circuit` (Jalur PCB/Tech)
- 🖼️ **5 Gaya Frame & Tipografi Kustom**:
  - `None` • `Top Banner` • `Bottom Banner` • `Bubble Box` • `Label Badge`
  - Kontrol kustom untuk teks banner (*e.g., "SCAN ME"*), warna bingkai, dan warna teks.
- 🏷️ **Penyematan Logo Tengah (Center Logo)**:
  - Drag-and-drop file gambar logo (PNG/SVG) langsung ke dropzone.
  - Auto-clearing modul di bagian tengah dengan proteksi koreksi galat tinggi (*Error Correction Level H*) agar QR tetap terbaca akurat.
- 🔍 **WCAG Contrast Validator**:
  - Sistem pendeteksi rasio kontras warna secara otomatis; menampilkan peringatan jika kombinasi warna berisiko sulit dipindai.
- 📥 **Ekspor HD Siap Cetak (1300px)**:
  - Tombol unduh menghasilkan gambar resolusi tinggi 1300 × 1300px tanpa blur, cocok untuk kebutuhan cetak profesional (*print-ready*).
- 🌓 **Zero-Flicker Light & Dark Theme**:
  - Default: Light Mode bernuansa studio modern.
  - Dark Mode persisten via `localStorage` dengan script preload anti-kedip (*FOUC free*).
- 🛹 **Animasi Slide Standar & Mulus**:
  - Indikator menu rail dan tab bar meluncur mulus (*standard linear ease-out*) tanpa efek debounce memantul.
  - Transisi konten bergeser bertahap (*directional entrance*).
- 📱 **Desain 100% Responsif**:
  - Beradaptasi secara otomatis mulai dari layar ultra-lebar, desktop, tablet, hingga smartphone 320px dengan ukuran kartu QR proporsional.

---

## 🖥️ Tampilan Antarmuka (Demo UI)

Antarmuka web mengadopsi **Two-Zone Studio Architecture**:

```
+-----------------------------------------------------------------------------------------+
|                                    QR Code Generator                                [🌓]|
+-----------------------------------------------------------------------------------------+
| [Rail Capsule] | [Panel Pengaturan Aktif]                   | [Live Preview Station]    |
|                |                                            |                           |
|   [ T ] Teks   |  ENTER YOUR TEXT                           |  LIVE PREVIEW   Up to date|
|   [ * ] Shape  |  https://github.com/rizqyalfatah           |                           |
|   [ = ] Frame  |                                            |     +---------------+     |
|   [ @ ] Logo   |  [ Presets / Color Pickers / Tiles / etc ] |     |   QR CODE     |     |
|   -----        |                                            |     |   PREVIEW     |     |
|   [ 🌓 ] Theme |                                            |     +---------------+     |
|                |                                            |                           |
|                |                                            |  [ Download HD (1300px) ] |
+-----------------------------------------------------------------------------------------+
```

---

## 🚀 Cara Instalasi & Menjalankan Lokal

Ikuti langkah mudah berikut untuk menjalankan proyek di komputer lokal:

### 1. Kloning Repositori
```bash
git clone https://github.com/RizqyAlfatah/QR-code-generator.git
cd qr-code-generator
```

### 2. Pasang Dependensi Python
Pastikan Python 3.8+ telah terpasang. Pasang paket `flask`, `qrcode`, dan `pillow`:
```bash
pip install flask qrcode pillow
```

### 3. Jalankan Webserver
```bash
python generateserver.py
```

### 4. Buka di Browser
Akses aplikasi melalui browser:
```text
Local Machine : http://localhost:5000
Local Network : http://<IP-KOMPUTER-ANDA>:5000 (Dapat diuji dari smartphone dalam 1 WiFi)
```

---

## ️ Tech Stack

| Lapisan | Teknologi | Peran & Penggunaan |
|---|---|---|
| **Backend Core** | **Python 3.9+** | Bahasa utama logika generator |
| **Web Server** | **Flask** | Routing API endpoints (`/generate_preview`, `/download`) |
| **QR Engine** | **qrcode (PIL)** | Perhitungan matriks QR dengan Level H error correction |
| **Image Rendering**| **Pillow (PIL)** | Pemrosesan grafis modul, frame, masking logo, & ekspor 1300px |
| **Markup & Layout**| **HTML5 & Tailwind CSS**| Struktur dokumen semantik dan utility styling |
| **Client Script** | **Vanilla JS (ES6+)** | State persistence, debouncing, AbortController, tab navigation |
| **Design Tokens** | **Custom CSS Variables**| Palet warna terkalibrasi (*Navy, Indigo, Steel Blue, Mint*) |

---

## 📝 Changelog

### [v1.2.1] - 2026-10-03
- **Refactor Layout 2-Zona**: Memindahkan editor teks langsung ke dalam tab sidebar (`T`) dan menghapus kolom tengah berlebih agar tampilan lebih lega (*spacious*) dan efisien.
- **Standarisasi Animasi Slide**: Mengganti kurva spring pantul dengan *standard slide transition* (`cubic-bezier(0.25, 1, 0.5, 1)`) yang bersih dan stabil.
- **Mobile Preview Optimization**: Mengatur batas ukuran kartu QR mobile (~145px) agar proporsional dan tombol download langsung terlihat tanpa perlu scroll.
- **Panel Visibility Fix**: Memastikan panel isian langsung memiliki opasitas penuh sejak awal muat halaman.

### [v1.2.0] - 2026-10-03
- **Studio Redesign**: Rombak arsitektur UI mengikuti panduan desain studio dan palet Color Hunt.
- **Multi-Feature Support**: Penambahan 6 module shapes, 5 gaya frame & teks banner, serta dropzone upload center logo.
- **Accessibility**: Penambahan kalkulator rasio kontras WCAG otomatis.
- **Export HD**: Peningkatan resolusi ekspor menjadi 1300px murni berbasis kalkulasi dinamis box size Pillow.

### [v1.0.0] - 2026-10-03
- **Initial Release**: Rilis purwarupa dasar generator QR code dengan Flask server dan download PNG standar.

---

## 📄 Lisensi

Didistribusikan di bawah lisensi [MIT](LICENSE). Silakan gunakan, pelajari, dan kembangkan secara bebas.

<div align="center">
  <sub>Dibuat dengan dedikasi untuk alat bantu studio yang bersih, cepat, dan fungsional.</sub>
</div>
