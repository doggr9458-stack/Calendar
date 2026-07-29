import React from 'react';
import { Staff, ShiftAssignment, Department } from '../types';
import { SHIFT_DICTIONARY } from '../data/staff';
import { THAI_DAYS_FULL, THAI_DAYS_SHORT, formatDateKey } from '../utils/scheduleCalculator';
import { User, Lock, Edit3, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface WeekViewMatrixProps {
  currentDate: Date;
  staffList: Staff[];
  schedule: Record<string, ShiftAssignment>;
  isAdmin: boolean;
  onSelectShift: (assignment: ShiftAssignment, staff: Staff) => void;
  selectedDept: Department | 'ALL';
  searchTerm: string;
}

export const WeekViewMatrix: React.FC<WeekViewMatrixProps> = ({
  currentDate,
  staffList,
  schedule,
  isAdmin,
  onSelectShift,
  selectedDept,
  searchTerm,
}) => {
  // Get start of the week (Monday) for currentDate
  const curr = new Date(currentDate);
  const dayOfWeek = curr.getDay(); // 0=Sun
  const distToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(curr);
  monday.setDate(curr.getDate() + distToMon);

  // Generate 7 days for the week (Mon -> Sun)
  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDays.push(d);
  }

  const departments: Department[] = ['BSM', 'PIA', 'MSC'];

  const filteredStaff = staffList.filter((s) => {
    const matchesDept = selectedDept === 'ALL' || s.department === selectedDept;
    const matchesSearch =
      !searchTerm ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const todayStr = formatDateKey(new Date());

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden space-y-2">
      {/* Scroll indicator for mobile */}
      <div className="md:hidden px-3 py-1.5 bg-blue-50 border-b border-blue-100 text-[11px] text-blue-700 font-semibold flex items-center justify-between">
        <span>👈 เลื่อนตารางซ้าย-ขวาเพื่อดูวันพฤหัสบดี-อาทิตย์ 👉</span>
        <span className="font-mono bg-blue-200/80 px-1.5 py-0.5 rounded text-[10px]">7 วัน</span>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left border-collapse min-w-[700px]">
          {/* Table Header: Staff Name Column + 7 Days Columns */}
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-xs text-slate-800">
              <th className="py-3 px-3 font-bold min-w-[170px] sm:min-w-[200px] border-r border-slate-200 sticky left-0 bg-slate-100 z-20 shadow-2xs">
                รายชื่อพนักงาน / แผนก
              </th>
              {weekDays.map((d) => {
                const dateStr = formatDateKey(d);
                const isToday = dateStr === todayStr;
                const dayName = THAI_DAYS_SHORT[d.getDay()];

                return (
                  <th
                    key={dateStr}
                    className={`py-3 px-2 sm:px-3 text-center border-r last:border-r-0 border-slate-200 font-bold min-w-[85px] sm:min-w-[100px] ${
                      isToday ? 'bg-blue-100 text-blue-900 font-black' : ''
                    }`}
                  >
                    <div className="text-[11px] text-slate-500 font-semibold">{dayName}</div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      {d.getDate()} / {d.getMonth() + 1}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 text-xs">
            {departments.map((dept) => {
              const deptStaff = filteredStaff.filter((s) => s.department === dept);
              if (deptStaff.length === 0) return null;

              return (
                <React.Fragment key={dept}>
                  {/* Department Group Subheader */}
                  <tr className="bg-slate-100/90 font-bold text-slate-800">
                    <td
                      colSpan={8}
                      className="py-2 px-3 sm:px-4 border-b border-slate-200 text-xs uppercase tracking-wider text-blue-700 bg-slate-100 sticky left-0 z-20"
                    >
                      แผนก {dept} ({deptStaff.length} คน)
                    </td>
                  </tr>

                  {/* Staff Rows */}
                  {deptStaff.map((staff) => (
                    <tr
                      key={staff.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* Staff Info Cell (Sticky on mobile scroll!) */}
                      <td className="py-2.5 px-3 sm:px-4 border-r border-slate-200 bg-white sticky left-0 z-20 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0 ${staff.avatarColor}`}>
                            {staff.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                              {staff.name}
                            </div>
                            <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                              {staff.role}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 7 Days Shift Cells */}
                      {weekDays.map((d) => {
                        const dateStr = formatDateKey(d);
                        const key = `${dateStr}-${staff.id}`;
                        const assignment = schedule[key] || {
                          id: key,
                          date: dateStr,
                          staffId: staff.id,
                          shiftType: 'OFF',
                          startTime: '-',
                          endTime: '-',
                          isOff: true,
                        };

                        const shiftInfo = SHIFT_DICTIONARY[assignment.shiftType];
                        const isOff = assignment.isOff;

                        return (
                          <td
                            key={dateStr}
                            onClick={() => onSelectShift(assignment, staff)}
                            className={`py-2 px-1.5 text-center border-r last:border-r-0 border-slate-200 align-middle ${
                              isAdmin ? 'cursor-pointer hover:bg-blue-50' : 'cursor-default'
                            }`}
                            title={
                              isAdmin
                                ? `คลิกเพื่อแก้ไขกะของ ${staff.name}`
                                : `${staff.name}: ${isOff ? 'วันหยุด' : `${assignment.startTime} - ${assignment.endTime}`}`
                            }
                          >
                            <div
                              className={`py-1.5 px-1.5 sm:px-2 rounded-xl border text-[11px] font-bold transition-all ${
                                isOff
                                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                                  : `${shiftInfo.bgLight} border-slate-200 ${shiftInfo.textColor}`
                              }`}
                            >
                              {isOff ? (
                                <span className="text-rose-600 font-bold">หยุด</span>
                              ) : (
                                <div className="space-y-0.5">
                                  <div className="font-mono text-[10px] sm:text-xs font-bold leading-none">
                                    {assignment.startTime}
                                  </div>
                                  <div className="text-[9px] opacity-75 leading-none">
                                    {assignment.endTime}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* Daily Coverage Summary Footer */}
          <tfoot>
            <tr className="bg-slate-100 font-bold text-xs text-slate-800 border-t-2 border-slate-200">
              <td className="py-2.5 px-3 sm:px-4 border-r border-slate-200 sticky left-0 bg-slate-100 z-20 shadow-2xs">
                สรุปกำลังพลรายวัน
              </td>
              {weekDays.map((d) => {
                const dateStr = formatDateKey(d);
                let working = 0;
                let off = 0;

                filteredStaff.forEach((s) => {
                  const key = `${dateStr}-${s.id}`;
                  const assignment = schedule[key];
                  if (assignment && !assignment.isOff) {
                    working++;
                  } else {
                    off++;
                  }
                });

                return (
                  <td key={dateStr} className="py-2 px-2 text-center border-r last:border-r-0 border-slate-200">
                    <div className="text-emerald-700 font-bold">{working} คนมา</div>
                    <div className="text-rose-600 text-[10px] font-semibold">{off} คนหยุด</div>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
