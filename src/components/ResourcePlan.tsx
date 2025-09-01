import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, X } from 'lucide-react';
import { Project, ResourceList as ResourceListType, ResourcePlan as ResourcePlanType, WeeklyAllocation } from '../services/api';

interface ResourcePlanProps {
  project: Project;
  resourceLists: ResourceListType[];
  resourcePlans: ResourcePlanType[];
  onResourcePlansChange: (resourcePlans: ResourcePlanType[]) => void;
  onAddResourcePlan: (resourcePlan: Partial<ResourcePlanType>) => void;
  onDeleteResourcePlan: (id: number) => void;
  onProjectSettingsChange: (settings: Partial<Project>) => void;
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

export function ResourcePlan({ 
  project, 
  resourceLists, 
  resourcePlans, 
  onResourcePlansChange, 
  onAddResourcePlan,
  onDeleteResourcePlan,
  onProjectSettingsChange 
}: ResourcePlanProps) {
  const [weekNumbers, setWeekNumbers] = useState<number[]>([]);

  // Initialize week numbers from existing resource plans
  useEffect(() => {
    const allWeekNumbers = new Set<number>();
    resourcePlans.forEach(plan => {
      plan.weeklyAllocations.forEach(allocation => {
        allWeekNumbers.add(allocation.weekNumber);
      });
    });
    const sortedWeekNumbers = Array.from(allWeekNumbers).sort((a, b) => a - b);
    setWeekNumbers(sortedWeekNumbers.length > 0 ? sortedWeekNumbers : [1, 2, 3, 4, 5, 6, 7, 8]);
  }, [resourcePlans]);

  const currencySymbol = project.clientCurrency === 'EUR' ? '€' : '$';

  // Convert resource plans to row data format for AG Grid
  const rowData = useMemo(() => {
    return resourcePlans.map(plan => {
      const row: any = {
        id: plan.id,
        role: plan.role,
        name: plan.name || '',
        intHourlyRate: plan.intHourlyRate,
        clientHourlyRate: plan.clientHourlyRate
      };

      // Add week allocations
      weekNumbers.forEach(weekNum => {
        const allocation = plan.weeklyAllocations.find(wa => wa.weekNumber === weekNum);
        row[`week${weekNum}`] = allocation?.allocation || 0;
      });

      return row;
    });
  }, [resourcePlans, weekNumbers]);

  const calculateEstimatedEfforts = (row: any): number => {
    let totalWeeks = 0;
    weekNumbers.forEach(weekNum => {
      totalWeeks += (row[`week${weekNum}`] || 0) / 100;
    });
    return totalWeeks * 40; // 40 hours per week
  };

  const calculateTotalIntCost = (row: any): number => {
    const hours = calculateEstimatedEfforts(row);
    return hours * row.intHourlyRate;
  };

  const calculateTotalPrice = (row: any): number => {
    const hours = calculateEstimatedEfforts(row);
    return hours * row.clientHourlyRate;
  };

  const calculateMargin = (row: any): number | null => {
    const clientRate = row.clientHourlyRate;
    const intRateInClientCurrency = row.intHourlyRate / project.exchangeRate;
    
    // Return null if client rate is zero or invalid (can't calculate margin)
    if (!clientRate || clientRate <= 0 || !isFinite(clientRate)) {
      return null;
    }
    
    return ((clientRate - intRateInClientCurrency) / clientRate) * 100;
  };

  const insertWeekAfter = useCallback((afterWeekPosition: number) => {
    const newWeekNumbers = [...weekNumbers];
    newWeekNumbers.splice(afterWeekPosition, 0, 0);
    
    const renumberedWeeks = newWeekNumbers.map((_, index) => index + 1);
    
    // Update all resource plans with new week structure
    const updatedResourcePlans = resourcePlans.map(plan => {
      const newWeeklyAllocations: WeeklyAllocation[] = [];
      
      renumberedWeeks.forEach((newWeekNum, index) => {
        if (index === afterWeekPosition) {
          // New week with 0 allocation - create a temporary allocation
          newWeeklyAllocations.push({
            id: 0, // Temporary ID, will be replaced by database
            weekNumber: newWeekNum,
            allocation: 0,
            resourcePlanId: plan.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } else if (index < afterWeekPosition) {
          const oldWeekNum = weekNumbers[index];
          const existingAllocation = plan.weeklyAllocations.find(wa => wa.weekNumber === oldWeekNum);
          if (existingAllocation) {
            newWeeklyAllocations.push({
              ...existingAllocation,
              weekNumber: newWeekNum
            });
          }
        } else {
          const oldWeekNum = weekNumbers[index - 1];
          const existingAllocation = plan.weeklyAllocations.find(wa => wa.weekNumber === oldWeekNum);
          if (existingAllocation) {
            newWeeklyAllocations.push({
              ...existingAllocation,
              weekNumber: newWeekNum
            });
          }
        }
      });
      
      return {
        ...plan,
        weeklyAllocations: newWeeklyAllocations
      };
    });
    
    onResourcePlansChange(updatedResourcePlans);
    setWeekNumbers(renumberedWeeks);
  }, [weekNumbers, resourcePlans, onResourcePlansChange]);

  const removeSpecificWeek = useCallback((weekToRemove: number) => {
    if (weekNumbers.length <= 1) return;
    
    const weekPosition = weekNumbers.findIndex(week => week === weekToRemove);
    if (weekPosition === -1) return;
    
    const newWeekNumbers = weekNumbers.filter(week => week !== weekToRemove);
    const renumberedWeeks = newWeekNumbers.map((_, index) => index + 1);
    
    // Update all resource plans with new week structure
    const updatedResourcePlans = resourcePlans.map(plan => {
      const newWeeklyAllocations: WeeklyAllocation[] = [];
      
      renumberedWeeks.forEach((newWeekNum, index) => {
        const originalIndex = index < weekPosition ? index : index + 1;
        const oldWeekNum = weekNumbers[originalIndex];
        const existingAllocation = plan.weeklyAllocations.find(wa => wa.weekNumber === oldWeekNum);
        if (existingAllocation) {
          newWeeklyAllocations.push({
            ...existingAllocation,
            weekNumber: newWeekNum
          });
        }
      });
      
      return {
        ...plan,
        weeklyAllocations: newWeeklyAllocations
      };
    });
    
    onResourcePlansChange(updatedResourcePlans);
    setWeekNumbers(renumberedWeeks);
  }, [weekNumbers, resourcePlans, onResourcePlansChange]);

  const removeRole = useCallback((roleId: number) => {
    onDeleteResourcePlan(roleId);
  }, [onDeleteResourcePlan]);

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
          values: resourceLists.map(r => r.role)
        },
        valueGetter: (params: any) => params.data.role,
        valueSetter: (params: any) => {
          const newValue = params.newValue;
          
          // Update the cell data immediately for instant visual feedback
          params.data.role = newValue;
          
          // Find the selected resource to auto-populate other fields
          const selectedResource = resourceLists.find(r => r.role === newValue);
          if (selectedResource) {
            // Auto-populate fields from the selected resource
            params.data.intHourlyRate = selectedResource.intRate;
            params.data.name = selectedResource.name || '';
            
            // Update the resource plan with all the new data
            const updatedResourcePlans = resourcePlans.map(plan =>
              plan.id === params.data.id
                ? { 
                    ...plan, 
                    role: newValue,
                    intHourlyRate: selectedResource.intRate,
                    name: selectedResource.name || ''
                  }
                : plan
            );
            onResourcePlansChange(updatedResourcePlans);
          } else {
            // If role doesn't exist in resourceLists, show a warning but still allow the update
            console.warn(`Role "${newValue}" not found in resource list. This may cause issues.`);
            
            // Update the resource plan with just the role field
            const updatedResourcePlans = resourcePlans.map(plan =>
              plan.id === params.data.id
                ? { ...plan, role: newValue }
                : plan
            );
            onResourcePlansChange(updatedResourcePlans);
          }
          
          return true; // Return true to indicate the value was set successfully
        },
        cellRenderer: (params: any) => {
          const role = params.value;
          const isValidRole = validateRole(role);
          
          return (
            <div className={`flex items-center gap-2 ${!isValidRole && role ? 'text-amber-600' : ''}`}>
              <span>{role || 'Select role...'}</span>
              {!isValidRole && role && (
                <span title="This role is not in the Resource List" className="text-xs bg-amber-100 text-amber-800 px-1 rounded">
                  ⚠️
                </span>
              )}
            </div>
          );
        }
      },
      {
        headerName: 'Name',
        field: 'name',
        width: 150,
        pinned: 'left',
        editable: true,
        valueSetter: (params: any) => {
          const newValue = params.newValue;
          
          // Update the cell data immediately for instant visual feedback
          params.data.name = newValue;
          
          // Update the resource plan
          const updatedResourcePlans = resourcePlans.map(plan =>
            plan.id === params.data.id
              ? { ...plan, name: newValue }
              : plan
          );
          onResourcePlansChange(updatedResourcePlans);
          
          return true;
        }
      },
      {
        headerName: 'Int hourly rate, $/h',
        field: 'intHourlyRate',
        width: 140,
        editable: true,
        valueFormatter: (params: any) => `$${params.value.toFixed(2)}`,
        valueSetter: (params: any) => {
          const newValue = parseFloat(params.newValue) || 0;
          
          // Update the cell data immediately for instant visual feedback
          params.data.intHourlyRate = newValue;
          
          // Update the resource plan
          const updatedResourcePlans = resourcePlans.map(plan =>
            plan.id === params.data.id
              ? { ...plan, intHourlyRate: newValue }
              : plan
          );
          onResourcePlansChange(updatedResourcePlans);
          
          return true;
        }
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
        valueFormatter: (params: any) => `${currencySymbol}${params.value.toFixed(2)}`,
        valueSetter: (params: any) => {
          const newValue = parseFloat(params.newValue) || 0;
          
          // Update the cell data immediately for instant visual feedback
          params.data.clientHourlyRate = newValue;
          
          // Update the resource plan
          const updatedResourcePlans = resourcePlans.map(plan =>
            plan.id === params.data.id
              ? { ...plan, clientHourlyRate: newValue }
              : plan
          );
          onResourcePlansChange(updatedResourcePlans);
          
          return true;
        }
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
        valueFormatter: (params: any) => {
          if (params.value === null || params.value === undefined) {
            return '-';
          }
          return `${params.value.toFixed(1)}%`;
        }
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
         const clampedValue = Math.max(0, Math.min(100, value));
         
         // Update the cell data immediately for instant visual feedback
         params.data[`week${weekNum}`] = clampedValue;
         
         // Update the weekly allocation in the database
         const updatedResourcePlans = resourcePlans.map(plan => {
           if (plan.id === params.data.id) {
             const updatedAllocations = plan.weeklyAllocations.map(wa =>
               wa.weekNumber === weekNum
                 ? { ...wa, allocation: clampedValue }
                 : wa
             );
             return { ...plan, weeklyAllocations: updatedAllocations };
           }
           return plan;
         });
         onResourcePlansChange(updatedResourcePlans);
         
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
  }, [weekNumbers, currencySymbol, project.exchangeRate, removeSpecificWeek, insertWeekAfter, resourceLists, removeRole, resourcePlans, onResourcePlansChange]);

