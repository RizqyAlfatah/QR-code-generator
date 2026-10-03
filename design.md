# DESIGN.md — QR Code Generator

Design system untuk web **QR Code Generator** (high-resolution QR dengan styling dan frame kustom, live preview, download PNG 1300px). Palet inti diambil dari Color Hunt: `#2F39A9`, `#2E6FA0`, `#49A4BB`, `#15D8B3`. Warna netral (background, surface, teks) diturunkan dari hue indigo palet tersebut.

---

## 1. Design Read

- **Produk:** alat kerja satu halaman. Pengguna mengisi data, mengatur tampilan, lalu mengunduh QR.
- **Tugas utama layar:** mengubah pengaturan dan langsung melihat hasilnya, lalu mengunduh. Preview dan tombol download adalah pusat halaman; panel konfigurasi mendukungnya.
- **Karakter:** tenang, presisi, teknis tapi ramah. Seperti alat studio, bukan landing page.
- **Tema:** **dark default** karena ini alat yang dipakai berlama-lama dan preview QR berlatar putih jadi fokus alami. Sediakan light theme lewat toggle (token ada di bagian 2.2).
- **Anti-slop:** tanpa gradient, glow, glassmorphism, shadow tebal, badge pill dekoratif, emoji, atau data palsu. Hierarki dibentuk lewat warna, border, dan ukuran.

---

## 2. Design Tokens

### 2.1 Palet inti

| Token | Hex | Peran |
|---|---|---|
| `--indigo` | `#2F39A9` | Warna brand. Fill tombol sekunder, chip nomor section aktif |
| `--steel` | `#2E6FA0` | Border aktif, hover fill, state terpilih |
| `--sky` | `#49A4BB` | Link, ikon aktif, focus ring, teks aksen |
| `--mint` | `#15D8B3` | **Satu-satunya aksen.** Tombol Download dan status sukses |

Aturan pemakaian: 3 warna pertama membangun UI; **mint hanya muncul di momen kunci** (Download, "Up to date"). Jangan dipakai di ikon, border, atau hover umum.

### 2.2 Netral turunan (dark default)

| Token | Hex | Penggunaan |
|---|---|---|
| `--bg` | `#080B1F` | Latar halaman |
| `--surface` | `#0F1330` | Panel Configuration dan Live Preview |
| `--surface-raised` | `#171C45` | Header section accordion, input, hover baris |
| `--border` | `#252B5C` | Garis pemisah dan border panel |
| `--text` | `#E8EAFB` | Teks utama |
| `--text-muted` | `#9AA0D0` | Label, helper text, caption |
| `--on-mint` | `#080B1F` | Teks di atas tombol mint (bukan putih) |
| `--on-indigo` | `#FFFFFF` | Teks di atas fill indigo |

**Light theme (toggle):** `--bg #F5F6FD`, `--surface #FFFFFF`, `--surface-raised #ECEEFA`, `--border #D5D9F0`, `--text #12163A`, `--text-muted #5A6190`. Di light theme `--sky` untuk teks diganti `#2E6FA0` agar kontras cukup; mint tetap hanya untuk tombol (dengan `--on-mint`).

### 2.3 Warna state

| Token | Hex | Penggunaan |
|---|---|---|
| `--danger` | `#FF6B6B` | Error input, URL tidak valid |
| `--warning` | `#F5B84B` | Peringatan kontras QR rendah |
| `--success` | `#15D8B3` | Sama dengan mint, untuk status nyata ("Up to date") |

### 2.4 Kontras (sudah dihitung)

| Kombinasi | Rasio | Catatan |
|---|---|---|
| `--on-mint` di atas `--mint` | ± 10:1 | Lulus AAA. **Jangan pakai teks putih di mint (± 1.8:1)** |
| Putih di atas `--indigo` | ± 9:1 | Lulus AAA |
| `--sky` di atas `--bg` | ± 6.6:1 | Aman untuk link dan teks aksen |
| `--steel` di atas `--bg` | ± 3.5:1 | Hanya border dan komponen UI besar, bukan teks isi |
| `--indigo` di atas `--bg` | ± 2:1 | Hanya sebagai fill, jangan jadi teks atau garis penting |

