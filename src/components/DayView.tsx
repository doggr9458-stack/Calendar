import React from 'react';
import { Staff, ShiftAssignment, Department, ShiftType } from '../types';
import { SHIFT_DICTIONARY } from '../data/staff';
import { THAI_DAYS_FULL, THAI_MONTHS, formatDateKey } from '../utils/scheduleCalculator';
import { Sun, Sunset, Moon, Clock, ShieldAlert, Edit3, UserCheck, Coffee, ChevronLeft, ChevronRight } from 'lucide-react';

interface DayViewProps {
  currentDate: Date;
  staffList: Staff[];
  schedule: Record<string, ShiftAssignment>;
  isAdmin: boolean;
  onSelectShift: (assignment: ShiftAssignment, staff: Staff) => void;
  selectedDept: Department | 'ALL';
  onNavigateDay?: (date: Date) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  staffList,
  schedule,
  isAdmin,
  onSelectShift,
  selectedDept,
  onNavigateDay,
}) => {
  const dateStr = formatDateKey(currentDate);
  const dayName = THAI_DAYS_FULL[currentDate.getDay()];
  const dateNum = currentDate.getDate();
  const monthName = THAI_MONTHS[currentDate.getMonth()];
  const thaiYear = currentDate.getFullYear() + 543;

  const filteredStaff = staffList.filter(
    (s) => selectedDept === 'ALL' || s.department === selectedDept
  );

  // Group staff by shift type
  const shiftGroups: Record<ShiftType, { staff: Staff; assignment: ShiftAssignment }[]> = {
    MORNING: [],
    BSM_REGULAR: [],
    MID: [],
    LATE: [],
    OFF: [],
    CUSTOM: [],
  };

  filteredStaff.forEach((s) => {
    const key = `${dateStr}-${s.id}`;
    const assignment = schedule[key] || {
      id: key,
      date: dateStr,
      staffId: s.id,
      shiftType: 'OFF',
      startTime: '-',
      endTime: '-',
      isOff: true,
    };

    if (assignment.isOff) {
      shiftGroups.OFF.push({ staff: s, assignment });
    } else if (shiftGroups[assignment.shiftType]) {
      shiftGroups[assignment.shiftType].push({ staff: s, assignment });
    } else {
      shiftGroups.CUSTOM.push({ staff: s, assignment });
    }
  });

  const totalWorking = filteredStaff.length - shiftGroups.OFF.length;

  return (
    <div className="space-y-6">

      {/* Date Title Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium">
              ภาพรวมกะงานประจำวัน
            </span>
            {onNavigateDay && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const prev = new Date(currentDate);
                    prev.setDate(prev.getDate() - 1);
                    onNavigateDay(prev);
                  }}
                  className="px-2.5 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  title="วันก่อนหน้า"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>วันก่อนหน้า</span>
                </button>
                <button
                  onClick={() => {
                    const next = new Date(currentDate);
                    next.setDate(next.getDate() + 1);
                    onNavigateDay(next);
                  }}
                  className="px-2.5 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  title="วันถัดไป (สามารถเลื่อนดูจนถึงสิ้นเดือนได้)"
                >
                  <span>วันถัดไป</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          <h2 className="text-2xl font-black">
            {dayName}ที่ {dateNum} {monthName} {thaiYear}
          </h2>
          <p className="text-blue-100 text-xs mt-1">
            มีพนักงานปฏิบัติงานทั้งหมด {totalWorking} คน (หยุด {shiftGroups.OFF.length} คน)
          </p>
        </div>

        {/* Quick Shift Counter Cards */}
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl text-center border border-white/10">
            <div className="font-bold text-lg">{shiftGroups.MORNING.length}</div>
            <div className="text-[10px] text-blue-100">กะเช้า 10:00</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl text-center border border-white/10">
            <div className="font-bold text-lg">{shiftGroups.BSM_REGULAR.length}</div>
            <div className="text-[10px] text-blue-100">กะ BSM 11:00</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl text-center border border-white/10">
            <div className="font-bold text-lg">{shiftGroups.MID.length}</div>
            <div className="text-[10px] text-blue-100">กะเที่ยง 12:00</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl text-center border border-white/10">
            <div className="font-bold text-lg">{shiftGroups.LATE.length}</div>
            <div className="text-[10px] text-blue-100">กะบ่าย 13:00</div>
          </div>
        </div>
      </div>

      {/* Shift Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Morning Shift */}
        <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-blue-700 font-bold">
              <Sun className="w-5 h-5 text-amber-500" />
              <span>กะเช้า (10:00 - 19:00)</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              {shiftGroups.MORNING.length} คน
            </span>
          </div>

          <div className="space-y-2">
            {shiftGroups.MORNING.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 text-center">ไม่มีพนักงานเข้ากะนี้</p>
            ) : (
              shiftGroups.MORNING.map(({ staff, assignment }) => (
                <div
                  key={staff.id}
                  onClick={() => onSelectShift(assignment, staff)}
                  className={`p-3 rounded-xl border border-blue-100 bg-blue-50/60 flex items-center justify-between transition-all ${
                    isAdmin ? 'cursor-pointer hover:bg-blue-100/80 active:scale-98' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs ${staff.avatarColor}`}>
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{staff.name}</div>
                      <div className="text-xs text-slate-500">{staff.role}</div>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-blue-700">
                    10:00 - 19:00
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* BSM Regular Shift */}
        <div className="bg-white rounded-2xl p-5 border border-purple-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-purple-700 font-bold">
              <Clock className="w-5 h-5 text-purple-600" />
              <span>กะ BSM (11:00 - 20:00)</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
              {shiftGroups.BSM_REGULAR.length} คน
            </span>
          </div>

          <div className="space-y-2">
            {shiftGroups.BSM_REGULAR.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 text-center">ไม่มีพนักงานเข้ากะนี้</p>
            ) : (
              shiftGroups.BSM_REGULAR.map(({ staff, assignment }) => (
                <div
                  key={staff.id}
                  onClick={() => onSelectShift(assignment, staff)}
                  className={`p-3 rounded-xl border border-purple-100 bg-purple-50/60 flex items-center justify-between transition-all ${
                    isAdmin ? 'cursor-pointer hover:bg-purple-100/80 active:scale-98' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs ${staff.avatarColor}`}>
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{staff.name}</div>
                      <div className="text-xs text-slate-500">{staff.role}</div>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-purple-700">
                    11:00 - 20:00
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mid Shift */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-amber-800 font-bold">
              <Sunset className="w-5 h-5 text-amber-600" />
              <span>กะเที่ยง (12:00 - 21:00)</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              {shiftGroups.MID.length} คน
            </span>
          </div>

          <div className="space-y-2">
            {shiftGroups.MID.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 text-center">ไม่มีพนักงานเข้ากะนี้</p>
            ) : (
              shiftGroups.MID.map(({ staff, assignment }) => (
                <div
                  key={staff.id}
                  onClick={() => onSelectShift(assignment, staff)}
                  className={`p-3 rounded-xl border border-amber-100 bg-amber-50/60 flex items-center justify-between transition-all ${
                    isAdmin ? 'cursor-pointer hover:bg-amber-100/80 active:scale-98' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs ${staff.avatarColor}`}>
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{staff.name}</div>
                      <div className="text-xs text-slate-500">{staff.role}</div>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-800">
                    {assignment.startTime} - {assignment.endTime}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Late Shift */}
        <div className="bg-white rounded-2xl p-5 border border-indigo-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-indigo-700 font-bold">
              <Moon className="w-5 h-5 text-indigo-600" />
              <span>กะบ่าย (13:00 - 22:00)</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
              {shiftGroups.LATE.length} คน
            </span>
          </div>

          <div className="space-y-2">
            {shiftGroups.LATE.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 text-center">ไม่มีพนักงานเข้ากะนี้</p>
            ) : (
              shiftGroups.LATE.map(({ staff, assignment }) => (
                <div
                  key={staff.id}
                  onClick={() => onSelectShift(assignment, staff)}
                  className={`p-3 rounded-xl border border-indigo-100 bg-indigo-50/60 flex items-center justify-between transition-all ${
                    isAdmin ? 'cursor-pointer hover:bg-indigo-100/80 active:scale-98' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs ${staff.avatarColor}`}>
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{staff.name}</div>
                      <div className="text-xs text-slate-500">{staff.role}</div>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-indigo-700">
                    13:00 - 22:00
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Off Duty Section */}
        <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-xs md:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-rose-700 font-bold">
              <Coffee className="w-5 h-5 text-rose-600" />
              <span>พนักงานหยุดงานวันนี้ (Off)</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
              {shiftGroups.OFF.length} คน
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {shiftGroups.OFF.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 text-center col-span-2">วันนี้ไม่มีใครหยุด</p>
            ) : (
              shiftGroups.OFF.map(({ staff, assignment }) => (
                <div
                  key={staff.id}
                  onClick={() => onSelectShift(assignment, staff)}
                  className={`p-3 rounded-xl border border-rose-200 bg-rose-50/60 flex items-center justify-between transition-all ${
                    isAdmin ? 'cursor-pointer hover:bg-rose-100/80 active:scale-98' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs ${staff.avatarColor}`}>
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{staff.name}</div>
                      <div className="text-xs text-slate-500">{staff.role}</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">
                    {assignment.note || 'วันหยุด'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
