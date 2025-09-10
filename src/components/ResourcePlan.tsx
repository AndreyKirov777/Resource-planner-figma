import React, { useState, useMemo, useCallback, useEffect } from 'react';
import DataEditor, { GridCellKind, GridColumn, Item, EditableGridCell } from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
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
  onExportProject?: () => void;
  onImportProject?: () => void;
}

// Custom cell type for actions
interface ActionCell {
  kind: GridCellKind.Custom;
  data: { id: number; onRemove: () => void };
  allowOverlay: false;
  copyData: '';
}

// Custom cell type for role selection
interface RoleCell {
  kind: GridCellKind.Custom;
  data: { type: 'role-select'; value: string; options: string[] };
  allowOverlay: true;
  copyData: string;
  readonly?: boolean;
}

// Custom cell renderer for actions
const ActionCellRenderer = {
  isMatch: (cell: any): cell is ActionCell => cell.kind === GridCellKind.Custom && cell.data?.id !== undefined,
  draw: (args: any, cell: ActionCell) => {
    const { ctx, rect } = args;
    const { x, y, width, height } = rect;
    
    // Draw remove button
    const buttonSize = 20;
    const buttonX = x + (width - buttonSize) / 2;
    const buttonY = y + (height - buttonSize) / 2;
    
    // Button background
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(buttonX, buttonY, buttonSize, buttonSize);
    
    // Button text
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('×', buttonX + buttonSize / 2, buttonY + buttonSize / 2);
    
    return true;
  },
  provideEditor: () => undefined
};

