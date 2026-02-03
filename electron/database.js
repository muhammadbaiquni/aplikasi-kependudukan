import { app, ipcMain, dialog } from 'electron';
import fs from 'fs';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = app.isPackaged
  ? path.join(path.dirname(app.getPath('exe')), 'aplikasi-kependudukan.db')
  : path.join(__dirname, '../aplikasi-kependudukan.db');
const db = new Database(dbPath);

const REFERENCE_TABLES = {
  agama: 'ref_agama',
  status: 'ref_status',
  shdk: 'ref_shdk',
  pendidikan: 'ref_pendidikan',
  pekerjaan: 'ref_pekerjaan',
  jk: 'ref_jk'
};

const DEFAULT_REFERENCES = {
  agama: ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Budha', 'Khonghucu', 'Lainnya'],
  status: [
    'Belum Kawin',
    'Kawin',
    'Kawin Tercatat',
    'Kawin Belum Tercatat',
    'Cerai Hidup',
    'Cerai Mati'
  ],
  shdk: [
    'Kepala Keluarga',
    'Suami',
    'Istri',
    'Anak',
    'Mantu',
    'Cucu',
    'Orang Tua',
    'Mertua',
    'Famili Lainnya',
    'Pembantu',
    'Lainnya'
  ],
  pendidikan: [
    'Tidak/Belum Sekolah',
    'Belum Tamat SD/Sederajat',
    'Tamat SD/Sederajat',
    'SLTP/Sederajat',
    'SLTA/Sederajat',
    'Diploma I/II',
    'Akademi/Diploma III/S.Muda',
    'Diploma IV/Strata I',
    'Strata II',
    'Strata III'
  ],
  pekerjaan: [
    'Belum/Tidak Bekerja',
    'Mengurus Rumah Tangga',
    'Pelajar/Mahasiswa',
    'Pensiunan',
    'Pegawai Negeri Sipil (PNS)',
    'Tentara Nasional Indonesia (TNI)',
    'Kepolisian RI (POLRI)',
    'Perdagangan',
    'Petani/Pekebun',
    'Peternak',
    'Nelayan/Perikanan',
    'Industri',
    'Konstruksi',
    'Transportasi',
    'Karyawan Swasta',
    'Karyawan BUMN',
    'Karyawan BUMD',
    'Karyawan Honorer',
    'Buruh Harian Lepas',
    'Buruh Tani/Perkebunan',
    'Buruh Nelayan/Perikanan',
    'Buruh Peternakan',
    'Pembantu Rumah Tangga',
    'Tukang Cukur',
    'Tukang Listrik',
    'Tukang Batu',
    'Tukang Kayu',
    'Tukang Sol Sepatu',
    'Tukang Las/Pandai Besi',
    'Tukang Jahit',
    'Tukang Gigi',
    'Penata Rias',
    'Penata Busana',
    'Mekanik',
    'Seniman',
    'Tabib',
    'Paraji',
    'Perancang Busana',
    'Penterjemah',
    'Imam Masjid',
    'Pendeta',
    'Pastor',
    'Wartawan',
    'Ustadz/Mubaligh',
    'Juru Masak',
    'Promotor Acara',
    'Anggota DPR-RI',
    'Anggota DPD',
    'Anggota BPK',
    'Presiden',
    'Wakil Presiden',
    'Anggota Mahkamah Konstitusi',
    'Anggota Kabinet Kementrian',
    'Duta Besar',
    'Gubernur',
    'Wakil Gubernur',
    'Bupati',
    'Wakil Bupati',
    'Walikota',
    'Wakil Walikota',
    'Anggota DPRP Prop.',
    'Anggota DPRP Kab.',
    'Dosen',
    'Guru',
    'Pilot',
    'Pengacara',
    'Notaris',
    'Arsitek',
    'Akuntan',
    'Konsultan',
    'Dokter',
    'Bidan',
    'Perawat',
    'Apoteker',
    'Psikiater/Psikolog',
    'Penyiar Televisi',
    'Penyiar Radio',
    'Pelaut',
    'Peneliti',
    'Sopir',
    'Pialang',
    'Paranormal',
    'Pedagang',
    'Perangkat Desa',
    'Kepala Desa',
    'Biarawati',
    'Wiraswasta'
  ],
  jk: ['L', 'P']
};
const CSV_HEADERS = [
  'NIK',
  'NAMA',
  'JK',
  'TMPT_LHR',
  'TGL_LHR',
  'STATUS',
  'SHDK',
  'NO_KK',
  'AGAMA',
  'PDDK_AKHIR',
  'PEKERJAAN',
  'NAMA_AYAH',
  'NAMA_IBU',
  'NAMA_KEP_KEL',
  'ALAMAT',
  'RT',
  'RW',
  'KELURAHAN',
  'KECAMATAN',
  'KOTA',
  'PROVINSI',
  'KODEPOS',
  'TELEPON'
];

