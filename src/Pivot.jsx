import { useEffect, useMemo, useState } from 'react';
import { Card, Checkbox, Col, Empty, Row, Select, Space, Switch, Table, Tag } from 'antd';
import { getPendudukList, getPendudukPindahList, getPendudukMeninggalList } from './db';

const { Option } = Select;

const FIELDS = [
  { key: 'nik', label: 'NIK', type: 'string' },
  { key: 'nama', label: 'Nama', type: 'string' },
  { key: 'jk', label: 'JK', type: 'string' },
  { key: 'tmpt_lhr', label: 'Tempat Lahir', type: 'string' },
  { key: 'tgl_lhr', label: 'Tanggal Lahir', type: 'string' },
  { key: 'status', label: 'Status', type: 'string' },
  { key: 'shdk', label: 'SHDK', type: 'string' },
  { key: 'no_kk', label: 'No KK', type: 'string' },
  { key: 'agama', label: 'Agama', type: 'string' },
  { key: 'pddk_akhir', label: 'Pendidikan Akhir', type: 'string' },
  { key: 'pekerjaan', label: 'Pekerjaan', type: 'string' },
  { key: 'nama_ayah', label: 'Nama Ayah', type: 'string' },
  { key: 'nama_ibu', label: 'Nama Ibu', type: 'string' },
  { key: 'nama_kep_kel', label: 'Nama Kep Kel', type: 'string' },
  { key: 'alamat', label: 'Alamat', type: 'string' },
  { key: 'rt', label: 'RT', type: 'string' },
  { key: 'rw', label: 'RW', type: 'string' },
  { key: 'kelurahan', label: 'Kelurahan', type: 'string' },
  { key: 'kecamatan', label: 'Kecamatan', type: 'string' },
  { key: 'kota', label: 'Kota', type: 'string' },
  { key: 'provinsi', label: 'Provinsi', type: 'string' },
  { key: 'kodepos', label: 'Kode Pos', type: 'string' },
  { key: 'telepon', label: 'Telepon', type: 'string' },
  { key: 'tgl_peristiwa', label: 'Tanggal Peristiwa', type: 'string' },
  { key: 'umur', label: 'Umur', type: 'number' }
];

const AGG_OPTIONS = ['SUM', 'COUNT'];

const buildFieldMap = () => {
  const map = new Map();
  FIELDS.forEach((field) => {
    map.set(field.key, field);
  });
  return map;
};

const fieldMap = buildFieldMap();

const normalizeKey = (values) => values.map((value) => value ?? '').join('||');

const getAgeFromBirthDate = (birthDate) => {
  if (!birthDate) {
    return 0;
  }
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) {
    return 0;
  }
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const hasHadBirthday =
    today.getMonth() > date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());
  if (!hasHadBirthday) {
    age -= 1;
  }
  return Math.max(0, age);
};

const getFieldValue = (item, key) => {
  if (key === 'umur') {
    return getAgeFromBirthDate(item?.tgl_lhr);
  }
  return item?.[key];
};

const labelForKeys = (keys, item) => {
  if (keys.length === 0) {
    return 'Semua Data';
  }
  return keys
    .map((key) => {
      const value = getFieldValue(item, key);
      return value ?? '-';
    })
    .join(' / ');
};

const getAggDefault = (key) => {
  const type = fieldMap.get(key)?.type;
  return type === 'number' ? 'SUM' : 'COUNT';
};

const aggregateValue = (current, valueKey, item, agg) => {
  if (agg === 'COUNT') {
    return current + 1;
  }
  const raw = getFieldValue(item, valueKey);
  const numeric = Number.parseFloat(raw);
  return current + (Number.isNaN(numeric) ? 0 : numeric);
};

