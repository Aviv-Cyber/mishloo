import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Shield, User as UserIcon } from 'lucide-react';
import type { User } from '../types';

interface EntitiesViewProps {
  users: User[];
  currentUserId: string;
  onUpdateUsers: (updater: (users: User[]) => User[]) => void;
}

type VehicleType = User['vehicleType'];

export const EntitiesView: React.FC<EntitiesViewProps> = ({
  users,
  currentUserId,
  onUpdateUsers,
}) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'courier'>('courier');
  const [formVehicle, setFormVehicle] = useState<VehicleType>('רכב');
  const [formPhone, setFormPhone] = useState('');

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormRole('courier');
    setFormVehicle('רכב');
    setFormPhone('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormPassword('');
    setFormRole(user.role);
    setFormVehicle(user.vehicleType);
    setFormPhone(user.phone || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUsers((prevUsers: User[]) =>
        prevUsers.map(u =>
          u.id === editingUser.id
            ? {
                ...u,
                name: formName,
                username: formUsername,
                password: formPassword ? formPassword : u.password,
                role: formRole,
                vehicleType: formVehicle,
                phone: formPhone,
              }
            : u
        )
      );
    } else {
      const newUser: User = {
        id: 'user-' + Date.now(),
        name: formName,
        username: formUsername,
        password: formPassword || '123456',
        role: formRole,
        vehicleType: formVehicle,
        phone: formPhone,
        active: true,
      };
      onUpdateUsers((prevUsers: User[]) => [...prevUsers, newUser]);
    }
    setIsModalOpen(false);
  };

  const toggleActive = (id: string) => {
    onUpdateUsers((prevUsers: User[]) =>
      prevUsers.map(u => (u.id === id ? { ...u, active: !u.active } : u))
    );
  };

  const deleteUser = (id: string) => {
    if (id === currentUserId) {
      alert('לא ניתן למחוק את המשתמש המחובר כעת');
      return;
    }
    if (confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) {
      onUpdateUsers((prevUsers: User[]) => prevUsers.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#080809]">ניהול משתמשים ושליחים</h2>
          <p className="text-sm text-[#65686C]">הוספה, עריכה והגדרת הרשאות למשתמשי המערכת</p>
        </div>
        <button type="button" onClick={handleOpenAdd} className="fb-btn fb-btn-primary">
          <Plus className="w-4 h-4" />
          <span>הוסף משתמש חדש</span>
        </button>
      </div>

      <div className="fb-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#F0F2F5] text-[#65686C] text-xs uppercase border-b border-[#E2E5E9]">
                <th className="p-3.5">שם מלא</th>
                <th className="p-3.5">שם משתמש</th>
                <th className="p-3.5">תפקיד</th>
                <th className="p-3.5">סוג כלי רכב</th>
                <th className="p-3.5">טלפון</th>
                <th className="p-3.5">סטטוס</th>
                <th className="p-3.5 text-center">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E5E9] text-sm">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-[#F0F2F5]/50 transition-colors">
                  <td className="p-3.5 font-semibold text-[#080809] flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#E7F3FF] text-[#0866FF] flex items-center justify-center font-bold text-xs">
                      {u.name.charAt(0)}
                    </div>
                    <span>{u.name}</span>
                  </td>
                  <td className="p-3.5 text-[#65686C]">{u.username}</td>
                  <td className="p-3.5">
                    {u.role === 'admin' ? (
                      <span className="fb-badge fb-badge-success inline-flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        <span>מנהל</span>
                      </span>
                    ) : (
                      <span className="fb-badge fb-badge-warning inline-flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        <span>שליח</span>
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-[#65686C]">{u.vehicleType}</td>
                  <td className="p-3.5 text-[#65686C]" dir="ltr">{u.phone || '-'}</td>
                  <td className="p-3.5">
                    <button
                      type="button"
                      onClick={() => toggleActive(u.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border-none cursor-pointer ${
                        u.active ? 'bg-[#E7F3FF] text-[#0866FF]' : 'bg-[#FFEBE8] text-[#FA383E]'
                      }`}
                    >
                      {u.active ? 'פעיל' : 'מושבת'}
                    </button>
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 text-[#65686C] hover:text-[#0866FF] bg-transparent border-none cursor-pointer"
                        title="ערוך"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {u.id !== currentUserId && (
                        <button
                          type="button"
                          onClick={() => deleteUser(u.id)}
                          className="p-1.5 text-[#65686C] hover:text-[#FA383E] bg-transparent border-none cursor-pointer"
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="fb-card-elevated max-w-md w-full p-6">
            <h3 className="font-bold text-lg mb-4 text-[#080809]">
              {editingUser ? 'עריכת משתמש' : 'הוספת משתמש חדש'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="fb-label">שם מלא</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  required
                  className="fb-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="fb-label">שם משתמש</label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value)}
                    required
                    className="fb-input"
                  />
                </div>
                <div>
                  <label className="fb-label">סיסמה</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    placeholder={editingUser ? 'השאר ריק ללא שינוי' : 'הכנס סיסמה'}
                    {...(!editingUser ? { required: true } : {})}
                    className="fb-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="fb-label">תפקיד במערכת</label>
                  <select
                    value={formRole}
                    onChange={e => setFormRole(e.target.value as 'admin' | 'courier')}
                    className="fb-input"
                  >
                    <option value="courier">שליח</option>
                    <option value="admin">מנהל מערכת</option>
                  </select>
                </div>
                <div>
                  <label className="fb-label">כלי רכב</label>
                  <select
                    value={formVehicle}
                    onChange={e => setFormVehicle(e.target.value as VehicleType)}
                    className="fb-input"
                  >
                    <option value="רכב">רכב</option>
                    <option value="אופנוע">אופנוע</option>
                    <option value="אופניים חשמליים">אופניים חשמליים</option>
                    <option value="קורקינט">קורקינט</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="fb-label">טלפון נייד</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  placeholder="050-0000000"
                  className="fb-input"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="fb-btn fb-btn-secondary w-1/2"
                >
                  ביטול
                </button>
                <button type="submit" className="fb-btn fb-btn-primary w-1/2">
                  שמור
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};