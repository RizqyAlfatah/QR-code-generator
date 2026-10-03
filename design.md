# DESIGN.md — QR Code Generator (Redesign)

Redesign tampilan QR Code Generator mengikuti **gambar referensi** (kartu "device" putih di atas latar biru muda, panel biru tua di kanan berisi QR dan accordion, heading besar "Enter your text" di tengah, rail ikon vertikal di kiri). Semua **fitur yang sudah ada tetap dipertahankan**; hanya tampilan dan penempatan yang berubah. Palet memakai Color Hunt: `#2F39A9`, `#2E6FA0`, `#49A4BB`, `#15D8B3`.

---

## 1. Design Read

- **Produk:** alat satu halaman untuk membuat QR dengan styling kustom dan mengunduh PNG 1300px.
- **Tugas layar:** ketik isi QR, atur tampilan, lihat hasil langsung, unduh. Alur dibaca kiri ke kanan: input, lalu panel hasil.
- **Karakter:** bersih, cerah, percaya diri. Ruang putih lega di kiri, panel biru tua padat di kanan sebagai titik berat.
- **Tema:** **light default** (sesuai referensi), dark tersedia lewat toggle. Panel kanan tetap biru tua di kedua tema sebagai ciri khas.
- **Aksen:** mint `#15D8B3` hanya untuk tombol Download dan status sukses.

---

## 2. Design Tokens

### 2.1 Palet inti

| Token | Hex | Peran |
|---|---|---|
| `--indigo` | `#2F39A9` | Baris accordion di panel, chip aktif, fill tombol sekunder |
| `--steel` | `#2E6FA0` | Lingkaran dekor besar, hover, state terpilih ringan |
| `--sky` | `#49A4BB` | Border tile terpilih di panel, link, focus ring, lingkaran dekor kecil |
| `--mint` | `#15D8B3` | **Satu-satunya aksen**: tombol Download dan status "Up to date" |

### 2.2 Netral turunan

| Token | Light | Dark | Penggunaan |
|---|---|---|---|
| `--page-bg` | `#EAF0FC` | `#080B1F` | Latar halaman |
| `--frame` | `#FFFFFF` | `#11143A` | Bingkai luar kartu utama |
| `--card` | `#F4F7FD` | `#0F1330` | Isi kartu (area kiri) |
| `--field` | `#FFFFFF` | `#171C45` | Textarea dan input di area kiri |
| `--line` | `#D5D9F0` | `#252B5C` | Border dan garis pemisah |
| `--heading` | `#1E2674` | `#FFFFFF` | Heading besar |
| `--text` | `#12163A` | `#E8EAFB` | Teks isi |
| `--text-muted` | `#5A6190` | `#9AA0D0` | Label, helper, caption |
| `--navy` | `#1E2674` | `#1E2674` | Panel kanan (sama di kedua tema) |
| `--on-navy` | `#FFFFFF` | `#FFFFFF` | Teks di panel kanan |
| `--on-navy-muted` | `#B9BFEA` | `#B9BFEA` | Label dan helper di panel kanan |
| `--on-mint` | `#080B1F` | `#080B1F` | Teks di atas tombol mint |

State: `--danger #FF6B6B`, `--warning #F5B84B` (warna tambahan di luar palet; kontras di atas navy ≥ 5:1).

### 2.3 Kontras (dihitung)

| Kombinasi | Rasio | Catatan |
|---|---|---|
| `--on-mint` di atas `--mint` | ± 10:1 | Jangan pakai teks putih di mint (± 1.8:1) |
| `--mint` di atas `--navy` | ± 7.7:1 | Aman untuk tombol dan teks status di panel |
| Putih di atas `--indigo` | ± 9:1 | Baris accordion |
| `--sky` di atas `--indigo` | ± 3.2:1 | Hanya untuk border/komponen UI, bukan teks |
| `--heading` di atas `--card` (light) | > 10:1 | Aman |

### 2.4 Tipografi

