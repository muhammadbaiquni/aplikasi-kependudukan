import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, List, Table, Tabs, message } from 'antd';
import { getTableData, getTableList, runQuery } from './db';

const createColumns = (rows) => {
  if (!rows || rows.length === 0) {
    return [];
  }
  return Object.keys(rows[0]).map((key) => ({
    title: key,
    dataIndex: key,
    key,
    width: 160,
    ellipsis: true
  }));
};

const filterRows = (rows, filterText) => {
  const query = (filterText || '').trim().toLowerCase();
  if (!query) {
    return rows;
  }
  return rows.filter((row) => Object.values(row).some((value) => {
    if (value === null || value === undefined) {
      return false;
    }
    return value.toString().toLowerCase().includes(query);
  }));
};

export default function Query() {
  const [tables, setTables] = useState([]);
  const [tabs, setTabs] = useState([{ key: 'query', label: 'Query', type: 'query' }]);
  const [activeKey, setActiveKey] = useState('query');
  const [queryText, setQueryText] = useState('SELECT * FROM penduduk LIMIT 50;');
  const [queryResult, setQueryResult] = useState(null);
  const [queryRunning, setQueryRunning] = useState(false);
  const [tableData, setTableData] = useState({});
  const [tableFilters, setTableFilters] = useState({});
  const [tableLoading, setTableLoading] = useState({});
  const [leftWidth, setLeftWidth] = useState(240);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const loadTables = async () => {
      const result = await getTableList();
      setTables(Array.isArray(result) ? result : []);
    };
    loadTables();
  }, []);

  useEffect(() => {
    if (!isDragging) {
      return undefined;
    }

    const handleMove = (event) => {
      if (!containerRef.current) {
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      const nextWidth = Math.min(480, Math.max(180, event.clientX - rect.left));
      setLeftWidth(nextWidth);
      if (isCollapsed) {
        setIsCollapsed(false);
      }
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, isCollapsed]);

  const handleRunQuery = async () => {
    setQueryRunning(true);
    const result = await runQuery(queryText);
    setQueryRunning(false);
    if (result?.error) {
      message.error(result.error);
      setQueryResult({ type: 'error', error: result.error });
      return;
    }
    setQueryResult(result);
    if (result?.type === 'run') {
      message.success(`Query selesai. Perubahan: ${result.changes || 0}`);
    }
  };

  const handleQueryKeyDown = (event) => {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      handleRunQuery();
    }
  };

  const openTableTab = async (tableName) => {
    const tabKey = `table:${tableName}`;
    if (!tabs.some((tab) => tab.key === tabKey)) {
      setTabs((prev) => [
        ...prev,
        { key: tabKey, label: tableName, type: 'table', tableName }
      ]);
    }
    setActiveKey(tabKey);
    if (!tableData[tableName]) {
      setTableLoading((prev) => ({ ...prev, [tableName]: true }));
      const rows = await getTableData(tableName);
      setTableData((prev) => ({ ...prev, [tableName]: rows }));
      setTableLoading((prev) => ({ ...prev, [tableName]: false }));
    }
  };

  const handleCloseTab = (targetKey) => {
    if (targetKey === 'query') {
      return;
    }
    setTabs((prev) => prev.filter((tab) => tab.key !== targetKey));
    if (activeKey === targetKey) {
      setActiveKey('query');
    }
  };

  const queryColumns = useMemo(() => {
    if (queryResult?.type === 'rows') {
      return createColumns(queryResult.rows);
    }
    return [];
  }, [queryResult]);

  const tabItems = tabs.map((tab) => {
    if (tab.type === 'query') {
      return {
        key: tab.key,
        label: tab.label,
        closable: false,
        children: (
          <div style={styles.queryPanel}>
            <Input.TextArea
              rows={8}
              value={queryText}
              onChange={(event) => setQueryText(event.target.value)}
              onKeyDown={handleQueryKeyDown}
              placeholder="Tulis SQL query di sini"
              style={styles.queryInput}
            />
            <div style={styles.queryActions}>
              <Button type="primary" onClick={handleRunQuery} loading={queryRunning}>
                Run (Ctrl + Enter)
              </Button>
            </div>
            <div style={styles.resultPanel}>
              {queryResult?.type === 'rows' ? (
                <Table
                  columns={queryColumns}
                  dataSource={queryResult.rows}
                  rowKey={(record, index) => record.id ?? `query-${index}`}
                  size="small"
                  scroll={{ x: 'max-content', y: 420 }}
                  pagination={{ pageSize: 50 }}
                  bordered
                />
              ) : null}
              {queryResult?.type === 'run' ? (
                <div style={styles.runInfo}>
                  Perubahan: {queryResult.changes ?? 0}
                  {queryResult.lastInsertRowid ? ` | Last ID: ${queryResult.lastInsertRowid}` : ''}
                </div>
              ) : null}
              {queryResult?.type === 'error' ? (
                <div style={styles.errorInfo}>{queryResult.error}</div>
              ) : null}
            </div>
          </div>
        )
      };
    }

    const rows = tableData[tab.tableName] || [];
    const filteredRows = filterRows(rows, tableFilters[tab.tableName]);
    const tableColumns = createColumns(rows);

    return {
      key: tab.key,
      label: tab.label,
      closable: true,
      children: (
        <div style={styles.tablePanel}>
          <Input
            placeholder="Filter data tabel"
            value={tableFilters[tab.tableName] || ''}
            onChange={(event) => setTableFilters((prev) => ({
              ...prev,
              [tab.tableName]: event.target.value
            }))}
            allowClear
            style={styles.tableFilter}
          />
          <Table
            columns={tableColumns}
            dataSource={filteredRows}
            loading={tableLoading[tab.tableName]}
            rowKey={(record, index) => record.id ?? `${tab.tableName}-${index}`}
            size="small"
            scroll={{ x: 'max-content', y: 520 }}
            pagination={{ pageSize: 50 }}
            bordered
          />
        </div>
      )
    };
  });

  return (
    <div style={styles.container}>
      <div ref={containerRef} style={styles.contentRow}>
        <div
          style={{
            ...styles.leftPanel,
            width: isCollapsed ? 0 : leftWidth,
            paddingRight: isCollapsed ? 0 : 12,
            opacity: isCollapsed ? 0 : 1,
            pointerEvents: isCollapsed ? 'none' : 'auto'
          }}
        >
          <div style={styles.panelHeader}>
            <div style={styles.panelTitle}>Daftar Tabel</div>
            <Button size="small" onClick={() => setIsCollapsed(true)}>
              Collapse
            </Button>
          </div>
          <List
            size="small"
            dataSource={tables}
            renderItem={(item) => (
              <List.Item
                key={item}
                style={styles.tableItem}
                onDoubleClick={() => openTableTab(item)}
              >
                {item}
              </List.Item>
            )}
          />
        </div>
        <div
          style={styles.divider}
          onMouseDown={() => setIsDragging(true)}
          role="separator"
          aria-orientation="vertical"
        />
        <div style={styles.rightPanel}>
          <Tabs
            type="editable-card"
            hideAdd
            activeKey={activeKey}
            onChange={setActiveKey}
            onEdit={(targetKey, action) => {
              if (action === 'remove') {
                handleCloseTab(targetKey);
              }
            }}
            tabBarExtraContent={
              isCollapsed ? (
                <Button size="small" onClick={() => setIsCollapsed(false)}>
                  Tampilkan Tabel
                </Button>
              ) : null
            }
            items={tabItems}
          />
        </div>
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
  contentRow: {
    height: '100%',
    display: 'flex',
    gap: 0
  },
  leftPanel: {
    borderRight: '1px solid #f0f0f0',
    paddingRight: '12px',
    transition: 'width 0.2s ease',
    maxHeight: 'calc(100vh - 180px)',
    overflow: 'auto'
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px'
  },
  rightPanel: {
    paddingLeft: '12px',
    flex: 1,
    minWidth: 0
  },
  divider: {
    width: 6,
    cursor: 'col-resize',
    background: '#f5f5f5'
  },
  panelTitle: {
    fontWeight: 600,
    marginBottom: '12px'
  },
  tableItem: {
    cursor: 'pointer'
  },
  queryPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  queryInput: {
    fontFamily: 'Consolas, Menlo, monospace'
  },
  queryActions: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  resultPanel: {
    minHeight: 120
  },
  runInfo: {
    padding: '8px 0',
    color: '#1677ff'
  },
  errorInfo: {
    padding: '8px 0',
    color: '#ff4d4f'
  },
  tablePanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  tableFilter: {
    maxWidth: 320
  }
};