  const addWeek = useCallback(() => {
    const newWeekNumber = Math.max(...weekNumbers) + 1;
    setWeekNumbers(prev => [...prev, newWeekNumber]);
    
    // Add the new week to all resource plans
    const updatedResourcePlans = resourcePlans.map(plan => ({
      ...plan,
      weeklyAllocations: [
        ...plan.weeklyAllocations,
        {
          id: 0, // Temporary ID, will be replaced by database
          weekNumber: newWeekNumber,
          allocation: 0,
          resourcePlanId: plan.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    }));
    onResourcePlansChange(updatedResourcePlans);
  }, [weekNumbers, resourcePlans, onResourcePlansChange]);

  const addRole = useCallback(() => {
    const newResourcePlan: Partial<ResourcePlanType> = {
      role: '',
      name: '',
      intHourlyRate: 0,
      clientHourlyRate: 0,
      weeklyAllocations: weekNumbers.map(weekNum => ({
        weekNumber: weekNum,
        allocation: 0
      }))
    };
    
    onAddResourcePlan(newResourcePlan);
  }, [weekNumbers, onAddResourcePlan]);

  // Helper function to validate if a role exists in resourceLists
  const validateRole = useCallback((role: string): boolean => {
    return resourceLists.some(r => r.role === role);
  }, [resourceLists]);

  const totals = useMemo(() => {
    const totalIntCost = rowData.reduce((sum, row) => sum + calculateTotalIntCost(row), 0);
    const totalPrice = rowData.reduce((sum, row) => sum + calculateTotalPrice(row), 0);
    const totalEfforts = rowData.reduce((sum, row) => sum + calculateEstimatedEfforts(row), 0);
    const calculatedMargin = totalPrice > 0 ? ((totalPrice - (totalIntCost / project.exchangeRate)) / totalPrice) * 100 : 0;
    
    return { totalIntCost, totalPrice, totalEfforts, calculatedMargin };
  }, [rowData, weekNumbers, project.exchangeRate]);

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
              value={project.daysInFTE}
              onChange={(e) => onProjectSettingsChange({ daysInFTE: parseInt(e.target.value) || 20 })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientCurrency">Client currency</Label>
            <Select
              value={project.clientCurrency}
              onValueChange={(value) => onProjectSettingsChange({ clientCurrency: value })}
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
              value={project.exchangeRate}
              onChange={(e) => onProjectSettingsChange({ exchangeRate: parseFloat(e.target.value) || 0.89 })}
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
          💡 Tips: Click the green <span className="inline-flex items-center justify-center w-4 h-4 bg-emerald-500 text-white rounded-full text-xs">+</span> buttons to insert weeks at specific positions, or the red × buttons to remove weeks or roles. 
          <br />
          <span className="text-amber-600 font-medium">⚠️ Important:</span> When selecting a role, choose from the dropdown to auto-populate name and rate. If you type a custom role, ensure it exists in the Resource List tab first.
        </div>
        
        <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
          <AgGridReact
            theme="legacy"
            rowData={rowData}
            columnDefs={columnDefs}
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