### 2.5 Tipografi

- **UI:** `Inter`, fallback `system-ui, sans-serif`. Alasan: alat kerja butuh keterbacaan tinggi di ukuran kecil.
- **Data teknis:** `JetBrains Mono` untuk URL, hex warna, ukuran px, nomor section, dan status. Alasan: nilai-nilai ini memang data yang perlu dibandingkan karakter per karakter.

| Peran | Ukuran | Berat |
|---|---|---|
| Judul halaman | 24px | 700 |
| Judul section accordion | 16px | 600 |
| Label field | 13px | 500, `--text-muted` |
| Input / isi | 15px | 400 |
| Status & nomor (mono) | 12–13px | 500 |
| Caption | 12px | 400 |

Gunakan sentence case. Hindari uppercase dengan letter-spacing lebar untuk label biasa; uppercase hanya untuk judul panel kecil ("CONFIGURATION", "LIVE PREVIEW") bila memang dipertahankan, dengan tracking sedang (≤ 0.04em).

### 2.6 Spacing, radius, elevasi

- **Spacing:** 4 / 8 / 12 / 16 / 24 / 32 / 48 px.
- **Radius:** `6px` (input, chip), `10px` (tombol, field group), `14px` (panel, preview card). **Tidak ada pill.**
- **Elevasi:** nol shadow. Panel dibedakan dari latar dengan `--surface` + border 1px `--border`.
- **Border:** `1px solid var(--border)`; state aktif memakai `--steel`.

---

## 3. Layout

### Desktop (≥ 1024px)

- Container max-width ± 1400px, padding horizontal 24–32px, terpusat.
- Header: ikon aplikasi (36px, radius 10px, fill `--indigo`), judul, subjudul satu baris, garis bawah `--border`.
- Dua kolom: **Configuration (kiri, ± 7/12)** dan **Live Preview (kanan, ± 5/12)**, gap 24px.
- Panel preview bersifat **sticky** (`top: 24px`) agar tetap terlihat saat panel kiri di-scroll.

### Tablet (≈ 640–1023px)

- Satu kolom, preview di atas dengan lebar maksimum 420px dan terpusat; Configuration di bawahnya selebar penuh. Jangan meregangkan layout phone atau menjejalkan layout desktop.

### Mobile (< 640px)

- Satu kolom, **urutan: Preview, tombol Download, lalu Configuration**. Pengguna melihat hasil dulu; perubahan di bawah langsung tercermin saat dia scroll ke atas.
- QR card selebar layar dikurangi padding 16px, maksimum 360px. Preview **tidak sticky** di mobile agar tidak memakan layar.
- Padding section turun ke 16px; judul 20px; tidak ada padding desktop (48px+) yang terbawa.
- Tombol Download selebar penuh, tinggi 48px.
- Tanpa horizontal scroll. Input pakai `min-width: 0` dan `max-width: 100%`.

---

## 4. Komponen

### 4.1 Panel (Configuration & Live Preview)

- Latar `--surface`, border 1px `--border`, radius 14px.
- Header panel: judul kecil kiri, status kanan, tinggi ± 48px, garis bawah `--border`.
- Header kanan Configuration berisi "Live Sync". Teks ini harus mewakili sinkronisasi nyata (preview ter-update otomatis), bukan dekorasi.

### 4.2 Accordion section (01–04)

Urutan: `01 Content & Data`, `02 Color Palette`, `03 Pattern & Center Logo`, `04 Frame & Typography`.

- Header: tinggi 56px, latar `--surface-raised`, nomor mono 12px di kiri (chip 28px, radius 6px; aktif = fill `--indigo` + teks putih, tidak aktif = teks `--sky`), judul 16px/600, chevron kanan.
- Hanya satu section terbuka pada satu waktu di mobile; di desktop boleh beberapa terbuka.
- Isi section: padding 16–24px, label di atas input, gap antar field 16px.
- Animasi buka-tutup: `grid-template-rows: 0fr → 1fr` selama 150–200ms. Konten **tidak boleh terpotong** (hindari tinggi tetap + `overflow: hidden`).
- Chevron berputar 180° saat terbuka. Header berupa `<button>` dengan `aria-expanded` dan `aria-controls`.