const TEMPLATE_ROWS = [
  {
    NIK: '3201010101010001',
    NAMA: 'Ahmad Fauzi',
    JK: 'L',
    TMPT_LHR: 'Jakarta',
    TGL_LHR: '01/01/1990',
    STATUS: 'KAWIN',
    SHDK: 'KEPALA KELUARGA',
    NO_KK: '3201010101010001',
    AGAMA: 'Islam',
    PDDK_AKHIR: 'Strata I',
    PEKERJAAN: 'Karyawan Swasta',
    NAMA_AYAH: 'Subhan',
    NAMA_IBU: 'Siti',
    NAMA_KEP_KEL: 'Ahmad Fauzi',
    ALAMAT: 'Jl. Merdeka No. 1',
    RT: '001',
    RW: '002',
    KELURAHAN: 'Gambir',
    KECAMATAN: 'Gambir',
    KOTA: 'Jakarta',
    PROVINSI: 'DKI Jakarta',
    KODEPOS: '10110',
    TELEPON: '081234567890'
  },
  {
    NIK: '3201010101010002',
    NAMA: 'Siti Aminah',
    JK: 'P',
    TMPT_LHR: 'Bandung',
    TGL_LHR: '15/05/1993',
    STATUS: 'KAWIN',
    SHDK: 'ISTRI',
    NO_KK: '3201010101010001',
    AGAMA: 'Islam',
    PDDK_AKHIR: 'Diploma IV/Strata I',
    PEKERJAAN: 'Pegawai Negeri Sipil (PNS)',
    NAMA_AYAH: 'Herman',
    NAMA_IBU: 'Rina',
    NAMA_KEP_KEL: 'Ahmad Fauzi',
    ALAMAT: 'Jl. Merdeka No. 1',
    RT: '001',
    RW: '002',
    KELURAHAN: 'Gambir',
    KECAMATAN: 'Gambir',
    KOTA: 'Jakarta',
    PROVINSI: 'DKI Jakarta',
    KODEPOS: '10110',
    TELEPON: '081234567891'
  },
  {
    NIK: '3201010101010003',
    NAMA: 'Budi Santoso',
    JK: 'L',
    TMPT_LHR: 'Surabaya',
    TGL_LHR: '20/11/2001',
    STATUS: 'BELUM KAWIN',
    SHDK: 'ANAK',
    NO_KK: '3201010101010001',
    AGAMA: 'Islam',
    PDDK_AKHIR: 'SLTA/Sederajat',
    PEKERJAAN: 'Pelajar/Mahasiswa',
    NAMA_AYAH: 'Ahmad Fauzi',
    NAMA_IBU: 'Siti Aminah',
    NAMA_KEP_KEL: 'Ahmad Fauzi',
    ALAMAT: 'Jl. Merdeka No. 1',
    RT: '001',
    RW: '002',
    KELURAHAN: 'Gambir',
    KECAMATAN: 'Gambir',
    KOTA: 'Jakarta',
    PROVINSI: 'DKI Jakarta',
    KODEPOS: '10110',
    TELEPON: '081234567892'
  }
];

const NORMALIZED_HEADER_MAP = new Map([
  ['nik', 'nik'],
  ['nama', 'nama'],
  ['jk', 'jk'],
  ['tmpt_lhr', 'tmpt_lhr'],
  ['tmpt lhr', 'tmpt_lhr'],
  ['tgl_lhr', 'tgl_lhr'],
  ['tgl lhr', 'tgl_lhr'],
  ['status', 'status'],
  ['shdk', 'shdk'],
  ['no kk', 'no_kk'],
  ['no. kk', 'no_kk'],
  ['no_kk', 'no_kk'],
  ['agama', 'agama'],
  ['pddk_akhir', 'pddk_akhir'],
  ['pekerjaan', 'pekerjaan'],
  ['alamat', 'alamat'],
  ['nama_ayah', 'nama_ayah'],
  ['nama ayah', 'nama_ayah'],
  ['nama_ibu', 'nama_ibu'],
  ['nama ibu', 'nama_ibu'],
  ['nama kepala keluarga', 'nama_kep_kel'],
  ['nama kep kel', 'nama_kep_kel'],
  ['nama_kep_kel', 'nama_kep_kel'],
  ['rt', 'rt'],
  ['rw', 'rw'],
  ['kota', 'kota'],
  ['kabupaten', 'kota'],
  ['kabupaten/kota', 'kota'],
  ['kabupaten_kota', 'kota'],
  ['kelurahan', 'kelurahan'],
  ['desa', 'kelurahan'],
  ['desa/kelurahan', 'kelurahan'],
  ['desa_kelurahan', 'kelurahan'],
  ['kecamatan', 'kecamatan'],
  ['provinsi', 'provinsi'],
  ['propinsi', 'provinsi'],
  ['kodepos', 'kodepos'],
  ['kode pos', 'kodepos'],
  ['kode_pos', 'kodepos'],
  ['postal code', 'kodepos'],
  ['pos', 'kodepos'],
  ['telepon', 'telepon'],
  ['telp', 'telepon'],
  ['no telepon', 'telepon'],
  ['no. telepon', 'telepon'],
  ['telephone', 'telepon'],
  ['hp', 'telepon'],
  ['handphone', 'telepon'],
  ['no. hp', 'telepon'],
  ['no_hp', 'telepon']
]);

const normalizeHeader = (value) => value?.toString().trim().toLowerCase();

const normalizeValue = (value) => value?.toString().trim();

const normalizeEnum = (value, allowed, map = {}) => {
  if (!value) {
    return null;
  }
  const normalized = normalizeValue(value)?.toUpperCase();
  if (!normalized) {
    return null;
  }
  const mapped = map[normalized] || normalized;
  return allowed.has(mapped) ? mapped : null;
};

