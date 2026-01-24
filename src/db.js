const isRenderer = typeof window !== 'undefined' && window.electron;

const getAgeFromBirthDate = (birthDate) => {
  if (!birthDate) {
    return 0;
  }
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) {
    return 0;
  }
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

const mockData = {
  penduduk: [
    {
      id: 1,
      nik: '1234567890123456',
      nama: 'Ahmad Fauzi',
      jk: 'L',
      no_kk: '1234567890000001',
      agama: 'Islam',
      pddk_akhir: 'Strata I',
      pekerjaan: 'Karyawan Swasta',
      status: 'KAWIN',
      shdk: 'KEPALA KELUARGA',
      tmpt_lhr: 'Jakarta',
      tgl_lhr: '1990-01-01',
      nama_ayah: 'Subhan',
      nama_ibu: 'Siti',
      nama_kep_kel: 'Ahmad Fauzi',
      alamat: 'Jl. Merdeka No. 1, Jakarta',
      state: 'AKTIF'
    },
    {
      id: 2,
      nik: '1234567890123457',
      nama: 'Siti Aminah',
      jk: 'P',
      no_kk: '1234567890000001',
      agama: 'Islam',
      pddk_akhir: 'Diploma IV/Strata I',
      pekerjaan: 'Pegawai Negeri Sipil (PNS)',
      status: 'KAWIN',
      shdk: 'ISTRI',
      tmpt_lhr: 'Bandung',
      tgl_lhr: '1993-05-15',
      nama_ayah: 'Herman',
      nama_ibu: 'Rina',
      nama_kep_kel: 'Ahmad Fauzi',
      alamat: 'Jl. Merdeka No. 1, Jakarta',
      state: 'AKTIF'
    }
  ]
};

export const login = async (username, password) => {
  if (isRenderer && window.electron) {
    return window.electron.dbLogin(username, password);
  }
  
  if (username === 'admin' && password === 'admin123!@#') {
    return { id: 1, username: 'admin' };
  }
  return null;
};

export const getPendudukList = async () => {
  if (isRenderer && window.electron) {
    return window.electron.getPendudukList();
  }
  return mockData.penduduk.map((item) => ({
    ...item,
    umur: getAgeFromBirthDate(item.tgl_lhr)
  }));
};

export const getPendudukPindahList = async () => {
  if (isRenderer && window.electron) {
    return window.electron.getPendudukPindahList();
  }
  return [];
};

export const getPendudukMeninggalList = async () => {
  if (isRenderer && window.electron) {
    return window.electron.getPendudukMeninggalList();
  }
  return [];
};

export const getPendudukById = async (id) => {
  if (isRenderer && window.electron) {
    return window.electron.getPendudukById(id);
  }
  const item = mockData.penduduk.find((p) => p.id === id);
  if (!item) {
    return null;
  }
  return {
    ...item,
    umur: getAgeFromBirthDate(item.tgl_lhr)
  };
};

export const createPenduduk = async (data) => {
  if (isRenderer && window.electron) {
    return window.electron.createPenduduk(data);
  }
  
  const newId = mockData.penduduk.length + 1;
  const newPenduduk = {
    id: newId,
    ...data,
    umur: getAgeFromBirthDate(data.tgl_lhr),
    state: 'AKTIF'
  };
  mockData.penduduk.push(newPenduduk);
  return { success: true, id: newId };
};

export const updatePenduduk = async (id, data) => {
  if (isRenderer && window.electron) {
    return window.electron.updatePenduduk(id, data);
  }
  
  const index = mockData.penduduk.findIndex(p => p.id === id);
  if (index !== -1) {
    const existing = mockData.penduduk[index];
    const next = { ...existing, ...data };
    next.umur = getAgeFromBirthDate(next.tgl_lhr);
    mockData.penduduk[index] = next;
    return { success: true };
  }
  return { success: false };
};

export const deletePenduduk = async (id) => {
  if (isRenderer && window.electron) {
    return window.electron.deletePenduduk(id);
  }
  
  const index = mockData.penduduk.findIndex(p => p.id === id);
  if (index !== -1) {
    mockData.penduduk.splice(index, 1);
    return { success: true };
  }
  return { success: false };
};

export const getKeluargaList = async () => {
  if (isRenderer && window.electron) {
    return window.electron.getKeluargaList();
  }
  return [{ id: 1, no_kk: '1234567890000001', kepala_keluarga: 'Ahmad Fauzi', alamat: 'Jl. Merdeka No. 1' }];
};

