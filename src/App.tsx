import React, { useState } from 'react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { ResourcePlan } from './components/ResourcePlan';
import { ResourceList } from './components/ResourceList';
import { RateCard } from './components/RateCard';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface Resource {
  id: string;
  role: string;
  name?: string;
  intRate: number;
  description?: string;
}

const initialResources: Resource[] = [
  { id: '1', role: 'Application Development', name: 'John Smith', intRate: 25, description: 'General application development tasks' },
  { id: '2', role: 'Project Manager', name: 'Sarah Johnson', intRate: 27, description: 'Project coordination and management' },
  { id: '3', role: 'Frontend Engineer', name: 'Mike Chen', intRate: 25, description: 'Frontend development and UI implementation' },
  { id: '4', role: 'UX/UI Designer', name: 'Emily Davis', intRate: 20, description: 'User experience and interface design' },
  { id: '5', role: 'Senior Backend Engineer', name: 'David Wilson', intRate: 31, description: 'Senior-level backend development' },
  { id: '6', role: 'Senior Frontend Engineer', name: 'Lisa Anderson', intRate: 29, description: 'Senior-level frontend development' },
  { id: '7', role: 'Principal Frontend Engineer', name: 'Robert Taylor', intRate: 34, description: 'Principal-level frontend architecture' },
  { id: '8', role: 'QA Engineer', name: 'Jennifer Brown', intRate: 13, description: 'Quality assurance and testing' }
];

export default function App() {
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [activeTab, setActiveTab] = useState('resource-plan');

  const handleResourcesChange = (updatedResources: Resource[]) => {
    setResources(updatedResources);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1>Resource Planning Application</h1>
        <p className="text-muted-foreground">Manage your resources and plan project allocations</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resource-plan">Resource Plan</TabsTrigger>
          <TabsTrigger value="resource-list">Resource List</TabsTrigger>
          <TabsTrigger value="rate-card">Rate Card</TabsTrigger>
        </TabsList>
        
        <TabsContent value="resource-plan" className="mt-6">
          <ResourcePlan resources={resources} />
        </TabsContent>
        
        <TabsContent value="resource-list" className="mt-6">
          <ResourceList 
            resources={resources} 
            onResourcesChange={handleResourcesChange} 
          />
        </TabsContent>

        <TabsContent value="rate-card" className="mt-6">
          <RateCard resources={resources} />
        </TabsContent>
      </Tabs>
    </div>
  );
}