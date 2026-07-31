import React, { useState, useEffect } from 'react';
import { ShiftAssignment, ShiftType, Staff } from '../types';
import { SHIFT_DICTIONARY } from '../data/staff';
import { X, Clock, Calendar, Check, RotateCcw, AlertCircle } from 'lucide-react';
import { THAI_DAYS_FULL, THAI_MONTHS } from '../utils/scheduleCalculator';

interface ShiftEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: ShiftAssignment | null;
  staff: Staff | null;
  onSave: (updatedAssignment: ShiftAssignment) => void;
  onResetToAuto: () => void;
}

export const ShiftEditModal: React.FC<ShiftEditModalProps> = ({
  isOpen,
  onClose,
  assignment,
  staff,
  onSave,
  onResetToAuto,
}) => {
  const [selectedShiftType, setSelectedShiftType] = useState<ShiftType>(assignment?.shiftType || 'MORNING');
  const [startTime, setStartTime] = useState(assignment?.startTime || '10:00');
  const [endTime, setEndTime] = useState(assignment?.endTime || '19:00');
  const [isOff, setIsOff] = useState(assignment?.isOff || false);
  const [note, setNote] = useState(assignment?.note || '');

  useEffect(() => {
    if (assignment) {
      setSelectedShiftType(assignment.shiftType);
      setStartTime(assignment.startTime || '10:00');
      setEndTime(assignment.endTime || '19:00');
      setIsOff(assignment.isOff);
      setNote(assignment.note || '');
    }
  }, [assignment]);

  if (!isOpen || !assignment || !staff) return null;

  const handleSelectType = (type: ShiftType) => {
    setSelectedShiftType(type);
    const info = SHIFT_DICTIONARY[type];
    if (type === 'OFF') {
      setIsOff(true);
      setStartTime('-');
      setEndTime('-');
    } else {
      setIsOff(false);
      setStartTime(info.startTime);
      setEndTime(info.endTime);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...assignment,
      shiftType: selectedShiftType,
      startTime: isOff ? '-' : startTime,
      endTime: isOff ? '-' : endTime,
      isOff,
      isCustomOverride: true,
      note,
    });
    onClose();
  };

  // Format date header
  const dateObj = new Date(assignment.date);
  const dayName = THAI_DAYS_FULL[dateObj.getDay()];
  const dateNum = dateObj.getDate();
  const monthName = THAI_MONTHS[dateObj.getMonth()];
  const thaiYear = dateObj.getFullYear() + 543;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 max-w-lg w-full p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${staff.avatarColor}`}>
              {staff.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>แก้ไขกะงาน: {staff.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-normal">
                  {staff.role} ({staff.department})
                </span>
              </h2>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{dayName}ที่ {dateNum} {monthName} {thaiYear}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Quick Select Shift Type Badges */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              เลือกกะงาน
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['MORNING', 'BSM_REGULAR', 'MID', 'LATE', 'OFF', 'CUSTOM'] as ShiftType[]).map((type) => {
                const info = SHIFT_DICTIONARY[type];
                const isSelected = selectedShiftType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleSelectType(type)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20 font-semibold'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{info.label}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {type === 'OFF' ? 'วันหยุด' : `${info.startTime} - ${info.endTime}`}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Inputs if Not Off */}
          {!isOff && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  เวลาเข้างาน
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  เวลาเลิกงาน
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              หมายเหตุ / สาเหตุการเปลี่ยนกะ
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น สลับกะกับจิ๊บ, ลากิจ, เข้า OT 2 ชม."
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => {
                onResetToAuto();
                onClose();
              }}
              className="px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl flex items-center gap-1.5 transition-colors"
              title="คืนค่ากลับเป็นกฎการคำนวณอัตโนมัติ"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตเป็นกะตามกฎ</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-xs font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