### 4.3 Field input

- Tinggi 44px, latar `--surface-raised`, border 1px `--border`, radius 6px, teks 15px.
- Label 13px `--text-muted` di atas input, jarak 6px. Label tidak boleh menempel atau tertutup header section berikutnya.
- Focus: outline 2px `--sky`, offset 2px. Error: border `--danger` + pesan 12px di bawah field.
- Field URL/teks memakai `JetBrains Mono`; placeholder `https://example.com` (placeholder jujur, tanpa data palsu).

### 4.4 Pemilih warna (Color Palette)

- Dua field: **Foreground** dan **Background** QR, masing-masing swatch 40px (radius 6px) + input hex mono.
- Preset cepat 4 warna palet (indigo, steel, sky, mint) sebagai swatch 32px, berlabel aksesibel.
- **Validasi scan:** hitung rasio kontras foreground/background. Di bawah ± 4:1 atau saat foreground lebih terang dari background, tampilkan peringatan `--warning`: "Kontras rendah, QR mungkin sulit dipindai". Mint sebagai foreground di atas putih (± 1.8:1) harus memicu peringatan ini.

### 4.5 Pemilih bentuk (Module Shape / Frame Style)

- Grup opsi berupa kotak 64px berisi gambar mini bentuk aslinya, radius 10px, border `--border`.
- Terpilih: border `--steel` 2px + latar `--surface-raised`. Tanpa glow.
- Gunakan `role="radiogroup"` dengan navigasi panah.

### 4.6 Live Preview

- Kartu putih (`#FFFFFF`) radius 14px, padding 24px. **Kartu QR selalu putih** terlepas dari tema, agar quiet zone dan kontras scan terjaga.
- Teks frame (misalnya "SCAN ME") mengikuti warna foreground QR yang dipilih, bukan merah bawaan. Default memakai `--indigo`.
- Status kanan atas: "Up to date" (mono 12px, `--success`) hanya muncul saat gambar memang sudah sinkron; saat sedang render tampilkan "Updating…" dalam `--text-muted`; saat gagal tampilkan pesan `--danger`.

### 4.7 Tombol

| Varian | Gaya | Penggunaan |
|---|---|---|
| Primary | Fill `--mint`, teks `--on-mint`, 600, radius 10px, tinggi 48px | **Download HD (1300px)**. Hanya satu per layar |
| Secondary | Fill `--indigo`, teks putih | Aksi lain (mis. Reset) |
| Ghost | Transparan, border `--border`, teks `--text` | Aksi tersier |

- Hover primary: gelapkan mint ± 8%. Hover secondary: pindah ke `--steel`. Active: geser 1px ke bawah, tanpa animasi berlebih.
- Disabled: opacity 0.4 dan `cursor: not-allowed`. Tombol Download disabled bila input kosong atau tidak valid, disertai alasan yang terlihat.
- Ikon download 18px di kiri label. Tidak ada panah dekoratif.
- Caption di bawah tombol: "PNG 1300px, dibuat oleh server Python" (12px, `--text-muted`). Tulis hanya hal yang benar.

### 4.8 Empty, loading, error

- **Input kosong:** preview menampilkan area kosong dengan teks "Masukkan URL atau teks untuk membuat QR" dan fokus otomatis ke field Destination. Download disabled.
- **Loading:** "Updating…" di header preview; QR lama tetap tampil (jangan dikosongkan agar tidak berkedip).
- **Error server:** pesan spesifik ("Gagal membuat QR: server tidak merespons") dengan tombol "Coba lagi".

---

## 5. Motion

- Hanya transisi fungsional: buka-tutup accordion (150–200ms), hover/focus (≤ 120ms), pergantian QR (fade 100ms).
- Tidak ada pulse, float, atau loop tanpa pemicu. Hormati `prefers-reduced-motion` dengan menonaktifkan transisi non-esensial.

---

## 6. Aksesibilitas