- **UI:** `Inter` (fallback `system-ui, sans-serif`).
- **Data teknis:** `JetBrains Mono` untuk isi textarea (URL), nilai hex, nomor, dan status. Alasannya: nilai ini adalah data yang dibaca karakter per karakter.

| Peran | Desktop | Mobile | Berat |
|---|---|---|---|
| Heading besar ("Enter your text") | 48px, tracking -0.02em | 28px | 700 |
| Judul accordion | 14px | 14px | 600 |
| Label field | 13px | 13px | 500 |
| Textarea | 18px mono | 16px mono | 400 |
| Hex / status | 12–13px mono | 12px mono | 500 |
| Caption/helper | 13px | 12px | 400 |

Gunakan `clamp()` untuk heading agar mulus di antara breakpoint. Tidak ada uppercase dengan tracking lebar kecuali judul accordion bila diinginkan (tracking ≤ 0.04em).

### 2.5 Radius, spacing, elevasi

- **Radius:** frame luar `32px`, kartu dalam `26px`, panel kanan `22px`, item accordion `14px`, tile & input `12px`, QR card `18px`, rail dan tombol Download `9999px` (pill, **hanya dua elemen ini**).
- **Spacing:** 4 / 8 / 12 / 16 / 24 / 32 / 48.
- **Elevasi:** hanya **satu** shadow lembut pada kartu utama: `0 24px 60px -24px rgba(30,38,116,.28)`. Komponen lain datar, dibedakan dengan warna dan border.
- Tanpa gradient, glow, backdrop blur, atau animasi berulang.

---

## 3. Layout

### 3.1 Desktop (≥ 1024px)

Latar `--page-bg` dengan **tiga lingkaran dekor datar** (lihat 3.4). Di tengah, kartu utama:

- Frame luar `--frame` tebal 10px (radius 32px) membungkus kartu dalam `--card` (radius 26px). Lebar maks 1240px, tinggi `min(760px, 100dvh - 48px)` dengan minimum 640px; jika layar lebih pendek, halaman boleh scroll.
- Isi kartu dibagi tiga zona dalam grid: `64px | 1fr | 380px` (panel 340px pada lebar < 1180px), gap 24px, padding 24px.

**Zona kiri: rail (64px).**
- Atas: ikon aplikasi 36px (kotak radius 10px, fill `--indigo`, ikon putih) diikuti nama "QR Code Generator" 14px/600 bila ruang cukup; rail itu sendiri berada di bawah ikon.
- Rail: kapsul vertikal putih (`--frame`), padding 8px, item 40px bulat. Item aktif: fill `--navy`, ikon putih. Item lain: ikon `--text-muted`.
- Isi rail (semua nyata, bukan placeholder):
  1. Content (ikon teks): fokus ke textarea
  2. Shape & Color (ikon palet): buka accordion tersebut
  3. Logo (ikon gambar): buka accordion tersebut
  4. Frame (ikon bingkai): buka accordion tersebut
  - Bawah rail: toggle tema (matahari/bulan).
- Tooltip label saat hover/focus dan `aria-label` di setiap tombol. Rail **disembunyikan** di bawah 1024px.

**Zona tengah: input.**
- Heading `h1` "Enter your text" (atau "Enter your URL or text") berwarna `--heading`, rata kiri, diletakkan sejajar vertikal dengan sisi atas atau sedikit di bawah tengah.
- Helper di bawahnya: "Your QR code will be generated automatically" (13px, muted), dihubungkan dengan status Live Sync yang nyata.
- Textarea besar: `--field`, border 1px `--line`, radius 16px, min-height 180px, padding 20px, font mono 18px, placeholder `https://example.com`.
- Di bawah textarea: helper "Accepts standard web URLs, plain text data, or payload strings."
- Tidak ada elemen dekoratif tambahan di zona ini.

**Zona kanan: panel navy (380px).** Lihat 4.3.

### 3.2 Tablet (768–1023px)

