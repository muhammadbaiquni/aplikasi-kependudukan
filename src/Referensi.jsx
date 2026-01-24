import { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, message, Modal, Popconfirm, Space, Table, Tabs } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { createReference, deleteReference, getAllReferences, updateReference } from './db';

const REFERENCE_TYPES = [
  { key: 'agama', label: 'Agama' },
  { key: 'status', label: 'Status' },
  { key: 'shdk', label: 'SHDK' },
  { key: 'pendidikan', label: 'Pendidikan' },
  { key: 'pekerjaan', label: 'Pekerjaan' },
  { key: 'jk', label: 'Jenis Kelamin' }
];

export default function Referensi() {
  const [activeKey, setActiveKey] = useState('agama');
  const [references, setReferences] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const loadReferences = async () => {
    setLoading(true);
    try {
      const data = await getAllReferences();
      setReferences(data || {});
    } catch (error) {
      message.error('Gagal memuat referensi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferences();
  }, []);

  const dataSource = useMemo(
    () => references[activeKey] || [],
    [references, activeKey]
  );

  const openAddModal = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditing(record);
    form.setFieldsValue({ name: record.name });
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editing) {
        await updateReference(activeKey, editing.id, values.name);
        message.success('Referensi berhasil diperbarui.');
      } else {
        await createReference(activeKey, values.name);
        message.success('Referensi berhasil ditambahkan.');
      }
      setModalOpen(false);
      loadReferences();
    } catch (error) {
      message.error('Gagal menyimpan referensi.');
    }
  };

  const handleDelete = async (record) => {
    try {
      await deleteReference(activeKey, record.id);
      message.success('Referensi berhasil dihapus.');
      loadReferences();
    } catch (error) {
      message.error('Gagal menghapus referensi.');
    }
  };

  const columns = [
    {
      title: 'Nama',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            aria-label="Edit"
            onClick={() => openEditModal(record)}
            size="small"
          />
          <Popconfirm
            title="Hapus referensi ini?"
            onConfirm={() => handleDelete(record)}
            okText="Ya"
            cancelText="Batal"
          >
            <Button type="link" danger icon={<DeleteOutlined />} aria-label="Hapus" size="small" />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const tabItems = REFERENCE_TYPES.map((item) => ({
    key: item.key,
    label: item.label
  }));

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Referensi</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          Tambah Referensi
        </Button>
      </div>

      <Tabs
        activeKey={activeKey}
        items={tabItems}
        onChange={(key) => setActiveKey(key)}
      />

      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 20 }}
        bordered
      />

      <Modal
        title={editing ? 'Edit Referensi' : 'Tambah Referensi'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Nama"
            name="name"
            rules={[{ required: true, message: 'Nama wajib diisi.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editing ? 'Perbarui' : 'Simpan'}
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
  }
};