const formatDateValue = (year, month, day) => {
  const yyyy = String(year).padStart(4, '0');
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const normalizeDateValue = (value) => {
  if (!value) {
    return null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateValue(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed?.y && parsed?.m && parsed?.d) {
      return formatDateValue(parsed.y, parsed.m, parsed.d);
    }
    const fallback = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (!Number.isNaN(fallback.getTime())) {
      return formatDateValue(fallback.getFullYear(), fallback.getMonth() + 1, fallback.getDate());
    }
    return null;
  }
  if (typeof value !== 'string') {
    return null;
  }

  const raw = value.trim();
  if (!raw) {
    return null;
  }

  const isoMatch = raw.match(/^(\d{4})[/-](\d{2})[/-](\d{2})$/);
  if (isoMatch) {
    const year = Number.parseInt(isoMatch[1], 10);
    const month = Number.parseInt(isoMatch[2], 10);
    const day = Number.parseInt(isoMatch[3], 10);
    const date = new Date(year, month - 1, day);
    if (!Number.isNaN(date.getTime()) && date.getDate() === day && date.getMonth() === month - 1) {
      return formatDateValue(year, month, day);
    }
    return null;
  }

  const dmyMatch = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = Number.parseInt(dmyMatch[1], 10);
    const month = Number.parseInt(dmyMatch[2], 10);
    const year = Number.parseInt(dmyMatch[3], 10);
    const date = new Date(year, month - 1, day);
    if (!Number.isNaN(date.getTime()) && date.getDate() === day && date.getMonth() === month - 1) {
      return formatDateValue(year, month, day);
    }
    return null;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return formatDateValue(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
  }

  return null;
};

const getAgeFromBirthDate = (birthDate) => {
  const normalized = normalizeDateValue(birthDate);
  if (!normalized) {
    return 0;
  }
  const date = new Date(normalized);
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const hasHadBirthday =
    today.getMonth() > date.getMonth()
    || (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());
  if (!hasHadBirthday) {
    age -= 1;
  }
  return Math.max(0, age);
};

const STATUS_ALLOWED = new Set([
  'BELUM KAWIN',
  'KAWIN',
  'KAWIN TERCATAT',
  'KAWIN BELUM TERCATAT',
  'CERAI HIDUP',
  'CERAI MATI'
]);

const SHDK_ALLOWED = new Set([
  'KEPALA KELUARGA',
  'SUAMI',
  'ISTRI',
  'ANAK',
  'MANTU',
  'CUCU',
  'ORANG TUA',
  'MERTUA',
  'FAMILI LAINNYA',
  'PEMBANTU',
  'LAINNYA'
]);

const JK_ALLOWED = new Set(['L', 'P']);

const JK_MAP = {
  'LAKI-LAKI': 'L',
  LAKILAKI: 'L',
  LAKI: 'L',
  PRIA: 'L',
  MALE: 'L',
  PEREMPUAN: 'P',
  WANITA: 'P',
  FEMALE: 'P'
};

const STATUS_MAP = {
  BELUMKAWIN: 'BELUM KAWIN',
  KAWINTERCATAT: 'KAWIN TERCATAT',
  KAWINBELUMTERCATAT: 'KAWIN BELUM TERCATAT',
  CERAIHIDUP: 'CERAI HIDUP',
  CERAIMATI: 'CERAI MATI'
};

const SHDK_MAP = {
  KEPALAKELUARGA: 'KEPALA KELUARGA',
  ORANGTUA: 'ORANG TUA',
  FAMILILAINNYA: 'FAMILI LAINNYA'
};

const cleanupLegacySchema = () => {
  const items = db.prepare(
    "SELECT type, name FROM sqlite_master WHERE sql LIKE '%penduduk_old%'"
  ).all();
  items.forEach((item) => {
    if (item.type === 'trigger') {
      db.exec(`DROP TRIGGER IF EXISTS ${item.name};`);
    } else if (item.type === 'view') {
      db.exec(`DROP VIEW IF EXISTS ${item.name};`);
    }
  });
  db.exec('DROP TABLE IF EXISTS penduduk_old;');
};

const ensureUserColumns = () => {
  const columns = db.prepare('PRAGMA table_info(users)').all();
  const columnNames = new Set(columns.map((col) => col.name));
  if (!columnNames.has('nama')) {
    db.exec('ALTER TABLE users ADD COLUMN nama TEXT');
  }
  if (!columnNames.has('alamat')) {
    db.exec('ALTER TABLE users ADD COLUMN alamat TEXT');
  }
};

const ADDRESS_COLUMNS = [
  { name: 'rt', type: 'TEXT' },
  { name: 'rw', type: 'TEXT' },
  { name: 'kelurahan', type: 'TEXT' },
  { name: 'kecamatan', type: 'TEXT' },
  { name: 'kota', type: 'TEXT' },
  { name: 'provinsi', type: 'TEXT' },
  { name: 'kodepos', type: 'TEXT' },
  { name: 'telepon', type: 'TEXT' }
];

const ensureTableColumns = (tableName, columns) => {
  const tableColumns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  if (!tableColumns.length) {
    return;
  }
  const columnNames = new Set(tableColumns.map((col) => col.name));
  columns.forEach(({ name, type }) => {
    if (!columnNames.has(name)) {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${name} ${type}`);
    }
  });
};

const ensureReferenceTables = () => {
  Object.values(REFERENCE_TABLES).forEach((table) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${table} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      );
    `);
  });
};

const seedReferences = () => {
  const trx = db.transaction(() => {
    Object.entries(DEFAULT_REFERENCES).forEach(([key, values]) => {
      const table = REFERENCE_TABLES[key];
      const insert = db.prepare(`INSERT OR IGNORE INTO ${table} (name) VALUES (?)`);
      values.forEach((value) => insert.run(value));
    });
  });
  trx();
};

const ensurePendudukSchema = () => {
  const table = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='penduduk'")
    .get();

  if (!table) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS penduduk (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        umur INTEGER,
        nik TEXT UNIQUE NOT NULL,
        nama TEXT NOT NULL,
        jk TEXT,
        tmpt_lhr TEXT,
        tgl_lhr TEXT,
        status TEXT,
        shdk TEXT,
        no_kk TEXT,
        agama TEXT,
        pddk_akhir TEXT,
        pekerjaan TEXT,
        nama_ayah TEXT,
        nama_ibu TEXT,
        nama_kep_kel TEXT,
        alamat TEXT,
        rt TEXT,
        rw TEXT,
        kelurahan TEXT,
        kecamatan TEXT,
        kota TEXT,
        provinsi TEXT,
        kodepos TEXT,
        telepon TEXT,
        state TEXT DEFAULT 'AKTIF',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME
      );
    `);
    return;
  }

  if (!table.sql.includes('CHECK(')) {
    ensureTableColumns('penduduk', ADDRESS_COLUMNS);
    return;
  }

  db.exec('ALTER TABLE penduduk RENAME TO penduduk_old;');
  ensureTableColumns('penduduk_old', ADDRESS_COLUMNS);
  db.exec(`
    CREATE TABLE penduduk (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      umur INTEGER,
      nik TEXT UNIQUE NOT NULL,
      nama TEXT NOT NULL,
      jk TEXT,
      tmpt_lhr TEXT,
      tgl_lhr TEXT,
      status TEXT,
      shdk TEXT,
      no_kk TEXT,
      agama TEXT,
      pddk_akhir TEXT,
      pekerjaan TEXT,
      nama_ayah TEXT,
      nama_ibu TEXT,
      nama_kep_kel TEXT,
      alamat TEXT,
      rt TEXT,
      rw TEXT,
      kelurahan TEXT,
      kecamatan TEXT,
      kota TEXT,
      provinsi TEXT,
      kodepos TEXT,
      telepon TEXT,
      state TEXT DEFAULT 'AKTIF',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME
    );
  `);
  db.exec(`
    INSERT INTO penduduk (
      id, umur, nik, nama, jk, tmpt_lhr, tgl_lhr, status, shdk, no_kk,
      agama, pddk_akhir, pekerjaan, nama_ayah, nama_ibu, nama_kep_kel,
      alamat, rt, rw, kelurahan, kecamatan, kota, provinsi, kodepos, telepon,
      state, created_at, updated_at, deleted_at
    )
    SELECT
      id, umur, nik, nama, jk, tmpt_lhr, tgl_lhr, status, shdk, no_kk,
      agama, pddk_akhir, pekerjaan, nama_ayah, nama_ibu, nama_kep_kel,
      alamat, rt, rw, kelurahan, kecamatan, kota, provinsi, kodepos, telepon,
      state, created_at, updated_at, deleted_at
    FROM penduduk_old;
  `);
  db.exec('DROP TABLE penduduk_old;');
  ensureTableColumns('penduduk', ADDRESS_COLUMNS);
};

const ensurePendudukPindahSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS penduduk_pindah (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      umur INTEGER,
      nik TEXT UNIQUE NOT NULL,
      nama TEXT NOT NULL,
      jk TEXT,
      tmpt_lhr TEXT,
      tgl_lhr TEXT,
      status TEXT,
      shdk TEXT,
      no_kk TEXT,
      agama TEXT,
      pddk_akhir TEXT,
      pekerjaan TEXT,
      nama_ayah TEXT,
      nama_ibu TEXT,
      nama_kep_kel TEXT,
      alamat TEXT,
      rt TEXT,
      rw TEXT,
      kelurahan TEXT,
      kecamatan TEXT,
      kota TEXT,
      provinsi TEXT,
      kodepos TEXT,
      telepon TEXT,
      state TEXT DEFAULT 'PINDAH',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME
    );
  `);
  ensureTableColumns('penduduk_pindah', ADDRESS_COLUMNS);
};

const ensurePendudukMeninggalSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS penduduk_meninggal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      umur INTEGER,
      nik TEXT UNIQUE NOT NULL,
      nama TEXT NOT NULL,
      jk TEXT,
      tmpt_lhr TEXT,
      tgl_lhr TEXT,
      status TEXT,
      shdk TEXT,
      no_kk TEXT,
      agama TEXT,
      pddk_akhir TEXT,
      pekerjaan TEXT,
      nama_ayah TEXT,
      nama_ibu TEXT,
      nama_kep_kel TEXT,
      alamat TEXT,
      rt TEXT,
      rw TEXT,
      kelurahan TEXT,
      kecamatan TEXT,
      kota TEXT,
      provinsi TEXT,
      kodepos TEXT,
      telepon TEXT,
      state TEXT DEFAULT 'MENINGGAL',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME
    );
  `);
  ensureTableColumns('penduduk_meninggal', ADDRESS_COLUMNS);
};

const ensurePeristiwaSchema = () => {
  const table = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='peristiwa'")
    .get();

  if (!table) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS peristiwa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jenis TEXT CHECK(jenis IN ('LAHIR', 'MENINGGAL', 'DATANG', 'PERGI')),
        penduduk_id INTEGER NOT NULL,
        tgl_peristiwa TEXT NOT NULL,
        ket TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (penduduk_id) REFERENCES penduduk(id)
      );
    `);
    return;
  }

  if (!table.sql.includes('penduduk_old')) {
    return;
  }

  db.exec('ALTER TABLE peristiwa RENAME TO peristiwa_old;');
  db.exec(`
    CREATE TABLE peristiwa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jenis TEXT CHECK(jenis IN ('LAHIR', 'MENINGGAL', 'DATANG', 'PERGI')),
      penduduk_id INTEGER NOT NULL,
      tgl_peristiwa TEXT NOT NULL,
      ket TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (penduduk_id) REFERENCES penduduk(id)
    );
  `);
  db.exec(`
    INSERT INTO peristiwa (id, jenis, penduduk_id, tgl_peristiwa, ket, created_at)
    SELECT id, jenis, penduduk_id, tgl_peristiwa, ket, created_at
    FROM peristiwa_old;
  `);
  db.exec('DROP TABLE peristiwa_old;');
};

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const mapRowToPenduduk = (row) => {
  const payload = {};
  for (const [key, value] of Object.entries(row)) {
    const normalized = normalizeHeader(key);
    const targetKey = NORMALIZED_HEADER_MAP.get(normalized);
    if (!targetKey) {
      continue;
    }
    const cleanedValue = typeof value === 'string' ? value.trim() : value;
    payload[targetKey] = cleanedValue === '' ? null : cleanedValue;
  }

  payload.tgl_lhr = normalizeDateValue(payload.tgl_lhr);
  payload.jk = normalizeEnum(payload.jk, JK_ALLOWED, JK_MAP);
  payload.status = normalizeEnum(payload.status, STATUS_ALLOWED, STATUS_MAP);
  payload.shdk = normalizeEnum(payload.shdk, SHDK_ALLOWED, SHDK_MAP);

  return payload;
};

