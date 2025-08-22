import React, { useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';

// Import AG Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface RateCardRow {
  role: string;
  namingInPM: string;
  discipline: string;
  description: string;
  ukraine: number;
  easternEurope: number;
  asiaGE: number;
  asiaARMKZ: number;
  latam: number;
  mexico: number;
  india: number;
  newYork: number;
  london: number;
}

interface RateCardProps {
  resources: any[];
}

export function RateCard({ resources }: RateCardProps) {
  const [rowData, setRowData] = useState<RateCardRow[]>([
    {
      role: 'Senior Developer',
      namingInPM: 'Dev Senior',
      discipline: 'Development',
      description: 'Senior software developer with 5+ years experience',
      ukraine: 120,
      easternEurope: 110,
      asiaGE: 85,
      asiaARMKZ: 75,
      latam: 65,
      mexico: 70,
      india: 45,
      newYork: 120,
      london: 110
    },
    {
      role: 'Project Manager',
      namingInPM: 'PM Lead',
      discipline: 'Management',
      description: 'Experienced project manager for complex projects',
      ukraine: 140,
      easternEurope: 130,
      asiaGE: 95,
      asiaARMKZ: 85,
      latam: 75,
      mexico: 80,
      india: 55,
      newYork: 140,
      london: 130
    },
    {
      role: 'UX/UI Designer',
      namingInPM: 'Designer',
      discipline: 'Design',
      description: 'User experience and interface design specialist',
      ukraine: 100,
      easternEurope: 90,
      asiaGE: 70,
      asiaARMKZ: 60,
      latam: 50,
      mexico: 55,
      india: 35,
      newYork: 100,
      london: 90
    },
    {
      role: 'QA Engineer',
      namingInPM: 'QA',
      discipline: 'Testing',
      description: 'Quality assurance and testing specialist',
      ukraine: 80,
      easternEurope: 70,
      asiaGE: 60,
      asiaARMKZ: 50,
      latam: 40,
      mexico: 45,
      india: 25,
      newYork: 80,
      london: 70
    },
    {
      role: 'DevOps Engineer',
      namingInPM: 'DevOps',
      discipline: 'Infrastructure',
      description: 'DevOps and infrastructure specialist',
      ukraine: 110,
      easternEurope: 100,
      asiaGE: 80,
      asiaARMKZ: 70,
      latam: 60,
      mexico: 65,
      india: 40,
      newYork: 110,
      london: 100
    },
    {
      role: 'Data Scientist',
      namingInPM: 'Data Sci',
      discipline: 'Data',
      description: 'Data science and analytics specialist',
      ukraine: 130,
      easternEurope: 120,
      asiaGE: 90,
      asiaARMKZ: 80,
      latam: 70,
      mexico: 75,
      india: 50,
      newYork: 130,
      london: 120
    }
  ]);

  // Currency formatter for rate columns
  const currencyFormatter = (params: any) => {
    if (params.value != null) {
      return `$${params.value.toLocaleString()}`;
    }
    return '';
  };

  const columnDefs: ColDef<RateCardRow>[] = [
    {
      headerName: 'Role',
      field: 'role',
      sortable: true,
      filter: true,
      resizable: true
    },
    {
      headerName: 'Naming in PM',
      field: 'namingInPM',
      sortable: true,
      filter: true,
      resizable: true
    },
    {
      headerName: 'Discipline',
      field: 'discipline',
      sortable: true,
      filter: true,
      resizable: true
    },
    {
      headerName: 'Description',
      field: 'description',
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1
    },
    {
      headerName: 'Ukraine',
      field: 'ukraine',
      sortable: true,
      filter: true,
      resizable: true,
      valueFormatter: currencyFormatter,
      type: 'numericColumn'
    },
    {
      headerName: 'Eastern Europe',
      field: 'easternEurope',
      sortable: true,
      filter: true,
      resizable: true,
      valueFormatter: currencyFormatter,
      type: 'numericColumn'
    },
    {
      headerName: 'Asia (GE)',
      field: 'asiaGE',
      sortable: true,
      filter: true,
      resizable: true,
      valueFormatter: currencyFormatter,
      type: 'numericColumn'
    },
    {
      headerName: 'Asia (ARM, KZ)',
      field: 'asiaARMKZ',
      sortable: true,
      filter: true,
      resizable: true,
      valueFormatter: currencyFormatter,
      type: 'numericColumn'
    },
    {
      headerName: 'LATAM',
      field: 'latam',
      sortable: true,
      filter: true,
      resizable: true,
      valueFormatter: currencyFormatter,
      type: 'numericColumn'
    },
    {
      headerName: 'Mexico',
      field: 'mexico',
      sortable: true,
      filter: true,
      resizable: true,
      valueFormatter: currencyFormatter,
      type: 'numericColumn'
    },
    {
      headerName: 'India',
      field: 'india',
      sortable: true,
      filter: true,
      resizable: true,
      valueFormatter: currencyFormatter,
      type: 'numericColumn'
    },
    {
      headerName: 'New York',
      field: 'newYork',
      sortable: true,
      filter: true,
      resizable: true,
      valueFormatter: currencyFormatter,
      type: 'numericColumn'
    },
    {
      headerName: 'London',
      field: 'london',
      sortable: true,
      filter: true,
      resizable: true,
      valueFormatter: currencyFormatter,
      type: 'numericColumn'
    }
  ];

  const handleImportRateCard = () => {
    // TODO: Implement file open dialog functionality
    console.log('Import rate card button clicked');
  };

  return (
    <div className="p-6 space-y-6">
        <Button onClick={handleImportRateCard} title="Import rate card">
          <Plus className="h-4 w-4 mr-1"/>
          Import rate card
        </Button>
      <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          pagination={true}
          paginationPageSize={10}
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