- Satu kolom, padding halaman 24px. Rail disembunyikan, ikon aplikasi dan toggle tema berada di baris atas kartu.
- Heading 36px; textarea min-height 140px.
- Panel navy selebar penuh kartu, maks 640px, terpusat; QR card maks 280px.
- Hanya lingkaran dekor A yang tampil (dikecilkan).

### 3.3 Mobile (< 768px)

- Padding halaman 12px, frame luar radius 24px (border 6px), padding kartu dalam 16px.
- Baris atas: ikon aplikasi + nama, toggle tema di kanan (target 44px).
- Heading 28px; textarea min-height 120px, font 16px (mencegah zoom otomatis di iOS).
- Panel navy selebar penuh, radius 20px, padding 16px.
- **Urutan di dalam panel mobile:** status, QR card (maks 100% lebar, 280px), **tombol Download** (selebar penuh, tinggi 48px), lalu accordion. Tombol tidak boleh terdorong jauh dari QR.
- Accordion: satu terbuka pada satu waktu. Isi accordion tidak memakai tinggi tetap.
- Lingkaran dekor disembunyikan. Tidak ada horizontal scroll pada 320px.

### 3.4 Lingkaran dekor (motif merek)

Tiga lingkaran **solid, datar, tanpa blur dan tanpa gradient**, diposisikan di belakang kartu, sebagian keluar layar:

| Lingkaran | Ukuran | Posisi | Warna (light / dark) |
|---|---|---|---|
| A | ± 560px | kiri atas | `--navy` / `--navy` |
| B | ± 120px | tepi kanan tengah | `--sky` / `--steel` |
| C | ± 420px | kanan bawah | `--steel` / `--indigo` |

`aria-hidden="true"`, `pointer-events: none`, wrapper `overflow: clip`. Mint **tidak** dipakai di lingkaran.

---

## 4. Komponen

### 4.1 Tombol tema

Berada di bawah rail (desktop) atau baris atas (tablet/mobile). Label aksesibel "Switch to dark theme" / "Switch to light theme". Menyimpan pilihan di `localStorage` bila sudah ada logika serupa; jika tidak, ikuti `prefers-color-scheme`.

### 4.2 Textarea input

Lihat 3.1. State error (mis. input kosong atau terlalu panjang untuk QR): border `--danger` 2px + pesan 12px di bawahnya. Fokus: outline 2px `--sky`, offset 2px.

### 4.3 Panel navy (QR + pengaturan + download)

Latar `--navy`, teks `--on-navy`, radius 22px, padding 20px, tinggi penuh zona (desktop), `display: flex; flex-direction: column`.

Susunan desktop dari atas ke bawah:

1. **Baris status:** kiri "Live Preview" (13px, `--on-navy-muted`), kanan status mono 12px ("Up to date" `--mint`, "Updating…" `--on-navy-muted`, error `--danger`). Di sebelahnya boleh ada ikon grid kecil seperti referensi hanya bila fungsional; jika tidak, hilangkan.
2. **QR card:** putih `#FFFFFF`, radius 18px, padding 16px, QR maks 248px, terpusat. **QR card tetap putih** (dan memakai warna yang dipilih pengguna) agar quiet zone dan kontras scan terjaga.
3. **Area accordion (scrollable):** `flex: 1; overflow-y: auto` dengan scrollbar tipis. Tiga item, urutan seperti referensi: **Frame**, **Shape & Color**, **Logo**. Default: Shape & Color terbuka. Satu terbuka pada satu waktu.
4. **Tombol Download (menempel di bawah panel):** pill, fill `--mint`, teks `--on-mint` 600, tinggi 48px, lebar penuh, ikon download 18px kiri. Teks: "Download HD (1300px)". Di bawahnya caption 12px `--on-navy-muted`: "PNG 1300px, dibuat oleh server Python".

### 4.4 Item accordion (di dalam panel)

- Header: tinggi 48px, fill `--indigo`, radius 14px, judul 14px/600 putih, chevron kanan. `<button>` dengan `aria-expanded` dan `aria-controls`.
- Isi: fill `--indigo`, padding 16px, pemisah atas `rgba(255,255,255,.14)`. Animasi `grid-template-rows 0fr → 1fr` 180ms; konten tidak boleh terpotong.
- Gap antar item 8px.