const upsertPendudukBatch = (rows) => {
  const selectByNik = db.prepare('SELECT * FROM penduduk WHERE nik = ?');
  const insertStmt = db.prepare(`
    INSERT INTO penduduk (
      nik, nama, jk, tmpt_lhr, tgl_lhr, status, shdk, no_kk,
      agama, pddk_akhir, pekerjaan, nama_ayah, nama_ibu,
      nama_kep_kel, alamat, rt, rw, kelurahan, kecamatan, kota, provinsi,
      kodepos, telepon, umur
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateStmt = db.prepare(`
    UPDATE penduduk SET
      nik = ?, nama = ?, jk = ?, tmpt_lhr = ?, tgl_lhr = ?,
      status = ?, shdk = ?, no_kk = ?, agama = ?, pddk_akhir = ?,
      pekerjaan = ?, nama_ayah = ?, nama_ibu = ?, nama_kep_kel = ?,
      alamat = ?, rt = ?, rw = ?, kelurahan = ?, kecamatan = ?, kota = ?,
      provinsi = ?, kodepos = ?, telepon = ?, umur = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  const trx = db.transaction(() => {
    rows.forEach((row) => {
      const payload = mapRowToPenduduk(row);
      if (!payload.nik) {
        skipped += 1;
        return;
      }

      const existing = selectByNik.get(payload.nik);
      if (existing) {
        const merged = { ...existing, ...payload };
        const computedAge = getAgeFromBirthDate(merged.tgl_lhr);
        updateStmt.run(
          merged.nik,
          merged.nama,
          merged.jk,
          merged.tmpt_lhr,
          merged.tgl_lhr,
          merged.status,
          merged.shdk,
          merged.no_kk,
          merged.agama,
          merged.pddk_akhir,
          merged.pekerjaan,
          merged.nama_ayah,
          merged.nama_ibu,
          merged.nama_kep_kel,
          merged.alamat,
          merged.rt,
          merged.rw,
          merged.kelurahan,
          merged.kecamatan,
          merged.kota,
          merged.provinsi,
          merged.kodepos,
          merged.telepon,
          computedAge,
          existing.id
        );
        updated += 1;
      } else {
        const computedAge = getAgeFromBirthDate(payload.tgl_lhr);
        insertStmt.run(
          payload.nik,
          payload.nama,
          payload.jk,
          payload.tmpt_lhr,
          payload.tgl_lhr,
          payload.status,
          payload.shdk,
          payload.no_kk,
          payload.agama,
          payload.pddk_akhir,
          payload.pekerjaan,
          payload.nama_ayah,
          payload.nama_ibu,
          payload.nama_kep_kel,
          payload.alamat,
          payload.rt,
          payload.rw,
          payload.kelurahan,
          payload.kecamatan,
          payload.kota,
          payload.provinsi,
          payload.kodepos,
          payload.telepon,
          computedAge
        );
        inserted += 1;
      }
    });
  });

  trx();

  return { inserted, updated, skipped };
};

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS peristiwa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jenis TEXT CHECK(jenis IN ('LAHIR', 'MENINGGAL', 'DATANG', 'PERGI')),
      penduduk_id INTEGER NOT NULL,
      tgl_peristiwa TEXT NOT NULL,
      ket TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (penduduk_id) REFERENCES penduduk(id)
    );

    INSERT OR IGNORE INTO users (username, password) VALUES ('admin', 'admin123!@#');
  `);

  cleanupLegacySchema();
  ensureUserColumns();
  ensurePendudukSchema();
  ensurePendudukPindahSchema();
  ensurePendudukMeninggalSchema();
  ensurePeristiwaSchema();
  ensureReferenceTables();
  seedReferences();
  db.exec('DROP TABLE IF EXISTS keluarga;');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_penduduk_no_kk_deleted
    ON penduduk(no_kk, deleted_at);
  `);
  db.prepare("UPDATE users SET nama = ? WHERE username = ? AND (nama IS NULL OR nama = '')")
    .run('Administrator', 'admin');
}

initDatabase();

ipcMain.handle('db-login', (event, username, password) => {
  const stmt = db.prepare(
    'SELECT * FROM users WHERE username = ? AND password = ?'
  );
  const result = stmt.get(username, password);
  return result || null;
});

ipcMain.handle('db-get-penduduk-list', () => {
  const stmt = db.prepare('SELECT * FROM penduduk WHERE deleted_at IS NULL');
  return stmt.all().map((item) => ({
    ...item,
    umur: getAgeFromBirthDate(item.tgl_lhr)
  }));
});

ipcMain.handle('db-get-penduduk-pindah-list', () => {
  const stmt = db.prepare(`
    SELECT
      pp.*,
      (
        SELECT MAX(pr.tgl_peristiwa)
        FROM peristiwa pr
        JOIN penduduk p ON p.id = pr.penduduk_id
        WHERE p.nik = pp.nik AND pr.jenis = 'PERGI'
      ) AS tgl_peristiwa
    FROM penduduk_pindah pp
    WHERE pp.deleted_at IS NULL
  `);
  return stmt.all().map((item) => ({
    ...item,
    umur: getAgeFromBirthDate(item.tgl_lhr)
  }));
});

ipcMain.handle('db-get-penduduk-meninggal-list', () => {
  const stmt = db.prepare(`
    SELECT
      pm.*,
      (
        SELECT MAX(pr.tgl_peristiwa)
        FROM peristiwa pr
        JOIN penduduk p ON p.id = pr.penduduk_id
        WHERE p.nik = pm.nik AND pr.jenis = 'MENINGGAL'
      ) AS tgl_peristiwa
    FROM penduduk_meninggal pm
    WHERE pm.deleted_at IS NULL
  `);
  return stmt.all().map((item) => ({
    ...item,
    umur: getAgeFromBirthDate(item.tgl_lhr)
  }));
});

