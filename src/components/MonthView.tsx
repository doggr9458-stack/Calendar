import React, { useState, useEffect } from 'react';
import { Staff, ShiftAssignment, Department } from '../types';
import { SHIFT_DICTIONARY } from '../data/staff';
import { THAI_DAYS_SHORT, THAI_DAYS_FULL, THAI_MONTHS, formatDateKey } from '../utils/scheduleCalculator';
import { User, Lock, Edit3, Calendar, AlertCircle, Smartphone, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  staffList: Staff[];
  schedule: Record<string, ShiftAssignment>;
  isAdmin: boolean;
  onSelectShift: (assignment: ShiftAssignment, staff: Staff) => void;
  onSelectDay: (date: Date) => void;
  selectedDept: Department | 'ALL';
  searchTerm: string;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  staffList,
  schedule,
  isAdmin,
  onSelectShift,
  onSelectDay,
  selectedDept,
  searchTerm,
}) => {
  const [selectedMobileDate, setSelectedMobileDate] = useState<number>(() => {
    const today = new Date();
    if (today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear()) {
      return today.getDate();
    }
    return currentDate.getDate() || 1;
  });

  // Keep selectedMobileDate synchronized whenever currentDate (month/year/day) changes
  useEffect(() => {
    const today = new Date();
    if (today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear()) {
      setSelectedMobileDate(today.getDate());
    } else {
      setSelectedMobileDate(currentDate.getDate() || 1);
    }
  }, [currentDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of month & total days in month
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Calculate day of week index for 1st day (0=Sunday -> convert to Mon=0...Sun=6)
  let startDayIndex = firstDayOfMonth.getDay() - 1; // 0=Mon, 1=Tue, ..., 6=Sun
  if (startDayIndex < 0) startDayIndex = 6; // Sunday becomes 6

  // Days from previous month to fill the first row
  const prevMonthDays = new Date(year, month, 0).getDate();

  const filteredStaff = staffList.filter((s) => {
    const matchesDept = selectedDept === 'ALL' || s.department === selectedDept;
    const matchesSearch =
      !searchTerm ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDept && matchesSearch;
  });

  // Calendar cells array (42 slots for 6 full weeks)
  const calendarCells = [];
  
  // Previous month padding
  for (let i = startDayIndex - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 1, prevMonthDays - i);
    calendarCells.push({ date: prevDate, isCurrentMonth: false });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const curDate = new Date(year, month, day);
    calendarCells.push({ date: curDate, isCurrentMonth: true });
  }

  // Next month padding to complete grid
  const remaining = 42 - calendarCells.length;
  for (let day = 1; day <= remaining; day++) {
    const nextDate = new Date(year, month + 1, day);
    calendarCells.push({ date: nextDate, isCurrentMonth: false });
  }

  const todayStr = formatDateKey(new Date());

  // Mobile selected date calculation
  const activeMobileDate = new Date(year, month, Math.min(selectedMobileDate, daysInMonth));
  const activeMobileDateStr = formatDateKey(activeMobileDate);
  const activeMobileDayOfWeek = activeMobileDate.getDay();

  const activeMobileDailyAssignments = filteredStaff.map((s) => {
    const key = `${activeMobileDateStr}-${s.id}`;
    const assignment = schedule[key] || {
      id: key,
      date: activeMobileDateStr,
      staffId: s.id,
      shiftType: 'OFF',
      startTime: '-',
      endTime: '-',
      isOff: true,
    };
    return { staff: s, assignment };
  });

  const activeMobileWorking = activeMobileDailyAssignments.filter((a) => !a.assignment.isOff);
  const activeMobileOff = activeMobileDailyAssignments.filter((a) => a.assignment.isOff);

  const activeFixedOffNames = staffList
    .filter((s) => s.fixedOffDay === activeMobileDayOfWeek)
    .map((s) => s.name);

  return (
    <div className="space-y-4">
      {/* MOBILE AGENDA VIEW (Clean, Touch-Friendly, Highly Readable on Mobile) */}
      <div className="block md:hidden space-y-4">
        {/* Scrollable Day Selector Strip */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">เลือกวันที่ต้องการดู:</span>
              <span className="text-[11px] text-blue-600 font-bold">
                {THAI_DAYS_FULL[activeMobileDate.getDay()]}ที่ {activeMobileDate.getDate()} {THAI_MONTHS[activeMobileDate.getMonth()]} {activeMobileDate.getFullYear() + 543}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dNum) => {
                const dObj = new Date(year, month, dNum);
                const dKey = formatDateKey(dObj);
                const isSelected = dNum === activeMobileDate.getDate();
                const isTodayDate = dKey === todayStr;
                const dDayShort = THAI_DAYS_SHORT[dObj.getDay()];

                return (
                  <button
                    key={dNum}
                    onClick={() => setSelectedMobileDate(dNum)}
                    className={`flex flex-col items-center justify-center min-w-[46px] h-[52px] rounded-xl text-xs font-bold transition-all shrink-0 border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-105'
                        : isTodayDate
                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-black'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[10px] opacity-80 font-normal">{dDayShort}</span>
                    <span className="text-sm font-bold">{dNum}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Mobile Day Card Detail */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{THAI_DAYS_FULL[activeMobileDate.getDay()]}ที่ {activeMobileDate.getDate()}</span>
                  {activeMobileDateStr === todayStr && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                      วันนี้
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ทำงาน {activeMobileWorking.length} คน • หยุด {activeMobileOff.length} คน
                </p>
              </div>

              <button
                onClick={() => onSelectDay(activeMobileDate)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-blue-600 rounded-xl text-xs font-bold border border-slate-200 transition-all"
              >
                ดูรายละเอียดเต็ม
              </button>
            </div>

            {/* Working Staff Cards */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>พนักงานเข้ากะทำงาน ({activeMobileWorking.length} คน):</span>
              </h4>

              <div className="space-y-2">
                {activeMobileWorking.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">ไม่มีพนักงานทำงานวันนี้</p>
                ) : (
                  activeMobileWorking.map(({ staff, assignment }) => {
                    const shiftInfo = SHIFT_DICTIONARY[assignment.shiftType];
                    return (
                      <div
                        key={staff.id}
                        onClick={() => onSelectShift(assignment, staff)}
                        className={`p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between transition-all ${
                          isAdmin ? 'cursor-pointer hover:border-blue-300 active:scale-98' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-2xs ${staff.avatarColor}`}>
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{staff.name}</span>
                              <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-semibold">
                                {staff.department === 'BSM' ? staff.role : staff.department}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">{staff.role}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${shiftInfo.bgLight} ${shiftInfo.textColor} border border-slate-200/80`}>
                            {assignment.startTime} - {assignment.endTime}
                          </span>
                          {assignment.isCustomOverride && (
                            <div className="text-[10px] text-amber-600 font-bold mt-0.5">ปรับแต่งเอง</div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Off Staff Cards */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>พนักงานวันหยุด ({activeMobileOff.length} คน):</span>
              </h4>

              <div className="grid grid-cols-2 gap-2">
                {activeMobileOff.map(({ staff, assignment }) => (
                  <div
                    key={staff.id}
                    onClick={() => onSelectShift(assignment, staff)}
                    className={`p-2.5 rounded-xl border border-rose-200/80 bg-rose-50/60 flex items-center justify-between text-xs transition-all ${
                      isAdmin ? 'cursor-pointer hover:border-rose-300 active:scale-98' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{staff.name}</span>
                    </div>
                    <span className="text-rose-600 font-bold text-[11px] shrink-0">หยุด</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      {/* FULL MONTHLY GRID (Responsive Desktop View) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          {/* Table Day Headers (Mon - Sun) */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100/80 text-xs font-bold text-slate-800">
            {['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'].map((dayName, idx) => (
              <div
                key={dayName}
                className={`py-2.5 text-center border-r last:border-r-0 border-slate-200/80 ${
                  idx === 0 ? 'text-blue-700' : ''
                }`}
              >
                <span>{dayName}</span>
              </div>
            ))}
          </div>

          {/* Grid of Days */}
          <div className="grid grid-cols-7 auto-rows-fr">
            {calendarCells.map(({ date, isCurrentMonth }, cellIdx) => {
              const dateStr = formatDateKey(date);
              const isToday = dateStr === todayStr;
              const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon...

              // Get daily assignments for filtered staff
              const dailyAssignments = filteredStaff.map((s) => {
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
                return { staff: s, assignment };
              });

              // Fixed Off Staff list for this day
              const fixedOffStaffNames = staffList
                .filter((s) => s.fixedOffDay === dayOfWeek)
                .map((s) => s.name);

              const workingCount = dailyAssignments.filter((a) => !a.assignment.isOff).length;
              const offCount = dailyAssignments.filter((a) => a.assignment.isOff).length;

              return (
                <div
                  key={dateStr + cellIdx}
                  className={`min-h-[120px] sm:min-h-[140px] p-1.5 sm:p-2 border-r border-b border-slate-200/80 transition-colors flex flex-col justify-between ${
                    !isCurrentMonth ? 'bg-slate-50/60 opacity-40' : 'bg-white'
                  } ${isToday ? 'bg-blue-50/60 ring-2 ring-blue-500/40 z-10' : ''}`}
                >
                  {/* Cell Header */}
                  <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-100">
                    <button
                      onClick={() => onSelectDay(date)}
                      className={`text-xs font-bold rounded-lg px-1.5 sm:px-2 py-0.5 hover:bg-blue-100 transition-all ${
                        isToday
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-800'
                      }`}
                    >
                      {date.getDate()}
                    </button>

                    <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                      <span className="text-emerald-700 font-bold">{workingCount} มา</span>
                      <span>•</span>
                      <span className="text-rose-600">{offCount} หยุด</span>
                    </div>
                  </div>

                  {/* Staff Shifts List */}
                  <div className="space-y-1 overflow-y-auto max-h-[100px] sm:max-h-[110px] pr-0.5 scrollbar-thin">
                    {dailyAssignments.map(({ staff, assignment }) => {
                      const shiftInfo = SHIFT_DICTIONARY[assignment.shiftType];
                      const isOff = assignment.isOff;

                      return (
                        <div
                          key={assignment.id}
                          onClick={() => onSelectShift(assignment, staff)}
                          className={`px-1.5 py-1 rounded-md text-[11px] flex items-center justify-between gap-1 border transition-all ${
                            isAdmin ? 'cursor-pointer hover:scale-[1.02] hover:shadow-2xs' : 'cursor-default'
                          } ${
                            isOff
                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : `${shiftInfo.bgLight} border-slate-200/80 ${shiftInfo.textColor}`
                          }`}
                          title={
                            isAdmin
                              ? `คลิกเพื่อแก้ไขกะของ ${staff.name}`
                              : `${staff.name} (${staff.role}): ${isOff ? 'วันหยุด' : `${assignment.startTime} - ${assignment.endTime}`}`
                          }
                        >
                          <div className="flex items-center gap-1 min-w-0 truncate">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isOff ? 'bg-rose-500' : 'bg-blue-500'
                              }`}
                            />
                            <span className="font-bold truncate text-slate-800">{staff.name}</span>
                            {assignment.isCustomOverride && (
                              <span className="text-[9px] bg-amber-200 text-amber-900 px-1 rounded font-bold">
                                ปรับ
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] font-mono shrink-0 font-semibold">
                            {isOff ? (
                              <span className="text-rose-600 font-bold">หยุด</span>
                            ) : (
                              <span>{assignment.startTime}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
    </div>
  );
};

