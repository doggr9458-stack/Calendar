import React, { useState } from 'react';
import { Staff, ShiftAssignment } from '../types';
import { SHIFT_DICTIONARY } from '../data/staff';
import { THAI_DAYS_FULL, THAI_DAYS_SHORT, THAI_MONTHS, formatDateKey } from '../utils/scheduleCalculator';
import { User, Calendar, Copy, Check, Briefcase, Clock, ShieldCheck, Share2 } from 'lucide-react';

interface StaffIndividualViewProps {
  currentDate: Date;
  staffList: Staff[];
  schedule: Record<string, ShiftAssignment>;
  isAdmin: boolean;
  onSelectShift: (assignment: ShiftAssignment, staff: Staff) => void;
}

export const StaffIndividualView: React.FC<StaffIndividualViewProps> = ({
  currentDate,
  staffList,
  schedule,
  isAdmin,
  onSelectShift,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id || '');
  const [copied, setCopied] = useState(false);

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId) || staffList[0];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = THAI_MONTHS[month];
  const thaiYear = year + 543;

  if (!selectedStaff) return null;

  // Gather assignments for selected staff for the month
  const monthlyAssignments: { date: Date; assignment: ShiftAssignment }[] = [];
  let workingDays = 0;
  let offDays = 0;
  let morningCount = 0;
  let midCount = 0;
  let lateCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateStr = formatDateKey(d);
    const key = `${dateStr}-${selectedStaff.id}`;
    const assignment = schedule[key] || {
      id: key,
      date: dateStr,
      staffId: selectedStaff.id,
      shiftType: 'OFF',
      startTime: '-',
      endTime: '-',
      isOff: true,
    };

    monthlyAssignments.push({ date: d, assignment });

    if (assignment.isOff) {
      offDays++;
    } else {
      workingDays++;
      if (assignment.shiftType === 'MORNING' || assignment.shiftType === 'BSM_REGULAR') morningCount++;
      else if (assignment.shiftType === 'MID') midCount++;
      else if (assignment.shiftType === 'LATE') lateCount++;
    }
  }

  // Generate copyable text for LINE
  const handleCopyPersonalSchedule = () => {
    let text = `📅 ตารางงานพนักงาน: ${selectedStaff.name} (${selectedStaff.role})\n`;
    text += `ประจำเดือน: ${monthName} ${thaiYear}\n`;
    text += `-----------------------------------\n`;

    monthlyAssignments.forEach(({ date, assignment }) => {
      const dayNum = date.getDate();
      const dayName = THAI_DAYS_SHORT[date.getDay()];
      if (assignment.isOff) {
        text += `${dayNum} (${dayName}): 🔴 หยุด\n`;
      } else {
        text += `${dayNum} (${dayName}): 🟢 ${assignment.startTime} - ${assignment.endTime}\n`;
      }
    });

    text += `-----------------------------------\n`;
    text += `สรุป: ทำงาน ${workingDays} วัน | หยุด ${offDays} วัน`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fixedOffDayName = THAI_DAYS_FULL[selectedStaff.fixedOffDay];

  return (
    <div className="space-y-6">
      {/* Staff Selector Avatar Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <label className="block text-xs font-semibold text-slate-500 mb-2">
          เลือกพนักงานเพื่อดูตารางรายบุคคล:
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {staffList.map((s) => {
            const isSelected = s.id === selectedStaffId;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedStaffId(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium shrink-0 transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  isSelected ? 'bg-white text-blue-600' : `${s.avatarColor}`
                }`}>
                  {s.name.charAt(0)}
                </span>
                <span>{s.name}</span>
                <span className="text-[10px] opacity-75">({s.department})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Staff Profile Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-md ${selectedStaff.avatarColor}`}>
            {selectedStaff.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>{selectedStaff.name}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                แผนก {selectedStaff.department}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>{selectedStaff.role}</span>
              <span>•</span>
              <span className="text-rose-600 font-semibold">
                วันหยุดประจำสัปดาห์: {fixedOffDayName}
              </span>
            </p>
          </div>
        </div>

        {/* Stats & Copy Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl text-xs border border-slate-200">
            <div>
              <span className="text-slate-500">ทำงาน:</span>{' '}
              <span className="font-bold text-emerald-600">{workingDays} วัน</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <span className="text-slate-500">วันหยุด:</span>{' '}
              <span className="font-bold text-rose-600">{offDays} วัน</span>
            </div>
          </div>

          <button
            onClick={handleCopyPersonalSchedule}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'คัดลอกตารางแล้ว!' : 'คัดลอกส่ง LINE'}</span>
          </button>
        </div>
      </div>

      {/* Monthly Roster Grid for Selected Staff */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
          <span>ตารางงานเดือน {monthName} {thaiYear}</span>
          <span className="text-xs font-normal text-slate-500">
            คลิกที่ช่องเพื่อปรับแก้กะ (เฉพาะผู้ดูแลระบบ)
          </span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {monthlyAssignments.map(({ date, assignment }) => {
            const shiftInfo = SHIFT_DICTIONARY[assignment.shiftType];
            const isOff = assignment.isOff;
            const dayNum = date.getDate();
            const dayName = THAI_DAYS_SHORT[date.getDay()];

            return (
              <div
                key={assignment.id}
                onClick={() => onSelectShift(assignment, selectedStaff)}
                className={`p-3 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                  isAdmin ? 'cursor-pointer hover:ring-2 hover:ring-blue-500/40 hover:scale-[1.02]' : 'cursor-default'
                } ${
                  isOff
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : `${shiftInfo.bgLight} border-slate-200 ${shiftInfo.textColor}`
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">{dayNum}</span>
                  <span className="text-[10px] font-medium opacity-80">{dayName}</span>
                </div>

                <div className="font-bold font-mono text-[11px] mt-1">
                  {isOff ? (
                    <span className="text-rose-600">🔴 วันหยุด</span>
                  ) : (
                    <span>🟢 {assignment.startTime} - {assignment.endTime}</span>
                  )}
                </div>

                {assignment.note && (
                  <div className="text-[10px] text-slate-500 mt-1 truncate">
                    {assignment.note}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
