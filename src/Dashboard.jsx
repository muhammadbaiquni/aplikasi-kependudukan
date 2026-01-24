import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, DatePicker, Space } from 'antd';
import {
  UserOutlined,
  ManOutlined,
  WomanOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getStatistics } from './db';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function Dashboard() {
  const [statistics, setStatistics] = useState({
    total: 0,
    laki: 0,
    perempuan: 0,
    pindah: 0,
    meninggal: 0,
    agama: [],
    status: []
  });
  const [peristiwaRange, setPeristiwaRange] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await getStatistics({
        startDate: peristiwaRange[0]?.format('YYYY-MM-DD') || null,
        endDate: peristiwaRange[1]?.format('YYYY-MM-DD') || null
      });
      setStatistics(data);
    };
    loadData();
  }, [peristiwaRange]);

  const { total, laki, perempuan, pindah, meninggal, agama, status } = statistics;

  const agamaData = agama.map(a => ({
    name: a.agama || 'Lainnya',
    value: a.total
  }));

  const statusData = status.map(s => ({
    name: s.status,
    value: s.total
  }));

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dashboard Kependudukan</h1>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Penduduk"
              value={total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Laki-laki"
              value={laki}
              prefix={<ManOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Perempuan"
              value={perempuan}
              prefix={<WomanOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Penduduk Aktif"
              value={total}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={styles.filterRow}>
        <Col span={24}>
          <Card>
            <Space wrap>
              <span>Filter Tanggal Peristiwa:</span>
              <DatePicker.RangePicker
                value={peristiwaRange}
                onChange={(values) => setPeristiwaRange(values || [])}
                format="DD/MM/YYYY"
              />
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Kepindahan (Peristiwa)"
              value={pindah}
              prefix={<SwapOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Kematian (Peristiwa)"
              value={meninggal}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={styles.chartRow}>
        <Col span={12}>
          <Card title="Distribusi Agama">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={agamaData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {agamaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Status Pernikahan">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    background: '#f0f2f5',
    minHeight: '100%'
  },
  title: {
    marginBottom: '24px',
    fontSize: '24px',
    fontWeight: 'bold'
  },
  chartRow: {
    marginTop: '16px'
  },
  filterRow: {
    marginTop: '16px'
  }
};
