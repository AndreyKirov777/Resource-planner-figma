import React, { useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { ResourceList as ResourceListType } from '../services/api';

interface ResourceListProps {
  resourceLists: ResourceListType[];
  onResourceListsChange: (resources: ResourceListType[]) => void;
  onAddResourceList: (resource: Partial<ResourceListType>) => void;
  onDeleteResourceList: (id: number) => void;
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

export function ResourceList({ 
  resourceLists, 
  onResourceListsChange, 
  onAddResourceList,
  onDeleteResourceList 
}: ResourceListProps) {
  const [newRole, setNewRole] = useState('');
  const [newClientRole, setNewClientRole] = useState('');
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const deleteResource = (id: number) => {
    onDeleteResourceList(id);
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
          const updatedResources = resourceLists.map(resource =>
            resource.id === params.data.id
              ? { ...resource, role: params.newValue }
              : resource
          );
          onResourceListsChange(updatedResources);
        }
      },
      {
        headerName: 'Client Role',
        field: 'clientRole',
        width: 200,
        editable: true,
        onCellValueChanged: (params: any) => {
          const updatedResources = resourceLists.map(resource =>
            resource.id === params.data.id
              ? { ...resource, clientRole: params.newValue }
              : resource
          );
          onResourceListsChange(updatedResources);
        }
      },
      {
        headerName: 'Name',
        field: 'name',
        width: 150,
        editable: true,
        onCellValueChanged: (params: any) => {
          const updatedResources = resourceLists.map(resource =>
            resource.id === params.data.id
              ? { ...resource, name: params.newValue }
              : resource
          );
          onResourceListsChange(updatedResources);
        }
      },
      {
        headerName: 'Internal Rate ($/h)',
        field: 'intRate',
        width: 150,
        editable: true,
        valueFormatter: (params: any) => `$${params.value.toFixed(2)}`,
        onCellValueChanged: (params: any) => {
          const updatedResources = resourceLists.map(resource =>
            resource.id === params.data.id
              ? { ...resource, intRate: parseFloat(params.newValue) || 0 }
              : resource
          );
          onResourceListsChange(updatedResources);
        }
      },
      {
        headerName: 'Location',
        field: 'location',
        width: 120,
        editable: true,
        onCellValueChanged: (params: any) => {
          const updatedResources = resourceLists.map(resource =>
            resource.id === params.data.id
              ? { ...resource, location: params.newValue }
              : resource
          );
          onResourceListsChange(updatedResources);
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
          const updatedResources = resourceLists.map(resource =>
            resource.id === params.data.id
              ? { ...resource, description: params.newValue }
              : resource
          );
          onResourceListsChange(updatedResources);
        }
      }
    ];

    // Make delete function globally available for AG Grid buttons
    (window as any).deleteResource = deleteResource;

    return [actionsColumn, ...otherColumns];
  }, [resourceLists, onResourceListsChange, deleteResource]);

  const addResource = () => {
    if (!newRole.trim() || !newRate.trim()) return;
    
    const newResource: Partial<ResourceListType> = {
      role: newRole.trim(),
      clientRole: newClientRole.trim() || undefined,
      name: newName.trim() || undefined,
      intRate: parseFloat(newRate) || 0,
      location: newLocation.trim() || undefined,
      description: newDescription.trim() || undefined
    };
    
    onAddResourceList(newResource);
    setNewRole('');
    setNewClientRole('');
    setNewName('');
    setNewRate('');
    setNewDescription('');
    setNewLocation('');
  };

  const totalResources = resourceLists.length;
  const averageRate = resourceLists.length > 0 
    ? resourceLists.reduce((sum, r) => sum + r.intRate, 0) / resourceLists.length 
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Resource</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-40">
              <Label htmlFor="newRole" className="text-sm font-medium">Role Name</Label>
              <Input
                id="newRole"
                placeholder="e.g. Senior Developer"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1 min-w-40">
              <Label htmlFor="newClientRole" className="text-sm font-medium">Client Role</Label>
              <Input
                id="newClientRole"
                placeholder="e.g. Senior Developer"
                value={newClientRole}
                onChange={(e) => setNewClientRole(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1 min-w-32">
              <Label htmlFor="newName" className="text-sm font-medium">Name</Label>
              <Input
                id="newName"
                placeholder="e.g. John Smith"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="w-24">
              <Label htmlFor="newRate" className="text-sm font-medium">Rate ($/h)</Label>
              <Input
                id="newRate"
                type="number"
                placeholder="25.00"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="w-28">
              <Label htmlFor="newLocation" className="text-sm font-medium">Location</Label>
              <Input
                id="newLocation"
                placeholder="New York"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                maxLength={20}
                className="mt-1"
              />
            </div>
            <div className="flex-1 min-w-40">
              <Label htmlFor="newDescription" className="text-sm font-medium">Description</Label>
              <Input
                id="newDescription"
                placeholder="Brief description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={addResource} 
              disabled={!newRole.trim() || !newRate.trim()}
              className="mb-0"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
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
              rowData={resourceLists}
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