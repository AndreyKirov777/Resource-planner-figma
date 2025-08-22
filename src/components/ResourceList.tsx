import React, { useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface Resource {
  id: string;
  role: string;
  name?: string;
  intRate: number;
  description?: string;
}

interface ResourceListProps {
  resources: Resource[];
  onResourcesChange: (resources: Resource[]) => void;
}

// Custom cell renderer component for the Actions column
const ActionsCellRenderer = (props: any) => {
  const deleteResource = () => {
    if ((window as any).deleteResource) {
      (window as any).deleteResource(props.data.id);
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <button
        onClick={deleteResource}
        className="bg-red-500 hover:bg-red-600 text-white border-none rounded cursor-pointer px-2 py-1 text-xs"
        title="Delete resource"
      >
        Delete
      </button>
    </div>
  );
};

export function ResourceList({ resources, onResourcesChange }: ResourceListProps) {
  const [newRole, setNewRole] = useState('');
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const deleteResource = (id: string) => {
    const updatedResources = resources.filter(resource => resource.id !== id);
    onResourcesChange(updatedResources);
  };

  const columnDefs = useMemo(() => {
    // Actions column - moved to first position
    const actionsColumn = {
      headerName: 'Actions',
      width: 100,
      cellRenderer: ActionsCellRenderer,
      sortable: false,
      filter: false
    };

    const otherColumns = [
      {
        headerName: 'Role',
        field: 'role',
        width: 200,
        editable: true,
        onCellValueChanged: (params: any) => {
          const updatedResources = resources.map(resource =>
            resource.id === params.data.id
              ? { ...resource, role: params.newValue }
              : resource
          );
          onResourcesChange(updatedResources);
        }
      },
      {
        headerName: 'Name',
        field: 'name',
        width: 150,
        editable: true,
        onCellValueChanged: (params: any) => {
          const updatedResources = resources.map(resource =>
            resource.id === params.data.id
              ? { ...resource, name: params.newValue }
              : resource
          );
          onResourcesChange(updatedResources);
        }
      },
      {
        headerName: 'Internal Rate ($/h)',
        field: 'intRate',
        width: 150,
        editable: true,
        valueFormatter: (params: any) => `$${params.value.toFixed(2)}`,
        onCellValueChanged: (params: any) => {
          const updatedResources = resources.map(resource =>
            resource.id === params.data.id
              ? { ...resource, intRate: parseFloat(params.newValue) || 0 }
              : resource
          );
          onResourcesChange(updatedResources);
        }
      },
      {
        headerName: 'Daily Rate ($/day)',
        width: 140,
        valueGetter: (params: any) => params.data.intRate * 8,
        valueFormatter: (params: any) => `$${params.value.toFixed(2)}`
      },
      {
        headerName: 'Description',
        field: 'description',
        width: 250,
        editable: true,
        onCellValueChanged: (params: any) => {
          const updatedResources = resources.map(resource =>
            resource.id === params.data.id
              ? { ...resource, description: params.newValue }
              : resource
          );
          onResourcesChange(updatedResources);
        }
      }
    ];

    // Make delete function globally available for AG Grid buttons
    (window as any).deleteResource = deleteResource;

    return [actionsColumn, ...otherColumns];
  }, [resources, onResourcesChange]);

  const addResource = () => {
    if (!newRole.trim() || !newRate.trim()) return;
    
    const newResource: Resource = {
      id: Date.now().toString(),
      role: newRole.trim(),
      name: newName.trim() || undefined,
      intRate: parseFloat(newRate) || 0,
      description: newDescription.trim() || undefined
    };
    
    onResourcesChange([...resources, newResource]);
    setNewRole('');
    setNewName('');
    setNewRate('');
    setNewDescription('');
  };

  const totalResources = resources.length;
  const averageRate = resources.length > 0 
    ? resources.reduce((sum, r) => sum + r.intRate, 0) / resources.length 
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Resource</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newRole">Role Name</Label>
              <Input
                id="newRole"
                placeholder="e.g. Senior Developer"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newName">Name (Optional)</Label>
              <Input
                id="newName"
                placeholder="e.g. John Smith"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newRate">Internal Rate ($/h)</Label>
              <Input
                id="newRate"
                type="number"
                placeholder="25.00"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newDescription">Description (Optional)</Label>
              <Input
                id="newDescription"
                placeholder="Brief description of role"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={addResource} disabled={!newRole.trim() || !newRate.trim()}>
            <Plus className="h-4 w-4 mr-1" />
            Add Resource
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resource List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="ag-theme-alpine" style={{ height: '500px', width: '100%' }}>
            <AgGridReact
              theme="legacy"
              rowData={resources}
              columnDefs={columnDefs}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Total Resources</Label>
              <div className="text-lg">{totalResources}</div>
            </div>
            <div>
              <Label>Average Rate</Label>
              <div className="text-lg">${averageRate.toFixed(2)}/h</div>
            </div>
            <div>
              <Label>Average Daily Rate</Label>
              <div className="text-lg">${(averageRate * 8).toFixed(2)}/day</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}