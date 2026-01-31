import { spawn } from 'child_process';
import waitOn from 'wait-on';
import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';

let app;
let page;
let viteProcess;
let noKk;
const createdNiks = [];
const consoleLogs = [];

const startVite = async () => {
  viteProcess = spawn(
    'npm',
    ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173'],
    {
      cwd: process.cwd(),
      shell: true,
      env: { ...process.env, NODE_ENV: 'development' }
    }
  );

  await waitOn({
    resources: ['http://127.0.0.1:5173'],
    timeout: 120000
  });
};

const stopVite = () => {
  if (viteProcess) {
    viteProcess.kill('SIGTERM');
    viteProcess = null;
  }
};

const cleanupData = async () => {
  if (!page) {
    return;
  }

  try {
    await page.evaluate(async (niks) => {
      const list = await window.electron.getPendudukList();
      const targets = list.filter((item) => niks.includes(item.nik));
      await Promise.all(
        targets.map((item) => window.electron.deletePenduduk(item.id))
      );
      return targets.length;
    }, createdNiks);
  } catch (error) {
    throw new Error(`Cleanup failed: ${error?.message || error}`);
  }
};

const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const createPendudukViaForm = async ({ nikValue, nameValue, noKkValue, birthDate }) => {
  await page.getByRole('button', { name: 'Tambah Penduduk' }).click();
  const pendudukDialog = page.getByRole('dialog');
  await expect(pendudukDialog.getByText('Tambah Penduduk')).toBeVisible();

  await pendudukDialog.locator('#nik').fill(nikValue);
  await pendudukDialog.locator('#nama').fill(nameValue);
  await pendudukDialog.locator('#no_kk').fill(noKkValue);
  const dateInput = pendudukDialog.locator('.ant-picker input');
  await dateInput.fill(formatDate(birthDate));
  await dateInput.press('Enter');
  await page.waitForTimeout(500);
  await page.evaluate('() => document.activeElement?.blur()');
  await page.waitForTimeout(300);
  await pendudukDialog.getByRole('button', { name: 'Simpan' }).click();
  await page.waitForTimeout(1000);
};

const getMainWindow = async () => {
  const timeoutAt = Date.now() + 30000;

  while (Date.now() < timeoutAt) {
    const pages = app.windows();
    for (const candidate of pages) {
      const url = candidate.url();
      if (url && url.includes('http://localhost:5173')) {
        return candidate;
      }
    }

    try {
      await app.waitForEvent('window', { timeout: 2000 });
    } catch (error) {
      // Ignore timeout and retry.
    }
  }

  throw new Error('Main window not found within timeout.');
};

