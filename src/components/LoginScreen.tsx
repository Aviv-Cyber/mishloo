import React, {useState} from 'react';
import {Truck, AlertCircle, ArrowRight} from 'lucide-react';
import type {User} from '../types';

interface LoginScreenProps {
    users: User[];
    onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({users, onLogin}) => {
    const [loginUser, setLoginUser] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [loginError, setLoginError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        const found = users.find(u => u.username === loginUser && u.password === loginPass);
        if (found) {
            if (!found.active) {
                setLoginError('המשתמש הושבת על ידי המנהל');
                return;
            }
            onLogin(found);
        } else {
            setLoginError('שם משתמש או סיסמה שגויים');
        }
    };

    return (
        <div className="app-root flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <div
                        className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0866FF] text-white shadow-md mb-3">
                        <Truck className="w-7 h-7"/>
                    </div>
                    <h1 className="text-3xl font-extrabold text-[#0866FF] tracking-tight">DeliveryPulse</h1>
                    <p className="text-sm text-[#65686C] mt-1">התחבר למערכת ניהול המשלוחים והסנכרון</p>
                </div>

                <div className="fb-card-elevated p-6 sm:p-8">
                    {loginError && (
                        <div className="fb-alert-error mb-5">
                            <AlertCircle className="w-4 h-4 shrink-0"/>
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
                            <ArrowRight className="w-4 h-4"/>
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
};