export default function Pivot() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState('penduduk');
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [areas, setAreas] = useState({
    rows: [],
    columns: [],
    values: []
  });
  const [showPercent, setShowPercent] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let result = [];
        if (dataSource === 'penduduk') {
          result = await getPendudukList();
        } else if (dataSource === 'pindah') {
          result = await getPendudukPindahList();
        } else if (dataSource === 'meninggal') {
          result = await getPendudukMeninggalList();
        }
        setData(result || []);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dataSource]);

  const selectedFields = FIELDS.filter((field) => selectedKeys.includes(field.key));

  const handleToggleField = (key, checked) => {
    setSelectedKeys((prev) => {
      if (checked) {
        return [...prev, key];
      }
      return prev.filter((item) => item !== key);
    });

    setAreas((prev) => ({
      rows: prev.rows.filter((item) => item !== key),
      columns: prev.columns.filter((item) => item !== key),
      values: prev.values.filter((item) => item.key !== key)
    }));
  };

  const handleDrop = (areaKey, draggedKey) => {
    if (!selectedKeys.includes(draggedKey)) {
      return;
    }
    setAreas((prev) => {
      const next = {
        rows: prev.rows.filter((item) => item !== draggedKey),
        columns: prev.columns.filter((item) => item !== draggedKey),
        values: prev.values.filter((item) => item.key !== draggedKey)
      };

      if (areaKey === 'values') {
        next.values = [
          ...next.values,
          { key: draggedKey, agg: getAggDefault(draggedKey) }
        ];
      } else if (!next[areaKey].includes(draggedKey)) {
        next[areaKey] = [...next[areaKey], draggedKey];
      }

      return next;
    });
  };

  const handleRemoveFromArea = (areaKey, key) => {
    setAreas((prev) => {
      if (areaKey === 'values') {
        return { ...prev, values: prev.values.filter((item) => item.key !== key) };
      }
      return { ...prev, [areaKey]: prev[areaKey].filter((item) => item !== key) };
    });
  };

  const handleAggChange = (key, agg) => {
    setAreas((prev) => ({
      ...prev,
      values: prev.values.map((item) => (
        item.key === key ? { ...item, agg } : item
      ))
    }));
  };

  const pivotResult = useMemo(() => {
    if (areas.values.length === 0) {
      return { columns: [], rows: [], grandTotals: {} };
    }

    const rowKeys = areas.rows;
    const columnKeys = areas.columns;
    const valueDefs = areas.values;
    const rowLabels = new Map();
    const colLabels = new Map();
    const matrix = new Map();
    const colKeySet = new Set();

    data.forEach((item) => {
      const rowKey = normalizeKey(rowKeys.map((key) => getFieldValue(item, key)));
      const colKey = normalizeKey(columnKeys.map((key) => getFieldValue(item, key)));
      if (!rowLabels.has(rowKey)) {
        rowLabels.set(rowKey, labelForKeys(rowKeys, item));
      }
      if (!colLabels.has(colKey)) {
        colLabels.set(colKey, labelForKeys(columnKeys, item));
      }
      colKeySet.add(colKey);

      if (!matrix.has(rowKey)) {
        matrix.set(rowKey, new Map());
      }
      const rowMap = matrix.get(rowKey);
      if (!rowMap.has(colKey)) {
        const init = {};
        valueDefs.forEach((def) => {
          init[def.key] = 0;
        });
        rowMap.set(colKey, init);
      }
      const cell = rowMap.get(colKey);
      valueDefs.forEach((def) => {
        cell[def.key] = aggregateValue(cell[def.key], def.key, item, def.agg);
      });
    });

    const orderedColKeys = Array.from(colKeySet);
    if (orderedColKeys.length === 0) {
      orderedColKeys.push('ALL');
      colLabels.set('ALL', 'Semua Data');
    }

    const rowTotals = new Map();
    const colTotals = new Map();
    const grandTotals = {};
    valueDefs.forEach((def) => {
      grandTotals[def.key] = 0;
    });

    matrix.forEach((rowMap, rowKey) => {
      if (!rowTotals.has(rowKey)) {
        const init = {};
        valueDefs.forEach((def) => {
          init[def.key] = 0;
        });
        rowTotals.set(rowKey, init);
      }

      orderedColKeys.forEach((colKey) => {
        if (!colTotals.has(colKey)) {
          const init = {};
          valueDefs.forEach((def) => {
            init[def.key] = 0;
          });
          colTotals.set(colKey, init);
        }

        const cell = rowMap?.get(colKey);
        valueDefs.forEach((def) => {
          const value = cell ? cell[def.key] : 0;
          rowTotals.get(rowKey)[def.key] += value;
          colTotals.get(colKey)[def.key] += value;
          grandTotals[def.key] += value;
        });
      });
    });

    const columns = [
      {
        title: rowKeys.length ? rowKeys.map((key) => fieldMap.get(key)?.label).join(' / ') : 'Baris',
        dataIndex: '__row',
        key: '__row',
        fixed: 'left',
        width: 220,
        render: (value, record) => (
          record.__isTotal ? <strong>{value}</strong> : value
        )
      }
    ];

    orderedColKeys.forEach((colKey) => {
      const colTitle = colLabels.get(colKey) || 'Semua Data';
      if (valueDefs.length === 1) {
        const valueKey = valueDefs[0].key;
        columns.push({
          title: `${colTitle} (${valueDefs[0].agg})`,
          dataIndex: `${colKey}__${valueKey}`,
          key: `${colKey}__${valueKey}`,
          align: 'right',
          render: (value, record) => (
            record.__isTotal ? <strong>{value}</strong> : value
          )
        });
      } else {
        columns.push({
          title: colTitle,
          children: valueDefs.map((def) => ({
            title: `${fieldMap.get(def.key)?.label} (${def.agg})`,
            dataIndex: `${colKey}__${def.key}`,
            key: `${colKey}__${def.key}`,
            align: 'right',
            render: (value, record) => (
              record.__isTotal ? <strong>{value}</strong> : value
            )
          }))
        });
      }
    });

    if (valueDefs.length === 1) {
      const valueKey = valueDefs[0].key;
      columns.push({
        title: `Total (${valueDefs[0].agg})`,
        dataIndex: `__total__${valueKey}`,
        key: `__total__${valueKey}`,
        align: 'right',
        fixed: 'right',
        render: (value, record) => (
          record.__isTotal ? <strong>{value}</strong> : value
        )
      });
    } else {
      columns.push({
        title: 'Total',
        children: valueDefs.map((def) => ({
          title: `${fieldMap.get(def.key)?.label} (${def.agg})`,
          dataIndex: `__total__${def.key}`,
          key: `__total__${def.key}`,
          align: 'right',
          render: (value, record) => (
            record.__isTotal ? <strong>{value}</strong> : value
          )
        }))
      });
    }

    const formatValue = (value, defKey) => {
      if (!showPercent || grandTotals[defKey] === 0) {
        return value;
      }
      const percent = (value / grandTotals[defKey]) * 100;
      return `${value} (${percent.toFixed(2)}%)`;
    };

    const rows = Array.from(matrix.keys()).map((rowKey) => {
      const rowMap = matrix.get(rowKey);
      const rowData = {
        __row: rowLabels.get(rowKey) || 'Semua Data',
        key: rowKey
      };
      orderedColKeys.forEach((colKey) => {
        const cell = rowMap?.get(colKey);
        valueDefs.forEach((def) => {
          const value = cell ? cell[def.key] : 0;
          rowData[`${colKey}__${def.key}`] = formatValue(value, def.key);
        });
      });
      valueDefs.forEach((def) => {
        const totalValue = rowTotals.get(rowKey)?.[def.key] ?? 0;
        rowData[`__total__${def.key}`] = formatValue(totalValue, def.key);
      });
      return rowData;
    });

    if (rows.length > 0) {
      const totalRow = {
        __row: 'Grand Total',
        key: '__grand_total',
        __isTotal: true
      };
      orderedColKeys.forEach((colKey) => {
        valueDefs.forEach((def) => {
          const totalValue = colTotals.get(colKey)?.[def.key] ?? 0;
          totalRow[`${colKey}__${def.key}`] = formatValue(totalValue, def.key);
        });
      });
      valueDefs.forEach((def) => {
        totalRow[`__total__${def.key}`] = formatValue(grandTotals[def.key] ?? 0, def.key);
      });
      rows.push(totalRow);
    }

    return { columns, rows, grandTotals };
  }, [data, areas, showPercent]);

  return (
    <div style={styles.container}>
      <Row gutter={16}>
        <Col xs={24} lg={17}>
          <Card
            title={(
              <Space>
                <span>Pivot Table</span>
                <Select
                  size="small"
                  value={dataSource}
                  onChange={(value) => setDataSource(value)}
                  style={{ minWidth: 180 }}
                >
                  <Option value="penduduk">Penduduk</Option>
                  <Option value="pindah">Penduduk Pindah</Option>
                  <Option value="meninggal">Penduduk Meninggal</Option>
                </Select>
              </Space>
            )}
            style={styles.card}
          >
            {areas.values.length === 0 ? (
              <Empty description="Pilih minimal 1 field untuk Values" />
            ) : (
              <Table
                columns={pivotResult.columns}
                dataSource={pivotResult.rows}
                loading={loading}
                scroll={{ x: 'max-content', y: 520 }}
                pagination={false}
                bordered
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={7}>
          <Card title="Field List" style={styles.card}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {FIELDS.map((field) => (
                <Checkbox
                  key={field.key}
                  checked={selectedKeys.includes(field.key)}
                  onChange={(event) => handleToggleField(field.key, event.target.checked)}
                >
                  {field.label}
                </Checkbox>
              ))}
            </Space>

            <div style={styles.section}>
              <div style={styles.sectionTitle}>Selected Fields</div>
              <div style={styles.fieldList}>
                {selectedFields.length === 0 ? (
                  <div style={styles.emptyHint}>Pilih field untuk mulai.</div>
                ) : (
                  selectedFields.map((field) => (
                    <Tag
                      key={field.key}
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData('text/plain', field.key)}
                      style={styles.draggableTag}
                    >
                      {field.label}
                    </Tag>
                  ))
                )}
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionTitle}>Rows</div>
              <div
                style={styles.dropZone}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop('rows', event.dataTransfer.getData('text/plain'));
                }}
              >
                {areas.rows.length === 0 ? (
                  <span style={styles.emptyHint}>Drag field ke sini.</span>
                ) : (
                  areas.rows.map((key) => (
                    <Tag
                      key={key}
                      closable
                      onClose={() => handleRemoveFromArea('rows', key)}
                    >
                      {fieldMap.get(key)?.label}
                    </Tag>
                  ))
                )}
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionTitle}>Columns</div>
              <div
                style={styles.dropZone}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop('columns', event.dataTransfer.getData('text/plain'));
                }}
              >
                {areas.columns.length === 0 ? (
                  <span style={styles.emptyHint}>Drag field ke sini.</span>
                ) : (
                  areas.columns.map((key) => (
                    <Tag
                      key={key}
                      closable
                      onClose={() => handleRemoveFromArea('columns', key)}
                    >
                      {fieldMap.get(key)?.label}
                    </Tag>
                  ))
                )}
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionTitle}>Values</div>
              <div
                style={styles.dropZone}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop('values', event.dataTransfer.getData('text/plain'));
                }}
              >
                {areas.values.length === 0 ? (
                  <span style={styles.emptyHint}>Drag field ke sini.</span>
                ) : (
                  areas.values.map((value) => (
                    <div key={value.key} style={styles.valueRow}>
                      <Tag
                        closable
                        onClose={() => handleRemoveFromArea('values', value.key)}
                      >
                        {fieldMap.get(value.key)?.label}
                      </Tag>
                      <Select
                        size="small"
                        value={value.agg}
                        onChange={(agg) => handleAggChange(value.key, agg)}
                        style={{ minWidth: 90 }}
                      >
                        {AGG_OPTIONS.map((agg) => (
                          <Option
                            key={agg}
                            value={agg}
                            disabled={fieldMap.get(value.key)?.type !== 'number' && agg === 'SUM'}
                          >
                            {agg}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionTitle}>Tampilan</div>
              <Space>
                <Switch
                  checked={showPercent}
                  onChange={setShowPercent}
                />
                <span style={styles.emptyHint}>Tampilkan persen</span>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
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
  },
  section: {
    marginTop: '16px'
  },
  sectionTitle: {
    fontWeight: 600,
    marginBottom: '8px'
  },
  fieldList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    minHeight: '36px'
  },
  dropZone: {
    border: '1px dashed #d9d9d9',
    borderRadius: '6px',
    padding: '8px',
    minHeight: '48px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center'
  },
  emptyHint: {
    color: '#999'
  },
  draggableTag: {
    cursor: 'grab'
  },
  valueRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  }
};