test.beforeAll(async () => {
  await startVite();
  app = await electron.launch({
    args: ['.'],
    env: { ...process.env, NODE_ENV: 'development' }
  });

  page = await getMainWindow();
  await page.waitForLoadState('domcontentloaded');
  page.on('console', (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (error) => {
    consoleLogs.push(`[pageerror] ${error.message}`);
  });
});

test.afterAll(async () => {
  await cleanupData();
  if (app) {
    await app.close();
    app = null;
  }
  stopVite();
});

test('login, penduduk CRUD, keluarga members', async () => {
  const loginHeading = page.getByText('Login Aplikasi Kependudukan');
  const dashboardHeading = page.getByText('Dashboard Kependudukan');

  let appState = null;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const bodyText = await page.locator('body').innerText().catch(() => '');
    if (bodyText.includes('Login Aplikasi Kependudukan')) {
      appState = 'login';
      break;
    }
    if (bodyText.includes('Dashboard Kependudukan')) {
      appState = 'dashboard';
      break;
    }
    await page.waitForTimeout(500);
  }

  if (!appState) {
    const url = page.url();
    const htmlSnippet = (await page.content()).slice(0, 500);
    const rootHtml = await page.locator('#root').innerHTML().catch(() => '');
    const logSnippet = consoleLogs.slice(-10).join(' | ');
    throw new Error(
      `App did not render expected content. Current URL: ${url}. HTML: ${htmlSnippet}. Root: ${rootHtml}. Logs: ${logSnippet}`
    );
  }

  if (appState === 'login') {
    await page.getByPlaceholder('Username').fill('admin');
    await page.getByPlaceholder('Password').fill('admin123!@#');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(dashboardHeading).toBeVisible();
  }

  await page.getByRole('menuitem', { name: 'Data Penduduk' }).click();
  await expect(page.getByRole('heading', { name: 'Data Penduduk' })).toBeVisible();

  const now = Date.now().toString();
  noKk = `88${now}`.padEnd(16, '1');
  const nik = `99${now}`.padEnd(16, '0');
  createdNiks.push(nik);

  await createPendudukViaForm({
    nikValue: nik,
    nameValue: 'Penduduk Test',
    noKkValue: noKk,
    birthDate: new Date(1995, 1, 14)
  });

  const tableBody = page.locator('tbody');
  await expect(tableBody).toContainText(nik);
  await expect(tableBody).toContainText('Penduduk Test');

  const row = tableBody.getByRole('row', { name: new RegExp(nik) });
  await row.locator('button').first().click();
  const editDialog = page.getByRole('dialog');
  await expect(editDialog.getByText('Edit Penduduk')).toBeVisible();

  await editDialog.locator('#nama').fill('Penduduk Test Update');
  await editDialog.getByRole('button', { name: 'Update' }).click();

  await expect(tableBody).toContainText('Penduduk Test Update');

  await page.getByRole('menuitem', { name: 'Data Keluarga' }).click();
  await expect(page.getByRole('heading', { name: 'Data Keluarga' })).toBeVisible();

  const keluargaRow = page.getByRole('row', { name: new RegExp(noKk) });
  await keluargaRow.getByRole('button', { name: 'Lihat Anggota' }).click();

  await expect(page.getByText(`Anggota Keluarga - ${noKk}`)).toBeVisible();
  await expect(page.getByText('Penduduk Test Update')).toBeVisible();
  await page.getByRole('dialog').locator('.ant-modal-close').click();
  await expect(page.getByText(`Anggota Keluarga - ${noKk}`)).toBeHidden();

  await page.getByRole('menuitem', { name: 'Data Penduduk' }).click();
  await expect(page.getByRole('heading', { name: 'Data Penduduk' })).toBeVisible();

  const updatedRow = tableBody.getByRole('row', { name: new RegExp(nik) });
  await updatedRow.locator('button').nth(3).click();
  await page.getByRole('button', { name: 'Ya' }).click();

  await expect(tableBody).not.toContainText(nik);
});

