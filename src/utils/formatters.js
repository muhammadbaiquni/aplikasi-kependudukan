import dayjs from 'dayjs';

export const getJkLabel = (value) => {
  if (value === 'L') {
    return 'Laki-laki';
  }
  if (value === 'P') {
    return 'Perempuan';
  }
  return value || '-';
};

export const formatDate = (value) => {
  if (!value) {
    return '-';
  }
  const date = dayjs(value);
  return date.isValid() ? date.format('DD/MM/YYYY') : '-';
};

export const getAgeFromBirthDate = (dateString) => {
  if (!dateString) {
    return 0;
  }
  const birthDate = dayjs(dateString);
  if (!birthDate.isValid()) {
    return 0;
  }
  const today = dayjs();
  return Math.max(0, today.diff(birthDate, 'year'));
};

export const getAgeFromBirthDateAt = (birthDateString, referenceDateString) => {
  if (!birthDateString || !referenceDateString) {
    return 0;
  }
  const birthDate = dayjs(birthDateString);
  const referenceDate = dayjs(referenceDateString);
  if (!birthDate.isValid() || !referenceDate.isValid()) {
    return 0;
  }
  return Math.max(0, referenceDate.diff(birthDate, 'year'));
};

export const formatAddress = (record) => {
  const parts = [];
  const alamat = record?.alamat?.trim();
  if (alamat) {
    parts.push(alamat);
  }

  const rtRaw = record?.rt?.toString().trim();
  const rwRaw = record?.rw?.toString().trim();
  const rt = rtRaw ? rtRaw.padStart(3, '0') : '';
  const rw = rwRaw ? rwRaw.padStart(3, '0') : '';
  if (rt || rw) {
    parts.push(`RT ${rt || '-'}${rw ? `/RW ${rw}` : ''}`);
  }

  const kelurahan = record?.kelurahan?.trim();
  if (kelurahan) {
    parts.push(`Kelurahan ${kelurahan}`);
  }

  const kecamatan = record?.kecamatan?.trim();
  if (kecamatan) {
    parts.push(`Kecamatan ${kecamatan}`);
  }

  const kota = record?.kota?.trim();
  if (kota) {
    parts.push(kota);
  }

  const provinsiRaw = record?.provinsi?.trim();
  if (provinsiRaw) {
    const provinsi = provinsiRaw.replace(/^provinsi\s+/i, '');
    parts.push(`Provinsi ${provinsi}`);
  }

  const kodepos = record?.kodepos?.toString().trim();
  if (kodepos) {
    parts.push(kodepos);
  }

  return parts.join(', ');
};
