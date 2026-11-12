import React from 'react';
import { Truck, RefreshCw, CheckCircle2, AlertCircle, GitBranch, LogOut } from 'lucide-react';
import type { User, SyncStatus } from '../types';

interface HeaderProps {
  currentUser: User;
  syncStatus: SyncStatus;
  syncMessage: string;
  onSync: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  syncStatus,
  syncMessage,
  onSync,
  onOpenSettings,
  onLogout,
}) => {
  return (
    <header className="fb-header px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0866FF] text-white rounded-full flex items-center justify-center shadow-sm">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-[#080809] leading-tight">מערכת משלוחים</h1>
            <p className="text-xs text-[#65686C]">
              שלום, {currentUser.name} ({currentUser.role === 'admin' ? 'מנהל מערכת' : 'שליח'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          {syncStatus !== 'idle' && (
            <span className={`fb-badge ${
              syncStatus === 'syncing' ? 'fb-badge-warning' :
              syncStatus === 'success' ? 'fb-badge-success' : 'fb-badge-danger'
            }`}>
              {syncStatus === 'syncing' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {syncStatus === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {syncStatus === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
              <span>{syncMessage}</span>
            </span>
          )}

          <button
            type="button"
            onClick={onSync}
            className="fb-btn fb-btn-secondary text-xs py-2 px-3"
            title="רענן מ-GitHub"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>סנכרן נתונים</span>
          </button>

          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="fb-btn fb-btn-secondary text-xs py-2 px-3"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>הגדרות GitHub</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="fb-btn fb-btn-danger text-xs py-2 px-3"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>התנתק</span>
          </button>
        </div>
      </div>
    </header>
  );
};