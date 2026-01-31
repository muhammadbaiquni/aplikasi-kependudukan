import {
  createPenduduk,
  deletePenduduk,
  getPendudukById,
  getPendudukList,
  getPendudukMeninggalList,
  getPendudukPindahList,
  login,
  movePenduduk,
  resetMockData,
  updatePenduduk
} from '../db';

describe('db mock layer', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('authenticates admin credentials and rejects others', async () => {
    await expect(login('admin', 'admin123!@#')).resolves.toEqual({
      id: 1,
      username: 'admin'
    });
    await expect(login('admin', 'wrong')).resolves.toBeNull();
  });

  it('creates, updates, and deletes penduduk data in mock store', async () => {
    const initialList = await getPendudukList();
    const initialCount = initialList.length;
    const createResult = await createPenduduk({
      nik: '9876543210123456',
      nama: 'Dewi Lestari',
      jk: 'P',
      no_kk: '1234567890000001',
      agama: 'Islam',
      pddk_akhir: 'Strata I',
      pekerjaan: 'Wiraswasta',
      status: 'KAWIN',
      shdk: 'ISTRI',
      tmpt_lhr: 'Surabaya',
      tgl_lhr: '1996-07-20',
      nama_ayah: 'Agus',
      nama_ibu: 'Sri',
      nama_kep_kel: 'Ahmad Fauzi',
      alamat: 'Jl. Merdeka No. 1, Jakarta',
      rt: '009',
      rw: '010',
      kelurahan: 'Kebon Sirih',
      kecamatan: 'Menteng',
      kota: 'Jakarta',
      provinsi: 'DKI Jakarta',
      kodepos: '10340',
      telepon: '081234567899'
    });

    expect(createResult).toEqual({ success: true, id: initialCount + 1 });

    const afterCreate = await getPendudukList();
    expect(afterCreate).toHaveLength(initialCount + 1);

    const created = await getPendudukById(createResult.id);
    expect(created?.nama).toBe('Dewi Lestari');

    const updateResult = await updatePenduduk(createResult.id, {
      pekerjaan: 'Karyawan Swasta',
      rt: '011',
      rw: '012',
      kelurahan: 'Kebon Sirih',
      kecamatan: 'Menteng',
      kota: 'Jakarta',
      provinsi: 'Provinsi DKI Jakarta',
      kodepos: '10350',
      telepon: '081234567898'
    });
    expect(updateResult).toEqual({ success: true });

    const updated = await getPendudukById(createResult.id);
    expect(updated?.pekerjaan).toBe('Karyawan Swasta');
    expect(updated?.rt).toBe('011');
    expect(updated?.rw).toBe('012');
    expect(updated?.kodepos).toBe('10350');
    expect(updated?.telepon).toBe('081234567898');

    const deleteResult = await deletePenduduk(createResult.id);
    expect(deleteResult).toEqual({ success: true });

    const afterDelete = await getPendudukList();
    expect(afterDelete).toHaveLength(initialCount);
  });

  it('moves penduduk to pindah (single and family)', async () => {
    const initialPenduduk = await getPendudukList();
    const initialPindah = await getPendudukPindahList();

    const familyNoKk = '9990001112223334';
    const first = await createPenduduk({
      nik: '3333333333333333',
      nama: 'Budi Santoso',
      jk: 'L',
      no_kk: familyNoKk,
      agama: 'Islam',
      pddk_akhir: 'SLTA/Sederajat',
      pekerjaan: 'Pelajar/Mahasiswa',
      status: 'BELUM KAWIN',
      shdk: 'ANAK',
      tmpt_lhr: 'Bandung',
      tgl_lhr: '2002-02-02',
      nama_ayah: 'Agus',
      nama_ibu: 'Rina',
      nama_kep_kel: 'Agus',
      alamat: 'Jl. Mawar No. 2',
      rt: '1',
      rw: '2',
      kelurahan: 'Cihapit',
      kecamatan: 'Bandung Wetan',
      kota: 'Bandung',
      provinsi: 'Jawa Barat',
      kodepos: '40114',
      telepon: '081111111111'
    });

    const second = await createPenduduk({
      nik: '4444444444444444',
      nama: 'Sari Dewi',
      jk: 'P',
      no_kk: familyNoKk,
      agama: 'Islam',
      pddk_akhir: 'SLTA/Sederajat',
      pekerjaan: 'Pelajar/Mahasiswa',
      status: 'BELUM KAWIN',
      shdk: 'ANAK',
      tmpt_lhr: 'Bandung',
      tgl_lhr: '2004-04-04',
      nama_ayah: 'Agus',
      nama_ibu: 'Rina',
      nama_kep_kel: 'Agus',
      alamat: 'Jl. Mawar No. 2',
      rt: '3',
      rw: '4',
      kelurahan: 'Cihapit',
      kecamatan: 'Bandung Wetan',
      kota: 'Bandung',
      provinsi: 'Jawa Barat',
      kodepos: '40114',
      telepon: '082222222222'
    });

    const moveFamily = await movePenduduk({
      id: first.id,
      action: 'pindah',
      moveFamily: true,
      tgl_peristiwa: '2025-01-01',
      ket: 'Pindah keluarga'
    });
    expect(moveFamily).toEqual({ success: true, moved: 2 });

    const afterFamilyPenduduk = await getPendudukList();
    const afterFamilyPindah = await getPendudukPindahList();
    expect(afterFamilyPenduduk).toHaveLength(initialPenduduk.length);
    expect(afterFamilyPindah).toHaveLength(initialPindah.length + 2);

    const moveSingle = await movePenduduk({
      id: second.id,
      action: 'pindah',
      moveFamily: false,
      tgl_peristiwa: '2025-01-02',
      ket: 'Pindah sendiri'
    });
    expect(moveSingle).toEqual({ success: false, moved: 0 });
  });

  it('moves penduduk to meninggal', async () => {
    const initialPenduduk = await getPendudukList();
    const initialMeninggal = await getPendudukMeninggalList();

    const createResult = await createPenduduk({
      nik: '5555555555555555',
      nama: 'Slamet Raharjo',
      jk: 'L',
      no_kk: '5550001112223334',
      agama: 'Islam',
      pddk_akhir: 'Strata I',
      pekerjaan: 'Karyawan Swasta',
      status: 'KAWIN',
      shdk: 'KEPALA KELUARGA',
      tmpt_lhr: 'Semarang',
      tgl_lhr: '1985-03-12',
      nama_ayah: 'Raharjo',
      nama_ibu: 'Sri',
      nama_kep_kel: 'Slamet Raharjo',
      alamat: 'Jl. Kenanga No. 3',
      rt: '7',
      rw: '8',
      kelurahan: 'Sekayu',
      kecamatan: 'Semarang Tengah',
      kota: 'Semarang',
      provinsi: 'Jawa Tengah',
      kodepos: '50132',
      telepon: '083333333333'
    });

    const moveResult = await movePenduduk({
      id: createResult.id,
      action: 'meninggal',
      moveFamily: false,
      tgl_peristiwa: '2025-02-10',
      ket: 'Sakit'
    });
    expect(moveResult).toEqual({ success: true, moved: 1 });

    const afterPenduduk = await getPendudukList();
    const afterMeninggal = await getPendudukMeninggalList();
    expect(afterPenduduk).toHaveLength(initialPenduduk.length);
    expect(afterMeninggal).toHaveLength(initialMeninggal.length + 1);
    expect(afterMeninggal[afterMeninggal.length - 1]?.state).toBe('MENINGGAL');
  });
});