export const createKeluarga = async (data) => {
  if (isRenderer && window.electron) {
    return window.electron.createKeluarga(data);
  }
  return { success: true };
};

export const deleteKeluarga = async (noKK) => {
  if (isRenderer && window.electron) {
    return window.electron.deleteKeluarga(noKK);
  }
  return { success: true };
};

export const getKeluargaByNoKK = async (noKK) => {
  if (isRenderer && window.electron) {
    return window.electron.getKeluargaByNoKK(noKK);
  }
  return { id: 1, no_kk: noKK, kepala_keluarga: 'Ahmad Fauzi', alamat: 'Jl. Merdeka No. 1' };
};

export const getKeluargaMembers = async (noKK) => {
  if (isRenderer && window.electron) {
    return window.electron.getKeluargaMembers(noKK);
  }
  return mockData.penduduk
    .filter(p => p.no_kk === noKK)
    .map((item) => ({
      ...item,
      umur: getAgeFromBirthDate(item.tgl_lhr)
    }));
};

export const getStatistics = async (options) => {
  if (isRenderer && window.electron) {
    return window.electron.getStatistics(options);
  }
  
  return {
    total: mockData.penduduk.length,
    laki: mockData.penduduk.filter(p => p.jk === 'L').length,
    perempuan: mockData.penduduk.filter(p => p.jk === 'P').length,
    pindah: 0,
    meninggal: 0,
    agama: [{ agama: 'Islam', total: mockData.penduduk.length }],
    status: [{ status: 'KAWIN', total: mockData.penduduk.length }]
  };
};

export const exportCSV = async () => {
  if (isRenderer && window.electron) {
    return window.electron.exportCSV();
  }
  
  return { success: true, filePath: 'penduduk.csv (mock)' };
};

export const exportExcel = async () => {
  if (isRenderer && window.electron) {
    return window.electron.exportExcel();
  }

  return { success: true, filePath: 'penduduk.xlsx (mock)' };
};

export const exportTemplateCSV = async () => {
  if (isRenderer && window.electron) {
    return window.electron.exportTemplateCSV();
  }

  return { success: true, filePath: 'template-penduduk.csv (mock)' };
};

export const exportTemplateExcel = async () => {
  if (isRenderer && window.electron) {
    return window.electron.exportTemplateExcel();
  }

  return { success: true, filePath: 'template-penduduk.xlsx (mock)' };
};

export const importCSV = async () => {
  if (isRenderer && window.electron) {
    return window.electron.importCSV();
  }

  return { success: true, inserted: 0, updated: 0, skipped: 0 };
};

export const importExcel = async () => {
  if (isRenderer && window.electron) {
    return window.electron.importExcel();
  }

  return { success: true, inserted: 0, updated: 0, skipped: 0 };
};

export const getReferences = async (type) => {
  if (isRenderer && window.electron) {
    return window.electron.getReferences(type);
  }
  return [];
};

export const getAllReferences = async () => {
  if (isRenderer && window.electron) {
    return window.electron.getAllReferences();
  }
  return {};
};

export const createReference = async (type, name) => {
  if (isRenderer && window.electron) {
    return window.electron.createReference(type, name);
  }
  return { success: true };
};

export const updateReference = async (type, id, name) => {
  if (isRenderer && window.electron) {
    return window.electron.updateReference(type, id, name);
  }
  return { success: true };
};

export const deleteReference = async (type, id) => {
  if (isRenderer && window.electron) {
    return window.electron.deleteReference(type, id);
  }
  return { success: true };
};

export const getProfile = async (userId) => {
  if (isRenderer && window.electron) {
    return window.electron.getProfile(userId);
  }
  return null;
};

export const updateProfile = async (data) => {
  if (isRenderer && window.electron) {
    return window.electron.updateProfile(data);
  }
  return { success: true };
};

export const updatePassword = async (data) => {
  if (isRenderer && window.electron) {
    return window.electron.updatePassword(data);
  }
  return { success: true };
};

export const resetData = async (options) => {
  if (isRenderer && window.electron) {
    return window.electron.resetData(options);
  }
  return { success: true };
};

export const getAppInfo = async () => {
  if (isRenderer && window.electron) {
    return window.electron.getAppInfo();
  }
  return { version: 'dev', platform: 'web' };
};

export const movePenduduk = async (payload) => {
  if (isRenderer && window.electron) {
    return window.electron.movePenduduk(payload);
  }
  return { success: true, moved: 1 };
};
