import React, {useState} from 'react';
import {ArrowRight, CheckCircle2} from 'lucide-react';
import type {User, DeliveryRecord} from '../types';

interface DeliveryWizardProps {
    currentUser: User;
    initialRecord: DeliveryRecord | null;
    onSave: (record: DeliveryRecord) => void;
    onCancel: () => void;
}

export const DeliveryWizard: React.FC<DeliveryWizardProps> = ({
                                                                  currentUser,
                                                                  initialRecord,
                                                                  onSave,
                                                                  onCancel,
                                                              }) => {
    const [wizardStep, setWizardStep] = useState(1);
    const [wDeliveries, setWDeliveries] = useState(initialRecord ? String(initialRecord.deliveriesCount) : '');
    const [wKm, setWKm] = useState(initialRecord ? String(initialRecord.totalKm) : '');
    const [wIncome, setWIncome] = useState(initialRecord ? String(initialRecord.totalIncome) : '');
    const [wNotes, setWNotes] = useState(initialRecord?.notes || '');

    return (
        <div className="fb-card-elevated p-6 max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E2E5E9]">
                <div>
                    <h2 className="font-bold text-lg text-[#080809]">
                        {initialRecord ? 'עריכת משלוחים' : 'הוספת משלוחים חדשה'}
                    </h2>
                    <p className="text-xs text-[#65686C]">שלב {wizardStep} מתוך 3</p>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
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
                            <ArrowRight className="w-4 h-4"/>
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
                            <ArrowRight className="w-4 h-4"/>
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
                                const record: DeliveryRecord = {
                                    id: initialRecord ? initialRecord.id : `rec-${Date.now()}`,
                                    userId: currentUser.id,
                                    userName: currentUser.name,
                                    date: initialRecord ? initialRecord.date : new Date().toISOString().split('T')[0],
                                    deliveriesCount: Number(wDeliveries),
                                    totalKm: Number(wKm),
                                    totalIncome: Number(wIncome),
                                    notes: wNotes,
                                };
                                onSave(record);
                            }}
                            className="fb-btn fb-btn-success px-6"
                        >
                            <CheckCircle2 className="w-4 h-4"/>
                            <span>שמור משמרת</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};