### 4.5 Pemetaan fitur lama ke posisi baru

| Fitur saat ini | Posisi baru |
|---|---|
| 01 Content & Data (textarea URL/teks) | Zona tengah: textarea besar |
| 02 Color Palette: preset 4 swatch | Accordion **Shape & Color**, baris swatch paling atas |
| 02 Foreground (Dots), Eyes Color, Background Color | Accordion **Shape & Color**, tiga baris ringkas |
| 03 Module Shape (Square, Circle, Rounded, Vertical, Horizontal, Circuit) | Accordion **Shape & Color**, di bawah warna, grid 3 kolom |
| 03 Center Logo (file upload) | Accordion **Logo**, dropzone bergaris putus-putus |
| 04 Frame Style (None, Top, Bottom, Bubble, Label) | Accordion **Frame**, baris tile |
| 04 Typography (teks frame, font, dsb. sesuai kode yang ada) | Accordion **Frame**, di bawah tile |
| Live Preview + status "Up to date" | Panel navy, baris status + QR card |
| Download HD (1300px) | Panel navy, tombol mint |
| Toggle Dark/Light theme | Rail bawah (desktop) / baris atas (lainnya) |

Jangan menambah fitur yang tidak ada di aplikasi (lihat bagian 8).

### 4.6 Baris warna (di dalam panel)

- Satu baris = swatch 32px (radius 8px, border putih 1px 30%) + label 13px (+ deskripsi singkat 12px `--on-navy-muted`) + hex mono 12px di kanan. Seluruh baris adalah target klik ≥ 44px tingginya.
- Preset: 4 swatch 36px dengan label aksesibel (Black, Indigo, Steel, Sky); terpilih = border 2px `--sky`.
- **Peringatan kontras:** bila rasio foreground/background < ± 4:1 atau foreground lebih terang dari background, tampilkan peringatan `--warning` dengan ikon dan teks: "Contrast too low, the QR may not scan."

### 4.7 Tile pilihan (Module Shape & Frame Style)

- Grid 3 kolom (shape) dan 5 kolom yang membungkus (frame), tile min 56×56px, fill `--navy`, border 1px `rgba(255,255,255,.18)`, radius 12px, ikon 20px di atas label 12px.
- Terpilih: border 2px `--sky`, teks putih. Tidak ada glow.
- `role="radiogroup"`, navigasi panah.

### 4.8 Dropzone Center Logo

- Kotak border 1.5px putus-putus `rgba(255,255,255,.4)`, radius 14px, padding 16px, tombol bulat 36px (fill `--sky`, ikon upload gelap) + teks "Choose a PNG or SVG" dan helper "Transparent background recommended."
- Menggantikan input file bawaan browser ("Choose File / No file chosen"). Tetap memakai `<input type="file">` sungguhan di belakangnya agar keyboard dan screen reader berfungsi; mendukung klik dan drag-and-drop.
- Setelah dipilih: tampilkan thumbnail 32px, nama file, dan tombol "Remove".

### 4.9 State kosong, loading, error

- **Input kosong:** QR card menampilkan teks "Enter text to generate a QR code"; tombol Download disabled dengan alasan terlihat.
- **Loading:** QR lama tetap tampil, status "Updating…".
- **Error server:** pesan spesifik dan tombol "Try again".

---

## 5. Motion

Hanya fungsional: accordion 180ms, hover/focus ≤ 120ms, pergantian QR fade 100ms, ganti tema 150ms. Tidak ada animasi berulang. Hormati `prefers-reduced-motion`.

---

## 6. Aksesibilitas

- Urutan tab: toggle tema, textarea, rail (jika tampil), accordion, tombol Download.
- Focus ring 2px `--sky` (di atas navy gunakan `#FFFFFF`) pada semua elemen interaktif.
- Target sentuh ≥ 44×44px dengan jarak ≥ 8px.
- Status preview memakai `aria-live="polite"`; gambar QR punya `alt` yang menyebut isi yang dikodekan.
- Warna bukan satu-satunya pembawa makna (error/warning selalu disertai ikon dan teks).

