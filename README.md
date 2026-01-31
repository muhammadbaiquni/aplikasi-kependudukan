# Aplikasi Kependudukan

Desktop app untuk pendataan penduduk, kepindahan, kematian, dan pivot
table. Dibangun dengan Electron + Vite + React + SQLite.

## Fitur Utama
- CRUD penduduk, keluarga, referensi, dan settings profil.
- Import/Export CSV dan Excel (penduduk) dengan detail alamat.
- Template import CSV/Excel berisi header + contoh data.
- Pindah/meninggal: pindahkan data ke tabel khusus + catat peristiwa.
- Pivot table untuk penduduk, pindah, dan meninggal.
- Dashboard statistik + filter tanggal peristiwa.

## Kebutuhan
- Node.js 18+ (disarankan LTS).
- Windows untuk build .exe (electron-builder).

## Cara Menjalankan (Dev)
```bash
npm install
npm run electron:dev
```

## Build Electron (Installer + Portable)
```bash
npm run electron:build
```
Output ada di `dist/`:
- Installer NSIS
- Portable `.exe`

## Script Lain
```bash
npm run dev           # Vite dev server
npm run build         # Vite build
npm run test:unit     # Unit tests
npm run test:electron # UI tests
npm run lint          # Lint
```

## Format Import Penduduk
Header kolom:
```
NIK,NAMA,JK,TMPT_LHR,TGL_LHR,STATUS,SHDK,NO_KK,AGAMA,PDDK_AKHIR,PEKERJAAN,NAMA_AYAH,NAMA_IBU,NAMA_KEP_KEL,ALAMAT,RT,RW,KELURAHAN,KECAMATAN,KOTA,PROVINSI,KODEPOS,TELEPON
```

Format tanggal lahir yang didukung:
- `DD/MM/YYYY`
- `DD-MM-YYYY`
- `YYYY-MM-DD`
- Excel Date (tipe Date)

Umur dihitung otomatis dari `TGL_LHR`.

## Tampilan Alamat di Tabel
Di tabel Penduduk/Pindah/Meninggal, kolom alamat ditampilkan sebagai gabungan:

`{alamat}, RT {rt}/RW {rw}, Kelurahan {kelurahan}, Kecamatan {kecamatan}, {kota}, Provinsi {provinsi}, {kodepos}`

Aturan tampilan:
- Bagian yang kosong akan dihilangkan.
- RT/RW dipad menjadi 3 digit (contoh: `9` → `009`, `09` → `009`).
- Kata "provinsi" di awal field provinsi akan dihapus agar tidak dobel.

## Database
- Mode dev: `aplikasi-kependudukan.db` di root project.
- Mode portable: `aplikasi-kependudukan.db` di folder yang sama dengan `.exe`.

## Icon Aplikasi
- Window icon: `build/icon.ico`.
- Build Windows: icon diambil dari `build/icon.ico`.
