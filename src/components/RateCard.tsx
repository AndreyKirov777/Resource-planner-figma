import React, { useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import * as ExcelJS from 'exceljs';
import { RateCard as RateCardType } from '../services/api';

// Import AG Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface RateCardProps {
  rateCards: RateCardType[];
  onRateCardsChange: (rateCards: RateCardType[]) => void;
  onAddRateCard: (rateCard: Partial<RateCardType>) => void;
  onDeleteRateCard: (id: number) => void;
}

export function RateCard({ 
  rateCards, 
  onRateCardsChange, 
  onAddRateCard,
  onDeleteRateCard 
}: RateCardProps) {
  // Currency formatter for rate columns
  const currencyFormatter = (params: any) => {
    if (params.value != null) {
      return `$${params.value.toLocaleString()}`;
    }
    return '';
  };

  const columnDefs: ColDef<RateCardType>[] = [
    {
      headerName: 'Role',
      field: 'role',
      sortable: true,
      filter: true,
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
      filter: true,
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
      filter: true,
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
      filter: true,
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
      filter: true,
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
      filter: true,
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
      filter: true,
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
      filter: true,
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
      filter: true,
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
      filter: true,
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
      filter: true,
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
      filter: true,
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
      filter: true,
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
            // Add each imported rate card to the database
            for (const rateCardData of importedData) {
              onAddRateCard(rateCardData);
            }
            alert(`Successfully imported ${importedData.length} rate card entries`);
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

  return (
    <div className="p-6 space-y-6">
        <Button onClick={handleImportRateCard} title="Import rate card">
          <Plus className="h-4 w-4 mr-1"/>
          Import rate card
        </Button>
      <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
        <AgGridReact
          rowData={rateCards}
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
