import { useState } from 'react';
import { Layout, Menu } from 'antd';
import { 
  DashboardOutlined, 
  UserOutlined, 
  TeamOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  SettingOutlined,
  BarChartOutlined,
  SwapOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useAuth } from './AuthProvider';
import Dashboard from './Dashboard';
import PendudukList from './PendudukList';
import PendudukPindahList from './PendudukPindahList';
import PendudukMeninggalList from './PendudukMeninggalList';
import KeluargaList from './KeluargaList';
import Login from './Login';
import Referensi from './Referensi';
import Settings from './Settings';
import Pivot from './Pivot';

const { Header, Content, Sider } = Layout;

export default function App() {
  const { user, signOut } = useAuth();
  const [selectedKey, setSelectedKey] = useState('dashboard');

  if (!user) {
    return <Login />;
  }

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: 'penduduk', icon: <UserOutlined />, label: 'Data Penduduk' },
    { key: 'penduduk-pindah', icon: <SwapOutlined />, label: 'Data Pindah' },
    { key: 'penduduk-meninggal', icon: <CloseCircleOutlined />, label: 'Data Kematian' },
    { key: 'keluarga', icon: <TeamOutlined />, label: 'Data Keluarga' },
    { key: 'referensi', icon: <AppstoreOutlined />, label: 'Referensi' },
    { key: 'pivot', icon: <BarChartOutlined />, label: 'Pivot' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout' }
  ];

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      signOut();
    } else {
      setSelectedKey(key);
    }
  };

  const renderContent = () => {
    switch (selectedKey) {
      case 'dashboard':
        return <Dashboard />;
      case 'penduduk':
        return <PendudukList />;
      case 'penduduk-pindah':
        return <PendudukPindahList />;
      case 'penduduk-meninggal':
        return <PendudukMeninggalList />;
      case 'keluarga':
        return <KeluargaList />;
      case 'referensi':
        return <Referensi />;
      case 'pivot':
        return <Pivot />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={250} style={{ background: '#001529' }}>
        <div style={styles.logo}>
          <h3 style={{ color: '#fff', textAlign: 'center', margin: 0, padding: '20px' }}>
            Aplikasi Kependudukan
          </h3>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={styles.header}>
          <div style={{ color: '#fff' }}>
            Selamat Datang, {user?.username} | {user?.nama}
          </div>
        </Header>
        <Content style={styles.content}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

const styles = {
  logo: {
    height: 64,
    background: '#002140'
  },
  header: {
    padding: '0 24px',
    background: '#001529'
  },
  content: {
    margin: '16px',
    background: '#fff',
    borderRadius: '4px'
  }
};
