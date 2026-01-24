import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Settings from '../Settings';

const getProfileMock = vi.fn();
const getAppInfoMock = vi.fn();
const updateProfileMock = vi.fn();
const updatePasswordMock = vi.fn();
const resetDataMock = vi.fn();

vi.mock('../db', () => ({
  getProfile: (...args) => getProfileMock(...args),
  getAppInfo: (...args) => getAppInfoMock(...args),
  updateProfile: (...args) => updateProfileMock(...args),
  updatePassword: (...args) => updatePasswordMock(...args),
  resetData: (...args) => resetDataMock(...args)
}));

vi.mock('../AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin' },
    updateUser: vi.fn()
  })
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    Popconfirm: ({ children, onConfirm }) => (
      <span onClick={onConfirm}>{children}</span>
    )
  };
});

describe('Settings', () => {
  it('updates profile and password', async () => {
    getProfileMock.mockResolvedValueOnce({
      id: 1,
      username: 'admin',
      nama: 'Administrator',
      alamat: 'Jl. Admin'
    });
    getAppInfoMock.mockResolvedValueOnce({ version: '1.0.0', platform: 'win32' });
    updateProfileMock.mockResolvedValueOnce({ success: true });
    updatePasswordMock.mockResolvedValueOnce({ success: true });
    const user = userEvent.setup();

    render(<Settings />);

    await waitFor(() => {
      expect(getProfileMock).toHaveBeenCalledWith(1);
    });

    await user.clear(screen.getByLabelText('Nama'));
    await user.type(screen.getByLabelText('Nama'), 'Admin Baru');
    await user.click(screen.getByRole('button', { name: 'Simpan Profil' }));

    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledWith({
        id: 1,
        username: 'admin',
        nama: 'Admin Baru',
        alamat: 'Jl. Admin'
      });
    });

    await user.type(screen.getByLabelText('Password Lama'), 'admin123!@#');
    await user.type(screen.getByLabelText('Password Baru'), 'baru123');
    await user.type(screen.getByLabelText('Konfirmasi Password Baru'), 'baru123');
    await user.click(screen.getByRole('button', { name: 'Update Password' }));

    await waitFor(() => {
      expect(updatePasswordMock).toHaveBeenCalledWith({
        id: 1,
        currentPassword: 'admin123!@#',
        newPassword: 'baru123'
      });
    });
  });

  it('triggers reset data', async () => {
    getProfileMock.mockResolvedValueOnce({
      id: 1,
      username: 'admin',
      nama: 'Administrator',
      alamat: ''
    });
    getAppInfoMock.mockResolvedValueOnce({ version: '1.0.0', platform: 'win32' });
    resetDataMock.mockResolvedValueOnce({ success: true });
    const user = userEvent.setup();

    render(<Settings />);

    await waitFor(() => {
      expect(getProfileMock).toHaveBeenCalledWith(1);
    });

    await user.click(screen.getByRole('button', { name: 'Reset Data' }));

    await waitFor(() => {
      expect(resetDataMock).toHaveBeenCalledWith({
        resetPenduduk: true,
        resetKeluarga: true,
        resetPeristiwa: true,
        resetReferences: true
      });
    });
  });
});
