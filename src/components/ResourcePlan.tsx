import React, { useState, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, X } from 'lucide-react';

interface ResourceRow {
  id: string;
  role: string;
  name: string;
  intHourlyRate: number;
  clientHourlyRate: number;
  [key: string]: any; // For dynamic week columns
}

interface Resource {
  id: string;
  role: string;
  name?: string;
  intRate: number;
  description?: string;
}

interface ResourcePlanProps {
  resources: Resource[];
}

// Custom cell renderer component for the Actions column
const ActionsCellRenderer = (props: any) => {
  const removeRole = () => {
    if ((window as any).removePlanRole) {
      (window as any).removePlanRole(props.data.id);
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <button
        onClick={removeRole}
        className="bg-red-500 hover:bg-red-600 text-white border-none rounded-sm w-5 h-5 flex items-center justify-center text-xs cursor-pointer"
        title="Remove role"
      >
        ×
      </button>
    </div>
  );
};

export function ResourcePlan({ resources }: ResourcePlanProps) {
  const [projectSettings, setProjectSettings] = useState({
    daysInFTE: 20,
    clientCurrency: 'EUR',
    exchangeRate: 0.89,
    projectMargin: 65
  });

  const [weekNumbers, setWeekNumbers] = useState([1, 2, 3, 4, 5, 6, 7, 8]);
  const [rowData, setRowData] = useState<ResourceRow[]>([
    {
      id: '1',
      role: 'Application Development',
      name: '',
      intHourlyRate: 25,
      clientHourlyRate: 43,
      week1: 50, week2: 50, week3: 50, week4: 50, week5: 50, week6: 50, week7: 50, week8: 50
    },
    {
      id: '2',
      role: 'Project Manager',
      name: '',
      intHourlyRate: 27,
      clientHourlyRate: 49,
      week1: 50, week2: 50, week3: 50, week4: 0, week5: 0, week6: 0, week7: 0, week8: 0
    },
    {
      id: '3',
      role: 'Frontend Engineer',
      name: '',
      intHourlyRate: 25,
      clientHourlyRate: 32,
      week1: 50, week2: 50, week3: 50, week4: 50, week5: 0, week6: 0, week7: 0, week8: 0
    },
    {
      id: '4',
      role: 'UX/UI Designer',
      name: '',
      intHourlyRate: 20,
      clientHourlyRate: 32,
      week1: 100, week2: 100, week3: 100, week4: 100, week5: 100, week6: 100, week7: 100, week8: 100
    }
  ]);

  const currencySymbol = projectSettings.clientCurrency === 'EUR' ? '€' : '$';

  const calculateEstimatedEfforts = (row: ResourceRow): number => {
    let totalWeeks = 0;
    weekNumbers.forEach(weekNum => {
      totalWeeks += (row[`week${weekNum}`] || 0) / 100;
    });
    return totalWeeks * 40; // 40 hours per week
  };

  const calculateTotalIntCost = (row: ResourceRow): number => {
    const hours = calculateEstimatedEfforts(row);
    return hours * row.intHourlyRate;
  };

  const calculateTotalPrice = (row: ResourceRow): number => {
    const hours = calculateEstimatedEfforts(row);
    return hours * row.clientHourlyRate;
  };

  const calculateMargin = (row: ResourceRow): number => {
    const clientRate = row.clientHourlyRate;
    const intRateInClientCurrency = row.intHourlyRate / projectSettings.exchangeRate;
    return ((clientRate - intRateInClientCurrency) / clientRate) * 100;
  };

  const insertWeekAfter = useCallback((afterWeekPosition: number) => {
    const newWeekNumbers = [...weekNumbers];
    newWeekNumbers.splice(afterWeekPosition, 0, 0);
    
    const renumberedWeeks = newWeekNumbers.map((_, index) => index + 1);
    
    setRowData(prevData => 
      prevData.map(row => {
        const newRow: ResourceRow = {
          id: row.id,
          role: row.role,
          name: row.name,
          intHourlyRate: row.intHourlyRate,
          clientHourlyRate: row.clientHourlyRate
        };
        
        renumberedWeeks.forEach((newWeekNum, index) => {
          if (index === afterWeekPosition) {
            newRow[`week${newWeekNum}`] = 0;
          } else if (index < afterWeekPosition) {
            const oldWeekNum = weekNumbers[index];
            newRow[`week${newWeekNum}`] = row[`week${oldWeekNum}`] || 0;
          } else {
            const oldWeekNum = weekNumbers[index - 1];
            newRow[`week${newWeekNum}`] = row[`week${oldWeekNum}`] || 0;
          }
        });
        
        return newRow;
      })
    );
    
    setWeekNumbers(renumberedWeeks);
  }, [weekNumbers]);

  const removeSpecificWeek = useCallback((weekToRemove: number) => {
    if (weekNumbers.length <= 1) return;
    
    const weekPosition = weekNumbers.findIndex(week => week === weekToRemove);
    if (weekPosition === -1) return;
    
    const newWeekNumbers = weekNumbers.filter(week => week !== weekToRemove);
    const renumberedWeeks = newWeekNumbers.map((_, index) => index + 1);
    
    setRowData(prevData => 
      prevData.map(row => {
        const newRow: ResourceRow = {
          id: row.id,
          role: row.role,
          name: row.name,
          intHourlyRate: row.intHourlyRate,
          clientHourlyRate: row.clientHourlyRate
        };
        
        renumberedWeeks.forEach((newWeekNum, index) => {
          const originalIndex = index < weekPosition ? index : index + 1;
          const oldWeekNum = weekNumbers[originalIndex];
          newRow[`week${newWeekNum}`] = row[`week${oldWeekNum}`] || 0;
        });
        
        return newRow;
      })
    );
    
    setWeekNumbers(renumberedWeeks);
  }, [weekNumbers]);

  const removeRole = useCallback((roleId: string) => {
    setRowData(prevData => prevData.filter(row => row.id !== roleId));
  }, []);

  const columnDefs = useMemo(() => {
    // Actions column - moved to first position
    const actionsColumn = {
      headerName: 'Actions',
      width: 80,
      pinned: 'left',
      cellRenderer: ActionsCellRenderer,
      sortable: false,
      filter: false
    };

    const baseColumns = [
      {
        headerName: 'Role',
        field: 'role',
        width: 200,
        pinned: 'left',
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: resources.map(r => r.role)
        },
        onCellValueChanged: (params: any) => {
          const selectedResource = resources.find(r => r.role === params.newValue);
          if (selectedResource) {
            params.node.setDataValue('intHourlyRate', selectedResource.intRate);
            params.node.setDataValue('name', selectedResource.name || '');
          }
        }
      },
      {
        headerName: 'Name',
        field: 'name',
        width: 150,
        pinned: 'left',
        editable: true
      },
      {
        headerName: 'Int hourly rate, $/h',
        field: 'intHourlyRate',
        width: 140,
        editable: true,
        valueFormatter: (params: any) => `$${params.value.toFixed(2)}`
      },
      {
        headerName: 'Int daily rate, $',
        width: 120,
        valueGetter: (params: any) => params.data.intHourlyRate * 8,
        valueFormatter: (params: any) => `$${params.value.toFixed(2)}`
      },
      {
        headerName: `Hourly rate (Client Rate)`,
        field: 'clientHourlyRate',
        width: 160,
        editable: true,
        valueFormatter: (params: any) => `${currencySymbol}${params.value.toFixed(2)}`
      },
      {
        headerName: `Daily rate (Client Rate)`,
        width: 150,
        valueGetter: (params: any) => params.data.clientHourlyRate * 8,
        valueFormatter: (params: any) => `${currencySymbol}${params.value.toFixed(2)}`
      },
      {
        headerName: 'Margin, per role',
        width: 130,
        valueGetter: (params: any) => calculateMargin(params.data),
        valueFormatter: (params: any) => `${params.value.toFixed(1)}%`
      }
    ];

    const weekColumns = weekNumbers.map((weekNum, index) => ({
      headerName: `${weekNum}`,
      field: `week${weekNum}`,
      width: 80,
      editable: true,
      filter: false,
      headerComponentParams: {
        template: `
          <div style="display: flex; align-items: center; justify-content: center; width: 100%; position: relative;">
            <button 
              onclick="insertWeekAfter(${index})" 
              style="
                position: absolute;
                left: -12px;
                background: #10b981; 
                color: white; 
                border: none; 
                border-radius: 50%; 
                width: 14px; 
                height: 14px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-size: 10px; 
                cursor: pointer; 
                z-index: 10;
                line-height: 1;
              "
              title="Insert week after position ${index}"
            >+</button>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>${weekNum}</span>
              ${weekNumbers.length > 1 ? `<button 
                onclick="removeWeek(${weekNum})" 
                style="
                  background: #ef4444; 
                  color: white; 
                  border: none; 
                  border-radius: 2px; 
                  width: 16px; 
                  height: 16px; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
                  font-size: 10px; 
                  cursor: pointer;
                "
              >×</button>` : ''}
            </div>
            ${index === weekNumbers.length - 1 ? `<button 
              onclick="insertWeekAfter(${index + 1})" 
              style="
                position: absolute;
                right: -12px;
                background: #10b981; 
                color: white; 
                border: none; 
                border-radius: 50%; 
                width: 14px; 
                height: 14px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-size: 10px; 
                cursor: pointer; 
                z-index: 10;
                line-height: 1;
              "
              title="Add week at end"
            >+</button>` : ''}
          </div>
        `
      },
      valueFormatter: (params: any) => `${params.value || 0}%`,
      valueSetter: (params: any) => {
        const value = parseInt(params.newValue) || 0;
        params.data[`week${weekNum}`] = Math.max(0, Math.min(100, value));
        return true;
      }
    }));

    const calculationColumns = [
      {
        headerName: 'Total int cost, $',
        width: 130,
        valueGetter: (params: any) => calculateTotalIntCost(params.data),
        valueFormatter: (params: any) => `$${params.value.toFixed(2)}`
      },
      {
        headerName: 'Total price',
        width: 120,
        valueGetter: (params: any) => calculateTotalPrice(params.data),
        valueFormatter: (params: any) => `${currencySymbol}${params.value.toFixed(2)}`
      },
      {
        headerName: 'Estimated efforts, h',
        width: 140,
        valueGetter: (params: any) => calculateEstimatedEfforts(params.data),
        valueFormatter: (params: any) => `${params.value.toFixed(1)}`
      }
    ];

    // Make functions globally available for the header buttons
    (window as any).removeWeek = removeSpecificWeek;
    (window as any).insertWeekAfter = insertWeekAfter;
    (window as any).removePlanRole = removeRole;

    return [actionsColumn, ...baseColumns, ...weekColumns, ...calculationColumns];
  }, [weekNumbers, currencySymbol, projectSettings.exchangeRate, removeSpecificWeek, insertWeekAfter, resources, removeRole]);

  const addWeek = useCallback(() => {
    const newWeekNumber = Math.max(...weekNumbers) + 1;
    setWeekNumbers(prev => [...prev, newWeekNumber]);
    setRowData(prevData => 
      prevData.map(row => ({
        ...row,
        [`week${newWeekNumber}`]: 0
      }))
    );
  }, [weekNumbers]);

  const addRole = useCallback(() => {
    const newRow: ResourceRow = {
      id: Date.now().toString(),
      role: '',
      name: '',
      intHourlyRate: 0,
      clientHourlyRate: 0
    };
    
    weekNumbers.forEach(weekNum => {
      newRow[`week${weekNum}`] = 0;
    });
    
    setRowData(prev => [...prev, newRow]);
  }, [weekNumbers]);

  const totals = useMemo(() => {
    const totalIntCost = rowData.reduce((sum, row) => sum + calculateTotalIntCost(row), 0);
    const totalPrice = rowData.reduce((sum, row) => sum + calculateTotalPrice(row), 0);
    const totalEfforts = rowData.reduce((sum, row) => sum + calculateEstimatedEfforts(row), 0);
    const calculatedMargin = totalPrice > 0 ? ((totalPrice - (totalIntCost / projectSettings.exchangeRate)) / totalPrice) * 100 : 0;
    
    return { totalIntCost, totalPrice, totalEfforts, calculatedMargin };
  }, [rowData, weekNumbers, projectSettings.exchangeRate]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="daysInFTE">Days in FTE/month</Label>
            <Input
              id="daysInFTE"
              type="number"
              value={projectSettings.daysInFTE}
              onChange={(e) => setProjectSettings(prev => ({ ...prev, daysInFTE: parseInt(e.target.value) || 20 }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientCurrency">Client currency</Label>
            <Select
              value={projectSettings.clientCurrency}
              onValueChange={(value) => setProjectSettings(prev => ({ ...prev, clientCurrency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="exchangeRate">USD-EUR Exchange rate</Label>
            <Input
              id="exchangeRate"
              type="number"
              step="0.01"
              value={projectSettings.exchangeRate}
              onChange={(e) => setProjectSettings(prev => ({ ...prev, exchangeRate: parseFloat(e.target.value) || 0.89 }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="projectMargin">Project Margin</Label>
            <Input
              id="projectMargin"
              value={`${totals.calculatedMargin.toFixed(0)}%`}
              readOnly
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <h2>Planning Table</h2>
          <div className="flex items-center gap-2">
            <Button onClick={addRole} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Role
            </Button>
            <Button onClick={addWeek} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Week at End
            </Button>
            <span className="text-sm text-muted-foreground">Weeks: {weekNumbers.length} | Roles: {rowData.length}</span>
          </div>
        </div>
        
        <div className="mb-2 text-sm text-muted-foreground">
          💡 Tips: Click the green <span className="inline-flex items-center justify-center w-4 h-4 bg-emerald-500 text-white rounded-full text-xs">+</span> buttons to insert weeks at specific positions, or the red × buttons to remove weeks or roles. Selecting a role will auto-populate the corresponding name and rate.
        </div>
        
        <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
          <AgGridReact
            theme="legacy"
            rowData={rowData}
            columnDefs={columnDefs}
            onCellValueChanged={() => {
              setRowData(prev => [...prev]);
            }}
            defaultColDef={{
              sortable: true,
              filter: false,
              resizable: true
            }}
          />
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Total Internal Cost</Label>
                <div className="text-lg">${totals.totalIntCost.toFixed(2)}</div>
              </div>
              <div>
                <Label>Total Price</Label>
                <div className="text-lg">{currencySymbol}{totals.totalPrice.toFixed(2)}</div>
              </div>
              <div>
                <Label>Total Estimated Efforts</Label>
                <div className="text-lg">{totals.totalEfforts.toFixed(1)}h</div>
              </div>
              <div>
                <Label>Calculated Project Margin</Label>
                <div className="text-lg">{totals.calculatedMargin.toFixed(1)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}