
import './App.css';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  LogOut,
  Truck,
  Plus,
  Trash2,
  Edit2,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Filter
} from 'lucide-react';


interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: 'admin' | 'courier';
  vehicleType: 'אופנוע' | 'רכב' | 'אופניים חשמליים' | 'קורקינט';
  phone: string;
  active: boolean;
}

interface DeliveryRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  deliveriesCount: number;
  totalKm: number;
  totalIncome: number;
  notes?: string;
}

interface AppStore {
  users: User[];
  deliveries: DeliveryRecord[];
}

interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  token: string;
}

const INITIAL_ADMIN: User = {
  id: 'admin-1',
  username: 'admin',
  password: 'admin1234',
  name: 'מנהל ראשי',
  role: 'admin',
  vehicleType: 'רכב',
  phone: '050-0000000',
  active: true,
};

function encodeBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binString = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binString += String.fromCharCode(bytes[i]);
  }
  return btoa(binString);
}

function decodeBase64Utf8(base64: string): string {
  const cleanBase64 = base64.replace(/\s/g, '');
  const binString = atob(cleanBase64);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export default function App() {
  const [store, setStore] = useState<AppStore>(() => {
    const saved = localStorage.getItem('unified_delivery_store');
    if (saved) {
      try {
        return JSON.parse(saved) as AppStore;
      } catch {
        // fallback
      }
    }
    return { users: [INITIAL_ADMIN], deliveries: [] };
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('current_delivery_user');
    if (saved) {
      try {
        return JSON.parse(saved) as User;
      } catch {
        // fallback
      }
    }
    return null;
  });

  const [githubConfig, setGithubConfig] = useState<GitHubConfig>(() => {
    const saved = localStorage.getItem('github_sync_config');
    if (saved) {
      try {
        return JSON.parse(saved) as GitHubConfig;
      } catch {
        // fallback
      }
    }
    return { owner: '', repo: '', branch: 'main', path: 'data.json', token: '' };
  });

  const [activeView, setActiveView] = useState<'dashboard' | 'wizard' | 'entities' | 'settings'>('dashboard');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  // Login form state
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Wizard form state
  const [wizardStep, setWizardStep] = useState(1);
  const [wDeliveries, setWDeliveries] = useState('');
  const [wKm, setWKm] = useState('');
  const [wIncome, setWIncome] = useState('');
  const [wNotes, setWNotes] = useState('');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // Filters state
  const [filterUser, setFilterUser] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Entity modal state
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<User | null>(null);
  const [entUsername, setEntUsername] = useState('');
  const [entPassword, setEntPassword] = useState('');
  const [entName, setEntName] = useState('');
  const [entRole, setEntRole] = useState<'admin' | 'courier'>('courier');
  const [entVehicle, setEntVehicle] = useState<'אופנוע' | 'רכב' | 'אופניים חשמליים' | 'קורקינט'>('אופנוע');
  const [entPhone, setEntPhone] = useState('');

  useEffect(() => {
    localStorage.setItem('unified_delivery_store', JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('current_delivery_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('current_delivery_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('github_sync_config', JSON.stringify(githubConfig));
  }, [githubConfig]);

  const pushToGitHub = useCallback(async (currentStore: AppStore) => {
    if (!githubConfig.token || !githubConfig.owner || !githubConfig.repo) return;
    setSyncStatus('syncing');
    setSyncMessage('מעדכן מול GitHub...');

    try {
      const apiUrl = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${githubConfig.path}`;
      let sha: string | undefined = undefined;
      const getRes = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${githubConfig.token}` }
      });
      if (getRes.ok) {
        const fileData = (await getRes.json()) as { sha?: string };
        sha = fileData.sha;
      }

      const contentEnc = encodeBase64Utf8(JSON.stringify(currentStore, null, 2));
      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${githubConfig.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Sync delivery data via web dashboard [skip ci]',
          content: contentEnc,
          sha,
          branch: githubConfig.branch || 'main'
        })
      });

      if (!putRes.ok) {
        setSyncStatus('error');
        setSyncMessage('שגיאה בשמירה ל-GitHub (בדוק הרשאות ופרטים)');
        return;
      }

      setSyncStatus('success');
      setSyncMessage('הנתונים סונכרנו בהצלחה ל-GitHub');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאת רשת בסנכרון';
      setSyncStatus('error');
      setSyncMessage(msg);
    }
  }, [githubConfig]);

  const pullFromGitHub = useCallback(async () => {
    if (!githubConfig.token || !githubConfig.owner || !githubConfig.repo) return;
    setSyncStatus('syncing');
    setSyncMessage('מושך נתונים מ-GitHub...');

    try {
      const apiUrl = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${githubConfig.path}`;
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${githubConfig.token}` }
      });

      if (!res.ok) {
        setSyncStatus('error');
        setSyncMessage('הקובץ אינו קיים או שגיאת הרשאה');
        return;
      }

      const fileData = (await res.json()) as { content?: string };
      if (!fileData.content) {
        setSyncStatus('error');
        setSyncMessage('תוכן הקובץ ריק');
        return;
      }

      const decoded = decodeBase64Utf8(fileData.content);
      const remoteStore = JSON.parse(decoded) as AppStore;

      if (remoteStore && Array.isArray(remoteStore.users)) {
        setStore(remoteStore);
        setSyncStatus('success');
        setSyncMessage('הנתונים עודכנו מ-GitHub בהצלחה');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאה במשיכת נתונים';
      setSyncStatus('error');
      setSyncMessage(msg);
    }
  }, [githubConfig]);

  useEffect(() => {
    let isMounted = true;
    const initSync = async () => {
      if (!githubConfig.token || !githubConfig.owner || !githubConfig.repo) return;
      try {
        const apiUrl = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${githubConfig.path}`;
        const res = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${githubConfig.token}` }
        });
        if (res.ok && isMounted) {
          const fileData = (await res.json()) as { content?: string };
          if (fileData.content) {
            const decoded = decodeBase64Utf8(fileData.content);
            const remoteStore = JSON.parse(decoded) as AppStore;
            if (remoteStore && Array.isArray(remoteStore.users)) {
              setStore(remoteStore);
            }
          }
        }
      } catch {
        // silent
      }
    };
    void initSync();
    return () => { isMounted = false; };
  }, [githubConfig.token, githubConfig.owner, githubConfig.repo, githubConfig.path]);

  const updateStoreAndSync = useCallback((updater: (prev: AppStore) => AppStore) => {
    setStore(prev => {
      const next = updater(prev);
      void pushToGitHub(next);
      return next;
    });
  }, [pushToGitHub]);

  const handleLogin = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');
    const found = store.users.find(u => u.username === loginUser && u.password === loginPass);
    if (found) {
      if (!found.active) {
        setLoginError('המשתמש הושבת על ידי המנהל');
        return;
      }
      setCurrentUser(found);
      setActiveView('dashboard');
    } else {
      setLoginError('שם משתמש או סיסמה שגויים');
    }
  };

  const filteredDeliveries = useMemo(() => {
    if (!currentUser) return [];
    return store.deliveries.filter(d => {
      if (currentUser.role === 'courier' && d.userId !== currentUser.id) return false;
      if (currentUser.role === 'admin') {
        if (filterUser !== 'all' && d.userId !== filterUser) return false;
        if (filterStartDate && d.date < filterStartDate) return false;
        if (filterEndDate && d.date > filterEndDate) return false;
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [store.deliveries, currentUser, filterUser, filterStartDate, filterEndDate]);

  const totals = useMemo(() => {
    const count = filteredDeliveries.reduce((acc, curr) => acc + curr.deliveriesCount, 0);
    const km = filteredDeliveries.reduce((acc, curr) => acc + curr.totalKm, 0);
    const income = filteredDeliveries.reduce((acc, curr) => acc + curr.totalIncome, 0);
    return { count, km, income };
  }, [filteredDeliveries]);

  // ============================================================================
  // Login Screen
  // ============================================================================
  if (!currentUser) {
    return (
      <div className="app-root flex items-center justify-center p-4">

        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0866FF] text-white shadow-md mb-3">
              <Truck className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#0866FF] tracking-tight">DeliveryPulse</h1>
            <p className="text-sm text-[#65686C] mt-1">התחבר למערכת ניהול המשלוחים והסנכרון</p>
          </div>

          <div className="fb-card-elevated p-6 sm:p-8">
            {loginError && (
              <div className="fb-alert-error mb-5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="fb-label">שם משתמש</label>
                <input
                  type="text"
                  value={loginUser}
                  onChange={e => setLoginUser(e.target.value)}
                  placeholder="הכנס שם משתמש"
                  required
                  className="fb-input pill"
                />
              </div>

              <div>
                <label className="fb-label">סיסמה</label>
                <input
                  type="password"
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  placeholder="הכנס סיסמה"
                  required
                  className="fb-input pill"
                />
              </div>

              <button type="submit" className="fb-btn fb-btn-primary w-full py-3 text-base mt-2">
                <span>התחבר למערכת</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-[#E2E5E9] text-center">
              <button
                type="button"
                onClick={() => {
                  setLoginUser('admin');
                  setLoginPass('admin1234');
                }}
                className="text-xs font-semibold text-[#0866FF] hover:underline bg-transparent border-none cursor-pointer"
              >
                מילוי מהיר: חשבון מנהל (admin)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Main Authenticated App
  // ============================================================================
  return (
    <div className="app-root pb-12">

      {/* Top Header */}
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
              onClick={() => void pullFromGitHub()}
              className="fb-btn fb-btn-secondary text-xs py-2 px-3"
              title="רענן מ-GitHub"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>סנכרן נתונים</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('settings')}
              className="fb-btn fb-btn-secondary text-xs py-2 px-3"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>הגדרות GitHub</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentUser(null)}
              className="fb-btn fb-btn-danger text-xs py-2 px-3"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>התנתק</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 mt-6">
        {/* Navigation Bar */}
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
                setEditingRecordId(null);
                setWDeliveries('');
                setWKm('');
                setWIncome('');
                setWNotes('');
                setWizardStep(1);
                setActiveView('wizard');
              }}
              className="fb-btn fb-btn-success mr-auto"
            >
              <Plus className="w-4 h-4" />
              <span>הוסף משמרת / משלוחים</span>
            </button>
          </div>
        )}

        {/* View: Settings */}
        {activeView === 'settings' && (
          <div className="fb-card-elevated p-6 max-w-xl mx-auto">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E2E5E9]">
              <div className="w-10 h-10 bg-[#E7F3FF] text-[#0866FF] rounded-full flex items-center justify-center">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-[#080809]">חיבור ל-GitHub REST API</h2>
                <p className="text-xs text-[#65686C]">שמירה וסנכרון ישיר מול הריפוזיטורי שלך</p>
              </div>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                setActiveView('dashboard');
                void pullFromGitHub();
              }}
              className="space-y-4"
            >
              <div>
                <label className="fb-label">שם משתמש / ארגון (Owner)</label>
                <input
                  type="text"
                  value={githubConfig.owner}
                  onChange={e => setGithubConfig({ ...githubConfig, owner: e.target.value })}
                  placeholder="למשל: Aviv-Cyber"
                  required
                  className="fb-input"
                />
              </div>

              <div>
                <label className="fb-label">שם הריפוזיטורי (Repo)</label>
                <input
                  type="text"
                  value={githubConfig.repo}
                  onChange={e => setGithubConfig({ ...githubConfig, repo: e.target.value })}
                  placeholder="למשל: mishlow"
                  required
                  className="fb-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="fb-label">ענף (Branch)</label>
                  <input
                    type="text"
                    value={githubConfig.branch}
                    onChange={e => setGithubConfig({ ...githubConfig, branch: e.target.value })}
                    placeholder="main"
                    required
                    className="fb-input"
                  />
                </div>
                <div>
                  <label className="fb-label">נתיב לקובץ (Path)</label>
                  <input
                    type="text"
                    value={githubConfig.path}
                    onChange={e => setGithubConfig({ ...githubConfig, path: e.target.value })}
                    placeholder="data.json"
                    required
                    className="fb-input"
                  />
                </div>
              </div>

              <div>
                <label className="fb-label">Personal Access Token</label>
                <input
                  type="password"
                  value={githubConfig.token}
                  onChange={e => setGithubConfig({ ...githubConfig, token: e.target.value })}
                  placeholder="github_pat_xxxxxxxxxxxx"
                  required
                  className="fb-input"
                />
                <p className="text-xs text-[#65686C] mt-1">נדרשת הרשאת Contents: Read & Write בהגדרות GitHub.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveView('dashboard')}
                  className="fb-btn fb-btn-secondary w-1/2"
                >
                  ביטול
                </button>
                <button type="submit" className="fb-btn fb-btn-primary w-1/2">
                  שמור וסנכרן
                </button>
              </div>
            </form>
          </div>
        )}

        {/* View: Entities */}
        {activeView === 'entities' && currentUser.role === 'admin' && (
          <div className="space-y-4">
            <div className="fb-card p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#080809]">ניהול ישויות ומשתמשים</h2>
                <p className="text-xs text-[#65686C]">הוספה וניהול של שליחים ומנהלים במערכת</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingEntity(null);
                  setEntUsername('');
                  setEntPassword('');
                  setEntName('');
                  setEntRole('courier');
                  setEntVehicle('אופנוע');
                  setEntPhone('');
                  setIsEntityModalOpen(true);
                }}
                className="fb-btn fb-btn-primary"
              >
                <Plus className="w-4 h-4" />
                <span>הוסף משתמש חדש</span>
              </button>
            </div>

            <div className="fb-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="fb-table">
                  <thead>
                    <tr>
                      <th>שם מלא</th>
                      <th>שם משתמש</th>
                      <th>תפקיד</th>
                      <th>כלי רכב</th>
                      <th>טלפון</th>
                      <th>סטטוס</th>
                      <th className="text-left">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {store.users.map(u => (
                      <tr key={u.id}>
                        <td className="font-semibold">{u.name}</td>
                        <td className="text-[#65686C] font-mono text-xs">{u.username}</td>
                        <td>
                          <span className={`fb-badge ${u.role === 'admin' ? 'fb-badge-primary' : 'fb-badge-warning'}`}>
                            {u.role === 'admin' ? 'מנהל' : 'שליח'}
                          </span>
                        </td>
                        <td>{u.vehicleType}</td>
                        <td className="font-mono text-xs">{u.phone}</td>
                        <td>
                          <span className={`fb-badge ${u.active ? 'fb-badge-success' : 'fb-badge-danger'}`}>
                            {u.active ? 'פעיל' : 'מושבת'}
                          </span>
                        </td>
                        <td className="text-left">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEntity(u);
                                setEntUsername(u.username);
                                setEntPassword(u.password || '');
                                setEntName(u.name);
                                setEntRole(u.role);
                                setEntVehicle(u.vehicleType);
                                setEntPhone(u.phone);
                                setIsEntityModalOpen(true);
                              }}
                              className="fb-icon-btn"
                              title="ערוך"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {u.id !== currentUser.id && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateStoreAndSync(prev => ({
                                    ...prev,
                                    users: prev.users.filter(item => item.id !== u.id)
                                  }));
                                }}
                                className="fb-icon-btn danger"
                                title="מחק"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* View: Wizard */}
        {activeView === 'wizard' && (
          <div className="fb-card-elevated p-6 max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E2E5E9]">
              <div>
                <h2 className="font-bold text-lg text-[#080809]">
                  {editingRecordId ? 'עריכת משלוחים' : 'הוספת משלוחים חדשה'}
                </h2>
                <p className="text-xs text-[#65686C]">שלב {wizardStep} מתוך 3</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('dashboard')}
                className="fb-btn fb-btn-secondary text-xs py-1.5 px-3"
              >
                ביטול
              </button>
            </div>

            {wizardStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="fb-label">כמה משלוחים בוצעו במשמרת זו?</label>
                  <input
                    type="number"
                    min="1"
                    value={wDeliveries}
                    onChange={e => setWDeliveries(e.target.value)}
                    placeholder="למשל: 12"
                    autoFocus
                    className="fb-input text-lg"
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (!wDeliveries || Number(wDeliveries) <= 0) return;
                      setWizardStep(2);
                    }}
                    disabled={!wDeliveries || Number(wDeliveries) <= 0}
                    className="fb-btn fb-btn-primary px-6"
                  >
                    <span>הבא</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="fb-label">מה סך הקילומטרז' שעברת במשמרת?</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={wKm}
                    onChange={e => setWKm(e.target.value)}
                    placeholder="למשל: 45.5"
                    autoFocus
                    className="fb-input text-lg"
                  />
                </div>
                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="fb-btn fb-btn-secondary px-6"
                  >
                    חזור
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!wKm || Number(wKm) < 0) return;
                      setWizardStep(3);
                    }}
                    disabled={!wKm || Number(wKm) < 0}
                    className="fb-btn fb-btn-primary px-6"
                  >
                    <span>הבא</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="fb-label">מה סך ההכנסה (ברוטו) מהמשמרת?</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={wIncome}
                    onChange={e => setWIncome(e.target.value)}
                    placeholder="למשל: 650"
                    autoFocus
                    className="fb-input text-lg"
                  />
                </div>
                <div>
                  <label className="fb-label">הערות נוספות (אופציונלי)</label>
                  <input
                    type="text"
                    value={wNotes}
                    onChange={e => setWNotes(e.target.value)}
                    placeholder="למשל: כולל בונוס ערב"
                    className="fb-input"
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="fb-btn fb-btn-secondary px-6"
                  >
                    חזור
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!wIncome || Number(wIncome) < 0) return;
                      const newRecord: DeliveryRecord = {
                        id: editingRecordId || `rec-${Date.now()}`,
                        userId: currentUser.id,
                        userName: currentUser.name,
                        date: new Date().toISOString().split('T')[0],
                        deliveriesCount: Number(wDeliveries),
                        totalKm: Number(wKm),
                        totalIncome: Number(wIncome),
                        notes: wNotes
                      };

                      updateStoreAndSync(prev => ({
                        ...prev,
                        deliveries: editingRecordId
                          ? prev.deliveries.map(r => r.id === editingRecordId ? newRecord : r)
                          : [newRecord, ...prev.deliveries]
                      }));

                      setActiveView('dashboard');
                    }}
                    className="fb-btn fb-btn-success px-6"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>שמור משמרת</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* View: Dashboard */}
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="fb-card p-5">
                <p className="text-xs font-semibold text-[#65686C]">סך משלוחים</p>
                <p className="text-3xl font-extrabold mt-2 text-[#0866FF]">{totals.count}</p>
              </div>
              <div className="fb-card p-5">
                <p className="text-xs font-semibold text-[#65686C]">סך קילומטרז'</p>
                <p className="text-3xl font-extrabold mt-2 text-[#080809]">{totals.km.toFixed(1)} ק"מ</p>
              </div>
              <div className="fb-card p-5">
                <p className="text-xs font-semibold text-[#65686C]">סך הכנסה</p>
                <p className="text-3xl font-extrabold mt-2 text-[#31A24C]">₪{totals.income.toFixed(2)}</p>
              </div>
            </div>

            {/* Filters (Admin only) */}
            {currentUser.role === 'admin' && (
              <div className="fb-card p-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-[#65686C] text-xs font-semibold">
                  <Filter className="w-4 h-4" />
                  <span>סינון נתונים:</span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-[#65686C]">שליח:</label>
                  <select
                    value={filterUser}
                    onChange={e => setFilterUser(e.target.value)}
                    className="fb-input py-1.5 px-3 text-xs w-auto"
                  >
                    <option value="all">כל השליחים</option>
                    {store.users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-[#65686C]">מתאריך:</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={e => setFilterStartDate(e.target.value)}
                    className="fb-input py-1.5 px-3 text-xs w-auto"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-[#65686C]">עד תאריך:</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={e => setFilterEndDate(e.target.value)}
                    className="fb-input py-1.5 px-3 text-xs w-auto"
                  />
                </div>

                {(filterUser !== 'all' || filterStartDate || filterEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterUser('all');
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                    className="text-xs font-semibold text-[#0866FF] hover:underline mr-auto bg-transparent border-none cursor-pointer"
                  >
                    איפוס סינון
                  </button>
                )}
              </div>
            )}

            {/* Records Table */}
            <div className="fb-card overflow-hidden">
              <div className="p-4 border-b border-[#E2E5E9] flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#080809]">היסטוריית משלוחים ומשמרות</h3>
                <span className="fb-badge fb-badge-primary">סה"כ {filteredDeliveries.length} רשומות</span>
              </div>

              <div className="overflow-x-auto">
                <table className="fb-table">
                  <thead>
                    <tr>
                      <th>תאריך</th>
                      <th>שליח</th>
                      <th>משלוחים</th>
                      <th>קילומטרז'</th>
                      <th>הכנסה</th>
                      <th>הערות</th>
                      <th className="text-left">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeliveries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-[#65686C] text-sm">
                          אין רשומות להצגה כרגע. לחץ על "הוסף משמרת / משלוחים" כדי להתחיל.
                        </td>
                      </tr>
                    ) : (
                      filteredDeliveries.map(d => (
                        <tr key={d.id}>
                          <td className="text-[#65686C] font-mono text-xs">{d.date}</td>
                          <td className="font-semibold">{d.userName}</td>
                          <td className="text-[#0866FF] font-bold">{d.deliveriesCount}</td>
                          <td>{d.totalKm} ק"מ</td>
                          <td className="text-[#31A24C] font-bold">₪{d.totalIncome.toFixed(2)}</td>
                          <td className="text-[#65686C] text-xs">{d.notes || '-'}</td>
                          <td className="text-left">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRecordId(d.id);
                                  setWDeliveries(String(d.deliveriesCount));
                                  setWKm(String(d.totalKm));
                                  setWIncome(String(d.totalIncome));
                                  setWNotes(d.notes || '');
                                  setWizardStep(1);
                                  setActiveView('wizard');
                                }}
                                className="fb-icon-btn"
                                title="ערוך"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateStoreAndSync(prev => ({
                                    ...prev,
                                    deliveries: prev.deliveries.filter(item => item.id !== d.id)
                                  }));
                                }}
                                className="fb-icon-btn danger"
                                title="מחק"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Entity Modal */}
      {isEntityModalOpen && (
        <div className="fb-modal-backdrop">
          <div className="fb-card-elevated p-6 w-full max-w-md">
            <h3 className="font-bold text-lg text-[#080809] mb-4 pb-3 border-b border-[#E2E5E9]">
              {editingEntity ? 'עריכת משתמש / ישות' : 'הוספת משתמש חדש'}
            </h3>

            <form
              onSubmit={e => {
                e.preventDefault();
                const newUserObj: User = {
                  id: editingEntity ? editingEntity.id : `user-${Date.now()}`,
                  username: entUsername,
                  password: entPassword || editingEntity?.password || '123456',
                  name: entName,
                  role: entRole,
                  vehicleType: entVehicle,
                  phone: entPhone,
                  active: true
                };

                updateStoreAndSync(prev => ({
                  ...prev,
                  users: editingEntity
                    ? prev.users.map(u => u.id === editingEntity.id ? newUserObj : u)
                    : [...prev.users, newUserObj]
                }));

                setIsEntityModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="fb-label">שם מלא</label>
                <input
                  type="text"
                  value={entName}
                  onChange={e => setEntName(e.target.value)}
                  placeholder="למשל: ישראל ישראלי"
                  required
                  className="fb-input"
                />
              </div>

              <div>
                <label className="fb-label">שם משתמש להתחברות</label>
                <input
                  type="text"
                  value={entUsername}
                  onChange={e => setEntUsername(e.target.value)}
                  placeholder="למשל: israel"
                  required
                  className="fb-input"
                />
              </div>

              <div>
                <label className="fb-label">סיסמה</label>
                <input
                  type="text"
                  value={entPassword}
                  onChange={e => setEntPassword(e.target.value)}
                  placeholder={editingEntity ? 'השאר ריק או הזן סיסמה חדשה' : 'הזן סיסמה'}
                  required={!editingEntity}
                  className="fb-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="fb-label">תפקיד</label>
                  <select
                    value={entRole}
                    onChange={e => setEntRole(e.target.value as 'admin' | 'courier')}
                    className="fb-input"
                  >
                    <option value="courier">שליח</option>
                    <option value="admin">מנהל</option>
                  </select>
                </div>

                <div>
                  <label className="fb-label">כלי רכב</label>
                  <select
                    value={entVehicle}
                    onChange={e => setEntVehicle(e.target.value as 'אופנוע' | 'רכב' | 'אופניים חשמליים' | 'קורקינט')}
                    className="fb-input"
                  >
                    <option value="אופנוע">אופנוע</option>
                    <option value="רכב">רכב</option>
                    <option value="אופניים חשמליים">אופניים חשמליים</option>
                    <option value="קורקינט">קורקינט</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="fb-label">טלפון</label>
                <input
                  type="text"
                  value={entPhone}
                  onChange={e => setEntPhone(e.target.value)}
                  placeholder="050-0000000"
                  required
                  className="fb-input"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEntityModalOpen(false)}
                  className="fb-btn fb-btn-secondary w-1/2"
                >
                  ביטול
                </button>
                <button type="submit" className="fb-btn fb-btn-primary w-1/2">
                  שמור משתמש
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}