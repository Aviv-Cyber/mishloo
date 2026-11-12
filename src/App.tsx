import './App.css';
import { useState } from 'react';
import { Plus, TrendingUp, Users } from 'lucide-react';
import type { ActiveView, DeliveryRecord, User } from './types';
import { useDeliveryStore } from './hooks/useDeliveryStore';
import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { DeliveryWizard } from './components/DeliveryWizard';
import { EntitiesView } from './components/EntitiesView';
import { GitHubSettings } from './components/GitHubSettings';

export default function App() {
  const {
    store,
    currentUser,
    setCurrentUser,
    githubConfig,
    setGithubConfig,
    syncStatus,
    syncMessage,
    pullFromGitHub,
    updateStoreAndSync,
  } = useDeliveryStore();

  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [editingRecord, setEditingRecord] = useState<DeliveryRecord | null>(null);

  if (!currentUser) {
    return (
      <LoginScreen
        users={store.users}
        onLogin={(user: User, redirectToSettings?: boolean) => {
          setCurrentUser(user);
          setActiveView(redirectToSettings && user.role === 'admin' ? 'settings' : 'dashboard');
        }}
      />
    );
  }

  return (
    <div className="app-root pb-12">
      <Header
        currentUser={currentUser}
        syncStatus={syncStatus}
        syncMessage={syncMessage}
        onSync={() => void pullFromGitHub()}
        onOpenSettings={() => setActiveView('settings')}
        onLogout={() => setCurrentUser(null)}
      />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 mt-6">
        {activeView !== 'wizard' && (
          <div className="fb-card p-2 mb-6 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveView('dashboard')}
              className={`fb-nav-tab ${activeView === 'dashboard' ? 'active' : ''}`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>לוח בקרה ורשומות</span>
            </button>

            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={() => setActiveView('entities')}
                className={`fb-nav-tab ${activeView === 'entities' ? 'active' : ''}`}
              >
                <Users className="w-4 h-4" />
                <span>ניהול ישויות ומשתמשים</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setEditingRecord(null);
                setActiveView('wizard');
              }}
              className="fb-btn fb-btn-success mr-auto"
            >
              <Plus className="w-4 h-4" />
              <span>הוסף משמרת / משלוחים</span>
            </button>
          </div>
        )}

        {activeView === 'settings' && currentUser.role === 'admin' && (
          <GitHubSettings
            config={githubConfig}
            onSave={newCfg => {
              setGithubConfig(newCfg);
              setActiveView('dashboard');
            }}
            onCancel={() => setActiveView('dashboard')}
          />
        )}

        {activeView === 'entities' && currentUser.role === 'admin' && (
          <EntitiesView
            users={store.users}
            currentUserId={currentUser.id}
            onUpdateUsers={(updater: (users: User[]) => User[]) =>
              updateStoreAndSync(prev => ({ ...prev, users: updater(prev.users) }))
            }
          />
        )}

        {activeView === 'wizard' && (
          <DeliveryWizard
            currentUser={currentUser}
            initialRecord={editingRecord}
            onSave={(record: DeliveryRecord) => {
              updateStoreAndSync(prev => ({
                ...prev,
                deliveries: editingRecord
                  ? prev.deliveries.map(r => (r.id === editingRecord.id ? record : r))
                  : [record, ...prev.deliveries],
              }));
              setActiveView('dashboard');
            }}
            onCancel={() => setActiveView('dashboard')}
          />
        )}

        {activeView === 'dashboard' && (
          <DashboardView
            currentUser={currentUser}
            users={store.users}
            deliveries={store.deliveries}
            onEditRecord={record => {
              setEditingRecord(record);
              setActiveView('wizard');
            }}
            onDeleteRecord={id =>
              updateStoreAndSync(prev => ({
                ...prev,
                deliveries: prev.deliveries.filter(item => item.id !== id),
              }))
            }
          />
        )}
      </main>
    </div>
  );
}