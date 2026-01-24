import { useEffect, useRef, useState } from 'react';
import { Table, Button, Dropdown, Modal, Form, Input, Select, message, Space, Popconfirm, Row, Col, DatePicker, Radio } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExportOutlined, UploadOutlined, DownOutlined, DownloadOutlined, SwapOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getPendudukList, createPenduduk, updatePenduduk, deletePenduduk, exportCSV, exportExcel, importCSV, importExcel, exportTemplateCSV, exportTemplateExcel, movePenduduk, getAllReferences } from './db';

const { TextArea } = Input;
const { Option } = Select;

const getJkLabel = (value) => {
  if (value === 'L') {
    return 'Laki-laki';
  }
  if (value === 'P') {
    return 'Perempuan';
  }
  return value;
};

export default function PendudukList() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [moveAction, setMoveAction] = useState('pindah');
  const [moveRecord, setMoveRecord] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filterAgama, setFilterAgama] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterJk, setFilterJk] = useState(null);
  const [pageSize, setPageSize] = useState(20);
  const [tableHeight, setTableHeight] = useState(600);
  const [references, setReferences] = useState({
    agama: [],
    status: [],
    shdk: [],
    pendidikan: [],
    pekerjaan: [],
    jk: []
  });
  const [form] = Form.useForm();
  const [moveForm] = Form.useForm();
  const tableWrapRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getPendudukList();
      setData(result);
    } catch (error) {
      message.error('Gagal memuat data!');
    } finally {
      setLoading(false);
    }
  };

  const loadReferences = async () => {
    try {
      const result = await getAllReferences();
      setReferences({
        agama: result?.agama || [],
        status: result?.status || [],
        shdk: result?.shdk || [],
        pendidikan: result?.pendidikan || [],
        pekerjaan: result?.pekerjaan || [],
        jk: result?.jk || []
      });
    } catch (error) {
      message.error('Gagal memuat referensi!');
    }
  };

  useEffect(() => {
    loadData();
    loadReferences();
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
  }, [data.length, pageSize]);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      jk: references.jk[0]?.name || undefined,
      status: references.status[0]?.name || undefined,
      shdk: references.shdk[0]?.name || undefined
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      tgl_lhr: record.tgl_lhr ? dayjs(record.tgl_lhr) : null
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deletePenduduk(id);
      message.success('Data berhasil dihapus!');
      loadData();
    } catch (error) {
      message.error('Gagal menghapus data!');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        tgl_lhr: values.tgl_lhr ? values.tgl_lhr.format('YYYY-MM-DD') : null
      };
      if (editingId) {
        await updatePenduduk(editingId, payload);
        message.success('Data berhasil diperbarui!');
      } else {
        await createPenduduk(payload);
        message.success('Data berhasil ditambahkan!');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('Gagal menyimpan data!');
    }
  };

  const getAgeFromBirthDate = (dateString) => {
    if (!dateString) {
      return 0;
    }
    const birthDate = dayjs(dateString);
    if (!birthDate.isValid()) {
      return 0;
    }
    const today = dayjs();
    return Math.max(0, today.diff(birthDate, 'year'));
  };

  const handleOpenMoveModal = (record, action) => {
    setMoveAction(action);
    setMoveRecord(record);
    moveForm.resetFields();
    moveForm.setFieldsValue({
      moveType: 'single',
      tgl_peristiwa: dayjs()
    });
    setMoveModalVisible(true);
  };

  const handleSubmitMove = async (values) => {
    if (!moveRecord) {
      return;
    }
    try {
      const payload = {
        id: moveRecord.id,
        action: moveAction,
        moveFamily: values.moveType === 'family',
        tgl_peristiwa: values.tgl_peristiwa ? values.tgl_peristiwa.format('YYYY-MM-DD') : null,
        ket: values.ket || null
      };
      const result = await movePenduduk(payload);
      if (result.success) {
        message.success(
          moveAction === 'meninggal'
            ? 'Data penduduk dipindahkan ke kematian.'
            : `Data pindah diproses (${result.moved || 0} data).`
        );
        setMoveModalVisible(false);
        loadData();
      } else {
        message.error('Gagal memproses perpindahan data.');
      }
    } catch (error) {
      message.error('Gagal memproses perpindahan data.');
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportCSV();
      if (result.success) {
        message.success('Data berhasil diexport ke ' + result.filePath);
      } else {
        message.error('Export dibatalkan');
      }
    } catch (error) {
      message.error('Gagal mengeksport data!');
    }
  };

  const handleExportExcel = async () => {
    try {
      const result = await exportExcel();
      if (result.success) {
        message.success('Data berhasil diexport ke ' + result.filePath);
      } else {
        message.error('Export dibatalkan');
      }
    } catch (error) {
      message.error('Gagal mengeksport data!');
    }
  };

  const handleImportCSV = async () => {
    try {
      const result = await importCSV();
      if (result.success) {
        message.success(
          `Import selesai. Ditambah: ${result.inserted}, Diupdate: ${result.updated}, Dilewati: ${result.skipped}`
        );
        loadData();
      } else {
        message.error('Import dibatalkan');
      }
    } catch (error) {
      message.error('Gagal mengimport data!');
    }
  };

  const handleImportExcel = async () => {
    try {
      const result = await importExcel();
      if (result.success) {
        message.success(
          `Import selesai. Ditambah: ${result.inserted}, Diupdate: ${result.updated}, Dilewati: ${result.skipped}`
        );
        loadData();
      } else {
        message.error('Import dibatalkan');
      }
    } catch (error) {
      message.error('Gagal mengimport data!');
    }
  };

  const handleExportTemplateCSV = async () => {
    try {
      const result = await exportTemplateCSV();
      if (result.success) {
        message.success('Template CSV disimpan di ' + result.filePath);
      } else {
        message.error('Unduh template dibatalkan');
      }
    } catch (error) {
      message.error('Gagal mengunduh template CSV!');
    }
  };

  const handleExportTemplateExcel = async () => {
    try {
      const result = await exportTemplateExcel();
      if (result.success) {
        message.success('Template Excel disimpan di ' + result.filePath);
      } else {
        message.error('Unduh template dibatalkan');
      }
    } catch (error) {
      message.error('Gagal mengunduh template Excel!');
    }
  };

  const handleClearFilters = () => {
    setSearchText('');
    setFilterAgama(null);
    setFilterStatus(null);
    setFilterJk(null);
  };

  const importMenuItems = [
    {
      key: 'csv',
      label: 'CSV'
    },
    {
      key: 'excel',
      label: 'Excel'
    }
  ];

  const exportMenuItems = [
    {
      key: 'csv',
      label: 'CSV'
    },
    {
      key: 'excel',
      label: 'Excel'
    }
  ];

  const templateMenuItems = [
    {
      key: 'csv',
      label: 'CSV (template + contoh)'
    },
    {
      key: 'excel',
      label: 'Excel (template + contoh)'
    }
  ];

  const handleImportMenuClick = ({ key }) => {
    if (key === 'csv') {
      handleImportCSV();
    } else if (key === 'excel') {
      handleImportExcel();
    }
  };

  const handleExportMenuClick = ({ key }) => {
    if (key === 'csv') {
      handleExport();
    } else if (key === 'excel') {
      handleExportExcel();
    }
  };

  const handleTemplateMenuClick = ({ key }) => {
    if (key === 'csv') {
      handleExportTemplateCSV();
    } else if (key === 'excel') {
      handleExportTemplateExcel();
    }
  };

  const columns = [
    { title: 'NIK', dataIndex: 'nik', key: 'nik', width: 150, sorter: (a, b) => a.nik.localeCompare(b.nik) },
    { title: 'Nama', dataIndex: 'nama', key: 'nama', width: 200, sorter: (a, b) => a.nama.localeCompare(b.nama) },
    { title: 'Jenis Kelamin', dataIndex: 'jk', key: 'jk', width: 50, filters: [{ text: 'Laki-laki', value: 'L' }, { text: 'Perempuan', value: 'P' }], onFilter: (value, record) => record.jk === value },
    { 
      title: 'Umur', 
      dataIndex: 'umur', 
      key: 'umur', 
      width: 60,
      sorter: (a, b) => getAgeFromBirthDate(a.tgl_lhr) - getAgeFromBirthDate(b.tgl_lhr),
      render: (_, record) => getAgeFromBirthDate(record.tgl_lhr)
    },
    { title: 'No. KK', dataIndex: 'no_kk', key: 'no_kk', width: 150 },
    { title: 'Alamat', dataIndex: 'alamat', key: 'alamat', width: 300, ellipsis: true },
    {
      title: 'Aksi',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Button
            type="link"
            icon={<SwapOutlined />}
            onClick={() => handleOpenMoveModal(record, 'pindah')}
            size="small"
          >
            Pindah
          </Button>
          <Button
            type="link"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleOpenMoveModal(record, 'meninggal')}
            size="small"
          >
            Meninggal
          </Button>
          <Popconfirm
            title="Yakin ingin menghapus data ini?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ya"
            cancelText="Batal"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const filteredData = data.filter((item) => {
    const query = searchText.trim().toLowerCase();
    const matchesSearch = !query
      || item.nik?.toLowerCase().includes(query)
      || item.nama?.toLowerCase().includes(query)
      || item.no_kk?.toLowerCase().includes(query)
      || item.alamat?.toLowerCase().includes(query);

    const matchesAgama = !filterAgama || item.agama === filterAgama;
    const matchesStatus = !filterStatus || item.status === filterStatus;
    const matchesJk = !filterJk || item.jk === filterJk;

    return matchesSearch && matchesAgama && matchesStatus && matchesJk;
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Data Penduduk</h2>
        <Space>
          <Dropdown
            menu={{ items: importMenuItems, onClick: handleImportMenuClick }}
            trigger={['click']}
          >
            <Button icon={<UploadOutlined />}>
              Import <DownOutlined />
            </Button>
          </Dropdown>
          <Dropdown
            menu={{ items: exportMenuItems, onClick: handleExportMenuClick }}
            trigger={['click']}
          >
            <Button icon={<ExportOutlined />}>
              Export <DownOutlined />
            </Button>
          </Dropdown>
          <Dropdown
            menu={{ items: templateMenuItems, onClick: handleTemplateMenuClick }}
            trigger={['click']}
          >
            <Button icon={<DownloadOutlined />}>
              Template <DownOutlined />
            </Button>
          </Dropdown>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Tambah Penduduk
          </Button>
        </Space>
      </div>

      <Row gutter={[12, 12]} style={styles.filterBar}>
        <Col xs={24} md={8}>
          <Input.Search
            placeholder="Cari NIK, Nama, No. KK, Alamat"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} md={5}>
          <Select
            placeholder="Filter Agama"
            value={filterAgama}
            onChange={(value) => setFilterAgama(value)}
            allowClear
            style={{ width: '100%' }}
          >
            {references.agama.map((item) => (
              <Option key={item.id} value={item.name}>
                {item.name}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} md={5}>
          <Select
            placeholder="Filter Status"
            value={filterStatus}
            onChange={(value) => setFilterStatus(value)}
            allowClear
            style={{ width: '100%' }}
          >
            {references.status.map((item) => (
              <Option key={item.id} value={item.name}>
                {item.name}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} md={4}>
          <Select
            placeholder="Filter Jenis Kelamin"
            value={filterJk}
            onChange={(value) => setFilterJk(value)}
            allowClear
            style={{ width: '100%' }}
          >
            {references.jk.map((item) => (
              <Option key={item.id} value={item.name}>
                {getJkLabel(item.name)}
              </Option>
            ))}
          </Select>
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
          scroll={{ x: 1200, y: tableHeight }}
          pagination={{
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onShowSizeChange: (_, size) => setPageSize(size)
          }}
          bordered
        />
      </div>

      <Modal
        title={editingId ? 'Edit Penduduk' : 'Tambah Penduduk'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            label="NIK"
            name="nik"
            rules={[{ required: true, message: 'NIK wajib diisi!' }]}
          >
            <Input maxLength={16} />
          </Form.Item>

          <Form.Item
            label="Nama Lengkap"
            name="nama"
            rules={[{ required: true, message: 'Nama wajib diisi!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Jenis Kelamin" name="jk">
            <Select>
              {references.jk.map((item) => (
                <Option key={item.id} value={item.name}>
                  {getJkLabel(item.name)}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Tempat Lahir" name="tmpt_lhr">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tanggal Lahir" name="tgl_lhr">
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Status Pernikahan" name="status">
                <Select>
                  {references.status.map((item) => (
                    <Option key={item.id} value={item.name}>
                      {item.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Hubungan Keluarga" name="shdk">
                <Select>
                  {references.shdk.map((item) => (
                    <Option key={item.id} value={item.name}>
                      {item.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="No. Kartu Keluarga" name="no_kk">
            <Input maxLength={16} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Agama" name="agama">
                <Select>
                  {references.agama.map((item) => (
                    <Option key={item.id} value={item.name}>
                      {item.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Pendidikan Terakhir" name="pddk_akhir">
                <Select>
                  {references.pendidikan.map((item) => (
                    <Option key={item.id} value={item.name}>
                      {item.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Pekerjaan" name="pekerjaan">
            <Select showSearch>
              {references.pekerjaan.map((item) => (
                <Option key={item.id} value={item.name}>
                  {item.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Nama Ayah" name="nama_ayah">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Nama Ibu" name="nama_ibu">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Alamat" name="alamat">
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingId ? 'Update' : 'Simpan'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={moveAction === 'meninggal' ? 'Catat Kematian' : 'Catat Kepindahan'}
        open={moveModalVisible}
        onCancel={() => setMoveModalVisible(false)}
        footer={null}
        width={520}
      >
        <Form form={moveForm} onFinish={handleSubmitMove} layout="vertical">
          {moveAction === 'pindah' && (
            <Form.Item
              label="Jenis Kepindahan"
              name="moveType"
              rules={[{ required: true, message: 'Pilih jenis kepindahan.' }]}
            >
              <Radio.Group>
                <Radio value="single">Pindah sendiri</Radio>
                <Radio value="family">Pindah seluruh keluarga</Radio>
              </Radio.Group>
            </Form.Item>
          )}
          <Form.Item
            label="Tanggal Peristiwa"
            name="tgl_peristiwa"
            rules={[{ required: true, message: 'Tanggal peristiwa wajib diisi.' }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Keterangan" name="ket">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Simpan
            </Button>
          </Form.Item>
        </Form>
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
