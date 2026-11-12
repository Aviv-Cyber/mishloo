import type {AppStore, GitHubConfig} from '../types';

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

export async function fetchGitHubStore(config: GitHubConfig): Promise<AppStore | null> {
    if (!config.token || !config.owner || !config.repo) return null;

    const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}`;
    const res = await fetch(apiUrl, {
        headers: {Authorization: `Bearer ${config.token}`}
    });

    if (!res.ok) throw new Error('הקובץ אינו קיים או שגיאת הרשאה');

    const fileData = (await res.json()) as { content?: string };
    if (!fileData.content) throw new Error('תוכן הקובץ ריק');

    const decoded = decodeBase64Utf8(fileData.content);
    const remoteStore = JSON.parse(decoded) as AppStore;

    return remoteStore && Array.isArray(remoteStore.users) ? remoteStore : null;
}

export async function saveGitHubStore(config: GitHubConfig, store: AppStore): Promise<void> {
    if (!config.token || !config.owner || !config.repo) return;

    const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}`;
    let sha: string | undefined;

    const getRes = await fetch(apiUrl, {
        headers: {Authorization: `Bearer ${config.token}`}
    });
    if (getRes.ok) {
        const fileData = (await getRes.json()) as { sha?: string };
        sha = fileData.sha;
    }

    const contentEnc = encodeBase64Utf8(JSON.stringify(store, null, 2));
    const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${config.token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: 'Sync delivery data via web dashboard [skip ci]',
            content: contentEnc,
            sha,
            branch: config.branch || 'main'
        })
    });

    if (!putRes.ok) {
        throw new Error('שגיאה בשמירה ל-GitHub (בדוק הרשאות ופרטים)');
    }
}