ipcMain.handle('db-get-penduduk-by-id', (event, id) => {
  const stmt = db.prepare('SELECT * FROM penduduk WHERE id = ?');
  const item = stmt.get(id);
  if (!item) {
    return null;
  }
  return {
    ...item,
    umur: getAgeFromBirthDate(item.tgl_lhr)
  };
});

ipcMain.handle('db-create-penduduk', (event, data) => {
  const normalizedBirthDate = normalizeDateValue(data.tgl_lhr);
  const computedAge = getAgeFromBirthDate(normalizedBirthDate);
  const stmt = db.prepare(`
    INSERT INTO penduduk (
      nik, nama, jk, tmpt_lhr, tgl_lhr, status, shdk, no_kk,
      agama, pddk_akhir, pekerjaan, nama_ayah, nama_ibu,
      nama_kep_kel, alamat, rt, rw, kelurahan, kecamatan, kota, provinsi,
      kodepos, telepon, umur
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.nik, data.nama, data.jk, data.tmpt_lhr, normalizedBirthDate,
    data.status, data.shdk, data.no_kk, data.agama, data.pddk_akhir,
    data.pekerjaan, data.nama_ayah, data.nama_ibu, data.nama_kep_kel,
    data.alamat, data.rt, data.rw, data.kelurahan, data.kecamatan,
    data.kota, data.provinsi, data.kodepos, data.telepon, computedAge
  );
  return { success: result.changes > 0, id: result.lastInsertRowid };
});

ipcMain.handle('db-update-penduduk', (event, id, data) => {
  const normalizedBirthDate = normalizeDateValue(data.tgl_lhr);
  const computedAge = getAgeFromBirthDate(normalizedBirthDate);
  const stmt = db.prepare(`
    UPDATE penduduk SET
      nik = ?, nama = ?, jk = ?, tmpt_lhr = ?, tgl_lhr = ?,
      status = ?, shdk = ?, no_kk = ?, agama = ?, pddk_akhir = ?,
      pekerjaan = ?, nama_ayah = ?, nama_ibu = ?, nama_kep_kel = ?,
      alamat = ?, rt = ?, rw = ?, kelurahan = ?, kecamatan = ?, kota = ?,
      provinsi = ?, kodepos = ?, telepon = ?, umur = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const result = stmt.run(
    data.nik, data.nama, data.jk, data.tmpt_lhr, normalizedBirthDate,
    data.status, data.shdk, data.no_kk, data.agama, data.pddk_akhir,
    data.pekerjaan, data.nama_ayah, data.nama_ibu, data.nama_kep_kel,
    data.alamat, data.rt, data.rw, data.kelurahan, data.kecamatan,
    data.kota, data.provinsi, data.kodepos, data.telepon, computedAge, id
  );
  return { success: result.changes > 0 };
});

ipcMain.handle('db-delete-penduduk', (event, id) => {
  const stmt = db.prepare(
    'UPDATE penduduk SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?'
  );
  const result = stmt.run(id);
  return { success: result.changes > 0 };
});

ipcMain.handle('db-get-keluarga-list', () => {
  const stmt = db.prepare(`
    SELECT
      p.*,
      COUNT(m.id) AS jumlah_anggota
    FROM penduduk p
    LEFT JOIN penduduk m
      ON m.no_kk = p.no_kk AND m.deleted_at IS NULL
    WHERE p.no_kk IS NOT NULL
      AND p.shdk = 'KEPALA KELUARGA'
      AND p.deleted_at IS NULL
    GROUP BY p.id
  `);
  return stmt.all();
});

ipcMain.handle('db-get-references', (event, type) => {
  const table = REFERENCE_TABLES[type];
  if (!table) {
    return [];
  }
  return db.prepare(`SELECT * FROM ${table} ORDER BY id`).all();
});

ipcMain.handle('db-get-all-references', () => {
  const result = {};
  Object.entries(REFERENCE_TABLES).forEach(([key, table]) => {
    result[key] = db.prepare(`SELECT * FROM ${table} ORDER BY id`).all();
  });
  return result;
});

ipcMain.handle('db-create-reference', (event, type, name) => {
  const table = REFERENCE_TABLES[type];
  if (!table) {
    return { success: false };
  }
  const stmt = db.prepare(`INSERT INTO ${table} (name) VALUES (?)`);
  const result = stmt.run(name);
  return { success: result.changes > 0 };
});

ipcMain.handle('db-update-reference', (event, type, id, name) => {
  const table = REFERENCE_TABLES[type];
  if (!table) {
    return { success: false };
  }
  const stmt = db.prepare(`UPDATE ${table} SET name = ? WHERE id = ?`);
  const result = stmt.run(name, id);
  return { success: result.changes > 0 };
});

ipcMain.handle('db-delete-reference', (event, type, id) => {
  const table = REFERENCE_TABLES[type];
  if (!table) {
    return { success: false };
  }
  const stmt = db.prepare(`DELETE FROM ${table} WHERE id = ?`);
  const result = stmt.run(id);
  return { success: result.changes > 0 };
});

ipcMain.handle('db-get-keluarga-by-no-kk', (event, noKK) => {
  const stmt = db.prepare('SELECT * FROM penduduk WHERE no_kk = ?');
  return stmt.get(noKK);
});

ipcMain.handle('db-get-keluarga-members', (event, noKK) => {
  const stmt = db.prepare(
    'SELECT * FROM penduduk WHERE no_kk = ? AND deleted_at IS NULL'
  );
  return stmt.all(noKK).map((item) => ({
    ...item,
    umur: getAgeFromBirthDate(item.tgl_lhr)
  }));
});

const getTableNames = () => db.prepare(`
  SELECT name
  FROM sqlite_master
  WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
  ORDER BY name
`).all().map((row) => row.name);

const isSelectQuery = (query) => /^\s*(SELECT|PRAGMA|WITH|EXPLAIN)\b/i.test(query || '');

const isKnownTable = (tableName) => {
  if (!tableName) {
    return false;
  }
  return getTableNames().includes(tableName);
};

ipcMain.handle('db-get-table-list', () => getTableNames());

ipcMain.handle('db-get-table-data', (event, tableName) => {
  if (!isKnownTable(tableName)) {
    return [];
  }
  const stmt = db.prepare(`SELECT * FROM ${tableName}`);
  return stmt.all();
});

ipcMain.handle('db-run-query', (event, query) => {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    return { error: 'Query kosong.' };
  }
  try {
    if (isSelectQuery(trimmed)) {
      const stmt = db.prepare(trimmed);
      return { type: 'rows', rows: stmt.all() };
    }
    const stmt = db.prepare(trimmed);
    const result = stmt.run();
    return { type: 'run', changes: result.changes, lastInsertRowid: result.lastInsertRowid };
  } catch (error) {
    return { error: error?.message || 'Gagal menjalankan query.' };
  }
});

