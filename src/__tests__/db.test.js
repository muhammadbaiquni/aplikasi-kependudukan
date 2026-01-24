import {
  createPenduduk,
  deletePenduduk,
  getPendudukById,
  getPendudukList,
  login,
  updatePenduduk
} from '../db';

describe('db mock layer', () => {
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
      alamat: 'Jl. Merdeka No. 1, Jakarta'
    });

    expect(createResult).toEqual({ success: true, id: initialCount + 1 });

    const afterCreate = await getPendudukList();
    expect(afterCreate).toHaveLength(initialCount + 1);

    const created = await getPendudukById(createResult.id);
    expect(created?.nama).toBe('Dewi Lestari');

    const updateResult = await updatePenduduk(createResult.id, {
      pekerjaan: 'Karyawan Swasta'
    });
    expect(updateResult).toEqual({ success: true });

    const updated = await getPendudukById(createResult.id);
    expect(updated?.pekerjaan).toBe('Karyawan Swasta');

    const deleteResult = await deletePenduduk(createResult.id);
    expect(deleteResult).toEqual({ success: true });

    const afterDelete = await getPendudukList();
    expect(afterDelete).toHaveLength(initialCount);
  });
});