// Custom cell renderer for role selection with dropdown editor
const RoleCellRenderer = {
  isMatch: (cell: any): cell is RoleCell => cell.kind === GridCellKind.Custom && cell.data?.type === 'role-select',
  draw: (args: any, cell: RoleCell) => {
    const { ctx, rect, theme } = args;
    const { x, y, width, height } = rect;

    // background
    ctx.fillStyle = (args as any).cell?.themeOverride?.bgCell ?? theme.bgCell;
    ctx.fillRect(x, y, width, height);

    // text
    ctx.fillStyle = theme.textDark;
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const label = cell.data.value || 'Select role...';
    ctx.fillText(label, x + 8, y + height / 2);

    return true;
  },
  provideEditor: (cell: RoleCell) => {
    const Editor = (p: any) => {
      const { onChange, onFinishedEditing, value } = p;
      const current = (value as RoleCell).data.value;
      const options = (value as RoleCell).data.options;

      return (
        <div style={{ padding: 8, minWidth: 220 }}>
          <Select
            value={current || ''}
            onValueChange={(val) => {
              const updated: RoleCell = {
                ...(value as RoleCell),
                data: { ...((value as RoleCell).data), value: val },
              };
              onChange(updated);
              onFinishedEditing(updated);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt: string) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    };
    return {
      editor: Editor,
      disablePadding: true,
    } as any;
  },
};

export function ResourcePlan({ 
  project, 
  resourceLists, 
  resourcePlans, 
  onResourcePlansChange, 
  onAddResourcePlan,
  onDeleteResourcePlan,
  onProjectSettingsChange,
  onExportProject,
  onImportProject
}: ResourcePlanProps) {
  const [weekNumbers, setWeekNumbers] = useState<number[]>([]);
  const [rolePicker, setRolePicker] = useState<{ open: boolean; row: number | null }>({ open: false, row: null });
  const [roleSelection, setRoleSelection] = useState<string>('');

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

  const currencySymbol = project.clientCurrency === 'EUR' ? '€' : 
                        project.clientCurrency === 'GBP' ? '£' : '$';

  // Calculation functions (reused from original)
  const calculateEstimatedEfforts = (plan: ResourcePlanType): number => {
    let totalWeeks = 0;
    weekNumbers.forEach(weekNum => {
      const allocation = plan.weeklyAllocations.find(wa => wa.weekNumber === weekNum);
      totalWeeks += (allocation?.allocation || 0) / 100;
    });
    return totalWeeks * 40; // 40 hours per week
  };

  const calculateTotalIntCost = (plan: ResourcePlanType): number => {
    const hours = calculateEstimatedEfforts(plan);
    return hours * plan.intHourlyRate;
  };

  const calculateTotalPrice = (plan: ResourcePlanType): number => {
    const hours = calculateEstimatedEfforts(plan);
    return hours * plan.clientHourlyRate;
  };

  const calculateMargin = (plan: ResourcePlanType): number | null => {
    const clientRate = plan.clientHourlyRate;
    const intRateInClientCurrency = plan.intHourlyRate * project.exchangeRate;
    
    if (!clientRate || clientRate <= 0 || !isFinite(clientRate)) {
      return null;
    }
    
    return ((clientRate - intRateInClientCurrency) / clientRate) * 100;
  };

  // Week management functions (reused from original)
  const insertWeekAfter = useCallback((afterWeekPosition: number) => {
    const newWeekNumbers = [...weekNumbers];
    newWeekNumbers.splice(afterWeekPosition, 0, 0);
    
    const renumberedWeeks = newWeekNumbers.map((_, index) => index + 1);
    
    const updatedResourcePlans = resourcePlans.map(plan => {
      const newWeeklyAllocations: WeeklyAllocation[] = [];
      
      renumberedWeeks.forEach((newWeekNum, index) => {
        if (index === afterWeekPosition) {
          newWeeklyAllocations.push({
            id: 0,
            weekNumber: newWeekNum,
            allocation: 0,
            resourcePlanId: plan.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as WeeklyAllocation);
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

  // Glide Data Grid column definitions
  const columns = useMemo((): GridColumn[] => {
    const cols: GridColumn[] = [
      { title: '', width: 60 }, // Actions column
      { title: 'Rate card role', width: 200 },
      { title: 'Client Role', width: 150 },
      { title: 'Name', width: 150 },
      { title: 'Hourly cost', width: 110 },
      { title: 'Daily cost', width: 100 },
      { title: 'Hourly rate', width: 110 },
      { title: 'Daily rate', width: 100 },
      { title: 'Margin', width: 100 },
    ];

    // Add week columns
    weekNumbers.forEach(weekNum => {
      cols.push({ title: `Week ${weekNum}`, width: 80 });
    });

    // Add calculation columns
    cols.push(
      { title: 'Total int cost', width: 130 },
      { title: 'Total price', width: 120 },
      { title: 'Efforts, h', width: 100 }
    );

    return cols;
  }, [weekNumbers]);

  // Get cell content function for glide-data-grid
  const getCellContent = useCallback(([col, row]: Item) => {
    const plan = resourcePlans[row];
    if (!plan) {
      return {
        kind: GridCellKind.Text,
        data: '',
        allowOverlay: false,
        displayData: '',
      };
    }

    const colIndex = col;
    let colOffset = 0;

    // Actions column
    if (colIndex === colOffset) {
      return {
        kind: GridCellKind.Custom,
        data: { id: plan.id, onRemove: () => removeRole(plan.id) },
        allowOverlay: false,
        copyData: '',
      } as ActionCell;
    }
    colOffset++;

    // Rate card role
    if (colIndex === colOffset) {
      const isValidRole = resourceLists.some(r => r.role === plan.role);
      return {
        kind: GridCellKind.Text,
        data: plan.role || '',
        allowOverlay: true,
        displayData: plan.role || 'Select role...',
        readonly: false,
      };
    }
    colOffset++;

    // Client Role
    if (colIndex === colOffset) {
      return {
        kind: GridCellKind.Text,
        data: plan.clientRole || '',
        allowOverlay: true,
        displayData: plan.clientRole || '',
        readonly: false,
      };
    }
    colOffset++;

    // Name
    if (colIndex === colOffset) {
      return {
        kind: GridCellKind.Text,
        data: plan.name || '',
        allowOverlay: true,
        displayData: plan.name || '',
        readonly: false,
      };
    }
    colOffset++;

    // Hourly cost
    if (colIndex === colOffset) {
      return {
        kind: GridCellKind.Number,
        data: plan.intHourlyRate,
        allowOverlay: true,
        displayData: `$${Math.round(plan.intHourlyRate)}`,
        readonly: false,
      };
    }
    colOffset++;

    // Daily cost
    if (colIndex === colOffset) {
      return {
        kind: GridCellKind.Text,
        data: `$${Math.round(plan.intHourlyRate * 8)}`,
        allowOverlay: false,
        displayData: `$${Math.round(plan.intHourlyRate * 8)}`,
      };
    }
    colOffset++;

    // Hourly rate
    if (colIndex === colOffset) {
      return {
        kind: GridCellKind.Number,
        data: plan.clientHourlyRate,
        allowOverlay: true,
        displayData: `${currencySymbol}${Math.round(plan.clientHourlyRate)}`,
        readonly: false,
      };
    }
    colOffset++;

    // Daily rate
    if (colIndex === colOffset) {
      return {
        kind: GridCellKind.Text,
        data: `${currencySymbol}${Math.round(plan.clientHourlyRate * 8)}`,
        allowOverlay: false,
        displayData: `${currencySymbol}${Math.round(plan.clientHourlyRate * 8)}`,
      };
    }
    colOffset++;

    // Margin
    if (colIndex === colOffset) {
      const margin = calculateMargin(plan);
      return {
        kind: GridCellKind.Text,
        data: margin === null ? '-' : `${margin.toFixed(1)}%`,
        allowOverlay: false,
        displayData: margin === null ? '-' : `${margin.toFixed(1)}%`,
      };
    }
    colOffset++;

    // Week columns
    for (let i = 0; i < weekNumbers.length; i++) {
      if (colIndex === colOffset + i) {
        const weekNum = weekNumbers[i];
        const allocation = plan.weeklyAllocations.find(wa => wa.weekNumber === weekNum);
        const value = allocation?.allocation || 0;
        return {
          kind: GridCellKind.Number,
          data: value,
          allowOverlay: true,
          displayData: `${value}%`,
          readonly: false,
        };
      }
    }
    colOffset += weekNumbers.length;

    // Total int cost
    if (colIndex === colOffset) {
      return {
        kind: GridCellKind.Text,
        data: `$${Math.round(calculateTotalIntCost(plan))}`,
        allowOverlay: false,
        displayData: `$${Math.round(calculateTotalIntCost(plan))}`,
      };
    }
    colOffset++;

    // Total price
    if (colIndex === colOffset) {
      return {
        kind: GridCellKind.Text,
        data: `${currencySymbol}${Math.round(calculateTotalPrice(plan))}`,
        allowOverlay: false,
        displayData: `${currencySymbol}${Math.round(calculateTotalPrice(plan))}`,
      };
    }
    colOffset++;

    // Efforts
    if (colIndex === colOffset) {
      return {
        kind: GridCellKind.Text,
        data: `${Math.round(calculateEstimatedEfforts(plan))}`,
        allowOverlay: false,
        displayData: `${Math.round(calculateEstimatedEfforts(plan))}`,
      };
    }

    return {
      kind: GridCellKind.Text,
      data: '',
      allowOverlay: false,
      displayData: '',
    };
  }, [resourcePlans, weekNumbers, currencySymbol, resourceLists, removeRole, project.exchangeRate]);

  // Handle cell editing
  const onCellEdited = useCallback((cell: Item, newValue: EditableGridCell) => {
    const [col, row] = cell;
    const plan = resourcePlans[row];
    if (!plan) return;

    const colIndex = col;
    let colOffset = 0;

    // Skip actions column
    colOffset++;

    // Rate card role
    if (colIndex === colOffset) {
      if (newValue.kind === GridCellKind.Text) {
        const newRole = newValue.data;
        const selectedResource = resourceLists.find(r => r.role === newRole);
        
        if (selectedResource) {
          const defaultMargin = project.defaultMargin || 25.0;
          const marginDecimal = defaultMargin / 100;
          const clientHourlyRateInUSD = selectedResource.intRate / (1 - marginDecimal);
          const clientHourlyRate = clientHourlyRateInUSD * project.exchangeRate;
          
          const updatedResourcePlans = resourcePlans.map(p =>
            p.id === plan.id
              ? { 
                  ...p, 
                  role: newRole,
                  intHourlyRate: selectedResource.intRate,
                  clientHourlyRate: clientHourlyRate,
                  name: selectedResource.name || '',
                  clientRole: selectedResource.clientRole || ''
                }
              : p
          );
          onResourcePlansChange(updatedResourcePlans);
        } else {
          const updatedResourcePlans = resourcePlans.map(p =>
            p.id === plan.id ? { ...p, role: newRole } : p
          );
          onResourcePlansChange(updatedResourcePlans);
        }
      }
      return;
    }
    colOffset++;

    // Client Role
    if (colIndex === colOffset) {
      if (newValue.kind === GridCellKind.Text) {
        const updatedResourcePlans = resourcePlans.map(p =>
          p.id === plan.id ? { ...p, clientRole: newValue.data } : p
        );
        onResourcePlansChange(updatedResourcePlans);
      }
      return;
    }
    colOffset++;

    // Name
    if (colIndex === colOffset) {
      if (newValue.kind === GridCellKind.Text) {
        const updatedResourcePlans = resourcePlans.map(p =>
          p.id === plan.id ? { ...p, name: newValue.data } : p
        );
        onResourcePlansChange(updatedResourcePlans);
      }
      return;
    }
    colOffset++;

    // Hourly cost
    if (colIndex === colOffset) {
      if (newValue.kind === GridCellKind.Number) {
        const updatedResourcePlans = resourcePlans.map(p =>
          p.id === plan.id ? { ...p, intHourlyRate: newValue.data || 0 } : p
        );
        onResourcePlansChange(updatedResourcePlans);
      }
      return;
    }
    colOffset++;

    // Skip daily cost (calculated)
    colOffset++;

    // Hourly rate
    if (colIndex === colOffset) {
      if (newValue.kind === GridCellKind.Number) {
        const updatedResourcePlans = resourcePlans.map(p =>
          p.id === plan.id ? { ...p, clientHourlyRate: newValue.data || 0 } : p
        );
        onResourcePlansChange(updatedResourcePlans);
      }
      return;
    }
    colOffset++;

    // Skip daily rate and margin (calculated)
    colOffset += 2;

    // Week columns
    for (let i = 0; i < weekNumbers.length; i++) {
      if (colIndex === colOffset + i) {
        if (newValue.kind === GridCellKind.Number) {
          const weekNum = weekNumbers[i];
          const clampedValue = Math.max(0, Math.min(100, newValue.data || 0));
          
          const updatedResourcePlans = resourcePlans.map(p => {
            if (p.id !== plan.id) return p;
            
            const existing = p.weeklyAllocations.find(wa => wa.weekNumber === weekNum);
            if (existing) {
              const updatedAllocations = p.weeklyAllocations.map(wa =>
                wa.weekNumber === weekNum
                  ? { ...wa, allocation: clampedValue, updatedAt: new Date().toISOString() }
                  : wa
              );
              return { ...p, weeklyAllocations: updatedAllocations };
            }
            
            const now = new Date().toISOString();
            const newAllocation = {
              id: 0,
              weekNumber: weekNum,
              allocation: clampedValue,
              resourcePlanId: p.id,
              createdAt: now,
              updatedAt: now,
            } as WeeklyAllocation;
            
            return { ...p, weeklyAllocations: [...p.weeklyAllocations, newAllocation] };
          });
          
          onResourcePlansChange(updatedResourcePlans);
        }
        return;
      }
    }
  }, [resourcePlans, weekNumbers, resourceLists, project.defaultMargin, project.exchangeRate, onResourcePlansChange]);

  // Helper functions (reused from original)
  const addWeek = useCallback(() => {
    const newWeekNumber = Math.max(...weekNumbers) + 1;
    setWeekNumbers(prev => [...prev, newWeekNumber]);
    
    const updatedResourcePlans = resourcePlans.map(plan => ({
      ...plan,
      weeklyAllocations: [
        ...plan.weeklyAllocations,
        {
          id: 0,
          weekNumber: newWeekNumber,
          allocation: 0,
          resourcePlanId: plan.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as WeeklyAllocation
      ]
    }));
    onResourcePlansChange(updatedResourcePlans);
  }, [weekNumbers, resourcePlans, onResourcePlansChange]);

  const addRole = useCallback(() => {
    const newResourcePlan: Partial<ResourcePlanType> = {
      role: '',
      clientRole: '',
      name: '',
      intHourlyRate: 0,
      clientHourlyRate: 0,
      weeklyAllocations: weekNumbers.map(weekNum => ({
        id: 0,
        weekNumber: weekNum,
        allocation: 0,
        resourcePlanId: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
    };
    
    onAddResourcePlan(newResourcePlan);
  }, [weekNumbers, onAddResourcePlan]);

  const validateRole = useCallback((role: string): boolean => {
    return resourceLists.some(r => r.role === role);
  }, [resourceLists]);

  const totals = useMemo(() => {
    const totalIntCost = resourcePlans.reduce((sum, plan) => sum + calculateTotalIntCost(plan), 0);
    const totalPrice = resourcePlans.reduce((sum, plan) => sum + calculateTotalPrice(plan), 0);
    const totalEfforts = resourcePlans.reduce((sum, plan) => sum + calculateEstimatedEfforts(plan), 0);
    const calculatedMargin = totalPrice > 0 ? ((totalPrice - (totalIntCost * project.exchangeRate)) / totalPrice) * 100 : 0;
    
    return { totalIntCost, totalPrice, totalEfforts, calculatedMargin };
  }, [resourcePlans, project.exchangeRate]);

  // Custom cells for actions - simplified implementation
  const customRenderers = [ActionCellRenderer];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="daysInFTE">Days in FTE/month</Label>
            <Input
              id="daysInFTE"
              type="number"
              value={project.daysInFTE}
              onChange={(e) => onProjectSettingsChange({ daysInFTE: parseInt(e.target.value) || 20 })}
            />
          </div>
          
          <div className="flex-1 space-y-2">
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
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 space-y-2">
            <Label htmlFor="exchangeRate">Exchange rate (to USD)</Label>
            <Input
              id="exchangeRate"
              type="number"
              step="0.01"
              value={project.exchangeRate}
              onChange={(e) => onProjectSettingsChange({ exchangeRate: parseFloat(e.target.value) || 0.89 })}
            />
          </div>
          
          <div className="flex-1 space-y-2">
            <Label htmlFor="defaultMargin">Default Margin</Label>
            <Input
              id="defaultMargin"
              type="text"
              value={`${Number.isFinite(project.defaultMargin as number) ? (project.defaultMargin as number).toFixed(0) : '50'}%`}
              onChange={(e) => {
                const numeric = e.target.value.replace(/[^0-9.]/g, '');
                const parsed = parseFloat(numeric);
                const clamped = isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed));
                onProjectSettingsChange({ defaultMargin: clamped });
              }}
            />
          </div>
          
          <div className="flex-1 space-y-2">
            <Label htmlFor="projectMargin">Estimated Margin</Label>
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
            {onExportProject && (
              <Button onClick={onExportProject} size="sm" variant="secondary">
                Export JSON
              </Button>
            )}
            {onImportProject && (
              <Button onClick={onImportProject} size="sm" variant="secondary">
                Import JSON
              </Button>
            )}
            <span className="text-sm text-muted-foreground">Weeks: {weekNumbers.length} | Roles: {resourcePlans.length}</span>
          </div>
        </div>
        
        <div className="mb-2 text-sm text-muted-foreground">
          💡 Tips: Click the gray <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-500 text-white rounded-full text-xs">+</span> buttons to insert weeks at specific positions, or the gray <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-500 text-white rounded-full text-xs">−</span> buttons to remove weeks or roles. 
          <br />
          <span className="text-green-600 font-medium">✨ Auto-calculation:</span> When selecting a role from the dropdown, the client hourly rate is automatically calculated using the Default Margin and Exchange Rate. If you type a custom role, ensure it exists in the Resource List tab first.
        </div>
        
        <div style={{ height: '600px', width: '100%' }}>
          <DataEditor
            getCellContent={getCellContent}
            columns={columns}
            rows={resourcePlans.length}
            onCellEdited={onCellEdited}
            onCellActivated={(cell) => {
              const [col, row] = cell;
              if (col === 0) { // Actions column
                const plan = resourcePlans[row];
                if (plan) {
                  removeRole(plan.id);
                }
              }
              // Rate Card role column (index 1)
              if (col === 1) {
                const plan = resourcePlans[row];
                if (plan) {
                  setRoleSelection(plan.role || '');
                  setRolePicker({ open: true, row });
                }
              }
            }}
            freezeColumns={4}
            rowMarkers="number"
            smoothScrollX={true}
            smoothScrollY={true}
            overscrollX={0}
            overscrollY={0}
            theme={{
              accentColor: "#8f4f8f",
              accentFg: "#ffffff",
              accentLight: "rgba(62, 116, 253, 0.1)",
              textDark: "#313131",
              textMedium: "#737373",
              textLight: "#b1b1b1",
              textBubble: "#313131",
              bgIconHeader: "#b1b1b1",
              fgIconHeader: "#717171",
              textHeader: "#4a4a4a",
              textHeaderSelected: "#000000",
              bgCell: "#ffffff",
              bgCellMedium: "#fafafa",
              bgHeader: "#f6f6f6",
              bgHeaderHasFocus: "#e1e1e1",
              bgHeaderHovered: "#eeeeee",
              bgBubble: "#ffffff",
              bgBubbleSelected: "#ffffff",
              bgSearchResult: "#fff9e3",
              borderColor: "rgba(115, 115, 115, 0.16)",
              drilldownBorder: "rgba(115, 115, 115, 0.2)",
              linkColor: "#4F46E5",
              headerFontStyle: "600 14px",
              baseFontStyle: "14px",
              fontFamily: "Inter, Roboto, -apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui, helvetica neue, helvetica, Ubuntu, noto, arial, sans-serif"
            }}
          />
        </div>

        {/* Role picker dialog */}
        <Dialog open={rolePicker.open} onOpenChange={(open) => setRolePicker(p => ({ ...p, open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Rate Card Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={roleSelection} onValueChange={setRoleSelection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  {resourceLists.map((r) => (
                    <SelectItem key={r.role} value={r.role}>{r.role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setRolePicker({ open: false, row: null })}>Cancel</Button>
              <Button
                onClick={() => {
                  const row = rolePicker.row;
                  if (row === null) { setRolePicker({ open: false, row: null }); return; }
                  const plan = resourcePlans[row];
                  if (!plan) { setRolePicker({ open: false, row: null }); return; }
                  const newRole = roleSelection;
                  const selectedResource = resourceLists.find(r => r.role === newRole);
                  if (selectedResource) {
                    const defaultMargin = project.defaultMargin || 25.0;
                    const marginDecimal = defaultMargin / 100;
                    const clientHourlyRateInUSD = selectedResource.intRate / (1 - marginDecimal);
                    const clientHourlyRate = clientHourlyRateInUSD * project.exchangeRate;
                    const updatedResourcePlans = resourcePlans.map(p =>
                      p.id === plan.id
                        ? {
                            ...p,
                            role: newRole,
                            intHourlyRate: selectedResource.intRate,
                            clientHourlyRate: clientHourlyRate,
                            name: selectedResource.name || '',
                            clientRole: selectedResource.clientRole || ''
                          }
                        : p
                    );
                    onResourcePlansChange(updatedResourcePlans);
                  } else {
                    const updatedResourcePlans = resourcePlans.map(p =>
                      p.id === plan.id ? { ...p, role: newRole } : p
                    );
                    onResourcePlansChange(updatedResourcePlans);
                  }
                  setRolePicker({ open: false, row: null });
                }}
              >
                Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Total Internal Cost</Label>
                <div className="text-lg">${Math.round(totals.totalIntCost)}</div>
              </div>
              <div>
                <Label>Total Price</Label>
                <div className="text-lg">{currencySymbol}{Math.round(totals.totalPrice)}</div>
              </div>
              <div>
                <Label>Total Estimated Efforts</Label>
                <div className="text-lg">{Math.round(totals.totalEfforts)}h</div>
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
