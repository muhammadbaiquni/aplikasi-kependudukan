import { useEffect, useMemo, useRef, useState } from 'react';
import { Table, message, Input, Select, Row, Col, Button, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { getPendudukPindahList } from './db';
import { formatAddress, formatDate, getAgeFromBirthDate, getJkLabel } from './utils/formatters';

export default function PendudukPindahList() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterJk, setFilterJk] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterAgama, setFilterAgama] = useState(null);
  const [filterRange, setFilterRange] = useState([]);
  const [tableHeight, setTableHeight] = useState(600);
  const tableWrapRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getPendudukPindahList();
      setData(result);
    } catch (error) {
      message.error('Gagal memuat data pindah!');
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

  const columns = [
    { title: 'NIK', dataIndex: 'nik', key: 'nik', width: 150 },
    { title: 'Nama', dataIndex: 'nama', key: 'nama', width: 200 },
    {
      title: 'JK',
      dataIndex: 'jk',
      key: 'jk',
      width: 60,
      render: (value) => getJkLabel(value)
    },
    {
      title: 'Tgl Lahir',
      dataIndex: 'tgl_lhr',
      key: 'tgl_lhr',
      width: 120,
      render: (value) => formatDate(value)
    },
    {
      title: 'Tgl Pindah',
      dataIndex: 'tgl_peristiwa',
      key: 'tgl_peristiwa',
      width: 120,
      render: (value) => formatDate(value)
    },
    {
      title: 'Umur',
      dataIndex: 'umur',
      key: 'umur',
      width: 70,
      render: (_, record) => getAgeFromBirthDate(record.tgl_lhr)
    },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 140 },
    { title: 'SHDK', dataIndex: 'shdk', key: 'shdk', width: 160 },
    { title: 'No. KK', dataIndex: 'no_kk', key: 'no_kk', width: 150 },
    { title: 'Agama', dataIndex: 'agama', key: 'agama', width: 120 },
    { title: 'Pendidikan', dataIndex: 'pddk_akhir', key: 'pddk_akhir', width: 180 },
    { title: 'Pekerjaan', dataIndex: 'pekerjaan', key: 'pekerjaan', width: 200 },
    {
      title: 'Alamat',
      dataIndex: 'alamat',
      key: 'alamat',
      width: 520,
      ellipsis: true,
      render: (_, record) => formatAddress(record)
    },
    { title: 'Telepon', dataIndex: 'telepon', key: 'telepon', width: 140 }
  ];

  const options = useMemo(() => {
    const jk = new Set();
    const status = new Set();
    const agama = new Set();
    data.forEach((item) => {
      if (item.jk) {
        jk.add(item.jk);
      }
      if (item.status) {
        status.add(item.status);
      }
      if (item.agama) {
        agama.add(item.agama);
      }
    });
    return {
      jk: Array.from(jk),
      status: Array.from(status),
      agama: Array.from(agama)
    };
  }, [data]);

  const handleClearFilters = () => {
    setSearchText('');
    setFilterJk(null);
    setFilterStatus(null);
    setFilterAgama(null);
    setFilterRange([]);
  };

  const filteredData = data.filter((item) => {
    const query = searchText.trim().toLowerCase();
    const matchesSearch = !query
      || item.nik?.toLowerCase().includes(query)
      || item.nama?.toLowerCase().includes(query)
      || item.no_kk?.toLowerCase().includes(query)
      || item.alamat?.toLowerCase().includes(query)
      || item.rt?.toLowerCase().includes(query)
      || item.rw?.toLowerCase().includes(query)
      || item.kelurahan?.toLowerCase().includes(query)
      || item.kecamatan?.toLowerCase().includes(query)
      || item.kota?.toLowerCase().includes(query)
      || item.provinsi?.toLowerCase().includes(query)
      || item.kodepos?.toLowerCase().includes(query)
      || item.telepon?.toLowerCase().includes(query);

    const matchesJk = !filterJk || item.jk === filterJk;
    const matchesStatus = !filterStatus || item.status === filterStatus;
    const matchesAgama = !filterAgama || item.agama === filterAgama;

    const hasRange = filterRange && filterRange.length === 2;
    const matchesRange = !hasRange || (() => {
      if (!item.tgl_peristiwa) {
        return false;
      }
      const value = dayjs(item.tgl_peristiwa);
      if (!value.isValid()) {
        return false;
      }
      const start = filterRange[0]?.startOf('day');
      const end = filterRange[1]?.endOf('day');
      if (!start || !end) {
        return true;
      }
      return (value.isAfter(start) || value.isSame(start))
        && (value.isBefore(end) || value.isSame(end));
    })();

    return matchesSearch && matchesJk && matchesStatus && matchesAgama && matchesRange;
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Data Penduduk Pindah</h2>
      </div>
      <Row gutter={[12, 12]} style={styles.filterBar}>
        <Col xs={24} md={8}>
          <Input.Search
            placeholder="Cari NIK, nama, No. KK, alamat, RT/RW, kelurahan"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} md={4}>
          <Select
            placeholder="Filter JK"
            value={filterJk}
            onChange={(value) => setFilterJk(value)}
            allowClear
            style={{ width: '100%' }}
          >
            {options.jk.map((value) => (
              <Select.Option key={value} value={value}>
                {getJkLabel(value)}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} md={4}>
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
        <Col xs={24} md={4}>
          <Select
            placeholder="Filter Agama"
            value={filterAgama}
            onChange={(value) => setFilterAgama(value)}
            allowClear
            style={{ width: '100%' }}
          >
            {options.agama.map((value) => (
              <Select.Option key={value} value={value}>
                {value}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} md={4}>
          <DatePicker.RangePicker
            value={filterRange}
            onChange={(values) => setFilterRange(values || [])}
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
          />
        </Col>
        <Col xs={24} md={2}>
          <Button onClick={handleClearFilters} block>
            Reset
          </Button>
        </Col>
      </Row>
      <div ref={tableWrapRef}>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="id"
          scroll={{ x: 2000, y: tableHeight }}
          pagination={{ pageSize: 20 }}
          bordered
        />
      </div>
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