test('pindah, meninggal, filter tanggal, dan pivot', async () => {
  await page.getByRole('menuitem', { name: 'Data Penduduk' }).click();
  await expect(page.getByRole('heading', { name: 'Data Penduduk' })).toBeVisible();

  const now = Date.now().toString();
  const noKkLocal = `77${now}`.padEnd(16, '2');
  const nikPindah = `77${now}`.padEnd(16, '3');
  const nikMeninggal = `77${now}`.padEnd(16, '4');
  createdNiks.push(nikPindah, nikMeninggal);

  await createPendudukViaForm({
    nikValue: nikPindah,
    nameValue: 'Penduduk Pindah',
    noKkValue: noKkLocal,
    birthDate: new Date(1998, 4, 10)
  });

  await createPendudukViaForm({
    nikValue: nikMeninggal,
    nameValue: 'Penduduk Meninggal',
    noKkValue: noKkLocal,
    birthDate: new Date(2000, 6, 20)
  });

  const tableBody = page.locator('tbody');
  const pindahRow = tableBody.getByRole('row', { name: new RegExp(nikPindah) });
  await pindahRow.getByRole('button', { name: 'Pindah' }).click();
  const pindahDialog = page.getByRole('dialog');
  await expect(pindahDialog.getByText('Catat Kepindahan')).toBeVisible();
  await pindahDialog.getByRole('radio', { name: 'Pindah sendiri' }).check();
  const eventDate = new Date();
  const dateInput = pindahDialog.locator('.ant-picker input');
  await dateInput.fill(formatDate(eventDate));
  await dateInput.press('Enter');
  await pindahDialog.getByRole('button', { name: 'Simpan' }).click();

  await expect(tableBody).not.toContainText(nikPindah);

  const meninggalRow = tableBody.getByRole('row', { name: new RegExp(nikMeninggal) });
  await meninggalRow.getByRole('button', { name: 'Meninggal' }).click();
  const meninggalDialog = page.getByRole('dialog');
  await expect(meninggalDialog.getByText('Catat Kematian')).toBeVisible();
  const dateInputMeninggal = meninggalDialog.locator('.ant-picker input');
  await dateInputMeninggal.fill(formatDate(eventDate));
  await dateInputMeninggal.press('Enter');
  await meninggalDialog.getByRole('button', { name: 'Simpan' }).click();

  await expect(tableBody).not.toContainText(nikMeninggal);

  await page.getByRole('menuitem', { name: 'Data Pindah' }).click();
  await expect(page.getByRole('heading', { name: 'Data Penduduk Pindah' })).toBeVisible();
  await expect(page.locator('tbody')).toContainText(nikPindah);

  const rangeInputs = page.locator('.ant-picker-range input');
  await rangeInputs.nth(0).fill(formatDate(eventDate));
  await rangeInputs.nth(1).fill(formatDate(eventDate));
  await rangeInputs.nth(1).press('Enter');
  await expect(page.locator('tbody')).toContainText(nikPindah);

  await page.getByRole('menuitem', { name: 'Data Kematian' }).click();
  await expect(page.getByRole('heading', { name: 'Data Penduduk Meninggal' })).toBeVisible();
  await expect(page.locator('tbody')).toContainText(nikMeninggal);

  const rangeInputsMeninggal = page.locator('.ant-picker-range input');
  await rangeInputsMeninggal.nth(0).fill(formatDate(eventDate));
  await rangeInputsMeninggal.nth(1).fill(formatDate(eventDate));
  await rangeInputsMeninggal.nth(1).press('Enter');
  await expect(page.locator('tbody')).toContainText(nikMeninggal);

  await page.getByRole('menuitem', { name: 'Pivot' }).click();
  await expect(page.getByText('Pivot Table')).toBeVisible();
  await page.getByRole('combobox').selectOption('pindah');
  await page.getByRole('combobox').selectOption('meninggal');
});

