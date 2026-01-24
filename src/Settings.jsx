import { useEffect, useState } from 'react';
import { Button, Card, Checkbox, Divider, Form, Input, message, Popconfirm, Space } from 'antd';
import { getAppInfo, getProfile, resetData, updatePassword, updateProfile } from './db';
import { useAuth } from './AuthProvider';

const { TextArea } = Input;

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState(null);
  const [appInfo, setAppInfo] = useState({ version: '-', platform: '-' });
  const [resetOptions, setResetOptions] = useState({
    resetPenduduk: true,
    resetPendudukPindah: true,
    resetPendudukMeninggal: true,
    resetKeluarga: true,
    resetPeristiwa: true,
    resetReferences: true
  });

  const loadProfile = async () => {
    setLoading(true);
    try {
      const profile = await getProfile(user?.id);
      if (profile) {
        setProfileId(profile.id);
        profileForm.setFieldsValue({
          username: profile.username,
          nama: profile.nama || '',
          alamat: profile.alamat || ''
        });
      }
    } catch (error) {
      message.error('Gagal memuat profil.');
    } finally {
      setLoading(false);
    }
  };

  const loadAppInfo = async () => {
    try {
      const info = await getAppInfo();
      setAppInfo(info || { version: '-', platform: '-' });
    } catch (error) {
      setAppInfo({ version: '-', platform: '-' });
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
    loadAppInfo();
  }, [user?.id]);

  const handleProfileSubmit = async (values) => {
    if (!profileId) {
      return;
    }
    try {
      const result = await updateProfile({ id: profileId, ...values });
      if (result.success) {
        message.success('Profil berhasil diperbarui.');
        updateUser(values);
      } else {
        message.error('Gagal memperbarui profil.');
      }
    } catch (error) {
      message.error('Gagal memperbarui profil.');
    }
  };

  const handlePasswordSubmit = async (values) => {
    if (!profileId) {
      return;
    }
    try {
      const result = await updatePassword({
        id: profileId,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      if (result.success) {
        message.success('Password berhasil diperbarui.');
        passwordForm.resetFields();
      } else {
        message.error(result.message || 'Gagal memperbarui password.');
      }
    } catch (error) {
      message.error('Gagal memperbarui password.');
    }
  };

  const handleReset = async () => {
    try {
      await resetData(resetOptions);
      message.success('Reset data berhasil.');
    } catch (error) {
      message.error('Gagal reset data.');
    }
  };

  return (
    <div style={styles.container}>
      <h2>Settings</h2>

      <Card title="Profil Pengguna" style={styles.card}>
        <Form form={profileForm} layout="vertical" onFinish={handleProfileSubmit}>
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Username wajib diisi.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Nama" name="nama">
            <Input />
          </Form.Item>
          <Form.Item label="Alamat" name="alamat">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Simpan Profil
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Ubah Password" style={styles.card}>
        <Form form={passwordForm} layout="vertical" onFinish={handlePasswordSubmit}>
          <Form.Item
            label="Password Lama"
            name="currentPassword"
            rules={[{ required: true, message: 'Password lama wajib diisi.' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Password Baru"
            name="newPassword"
            rules={[{ required: true, message: 'Password baru wajib diisi.' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Konfirmasi Password Baru"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Konfirmasi password wajib diisi.' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Password tidak cocok.'));
                }
              })
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Update Password
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Reset Data" style={styles.card}>
        <Space direction="vertical" size="small">
          <Checkbox
            checked={resetOptions.resetPenduduk}
            onChange={(event) =>
              setResetOptions((prev) => ({
                ...prev,
                resetPenduduk: event.target.checked
              }))
            }
          >
            Reset Data Penduduk
          </Checkbox>
          <Checkbox
            checked={resetOptions.resetPendudukPindah}
            onChange={(event) =>
              setResetOptions((prev) => ({
                ...prev,
                resetPendudukPindah: event.target.checked
              }))
            }
          >
            Reset Data Penduduk Pindah
          </Checkbox>
          <Checkbox
            checked={resetOptions.resetPendudukMeninggal}
            onChange={(event) =>
              setResetOptions((prev) => ({
                ...prev,
                resetPendudukMeninggal: event.target.checked
              }))
            }
          >
            Reset Data Penduduk Meninggal
          </Checkbox>
          <Checkbox
            checked={resetOptions.resetKeluarga}
            onChange={(event) =>
              setResetOptions((prev) => ({
                ...prev,
                resetKeluarga: event.target.checked
              }))
            }
          >
            Reset Data Keluarga
          </Checkbox>
          <Checkbox
            checked={resetOptions.resetPeristiwa}
            onChange={(event) =>
              setResetOptions((prev) => ({
                ...prev,
                resetPeristiwa: event.target.checked
              }))
            }
          >
            Reset Data Peristiwa
          </Checkbox>
          <Checkbox
            checked={resetOptions.resetReferences}
            onChange={(event) =>
              setResetOptions((prev) => ({
                ...prev,
                resetReferences: event.target.checked
              }))
            }
          >
            Reset Referensi ke Default
          </Checkbox>
          <Popconfirm
            title="Yakin ingin reset data?"
            onConfirm={handleReset}
            okText="Ya"
            cancelText="Batal"
          >
            <Button danger type="primary">
              Reset Data
            </Button>
          </Popconfirm>
        </Space>
      </Card>

      <Divider />

      <Card title="Info Aplikasi" style={styles.card}>
        <div>Versi: {appInfo.version}</div>
        <div>Platform: {appInfo.platform}</div>
      </Card>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    background: '#fff',
    minHeight: '100%'
  },
  card: {
    marginBottom: '16px'
  }
};