const movePendudukRecords = (rows, targetTable, state, jenis, tglPeristiwa, ket) => {
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO ${targetTable} (
      nik, nama, jk, tmpt_lhr, tgl_lhr, status, shdk, no_kk,
      agama, pddk_akhir, pekerjaan, nama_ayah, nama_ibu,
      nama_kep_kel, alamat, rt, rw, kelurahan, kecamatan, kota, provinsi,
      kodepos, telepon, umur, state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateStmt = db.prepare(`
    UPDATE penduduk SET
      state = ?, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const peristiwaStmt = db.prepare(`
    INSERT INTO peristiwa (jenis, penduduk_id, tgl_peristiwa, ket, created_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  const normalizedDate = normalizeDateValue(tglPeristiwa);
  const eventDate = normalizedDate || formatDateValue(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    new Date().getDate()
  );

  rows.forEach((row) => {
    const computedAge = getAgeFromBirthDate(row.tgl_lhr);
    insertStmt.run(
      row.nik,
      row.nama,
      row.jk,
      row.tmpt_lhr,
      row.tgl_lhr,
      row.status,
      row.shdk,
      row.no_kk,
      row.agama,
      row.pddk_akhir,
      row.pekerjaan,
      row.nama_ayah,
      row.nama_ibu,
      row.nama_kep_kel,
      row.alamat,
      row.rt,
      row.rw,
      row.kelurahan,
      row.kecamatan,
      row.kota,
      row.provinsi,
      row.kodepos,
      row.telepon,
      computedAge,
      state
    );
    updateStmt.run(state, row.id);
    peristiwaStmt.run(jenis, row.id, eventDate, ket || null);
  });
};

ipcMain.handle('db-move-penduduk', (event, payload) => {
  const { id, action, moveFamily, tgl_peristiwa, ket } = payload || {};
  const target = action === 'meninggal' ? 'penduduk_meninggal' : 'penduduk_pindah';
  const state = action === 'meninggal' ? 'MENINGGAL' : 'PINDAH';
  const jenis = action === 'meninggal' ? 'MENINGGAL' : 'PERGI';

  const trx = db.transaction(() => {
    const base = db.prepare('SELECT * FROM penduduk WHERE id = ? AND deleted_at IS NULL').get(id);
    if (!base) {
      return { success: false };
    }

    const rows = moveFamily && base.no_kk
      ? db.prepare('SELECT * FROM penduduk WHERE no_kk = ? AND deleted_at IS NULL')
        .all(base.no_kk)
      : [base];

    movePendudukRecords(rows, target, state, jenis, tgl_peristiwa, ket);
    return { success: true, moved: rows.length };
  });

  return trx();
});

ipcMain.handle('db-get-statistics', (event, options) => {
  const startDate = normalizeDateValue(options?.startDate);
  const endDate = normalizeDateValue(options?.endDate);
  const totalStmt = db.prepare(
    'SELECT COUNT(*) as total FROM penduduk WHERE deleted_at IS NULL'
  );
  const lakiStmt = db.prepare(
    "SELECT COUNT(*) as total FROM penduduk WHERE jk = 'L' AND deleted_at IS NULL"
  );
  const perempuanStmt = db.prepare(
    "SELECT COUNT(*) as total FROM penduduk WHERE jk = 'P' AND deleted_at IS NULL"
  );

  const agamaStmt = db.prepare(`
    SELECT agama, COUNT(*) as total FROM penduduk
    WHERE deleted_at IS NULL GROUP BY agama
  `);

  const statusStmt = db.prepare(`
    SELECT status, COUNT(*) as total FROM penduduk
    WHERE deleted_at IS NULL GROUP BY status
  `);

  const pindahStmt = db.prepare(`
    SELECT COUNT(*) as total
    FROM peristiwa
    WHERE jenis = 'PERGI'
      AND (? IS NULL OR tgl_peristiwa >= ?)
      AND (? IS NULL OR tgl_peristiwa <= ?)
  `);

  const meninggalStmt = db.prepare(`
    SELECT COUNT(*) as total
    FROM peristiwa
    WHERE jenis = 'MENINGGAL'
      AND (? IS NULL OR tgl_peristiwa >= ?)
      AND (? IS NULL OR tgl_peristiwa <= ?)
  `);

  return {
    total: totalStmt.get()?.total || 0,
    laki: lakiStmt.get()?.total || 0,
    perempuan: perempuanStmt.get()?.total || 0,
    pindah: pindahStmt.get(startDate, startDate, endDate, endDate)?.total || 0,
    meninggal: meninggalStmt.get(startDate, startDate, endDate, endDate)?.total || 0,
    agama: agamaStmt.all(),
    status: statusStmt.all()
  };
});

ipcMain.handle('db-export-csv', async () => {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: 'penduduk.csv',
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  });

  if (filePath) {
    const pendudukList = db.prepare('SELECT * FROM penduduk WHERE deleted_at IS NULL').all();
    let csvContent = CSV_HEADERS.join(',') + '\n';
    pendudukList.forEach((item) => {
      const row = [
        item.nik,
        item.nama,
        item.jk,
        item.tmpt_lhr,
        item.tgl_lhr,
        item.status,
        item.shdk,
        item.no_kk,
        item.agama,
        item.pddk_akhir,
        item.pekerjaan,
        item.nama_ayah,
        item.nama_ibu,
        item.nama_kep_kel,
        item.alamat || '',
        item.rt || '',
        item.rw || '',
        item.kelurahan || '',
        item.kecamatan || '',
        item.kota || '',
        item.provinsi || '',
        item.kodepos || '',
        item.telepon || ''
      ];
      csvContent += row.map(escapeCsvValue).join(',') + '\n';
    });

    fs.writeFileSync(filePath, csvContent, 'utf-8');
    return { success: true, filePath };
  }

  return { success: false };
});

ipcMain.handle('db-export-excel', async () => {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: 'penduduk.xlsx',
    filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
  });

  if (filePath) {
    const pendudukList = db.prepare('SELECT * FROM penduduk WHERE deleted_at IS NULL').all();
    const rows = pendudukList.map((item) => ({
      NIK: item.nik,
      NAMA: item.nama,
      JK: item.jk,
      TMPT_LHR: item.tmpt_lhr,
      TGL_LHR: item.tgl_lhr,
      STATUS: item.status,
      SHDK: item.shdk,
      NO_KK: item.no_kk,
      AGAMA: item.agama,
      PDDK_AKHIR: item.pddk_akhir,
      PEKERJAAN: item.pekerjaan,
      NAMA_AYAH: item.nama_ayah,
      NAMA_IBU: item.nama_ibu,
      NAMA_KEP_KEL: item.nama_kep_kel,
      ALAMAT: item.alamat || '',
      RT: item.rt || '',
      RW: item.rw || '',
      KELURAHAN: item.kelurahan || '',
      KECAMATAN: item.kecamatan || '',
      KOTA: item.kota || '',
      PROVINSI: item.provinsi || '',
      KODEPOS: item.kodepos || '',
      TELEPON: item.telepon || ''
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: CSV_HEADERS });
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Penduduk');
    XLSX.writeFile(workbook, filePath);

    return { success: true, filePath };
  }

  return { success: false };
});