test('referensi CRUD operations', async () => {
  await page.getByRole('menuitem', { name: 'Referensi' }).click();
  await expect(page.getByRole('heading', { name: 'Referensi' })).toBeVisible();

  await page.getByRole('button', { name: 'Tambah Referensi' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Tambah Referensi')).toBeVisible();
  await dialog.locator('#name').fill('Test Agama');
  await dialog.getByRole('button', { name: 'Simpan' }).click();

  await expect(page.getByText('Test Agama')).toBeVisible();

  const tableBody = page.locator('tbody');
  const referenceName = tableBody.getByText('Test Agama');
  const row = referenceName.locator('..');
  await row.locator('button').first().click();
  await expect(dialog.getByText('Edit Referensi')).toBeVisible();
  await dialog.locator('#name').fill('Test Agama Updated');
  await dialog.getByRole('button', { name: 'Perbarui' }).click();
  await expect(page.getByText('Test Agama Updated')).toBeVisible();

  const updatedRow = tableBody.getByText('Test Agama Updated').locator('..');
  await updatedRow.locator('button').nth(1).click();
  await page.getByRole('button', { name: 'Ya' }).click();
  await expect(page.getByText('Test Agama Updated')).toBeHidden();
});

test('dashboard statistics and charts', async () => {
  await page.getByRole('menuitem', { name: 'Dashboard' }).click();
  await expect(page.getByText('Dashboard Kependudukan')).toBeVisible();

  await expect(page.getByText('Total Penduduk')).toBeVisible();
  await expect(page.getByText('Laki-laki')).toBeVisible();
  await expect(page.getByText('Perempuan')).toBeVisible();
  await expect(page.getByText('Penduduk Aktif')).toBeVisible();
  await expect(page.getByText('Kepindahan')).toBeVisible();
  await expect(page.getByText('Kematian (Peristiwa)')).toBeVisible();
  await expect(page.getByText('Distribusi Agama')).toBeVisible();
  await expect(page.getByText('Status Pernikahan')).toBeVisible();
});

test('search and filter penduduk', async () => {
  await page.getByRole('menuitem', { name: 'Data Penduduk' }).click();
  await expect(page.getByRole('heading', { name: 'Data Penduduk' })).toBeVisible();

  await page.getByPlaceholder('Cari NIK, Nama, No. KK, Alamat').fill('Test');
  await page.waitForTimeout(500);
  await page.getByPlaceholder('Cari NIK, Nama, No. KK, Alamat').fill('');
  await page.getByPlaceholder('Cari NIK, Nama, No. KK, Alamat').clear();
  await page.getByRole('button', { name: 'Reset' }).click();
});

test('search and filter data pindah', async () => {
  await page.getByRole('menuitem', { name: 'Data Pindah' }).click();
  await expect(page.getByRole('heading', { name: 'Data Penduduk Pindah' })).toBeVisible();

  await page.getByPlaceholder('Cari NIK, nama, No. KK, alamat').fill('Test');
  await page.waitForTimeout(500);
  await page.getByPlaceholder('Cari NIK, nama, No. KK, alamat').clear();
  await page.getByRole('button', { name: 'Reset' }).click();
});

test('search and filter data kematian', async () => {
  await page.getByRole('menuitem', { name: 'Data Kematian' }).click();
  await expect(page.getByRole('heading', { name: 'Data Penduduk Meninggal' })).toBeVisible();

  await page.getByPlaceholder('Cari NIK, nama, No. KK, alamat').fill('Test');
  await page.waitForTimeout(500);
  await page.getByPlaceholder('Cari NIK, nama, No. KK, alamat').clear();
  await page.getByRole('button', { name: 'Reset' }).click();
});

test('settings, update profile, logout', async () => {
  await page.getByRole('menuitem', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

  await page.getByRole('textbox', { name: 'Username' }).fill('admin');
  await page.getByRole('textbox', { name: 'Nama' }).fill('Admin Updated');
  await page.getByRole('textbox', { name: 'Alamat' }).fill('Alamat Test');
  await page.getByRole('button', { name: 'Simpan Profil' }).click();
  await page.waitForTimeout(500);

  await page.getByRole('menuitem', { name: 'Logout' }).click();

  const loginHeading = page.getByText('Login Aplikasi Kependudukan');
  await expect(loginHeading).toBeVisible();

  await page.getByPlaceholder('Username').fill('admin');
  await page.getByPlaceholder('Password').fill('admin123!@#');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.waitForTimeout(2000);
  await expect(page.getByText('Dashboard Kependudukan')).toBeVisible();
  await expect(page.getByText('Selamat Datang, admin | Admin Updated')).toBeVisible();
});

test('export and import data', async () => {
  await page.getByRole('menuitem', { name: 'Data Penduduk' }).click();
  await expect(page.getByRole('heading', { name: 'Data Penduduk' })).toBeVisible();

  const exportButton = page.getByText('Export');
  await exportButton.click();
  await page.getByText('CSV').nth(1).click();

  await page.waitForTimeout(1000);
});

test('navigation between all menus', async () => {
  const menus = [
    { name: 'Dashboard', heading: 'Dashboard Kependudukan' },
    { name: 'Data Penduduk', heading: 'Data Penduduk', headingType: 'h2' },
    { name: 'Data Pindah', heading: 'Data Penduduk Pindah', headingType: 'h2' },
    { name: 'Data Kematian', heading: 'Data Penduduk Meninggal', headingType: 'h2' },
    { name: 'Data Keluarga', heading: 'Data Keluarga', headingType: 'h2' },
    { name: 'Referensi', heading: 'Referensi', headingType: 'h2' },
    { name: 'Pivot', heading: 'Pivot Table' }
  ];

  for (const menu of menus) {
    await page.getByRole('menuitem', { name: menu.name }).click();
    if (menu.headingType === 'h2') {
      await expect(page.locator('h2').filter({ hasText: menu.heading })).toBeVisible();
    } else {
      await expect(page.getByText(menu.heading)).toBeVisible();
    }
  }
});
