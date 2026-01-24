import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { message } from 'antd';
import Login from '../Login';

const signInMock = vi.fn();

vi.mock('../AuthProvider', () => ({
  useAuth: () => ({
    signIn: (...args) => signInMock(...args)
  })
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn()
    }
  };
});

describe('Login', () => {
  it('submits credentials and shows success message', async () => {
    signInMock.mockResolvedValueOnce(true);
    const user = userEvent.setup();

    render(<Login />);

    await user.type(screen.getByPlaceholderText('Username'), 'admin');
    await user.type(screen.getByPlaceholderText('Password'), 'admin123!@#');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('admin', 'admin123!@#');
    });

    expect(message.success).toHaveBeenCalledWith('Login berhasil!');
  });

  it('shows error message on invalid credentials', async () => {
    signInMock.mockResolvedValueOnce(false);
    const user = userEvent.setup();

    render(<Login />);

    await user.type(screen.getByPlaceholderText('Username'), 'wrong');
    await user.type(screen.getByPlaceholderText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('wrong', 'wrong');
    });

    expect(message.error).toHaveBeenCalledWith('Username atau password salah!');
  });
});
