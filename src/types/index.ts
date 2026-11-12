export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: 'admin' | 'courier';
  vehicleType: 'אופנוע' | 'רכב' | 'אופניים חשמליים' | 'קורקינט';
  phone: string;
  active: boolean;
}

export interface DeliveryRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  deliveriesCount: number;
  totalKm: number;
  totalIncome: number;
  notes?: string;
}

export interface AppStore {
  users: User[];
  deliveries: DeliveryRecord[];
}

export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  token: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';
export type ActiveView = 'dashboard' | 'wizard' | 'entities' | 'settings';