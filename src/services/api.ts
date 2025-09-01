const API_BASE_URL = 'http://localhost:3001/api';

// Types
export interface Project {
  id: number;
  name: string;
  description?: string;
  daysInFTE: number;
  clientCurrency: string;
  exchangeRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface RateCard {
  id: number;
  role: string;
  namingInPM: string;
  discipline: string;
  description?: string;
  ukraine: number;
  easternEurope: number;
  asiaGE: number;
  asiaARMKZ: number;
  latam: number;
  mexico: number;
  india: number;
  newYork: number;
  london: number;
  projectId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceList {
  id: number;
  role: string;
  clientRole?: string;
  name?: string;
  intRate: number;
  location?: string;
  description?: string;
  projectId: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyAllocation {
  id: number;
  weekNumber: number;
  allocation: number;
  resourcePlanId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResourcePlan {
  id: number;
  role: string;
  name?: string;
  intHourlyRate: number;
  clientHourlyRate: number;
  projectId: number;
  createdAt: string;
  updatedAt: string;
  weeklyAllocations: WeeklyAllocation[];
}

// API functions
export const api = {
  // Project endpoints
  async getProjects(): Promise<Project[]> {
    const response = await fetch(`${API_BASE_URL}/projects`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  },

  async getProject(id: number): Promise<Project & {
    rateCards: RateCard[];
    resourceLists: ResourceList[];
    resourcePlans: ResourcePlan[];
  }> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`);
    if (!response.ok) throw new Error('Failed to fetch project');
    return response.json();
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
  },

  async updateProject(id: number, data: Partial<Project>): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update project');
    return response.json();
  },

  // Rate Card endpoints
  async getRateCards(projectId: number): Promise<RateCard[]> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/rate-cards`);
    if (!response.ok) throw new Error('Failed to fetch rate cards');
    return response.json();
  },

  async createRateCard(projectId: number, data: Partial<RateCard>): Promise<RateCard> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/rate-cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to create rate card: ${errorData.details || errorData.error || response.statusText}`);
    }
    return response.json();
  },

  async createRateCardsBulk(projectId: number, data: Partial<RateCard>[]): Promise<{ message: string; count: number }> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/rate-cards/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to create bulk rate cards: ${errorData.details || errorData.error || response.statusText}`);
    }
    return response.json();
  },

  async updateRateCard(id: number, data: Partial<RateCard>): Promise<RateCard> {
    const response = await fetch(`${API_BASE_URL}/rate-cards/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update rate card');
    return response.json();
  },

  async deleteRateCard(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/rate-cards/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete rate card');
  },

  async deleteAllRateCards(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/rate-cards`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete rate cards');
    return response.json();
  },

  // Resource List endpoints
  async getResourceLists(projectId: number): Promise<ResourceList[]> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/resource-lists`);
    if (!response.ok) throw new Error('Failed to fetch resource lists');
    return response.json();
  },

  async createResourceList(projectId: number, data: Partial<ResourceList>): Promise<ResourceList> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/resource-lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create resource list');
    return response.json();
  },

  async updateResourceList(id: number, data: Partial<ResourceList>): Promise<ResourceList> {
    const response = await fetch(`${API_BASE_URL}/resource-lists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update resource list');
    return response.json();
  },

  async deleteResourceList(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/resource-lists/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete resource list');
  },

  // Resource Plan endpoints
  async getResourcePlans(projectId: number): Promise<ResourcePlan[]> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/resource-plans`);
    if (!response.ok) throw new Error('Failed to fetch resource plans');
    return response.json();
  },

  async createResourcePlan(projectId: number, data: Partial<ResourcePlan> & { weeklyAllocations?: Partial<WeeklyAllocation>[] }): Promise<ResourcePlan> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/resource-plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create resource plan');
    return response.json();
  },

  async updateResourcePlan(id: number, data: Partial<ResourcePlan> & { weeklyAllocations?: Partial<WeeklyAllocation>[] }): Promise<ResourcePlan> {
    const response = await fetch(`${API_BASE_URL}/resource-plans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.details || errorData.error || 'Failed to update resource plan';
      throw new Error(errorMessage);
    }
    return response.json();
  },

  async deleteResourcePlan(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/resource-plans/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete resource plan');
  },

  // Weekly Allocation endpoints
  async getWeeklyAllocations(resourcePlanId: number): Promise<WeeklyAllocation[]> {
    const response = await fetch(`${API_BASE_URL}/resource-plans/${resourcePlanId}/weekly-allocations`);
    if (!response.ok) throw new Error('Failed to fetch weekly allocations');
    return response.json();
  },

  async createWeeklyAllocation(resourcePlanId: number, data: Partial<WeeklyAllocation>): Promise<WeeklyAllocation> {
    const response = await fetch(`${API_BASE_URL}/resource-plans/${resourcePlanId}/weekly-allocations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create weekly allocation');
    return response.json();
  },

  async updateWeeklyAllocation(id: number, data: Partial<WeeklyAllocation>): Promise<WeeklyAllocation> {
    const response = await fetch(`${API_BASE_URL}/weekly-allocations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update weekly allocation');
    return response.json();
  },

  async deleteWeeklyAllocation(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/weekly-allocations/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete weekly allocation');
  },
};
