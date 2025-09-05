import React, { useState } from 'react';
import { ChevronDown, ChevronUp, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface DataGridColumn {
  header: string;
  accessorKey: string;
  width?: number | string;
  sortable?: boolean;
  cell?: (props: any) => React.ReactNode;
}

interface DataGridProps {
  columns: DataGridColumn[];
  data: any[];
  onDataChange: (newData: any[]) => void;
  onAddRow?: () => void;
}

export function DataGrid({ columns, data, onDataChange, onAddRow }: DataGridProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending' | null;
  }>({
    key: '',
    direction: null
  });

  // Calculate column widths
  const columnWidths = columns.map(col => typeof col.width === 'number' ? `${col.width}px` : col.width || 'auto');

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: 'ascending' | 'descending' | null = 'ascending';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'ascending') {
        direction = 'descending';
      } else if (sortConfig.direction === 'descending') {
        direction = null;
      }
    }
    
    setSortConfig({ key, direction });
  };

  // Handle row deletion
  const handleDeleteRow = (index: number) => {
    const newData = [...data];
    newData.splice(index, 1);
    onDataChange(newData);
  };

  // Get sorted data
  const getSortedData = () => {
    if (!sortConfig.direction) return data;
    
    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle special value types
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
      }
      
      if (typeof bValue === 'string') {
        bValue = bValue.toLowerCase();
      }
      
      // Handle nullish values
      if (aValue == null) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'ascending' ? 1 : -1;

      // Compare values
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  // Render sort indicator
  const renderSortIndicator = (column: DataGridColumn) => {
    if (!column.sortable || sortConfig.key !== column.accessorKey) return null;
    
    if (sortConfig.direction === 'ascending') {
      return <ChevronUp className="ml-1 h-4 w-4 text-primary" />;
    } else if (sortConfig.direction === 'descending') {
      return <ChevronDown className="ml-1 h-4 w-4 text-primary" />;
    }
    return null;
  };

  return (
    <div className="data-grid">
      {/* Header */}
      <div className="flex border-b bg-muted/40 font-medium text-sm">
        {columns.map((column, colIndex) => (
          <div
            key={column.accessorKey}
            className={`flex items-center p-2 ${column.sortable ? 'cursor-pointer hover:bg-muted/60' : ''}`}
            style={{ width: columnWidths[colIndex], minWidth: columnWidths[colIndex] }}
            onClick={() => column.sortable && handleSort(column.accessorKey)}
          >
            <div className="flex items-center">
              {column.header}
              {renderSortIndicator(column)}
            </div>
          </div>
        ))}
        <div className="w-10 p-2 text-center">
          {/* Actions column */}
        </div>
      </div>

      {/* Body */}
      <div className="data-grid-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {getSortedData().length === 0 ? (
          <div className="flex justify-center items-center p-4 text-muted-foreground">
            No data available
          </div>
        ) : (
          getSortedData().map((row, rowIndex) => (
            <div key={rowIndex} className="flex border-b hover:bg-muted/20">
              {columns.map((column, colIndex) => (
                <div
                  key={`${rowIndex}-${column.accessorKey}`}
                  className="p-2"
                  style={{ width: columnWidths[colIndex], minWidth: columnWidths[colIndex] }}
                >
                  {column.cell ? column.cell({ row, rowIndex, column }) : row[column.accessorKey]}
                </div>
              ))}
              <div className="w-10 p-2 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteRow(rowIndex)}
                  className="h-6 w-6 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Row Button */}
      {onAddRow && (
        <div className="flex justify-center border-t p-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onAddRow}
            className="flex items-center gap-1"
          >
            <PlusCircle size={16} /> Add Row
          </Button>
        </div>
      )}
    </div>
  );
}