---

## 7. CSS variables

```css
:root {
  --indigo: #2F39A9;
  --steel:  #2E6FA0;
  --sky:    #49A4BB;
  --mint:   #15D8B3;

  --page-bg: #EAF0FC;
  --frame: #FFFFFF;
  --card: #F4F7FD;
  --field: #FFFFFF;
  --line: #D5D9F0;
  --heading: #1E2674;
  --text: #12163A;
  --text-muted: #5A6190;

  --navy: #1E2674;
  --on-navy: #FFFFFF;
  --on-navy-muted: #B9BFEA;
  --on-mint: #080B1F;

  --danger: #FF6B6B;
  --warning: #F5B84B;

  --font-ui: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, Menlo, monospace;

  --r-frame: 32px; --r-card: 26px; --r-panel: 22px;
  --r-item: 14px;  --r-tile: 12px; --r-qr: 18px; --r-pill: 9999px;
}

:root[data-theme="dark"] {
  --page-bg: #080B1F;
  --frame: #11143A;
  --card: #0F1330;
  --field: #171C45;
  --line: #252B5C;
  --heading: #FFFFFF;
  --text: #E8EAFB;
  --text-muted: #9AA0D0;
}

.shell {
  background: var(--frame);
  border-radius: var(--r-frame);
  padding: 10px;
  box-shadow: 0 24px 60px -24px rgba(30, 38, 116, .28);
}
.shell-inner {
  background: var(--card);
  border-radius: var(--r-card);
  display: grid;
  grid-template-columns: 64px 1fr 380px;
  gap: 24px; padding: 24px;
}

.panel { background: var(--navy); color: var(--on-navy); border-radius: var(--r-panel);
         display: flex; flex-direction: column; padding: 20px; min-height: 0; }
.panel-scroll { flex: 1; overflow-y: auto; min-height: 0; }

.btn-download {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; height: 48px; border-radius: var(--r-pill);
  background: var(--mint); color: var(--on-mint); font: 600 16px/1 var(--font-ui);
}
.btn-download:disabled { opacity: .4; cursor: not-allowed; }

.acc-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .18s ease; }
.acc-body[data-open="true"] { grid-template-rows: 1fr; }
.acc-body > div { overflow: hidden; min-height: 0; }

:focus-visible { outline: 2px solid var(--sky); outline-offset: 2px; }
.panel :focus-visible { outline-color: #fff; }

@media (max-width: 1179px) { .shell-inner { grid-template-columns: 64px 1fr 340px; } }
@media (max-width: 1023px) { .shell-inner { grid-template-columns: 1fr; } .rail { display: none; } }
@media (max-width: 767px)  { .deco { display: none; } }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
```

---

## 8. Do & Don't

**Do**
- Pertahankan semua fitur dan perilaku yang sudah ada; pindahkan, jangan hapus.
- Jadikan panel navy sebagai titik berat visual; mint hanya untuk Download dan status sukses.
- Pastikan QR card selalu putih dan menampilkan warna pilihan pengguna.
- Uji pada 320, 375, 768, 1024, 1440px, tema light dan dark.

**Don't**
- Jangan menambah fitur yang muncul di gambar referensi tetapi tidak ada di aplikasi: upload file apa saja, tombol JPG atau SVG/EPS, rail jenis konten (email, SMS, Wi-Fi, dst.). Boleh ditawarkan sebagai saran terpisah.
- Jangan memakai gradient, blur, glow, atau lingkaran dekor lebih dari tiga.
- Jangan memakai teks putih di atas mint.
- Jangan mengisi field dengan data palsu; gunakan placeholder jujur.
- Jangan memakai tombol/ikon rail yang tidak punya perilaku nyata.
- Jangan mengubah backend, endpoint, atau logika render QR (hanya lapisan tampilan).