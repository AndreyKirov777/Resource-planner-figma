import React, { useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Trash2, Search, X } from 'lucide-react';
import * as ExcelJS from 'exceljs';
import { RateCard as RateCardType } from '../services/api';

// Import AG Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface RateCardProps {
  projectId: number;
  rateCards: RateCardType[];
  onRateCardsChange: (rateCards: RateCardType[]) => void;
  onAddRateCard: (rateCard: Partial<RateCardType>) => void;
  onAddRateCardsBulk: (rateCards: Partial<RateCardType>[]) => Promise<{ message: string; count: number }>;
  onDeleteRateCard: (id: number) => void;
  onDeleteAllRateCards: () => void;
}

export function RateCard({ 
  projectId,
  rateCards, 
  onRateCardsChange, 
  onAddRateCard,
  onAddRateCardsBulk,
  onDeleteRateCard,
  onDeleteAllRateCards 
}: RateCardProps) {
  // State for external filters
  const [namingInPMFilter, setNamingInPMFilter] = useState<string>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  
  // State for arrays created from Excel import
  const [namingInPMArray, setNamingInPMArray] = useState<string[]>([]);
  const [disciplineArray, setDisciplineArray] = useState<string[]>([]);
  
  // Update arrays when rateCards change (for existing data)
  React.useEffect(() => {
    if (rateCards.length > 0) {
      const namingInPM = [...new Set(rateCards.map(item => item.namingInPM).filter(value => value && value.trim()))];
      const discipline = [...new Set(rateCards.map(item => item.discipline).filter(value => value && value.trim()))];
      setNamingInPMArray(namingInPM);
      setDisciplineArray(discipline);
    }
  }, [rateCards]);
  
  // Filtered data based on external filters
  const filteredRateCards = useMemo(() => {
    let filtered = rateCards;
    
    // Apply Naming in PM filter
    if (namingInPMFilter !== 'all') {
      filtered = filtered.filter(rateCard => 
        rateCard.namingInPM?.toLowerCase() === namingInPMFilter.toLowerCase()
      );
    }
    
    // Apply Discipline filter
    if (disciplineFilter !== 'all') {
      filtered = filtered.filter(rateCard => 
        rateCard.discipline?.toLowerCase() === disciplineFilter.toLowerCase()
      );
    }
    
    return filtered;
  }, [rateCards, namingInPMFilter, disciplineFilter]);
  
  // Currency formatter for rate columns
  const currencyFormatter = (params: any) => {
    if (params.value != null) {
      return `$${params.value.toLocaleString()}`;
    }
    return '';
  };

  const columnDefs: ColDef<RateCardType>[] = [
    {
      headerName: 'Action',
      field: 'id', // Use existing field to avoid TypeScript error
      sortable: false,
      filter: false,
      resizable: false,
      editable: false,
      width: 80,
      cellRenderer: () => '', // Empty cell for now
      pinned: 'left',
      hide: false
    },
    {
      headerName: 'Role',
      field: 'role',
      sortable: true,
      filter: false,
      resizable: true,
      editable: true,
      onCellValueChanged: (params: any) => {
        const updatedRateCards = rateCards.map(rateCard =>
          rateCard.id === params.data.id
            ? { ...rateCard, role: params.newValue }
            : rateCard
        );
        onRateCardsChange(updatedRateCards);
      }
    },
    {
      headerName: 'Naming in PM',
      field: 'namingInPM',
      sortable: true,
      filter: false, // Disable built-in filter since we're using external filter
      resizable: true,
      editable: true,
      onCellValueChanged: (params: any) => {
        const updatedRateCards = rateCards.map(rateCard =>
          rateCard.id === params.data.id
            ? { ...rateCard, namingInPM: params.newValue }
            : rateCard
        );
        onRateCardsChange(updatedRateCards);
      }
    },
    {
      headerName: 'Discipline',
      field: 'discipline',
      sortable: true,
      filter: false, // Disable built-in filter since we're using external filter
      resizable: true,
      editable: true,
      onCellValueChanged: (params: any) => {
        const updatedRateCards = rateCards.map(rateCard =>
          rateCard.id === params.data.id
            ? { ...rateCard, discipline: params.newValue }
            : rateCard
        );
        onRateCardsChange(updatedRateCards);
      }
    },
    {
      headerName: 'Description',
      field: 'description',
      sortable: true,
      filter: false,
      resizable: true,
      flex: 1,
      editable: true,
      onCellValueChanged: (params: any) => {
        const updatedRateCards = rateCards.map(rateCard =>
          rateCard.id === params.data.id
            ? { ...rateCard, description: params.newValue }
            : rateCard
        );
        onRateCardsChange(updatedRateCards);
      }
    },
    {
      headerName: 'Ukraine',
      field: 'ukraine',
      sortable: true,
      filter: false,
      resizable: true,
      valueFormatter: currencyFormatter,
      type: 'numericColumn',
      editable: true,
      onCellValueChanged: (params: any) => {
        const updatedRateCards = rateCards.map(rateCard =>
          rateCard.id === params.data.id
            ? { ...rateCard, ukraine: parseFloat(params.newValue) || 0 }
            : rateCard
        );
        onRateCardsChange(updatedRateCards);
      }
    },
    {
      headerName: 'Eastern Europe',
      field: 'easternEurope',
      sortable: true,
      filter: false,
      resizable: true,
      valueFormatter: currencyFormatter,
      type: 'numericColumn',
      editable: true,
      onCellValueChanged: (params: any) => {
        const updatedRateCards = rateCards.map(rateCard =>
          rateCard.id === params.data.id
            ? { ...rateCard, easternEurope: parseFloat(params.newValue) || 0 }
            : rateCard
        );
        onRateCardsChange(updatedRateCards);
      }
    },
    {
      headerName: 'Asia (GE)',
      field: 'asiaGE',
      sortable: true,
      filter: false,
      resizable: true,
      valueFormatter: currencyFormatter,
      type: 'numericColumn',
      editable: true,
      onCellValueChanged: (params: any) => {
        const updatedRateCards = rateCards.map(rateCard =>
          rateCard.id === params.data.id
            ? { ...rateCard, asiaGE: parseFloat(params.newValue) || 0 }
            : rateCard
        );
        onRateCardsChange(updatedRateCards);
      }
    },
    {
      headerName: 'Asia (ARM, KZ)',
      field: 'asiaARMKZ',
      sortable: true,
      filter: false,
      resizable: true,
      valueFormatter: currencyFormatter,
      type: 'numericColumn',
      editable: true,
      onCellValueChanged: (params: any) => {
        const updatedRateCards = rateCards.map(rateCard =>
          rateCard.id === params.data.id
            ? { ...rateCard, asiaARMKZ: parseFloat(params.newValue) || 0 }
            : rateCard
        );
        onRateCardsChange(updatedRateCards);
      }
    },
    {
      headerName: 'LATAM',
      field: 'latam',
      sortable: true,
      filter: false,
      resizable: true,
      valueFormatter: currencyFormatter,
      type: 'numericColumn',
      editable: true,
      onCellValueChanged: (params: any) => {
        const updatedRateCards = rateCards.map(rateCard =>
          rateCard.id === params.data.id
            ? { ...rateCard, latam: parseFloat(params.newValue) || 0 }
            : rateCard
        );
        onRateCardsChange(updatedRateCards);
      }
    },
    {
      headerName: 'Mexico',
      field: 'mexico',
      sortable: true,
      filter: false,
      resizable: true,
      valueFormatter: currencyFormatter,
      type: 'numericColumn',
      editable: true,
      onCellValueChanged: (params: any) => {
        const updatedRateCards = rateCards.map(rateCard =>
          rateCard.id === params.data.id
            ? { ...rateCard, mexico: parseFloat(params.newValue) || 0 }
            : rateCard
        );
        onRateCardsChange(updatedRateCards);
      }
    },
    {
      headerName: 'India',
      field: 'india',
      sortable: true,
      filter: false,
      resizable: true,
      valueFormatter: currencyFormatter,
      type: 'numericColumn',
      editable: true,
      onCellValueChanged: (params: any) => {
        const updatedRateCards = rateCards.map(rateCard =>
          rateCard.id === params.data.id
            ? { ...rateCard, india: parseFloat(params.newValue) || 0 }
            : rateCard
        );
        onRateCardsChange(updatedRateCards);
      }
    },
    {
      headerName: 'New York',
      field: 'newYork',
      sortable: true,
      filter: false,
      resizable: true,
      valueFormatter: currencyFormatter,
      type: 'numericColumn',
      editable: true,
      onCellValueChanged: (params: any) => {
        const updatedRateCards = rateCards.map(rateCard =>
          rateCard.id === params.data.id
            ? { ...rateCard, newYork: parseFloat(params.newValue) || 0 }
            : rateCard
        );
        onRateCardsChange(updatedRateCards);
      }
    },
    {
      headerName: 'London',
      field: 'london',
      sortable: true,
      filter: false,
      resizable: true,
      valueFormatter: currencyFormatter,
      type: 'numericColumn',
      editable: true,
      onCellValueChanged: (params: any) => {
        const updatedRateCards = rateCards.map(rateCard =>
          rateCard.id === params.data.id
            ? { ...rateCard, london: parseFloat(params.newValue) || 0 }
            : rateCard
        );
        onRateCardsChange(updatedRateCards);
      }
    }
  ];

  const handleImportRateCard = async () => {
    try {
      onDeleteAllRateCards(); // Clear existing rate cards
      // Create a file input element
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.xlsx,.xls';
      fileInput.style.display = 'none';
      
      fileInput.onchange = async (event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (!file) return;
        
        try {
          const workbook = new ExcelJS.Workbook();
          const arrayBuffer = await file.arrayBuffer();
          await workbook.xlsx.load(arrayBuffer);
          
          // Get the "RMNG RATES" sheet
          const worksheet = workbook.getWorksheet('RMNG RATES');
          if (!worksheet) {
            alert('Sheet "RMNG RATES" not found in the Excel file');
            return;
          }
          
          const importedData: Partial<RateCardType>[] = [];
          
          // Start from row 2 (assuming row 1 is headers)
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber <= 2) return; // Skip header row
            
            const rowData: Partial<RateCardType> = {
              role: row.getCell('A').value?.toString() || '',
              namingInPM: row.getCell('B').value?.toString() || '',
              discipline: row.getCell('C').value?.toString() || '',
              description: row.getCell('D').value?.toString() || '',
              ukraine: parseFloat(row.getCell('E').value?.toString() || '0'),
              easternEurope: parseFloat(row.getCell('F').value?.toString() || '0'),
              asiaGE: parseFloat(row.getCell('G').value?.toString() || '0'),
              asiaARMKZ: parseFloat(row.getCell('H').value?.toString() || '0'),
              latam: parseFloat(row.getCell('I').value?.toString() || '0'),
              mexico: parseFloat(row.getCell('J').value?.toString() || '0'),
              india: parseFloat(row.getCell('K').value?.toString() || '0'),
              newYork: parseFloat(row.getCell('L').value?.toString() || '0'),
              london: parseFloat(row.getCell('M').value?.toString() || '0')
            };
            
            // Only add rows that have at least a role name
            if (rowData.role?.trim()) {
              importedData.push(rowData);
            }
          });
          
          if (importedData.length > 0) {
            console.log('Imported data:', importedData);
            
            // Create arrays with unique values from the imported data
            const naming_in_pm = [...new Set(importedData.map(item => item.namingInPM).filter(value => value && value.trim()))];
            const discipline = [...new Set(importedData.map(item => item.discipline).filter(value => value && value.trim()))];
            
            // Update state arrays
            setNamingInPMArray(naming_in_pm);
            setDisciplineArray(discipline);
            
            // Add all imported rate cards to the database at once
            try {
              const result = await onAddRateCardsBulk(importedData);
              alert(`Successfully imported ${result.count} rate card entries`);
            } catch (error) {
              console.error('Error adding bulk rate cards:', error);
              alert(`Error importing rate cards: ${error instanceof Error ? error.message : 'Unknown error'}`);
              return;
            }
          } else {
            alert('No valid data found in the Excel file');
          }
          
        } catch (error) {
          console.error('Error importing Excel file:', error);
          alert('Error importing Excel file. Please check the file format and try again.');
        }
      };
      
      // Trigger file selection
      document.body.appendChild(fileInput);
      fileInput.click();
      document.body.removeChild(fileInput);
      
    } catch (error) {
      console.error('Error setting up file import:', error);
      alert('Error setting up file import');
    }
  };

  const handleClearAllRateCards = () => {
    if (rateCards.length === 0) {
      alert('The table is already empty.');
      return;
    }
    
    const confirmed = window.confirm(`Are you sure you want to delete all ${rateCards.length} rate card entries? This action cannot be undone.`);
    
    if (confirmed) {
      // Use the new bulk delete function
      onDeleteAllRateCards();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex gap-2">
        <Button onClick={handleImportRateCard} title="Import rate card">
          <Plus className="h-4 w-4 mr-1"/>
          Import rate card
        </Button>
        <Button 
          onClick={handleClearAllRateCards} 
          variant="destructive"
          title="Clear all rate cards"
          disabled={rateCards.length === 0}
        >
          <Trash2 className="h-4 w-4 mr-1"/>
          Clear All
        </Button>
      </div>
      
      {/* External Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Naming in PM:</span>
          <Select value={namingInPMFilter} onValueChange={setNamingInPMFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {namingInPMArray.map((value) => (
                <SelectItem key={value} value={value.toLowerCase()}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Discipline:</span>
          <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select discipline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {disciplineArray.map((value) => (
                <SelectItem key={value} value={value.toLowerCase()}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
        <AgGridReact
          rowData={filteredRateCards}
          columnDefs={columnDefs}
          pagination={true}
          paginationPageSize={20}
          domLayout="autoHeight"
          suppressRowClickSelection={true}
          rowSelection="multiple"
          animateRows={true}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
            minWidth: 100
          }}
        />
      </div>
    </div>
  );
}
