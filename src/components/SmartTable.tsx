"use client";

import React, { useState, useMemo } from 'react';

interface ColumnDef<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface SmartTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pageSize?: number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export default function SmartTable<T extends Record<string, any>>({ 
  data, 
  columns, 
  pageSize = 5,
  emptyMessage = "No hay datos disponibles",
  onRowClick
}: SmartTableProps<T>) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof T | string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter
  const filteredData = useMemo(() => {
    if (!search) return data;
    const lowerSearch = search.toLowerCase();
    return data.filter(row => {
      return Object.values(row).some(
        val => val !== null && val !== undefined && val.toString().toLowerCase().includes(lowerSearch)
      );
    });
  }, [data, search]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortOrder]);

  // Paginate
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const currentData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key: keyof T | string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Table Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <input 
          type="text" 
          placeholder="Buscar registros..." 
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          style={{ 
            padding: '0.6rem 1rem', 
            borderRadius: '2rem', 
            border: '1px solid var(--color-border)', 
            background: 'var(--color-surface)',
            color: 'var(--color-foreground)',
            outline: 'none',
            fontSize: '0.85rem',
            width: '250px'
          }}
        />
      </div>

      {/* Table Data */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '1rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--color-background)', borderBottom: '1px solid var(--color-border)' }}>
              {columns.map((col, idx) => (
                <th 
                  key={String(col.key)} 
                  onClick={() => handleSort(col.key)}
                  style={{ 
                    padding: '1rem', 
                    fontSize: '0.75rem', 
                    color: 'var(--color-muted)', 
                    fontWeight: 600, 
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span style={{ marginLeft: '0.5rem', color: 'var(--color-accent)' }}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((row, rowIdx) => (
                <tr key={rowIdx} onClick={() => onRowClick && onRowClick(row)} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s', cursor: onRowClick ? 'pointer' : 'default' }}>
                  {columns.map((col, colIdx) => (
                    <td key={String(col.key)} style={{ padding: '1.2rem 1rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-muted)' }}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Container */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem', marginTop: '0.5rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
          Mostrando {sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} a {Math.min(currentPage * pageSize, sortedData.length)} de {sortedData.length} registros
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            style={{ 
              padding: '0.4rem 0.8rem', 
              borderRadius: '4px', 
              border: '1px solid var(--color-border)', 
              background: currentPage === 1 ? 'transparent' : 'var(--color-surface)',
              color: 'var(--color-foreground)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >
            Anterior
          </button>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            style={{ 
              padding: '0.4rem 0.8rem', 
              borderRadius: '4px', 
              border: '1px solid var(--color-border)', 
              background: currentPage === totalPages ? 'transparent' : 'var(--color-surface)',
              color: 'var(--color-foreground)',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1
            }}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
