import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from './AuthProvider';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const success = await signIn(values.username, values.password);
      if (success) {
        message.success('Login berhasil!');
      } else {
        message.error('Username atau password salah!');
      }
    } catch (error) {
      message.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Card title="Login Aplikasi Kependudukan" style={styles.card}>
        <Form name="login" onFinish={onFinish} autoComplete="off" layout="vertical">
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Masukkan username!' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Username"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Masukkan password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  card: {
    width: 400,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  }
};