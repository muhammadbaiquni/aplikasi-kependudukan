import { useState, useEffect, useMemo, useRef } from 'react';
import { Table, Button, Modal, Input, message, Space, Row, Col, Select } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { getKeluargaList, getKeluargaMembers } from './db';

export default function KeluargaList() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [membersVisible, setMembersVisible] = useState(false);
  const [selectedKeluarga, setSelectedKeluarga] = useState(null);
  const [members, setMembers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterJk, setFilterJk] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [tableHeight, setTableHeight] = useState(600);
  const tableWrapRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getKeluargaList();
      setData(result);
    } catch (error) {
      message.error('Gagal memuat data!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const updateTableHeight = () => {
      if (!tableWrapRef.current) {
        return;
      }
      const rect = tableWrapRef.current.getBoundingClientRect();
      const nextHeight = Math.max(300, window.innerHeight - rect.top - 150);
      setTableHeight(nextHeight);
    };

    const handleResize = () => {
      window.requestAnimationFrame(updateTableHeight);
    };

    updateTableHeight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data.length]);

  const handleViewMembers = async (noKK) => {
    const membersData = await getKeluargaMembers(noKK);
    setMembers(membersData);
    setSelectedKeluarga(noKK);
    setMembersVisible(true);
  };

  const columns = [
    { title: 'No. KK', dataIndex: 'no_kk', key: 'no_kk', width: 150 },
    { title: 'Kepala Keluarga', dataIndex: 'nama', key: 'nama', width: 200 },
    // { title: 'Alamat', dataIndex: 'alamat', key: 'alamat', width: 250, ellipsis: true },
    // { title: 'Desa/Kelurahan', dataIndex: 'desa_kelurahan', key: 'desa_kelurahan', width: 150 },
    // { title: 'Kecamatan', dataIndex: 'kecamatan', key: 'kecamatan', width: 150 },
    // { title: 'Kabupaten/Kota', dataIndex: 'kabupaten_kota', key: 'kabupaten_kota', width: 150 },
    // { title: 'Provinsi', dataIndex: 'provinsi', key: 'provinsi', width: 150 },
    {
      title: 'Jumlah Anggota',
      key: 'jumlah',
      width: 120,
      render: (_, record) => {
        const members = getKeluargaMembers(record.no_kk);
        return members.length;
      }
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<TeamOutlined />}
            onClick={() => handleViewMembers(record.no_kk)}
            size="small"
          >
            Lihat Anggota
          </Button>
        </Space>
      )
    }
  ];

  const memberColumns = [
    { title: 'Nama', dataIndex: 'nama', key: 'nama', width: 200 },
    { title: 'NIK', dataIndex: 'nik', key: 'nik', width: 150 },
    { title: 'JK', dataIndex: 'jk', key: 'jk', width: 50 },
    { title: 'Umur', dataIndex: 'umur', key: 'umur', width: 60 },
    { title: 'SHDK', dataIndex: 'shdk', key: 'shdk', width: 150 },
    { title: 'Pekerjaan', dataIndex: 'pekerjaan', key: 'pekerjaan', width: 200, ellipsis: true }
  ];

  const options = useMemo(() => {
    const jk = new Set();
    const status = new Set();
    data.forEach((item) => {
      if (item.jk) {
        jk.add(item.jk);
      }
      if (item.status) {
        status.add(item.status);
      }
    });
    return {
      jk: Array.from(jk),
      status: Array.from(status)
    };
  }, [data]);

  const filteredData = data.filter((item) => {
    const query = searchText.trim().toLowerCase();
    const matchesSearch = !query
      || item.no_kk?.toLowerCase().includes(query)
      || item.nama?.toLowerCase().includes(query)
      || item.alamat?.toLowerCase().includes(query);

    const matchesJk = !filterJk || item.jk === filterJk;
    const matchesStatus = !filterStatus || item.status === filterStatus;

    return matchesSearch && matchesJk && matchesStatus;
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Data Keluarga</h2>
      </div>

      <Row gutter={[12, 12]} style={styles.filterBar}>
        <Col xs={24} md={10}>
          <Input.Search
            placeholder="Cari No. KK, kepala keluarga, alamat"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} md={7}>
          <Select
            placeholder="Filter JK"
            value={filterJk}
            onChange={(value) => setFilterJk(value)}
            allowClear
            style={{ width: '100%' }}
          >
            {options.jk.map((value) => (
              <Select.Option key={value} value={value}>
                {value}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} md={7}>
          <Select
            placeholder="Filter Status"
            value={filterStatus}
            onChange={(value) => setFilterStatus(value)}
            allowClear
            style={{ width: '100%' }}
          >
            {options.status.map((value) => (
              <Select.Option key={value} value={value}>
                {value}
              </Select.Option>
            ))}
          </Select>
        </Col>
      </Row>

      <div ref={tableWrapRef}>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200, y: tableHeight }}
          pagination={{ pageSize: 20 }}
          bordered
        />
      </div>

      <Modal
        title={`Anggota Keluarga - ${selectedKeluarga}`}
        open={membersVisible}
        onCancel={() => setMembersVisible(false)}
        footer={null}
        width={1000}
      >
        <Table
          columns={memberColumns}
          dataSource={members}
          loading={loading}
          rowKey="id"
          scroll={{ y: 400 }}
          pagination={false}
          size="small"
        />
      </Modal>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    background: '#fff',
    minHeight: '100%'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  filterBar: {
    marginBottom: '16px'
  }
};
