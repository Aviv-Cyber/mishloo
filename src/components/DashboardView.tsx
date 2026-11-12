import React, {useState, useMemo} from 'react';
import {Filter, Edit2, Trash2} from 'lucide-react';
import type {User, DeliveryRecord} from '../types';

interface DashboardViewProps {
    currentUser: User;
    users: User[];
    deliveries: DeliveryRecord[];
    onEditRecord: (record: DeliveryRecord) => void;
    onDeleteRecord: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
                                                                currentUser,
                                                                users,
                                                                deliveries,
                                                                onEditRecord,
                                                                onDeleteRecord,
                                                            }) => {
    const [filterUser, setFilterUser] = useState('all');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const filteredDeliveries = useMemo(() => {
        return deliveries.filter(d => {
            if (currentUser.role === 'courier' && d.userId !== currentUser.id) return false;
            if (currentUser.role === 'admin') {
                if (filterUser !== 'all' && d.userId !== filterUser) return false;
                if (filterStartDate && d.date < filterStartDate) return false;
                if (filterEndDate && d.date > filterEndDate) return false;
            }
            return true;
        }).sort((a, b) => b.date.localeCompare(a.date));
    }, [deliveries, currentUser, filterUser, filterStartDate, filterEndDate]);

    const totals = useMemo(() => {
        const count = filteredDeliveries.reduce((acc, curr) => acc + curr.deliveriesCount, 0);
        const km = filteredDeliveries.reduce((acc, curr) => acc + curr.totalKm, 0);
        const income = filteredDeliveries.reduce((acc, curr) => acc + curr.totalIncome, 0);
        return {count, km, income};
    }, [filteredDeliveries]);

    return (
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
                        <Filter className="w-4 h-4"/>
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
                            {users.map(u => (
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
                                                onClick={() => onEditRecord(d)}
                                                className="fb-icon-btn"
                                                title="ערוך"
                                            >
                                                <Edit2 className="w-4 h-4"/>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteRecord(d.id)}
                                                className="fb-icon-btn danger"
                                                title="מחק"
                                            >
                                                <Trash2 className="w-4 h-4"/>
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
    );
};