- Semua kontrol bisa dioperasikan dengan keyboard; urutan tab mengikuti urutan visual (Content, Color, Pattern, Frame, lalu Download).
- Focus ring 2px `--sky` pada semua elemen interaktif, tidak pernah dihapus.
- Target sentuh minimum 44×44px dengan jarak antar target ≥ 8px.
- Gambar QR diberi `alt` yang menyebut isi yang dikodekan; status preview memakai `aria-live="polite"`.
- Warna tidak jadi satu-satunya pembawa makna: error dan warning selalu disertai teks atau ikon.

---

## 7. Masalah di tampilan saat ini (perlu diperbaiki)

Dari screenshot versi sekarang:

1. **Body accordion terpotong.** Label "Destination URL or Text", "Module Shape", dan "Frame Style" tampak tertimpa header section berikutnya, dan section 02 hanya menampilkan sliver kosong. Penyebab umum: tinggi tetap + `overflow: hidden`. Perbaiki dengan teknik `grid-template-rows` (bagian 4.2).
2. **Teks "SCAN ME" merah** tidak terkait dengan palet. Ikuti warna foreground QR (bagian 4.6).
3. **Tombol Download hijau dengan teks putih** kontrasnya rendah. Ganti ke mint `#15D8B3` dengan teks gelap `--on-mint`.
4. **Label "CONFIGURATION" dan "LIVE PREVIEW"** uppercase boleh dipertahankan, tapi pastikan tracking sedang dan warnanya `--text-muted`.
5. **Preview tidak terlihat penuh** pada tinggi layar laptop kecil: pastikan panel kanan sticky dan QR + tombol Download muat dalam satu layar (QR max ± 400px di desktop).

---

## 8. CSS variables

```css
:root {
  /* palet inti (Color Hunt) */
  --indigo: #2F39A9;
  --steel:  #2E6FA0;
  --sky:    #49A4BB;
  --mint:   #15D8B3;

  /* netral dark (default) */
  --bg: #080B1F;
  --surface: #0F1330;
  --surface-raised: #171C45;
  --border: #252B5C;
  --text: #E8EAFB;
  --text-muted: #9AA0D0;
  --on-mint: #080B1F;
  --on-indigo: #FFFFFF;

  /* state */
  --danger: #FF6B6B;
  --warning: #F5B84B;
  --success: var(--mint);

  --font-ui: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, Menlo, monospace;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;

  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-6: 24px; --space-8: 32px; --space-12: 48px;
}

:root[data-theme="light"] {
  --bg: #F5F6FD;
  --surface: #FFFFFF;
  --surface-raised: #ECEEFA;
  --border: #D5D9F0;
  --text: #12163A;
  --text-muted: #5A6190;
}

.btn-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2);
  height: 48px; padding: 0 var(--space-6);
  border-radius: var(--radius-md);
  background: var(--mint); color: var(--on-mint);
  font: 600 16px/1 var(--font-ui);
}
.btn-primary:disabled { opacity: .4; cursor: not-allowed; }

.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

:focus-visible { outline: 2px solid var(--sky); outline-offset: 2px; }

/* accordion tanpa pemotongan konten */
.acc-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .18s ease; }
.acc-body[data-open="true"] { grid-template-rows: 1fr; }
.acc-body > div { overflow: hidden; min-height: 0; }

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
```

---

## 9. Do & Don't

**Do**
- Jadikan preview QR dan tombol Download titik fokus; sisanya pendukung.
- Pakai mint hanya untuk Download dan status sukses nyata.
- Tampilkan state kosong, loading, dan error dengan penyebab serta langkah berikutnya.
- Uji lebar layar dari 320px sampai 1440px, bukan hanya dua titik.

**Don't**
- Jangan menambah gradient, glow, glassmorphism, atau shadow besar.
- Jangan memakai teks putih di atas mint.
- Jangan memakai emoji, badge "AI Powered", atau titik status dekoratif.
- Jangan mengisi field dengan data palsu (John Doe, contoh@email.com yang tampak seperti data asli); pakai placeholder jujur.
- Jangan memakai warna palet di luar peran yang ditentukan di bagian 2.1.