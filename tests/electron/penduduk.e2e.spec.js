import { spawn } from 'child_process';
import waitOn from 'wait-on';
import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';

let app;
let page;
let viteProcess;
let noKk;
let nik;
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

const seedKeluarga = async () => {
  const now = Date.now().toString();
  noKk = `88${now}`.padEnd(16, '1');

  try {
    await page.evaluate(async (payload) => {
      return window.electron.createKeluarga(payload);
    }, {
      no_kk: noKk,
      kepala_keluarga: 'Kepala Test',
      alamat: 'Jl. Test No. 1'
    });
  } catch (error) {
    throw new Error(`Seed keluarga failed: ${error?.message || error}`);
  }
};

const cleanupData = async () => {
  if (!noKk || !page) {
    return;
  }

  try {
    await page.evaluate(async (noKkValue) => {
      return window.electron.deleteKeluarga(noKkValue);
    }, noKk);
  } catch (error) {
    throw new Error(`Cleanup failed: ${error?.message || error}`);
  }
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

  await seedKeluarga();
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

  await page.getByRole('button', { name: 'Tambah Penduduk' }).click();
  const pendudukDialog = page.getByRole('dialog');
  await expect(pendudukDialog.getByText('Tambah Penduduk')).toBeVisible();

  const now = Date.now().toString();
  nik = `99${now}`.padEnd(16, '0');

  await pendudukDialog.locator('#nik').fill(nik);
  await pendudukDialog.locator('#nama').fill('Penduduk Test');
  await pendudukDialog.locator('#tgl_lhr').fill('1995-02-14');
  await pendudukDialog.locator('#no_kk').fill(noKk);
  await pendudukDialog.getByRole('button', { name: 'Simpan' }).click();

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
  await updatedRow.locator('button').nth(1).click();
  await page.getByRole('button', { name: 'Ya' }).click();

  await expect(tableBody).not.toContainText(nik);
});
