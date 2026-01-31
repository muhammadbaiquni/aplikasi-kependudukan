import { useState } from 'react';
import { Button, Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  SettingOutlined,
  BarChartOutlined,
  SwapOutlined,
  CloseCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
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
  const [collapsed, setCollapsed] = useState(false);

  if (!user) {
    return <Login />;
  }

  const mainMenuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: 'penduduk', icon: <UserOutlined />, label: 'Data Penduduk' },
    { key: 'penduduk-pindah', icon: <SwapOutlined />, label: 'Data Pindah' },
    { key: 'penduduk-meninggal', icon: <CloseCircleOutlined />, label: 'Data Kematian' },
    { key: 'keluarga', icon: <TeamOutlined />, label: 'Data Keluarga' },
    { key: 'pivot', icon: <BarChartOutlined />, label: 'Pivot' }
  ];

  const bottomMenuItems = [
    { key: 'referensi', icon: <AppstoreOutlined />, label: 'Referensi' },
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
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider
        width={250}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        style={{ background: '#001529', height: '100%' }}
      >
        <div style={styles.siderContent}>
          <div style={styles.logo}>
            <div style={styles.logoInner}>
              {collapsed ? (
                <AppstoreOutlined style={styles.logoIcon} />
              ) : (
                <h3 style={styles.logoText}>Aplikasi Kependudukan</h3>
              )}
              <Button
                type="text"
                aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed((prev) => !prev)}
                style={styles.collapseButton}
              />
            </div>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={mainMenuItems}
            inlineCollapsed={collapsed}
            onClick={handleMenuClick}
            style={styles.mainMenu}
          />
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={bottomMenuItems}
            inlineCollapsed={collapsed}
            onClick={handleMenuClick}
            style={styles.bottomMenu}
          />
        </div>
      </Sider>
      <Layout style={styles.mainLayout}>
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
  siderContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden'
  },
  logo: {
    height: 64,
    background: '#002140',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px'
  },
  logoInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  logoText: {
    color: '#fff',
    textAlign: 'center',
    margin: 0
  },
  logoIcon: {
    fontSize: 24,
    color: '#fff'
  },
  collapseButton: {
    color: '#fff',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mainMenu: {
    flex: 1,
    overflowY: 'auto',
    minHeight: 0
  },
  bottomMenu: {
    marginTop: 'auto',
    flexShrink: 0
  },
  header: {
    padding: '0 24px',
    background: '#001529'
  },
  content: {
    margin: '16px',
    background: '#fff',
    borderRadius: '4px',
    overflow: 'auto',
    minHeight: 0
  },
  mainLayout: {
    height: '100%'
  }
};
