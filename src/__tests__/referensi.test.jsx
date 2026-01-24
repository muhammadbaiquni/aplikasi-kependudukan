import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Referensi from '../Referensi';

const getAllReferencesMock = vi.fn();
const createReferenceMock = vi.fn();
const updateReferenceMock = vi.fn();

vi.mock('../db', () => ({
  getAllReferences: (...args) => getAllReferencesMock(...args),
  createReference: (...args) => createReferenceMock(...args),
  updateReference: (...args) => updateReferenceMock(...args),
  deleteReference: vi.fn()
}));

describe('Referensi', () => {
  it('loads and creates a reference', async () => {
    getAllReferencesMock.mockResolvedValue({
      agama: [{ id: 1, name: 'Islam' }],
      status: [],
      shdk: [],
      pendidikan: [],
      pekerjaan: [],
      jk: []
    });
    createReferenceMock.mockResolvedValueOnce({ success: true });
    const user = userEvent.setup();

    render(<Referensi />);

    await waitFor(() => {
      expect(getAllReferencesMock).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: /Tambah Referensi/i }));
    await user.type(screen.getByLabelText('Nama'), 'Katolik');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    await waitFor(() => {
      expect(createReferenceMock).toHaveBeenCalledWith('agama', 'Katolik');
    });
  });

  it('updates a reference', async () => {
    getAllReferencesMock.mockResolvedValue({
      agama: [{ id: 2, name: 'Hindu' }],
      status: [],
      shdk: [],
      pendidikan: [],
      pekerjaan: [],
      jk: []
    });
    updateReferenceMock.mockResolvedValueOnce({ success: true });
    const user = userEvent.setup();

    render(<Referensi />);

    await waitFor(() => {
      expect(getAllReferencesMock).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.clear(screen.getByLabelText('Nama'));
    await user.type(screen.getByLabelText('Nama'), 'Hindu Dharma');
    await user.click(screen.getByRole('button', { name: 'Perbarui' }));

    await waitFor(() => {
      expect(updateReferenceMock).toHaveBeenCalledWith('agama', 2, 'Hindu Dharma');
    });
  });
});