ipcMain.handle('db-export-template-csv', async () => {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: 'template-penduduk.csv',
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  });

  if (filePath) {
    let csvContent = CSV_HEADERS.join(',') + '\n';
    TEMPLATE_ROWS.forEach((item) => {
      const row = CSV_HEADERS.map((header) => item[header] ?? '');
      csvContent += row.map(escapeCsvValue).join(',') + '\n';
    });

    fs.writeFileSync(filePath, csvContent, 'utf-8');
    return { success: true, filePath };
  }

  return { success: false };
});

ipcMain.handle('db-export-template-excel', async () => {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: 'template-penduduk.xlsx',
    filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
  });

  if (filePath) {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(TEMPLATE_ROWS, { header: CSV_HEADERS });
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, filePath);

    return { success: true, filePath };
  }

  return { success: false };
});

ipcMain.handle('db-get-profile', (event, userId) => {
  if (userId) {
    const stmt = db.prepare('SELECT id, username, nama, alamat FROM users WHERE id = ?');
    return stmt.get(userId) || null;
  }
  const stmt = db.prepare('SELECT id, username, nama, alamat FROM users ORDER BY id LIMIT 1');
  return stmt.get() || null;
});

ipcMain.handle('db-update-profile', (event, data) => {
  const stmt = db.prepare('UPDATE users SET username = ?, nama = ?, alamat = ? WHERE id = ?');
  const result = stmt.run(data.username, data.nama, data.alamat, data.id);
  return { success: result.changes > 0 };
});

ipcMain.handle('db-update-password', (event, data) => {
  const current = db.prepare('SELECT * FROM users WHERE id = ? AND password = ?')
    .get(data.id, data.currentPassword);
  if (!current) {
    return { success: false, message: 'Password lama tidak sesuai.' };
  }
  const stmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
  const result = stmt.run(data.newPassword, data.id);
  return { success: result.changes > 0 };
});

ipcMain.handle('db-reset-data', (event, options) => {
  const trx = db.transaction(() => {
    cleanupLegacySchema();
    ensurePeristiwaSchema();
    if (options.resetPenduduk) {
      db.exec('DELETE FROM penduduk;');
      db.exec("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'penduduk';");
    }
    if (options.resetPendudukPindah) {
      db.exec('DELETE FROM penduduk_pindah;');
      db.exec("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'penduduk_pindah';");
    }
    if (options.resetPendudukMeninggal) {
      db.exec('DELETE FROM penduduk_meninggal;');
      db.exec("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'penduduk_meninggal';");
    }
    if (options.resetPeristiwa) {
      db.exec('DELETE FROM peristiwa;');
    }
    if (options.resetReferences) {
      Object.values(REFERENCE_TABLES).forEach((table) => {
        db.exec(`DELETE FROM ${table};`);
        db.exec(`UPDATE sqlite_sequence SET seq = 0 WHERE name = '${table}';`);
      });
      seedReferences();
    }
  });
  trx();
  return { success: true };
});

ipcMain.handle('app-get-info', () => ({
  version: app.getVersion(),
  platform: process.platform
}));

ipcMain.handle('db-import-csv', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  });

  if (!filePaths || filePaths.length === 0) {
    return { success: false };
  }

  const fileContent = fs.readFileSync(filePaths[0], 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  const { inserted, updated, skipped } = upsertPendudukBatch(records);
  return { success: true, inserted, updated, skipped };
});

ipcMain.handle('db-import-excel', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
  });

  if (!filePaths || filePaths.length === 0) {
    return { success: false };
  }

  const workbook = XLSX.readFile(filePaths[0]);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const records = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const { inserted, updated, skipped } = upsertPendudukBatch(records);
  return { success: true, inserted, updated, skipped };
});
