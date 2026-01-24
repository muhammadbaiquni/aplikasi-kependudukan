import { useEffect } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../AuthProvider';

const loginMock = vi.fn();

vi.mock('../db', () => ({
  login: (...args) => loginMock(...args)
}));

function AuthHarness({ onReady }) {
  const auth = useAuth();

  useEffect(() => {
    onReady(auth);
  }, [auth, onReady]);

  return null;
}

describe('AuthProvider', () => {
  it('signs in and persists user to localStorage', async () => {
    loginMock.mockResolvedValueOnce({ id: 10, username: 'admin' });
    const onReady = vi.fn();

    render(
      <AuthProvider>
        <AuthHarness onReady={onReady} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    const getAuth = () => onReady.mock.calls.at(-1)[0];
    await act(async () => {
      await getAuth().signIn('admin', 'admin123!@#');
    });

    await waitFor(() => {
      expect(getAuth().user).toEqual({
        id: 10,
        username: 'admin',
        nama: '',
        alamat: ''
      });
    });

    expect(JSON.parse(localStorage.getItem('user'))).toEqual({
      id: 10,
      username: 'admin',
      nama: '',
      alamat: ''
    });
  });

  it('clears user on signOut', async () => {
    loginMock.mockResolvedValueOnce({ id: 11, username: 'operator' });
    const onReady = vi.fn();

    render(
      <AuthProvider>
        <AuthHarness onReady={onReady} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    const getAuth = () => onReady.mock.calls.at(-1)[0];
    await act(async () => {
      await getAuth().signIn('operator', 'secret');
    });

    await waitFor(() => {
      expect(getAuth().user).toEqual({
        id: 11,
        username: 'operator',
        nama: '',
        alamat: ''
      });
    });

    act(() => {
      getAuth().signOut();
    });

    await waitFor(() => {
      expect(getAuth().user).toBeNull();
    });

    expect(localStorage.getItem('user')).toBeNull();
  });
});
