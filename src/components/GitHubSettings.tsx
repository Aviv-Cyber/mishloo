import React, {useState} from 'react';
import {GitBranch} from 'lucide-react';
import type {GitHubConfig} from '../types';

interface GitHubSettingsProps {
    config: GitHubConfig;
    onSave: (config: GitHubConfig) => void;
    onCancel: () => void;
}

export const GitHubSettings: React.FC<GitHubSettingsProps> = ({config, onSave, onCancel}) => {
    const [form, setForm] = useState<GitHubConfig>(config);

    return (
        <div className="fb-card-elevated p-6 max-w-xl mx-auto">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E2E5E9]">
                <div className="w-10 h-10 bg-[#E7F3FF] text-[#0866FF] rounded-full flex items-center justify-center">
                    <GitBranch className="w-5 h-5"/>
                </div>
                <div>
                    <h2 className="font-bold text-lg text-[#080809]">חיבור ל-GitHub REST API</h2>
                    <p className="text-xs text-[#65686C]">שמירה וסנכרון ישיר מול הריפוזיטורי שלך</p>
                </div>
            </div>

            <form
                onSubmit={e => {
                    e.preventDefault();
                    onSave(form);
                }}
                className="space-y-4"
            >
                <div>
                    <label className="fb-label">שם משתמש / ארגון (Owner)</label>
                    <input
                        type="text"
                        value={form.owner}
                        onChange={e => setForm({...form, owner: e.target.value})}
                        placeholder="למשל: Aviv-Cyber"
                        required
                        className="fb-input"
                    />
                </div>

                <div>
                    <label className="fb-label">שם הריפוזיטורי (Repo)</label>
                    <input
                        type="text"
                        value={form.repo}
                        onChange={e => setForm({...form, repo: e.target.value})}
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
                            value={form.branch}
                            onChange={e => setForm({...form, branch: e.target.value})}
                            placeholder="main"
                            required
                            className="fb-input"
                        />
                    </div>
                    <div>
                        <label className="fb-label">נתיב לקובץ (Path)</label>
                        <input
                            type="text"
                            value={form.path}
                            onChange={e => setForm({...form, path: e.target.value})}
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
                        value={form.token}
                        onChange={e => setForm({...form, token: e.target.value})}
                        placeholder="github_pat_xxxxxxxxxxxx"
                        required
                        className="fb-input"
                    />
                    <p className="text-xs text-[#65686C] mt-1">נדרשת הרשאת Contents: Read & Write בהגדרות GitHub.</p>
                </div>

                <div className="flex gap-3 pt-4">
                    <button type="button" onClick={onCancel} className="fb-btn fb-btn-secondary w-1/2">
                        ביטול
                    </button>
                    <button type="submit" className="fb-btn fb-btn-primary w-1/2">
                        שמור וסנכרן
                    </button>
                </div>
            </form>
        </div>
    );
};