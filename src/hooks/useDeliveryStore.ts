import {useState, useEffect, useCallback, useRef} from 'react';
import type {AppStore, GitHubConfig, SyncStatus, User} from '../types';
import {fetchGitHubStore, saveGitHubStore} from '../services/githubService';

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

const DEFAULT_GITHUB_CONFIG: GitHubConfig = {
    owner: 'Aviv-Cyber',
    repo: 'mishloo',
    branch: 'main',
    path: 'public-data.json',
    token: '',
};

export function useDeliveryStore() {
    const [store, setStore] = useState<AppStore>(() => {
        try {
            const saved = localStorage.getItem('unified_delivery_store');
            return saved ? (JSON.parse(saved) as AppStore) : {users: [INITIAL_ADMIN], deliveries: []};
        } catch {
            return {users: [INITIAL_ADMIN], deliveries: []};
        }
    });

    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        try {
            const saved = localStorage.getItem('current_delivery_user');
            return saved ? (JSON.parse(saved) as User) : null;
        } catch {
            return null;
        }
    });

    const [githubConfig, setGithubConfig] = useState<GitHubConfig>(() => {
        try {
            const saved = localStorage.getItem('github_sync_config');
            if (saved) {
                const parsed = JSON.parse(saved) as GitHubConfig;
                return parsed.token ? parsed : DEFAULT_GITHUB_CONFIG;
            }
            return DEFAULT_GITHUB_CONFIG;
        } catch {
            return DEFAULT_GITHUB_CONFIG;
        }
    });

    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
    const [syncMessage, setSyncMessage] = useState('');

    useEffect(() => {
        localStorage.setItem('unified_delivery_store', JSON.stringify(store));
    }, [store]);

    useEffect(() => {
        if (currentUser) localStorage.setItem('current_delivery_user', JSON.stringify(currentUser));
        else localStorage.removeItem('current_delivery_user');
    }, [currentUser]);

    useEffect(() => {
        localStorage.setItem('github_sync_config', JSON.stringify(githubConfig));
    }, [githubConfig]);

    const pullFromGitHub = useCallback(async () => {
        if (!githubConfig.token || !githubConfig.owner || !githubConfig.repo) return;
        setSyncStatus('syncing');
        setSyncMessage('מושך נתונים מ-GitHub...');
        try {
            const remoteStore = await fetchGitHubStore(githubConfig);
            if (remoteStore) {
                setStore(remoteStore);
                setSyncStatus('success');
                setSyncMessage('הנתונים עודכנו מ-GitHub בהצלחה');
                setTimeout(() => setSyncStatus('idle'), 3000);
            }
        } catch (err) {
            setSyncStatus('error');
            setSyncMessage(err instanceof Error ? err.message : 'שגיאה במשיכת נתונים');
        }
    }, [githubConfig]);

    const updateStoreAndSync = useCallback((updater: (prev: AppStore) => AppStore) => {
        setStore(prev => {
            const next = updater(prev);
            if (githubConfig.token && githubConfig.owner && githubConfig.repo) {
                setSyncStatus('syncing');
                setSyncMessage('מעדכן מול GitHub...');
                saveGitHubStore(githubConfig, next)
                    .then(() => {
                        setSyncStatus('success');
                        setSyncMessage('הנתונים סונכרנו בהצלחה ל-GitHub');
                        setTimeout(() => setSyncStatus('idle'), 3000);
                    })
                    .catch(err => {
                        setSyncStatus('error');
                        setSyncMessage(err instanceof Error ? err.message : 'שגיאת רשת בסנכרון');
                    });
            }
            return next;
        });
    }, [githubConfig]);

    const hasFetchedRef = useRef(false);

    useEffect(() => {
        if (githubConfig.token && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            void pullFromGitHub();
        }
    }, [githubConfig.token, pullFromGitHub]);

    return {
        store,
        currentUser,
        setCurrentUser,
        githubConfig,
        setGithubConfig,
        syncStatus,
        syncMessage,
        pullFromGitHub,
        updateStoreAndSync,
    };
}