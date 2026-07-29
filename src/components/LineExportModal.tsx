import React, { useState } from 'react';
import { Staff, ShiftAssignment } from '../types';
import { SHIFT_DICTIONARY } from '../data/staff';
import { THAI_DAYS_FULL, THAI_DAYS_SHORT, THAI_MONTHS, formatDateKey } from '../utils/scheduleCalculator';
import { X, Copy, Check, Share2, MessageSquare, Calendar, Sparkles } from 'lucide-react';

interface LineExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  staffList: Staff[];
  schedule: Record<string, ShiftAssignment>;
}

export const LineExportModal: React.FC<LineExportModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  staffList,
  schedule,
}) => {
  const [exportType, setExportType] = useState<'daily' | 'weekly' | 'off_summary'>('daily');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const dateStr = formatDateKey(currentDate);
  const dayName = THAI_DAYS_FULL[currentDate.getDay()];
  const dateNum = currentDate.getDate();
  const monthName = THAI_MONTHS[currentDate.getMonth()];
  const thaiYear = currentDate.getFullYear() + 543;

  // Build LINE formatted text
  let lineText = '';

  if (exportType === 'daily') {
    lineText = `📅 *ประกาศตารางกะงานประจำวัน*\n`;
    lineText += `📌 ${dayName}ที่ ${dateNum} ${monthName} ${thaiYear}\n`;
    lineText += `------------------------------------\n\n`;

    const morning: string[] = [];
    const bsm: string[] = [];
    const mid: string[] = [];
    const late: string[] = [];
    const off: string[] = [];

    staffList.forEach((s) => {
      const key = `${dateStr}-${s.id}`;
      const assignment = schedule[key];
      const deptOrRole = s.department === 'BSM' ? s.role : s.department;
      if (!assignment || assignment.isOff) {
        off.push(`${s.name} (${deptOrRole})`);
      } else {
        const item = `${s.name} (${deptOrRole}) [${assignment.startTime}-${assignment.endTime}]`;
        if (assignment.shiftType === 'MORNING') morning.push(item);
        else if (assignment.shiftType === 'BSM_REGULAR') bsm.push(item);
        else if (assignment.shiftType === 'MID') mid.push(item);
        else if (assignment.shiftType === 'LATE') late.push(item);
        else morning.push(item);
      }
    });

    if (morning.length > 0) lineText += `🌅 *กะเช้า (10:00 - 19:00)*:\n• ${morning.join('\n• ')}\n\n`;
    if (bsm.length > 0) lineText += `🏢 *กะ BSM (11:00 - 20:00)*:\n• ${bsm.join('\n• ')}\n\n`;
    if (mid.length > 0) lineText += `☀️ *กะเที่ยง (12:00 - 21:00)*:\n• ${mid.join('\n• ')}\n\n`;
    if (late.length > 0) lineText += `🌙 *กะบ่าย (13:00 - 22:00)*:\n• ${late.join('\n• ')}\n\n`;
    if (off.length > 0) lineText += `🏖️ *วันหยุด (OFF)*:\n• ${off.join('\n• ')}\n\n`;

    lineText += `------------------------------------\n`;
    lineText += `ขอให้พนักงานทุกท่านเข้างานตรงเวลา ขอบคุณครับ/ค่ะ 🙏`;
  } else if (exportType === 'weekly') {
    lineText = `📅 *ตารางกะงานสัปดาห์นี้*\n`;
    lineText += `------------------------------------\n`;

    // Get 7 days
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay();
    const distToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + distToMon);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = formatDateKey(d);
      const dDayName = THAI_DAYS_SHORT[d.getDay()];

      lineText += `\n🗓️ *${d.getDate()}/${d.getMonth() + 1} (${dDayName})*\n`;

      const working: string[] = [];
      const off: string[] = [];

      staffList.forEach((s) => {
        const key = `${dStr}-${s.id}`;
        const assignment = schedule[key];
        if (!assignment || assignment.isOff) {
          off.push(s.name);
        } else {
          working.push(`${s.name} (${assignment.startTime})`);
        }
      });

      lineText += `🟢 เข้างาน: ${working.length > 0 ? working.join(', ') : 'ไม่มี'}\n`;
      lineText += `🔴 หยุด: ${off.length > 0 ? off.join(', ') : 'ไม่มี'}\n`;
    }
  } else if (exportType === 'off_summary') {
    lineText = `🔴 *สรุปวันหยุดประจำสัปดาห์ตามกฎร้าน*\n`;
    lineText += `------------------------------------\n`;
    lineText += `• วันจันทร์: เก้า, โย, วา\n`;
    lineText += `• วันอังคาร: แมงมุม, จิ๊บ\n`;
    lineText += `• วันพุธ: โนอาห์, โจโฉ\n`;
    lineText += `• วันพฤหัสบดี: คิม, สตาร์\n`;
    lineText += `• ศุกร์-เสาร์-อาทิตย์: ปฏิบัติงานเต็มอัตรา\n`;
    lineText += `------------------------------------\n`;
    lineText += `*หมายเหตุ BSM*: แมงมุมและเก้า สลับกะ 10:00/12:00 คนละวีค`;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(lineText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 max-w-lg w-full p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                คัดลอกตารางแจ้งกลุ่ม LINE
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                เลือกรูปแบบข้อความและคัดลอกนำไปวางใน LINE ได้ทันที
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

        {/* Format Selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setExportType('daily')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
              exportType === 'daily'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
            }`}
          >
            ประกาศประจำวัน
          </button>
          <button
            onClick={() => setExportType('weekly')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
              exportType === 'weekly'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
            }`}
          >
            ประกาศสัปดาห์นี้
          </button>
          <button
            onClick={() => setExportType('off_summary')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
              exportType === 'off_summary'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
            }`}
          >
            สรุปวันหยุด
          </button>
        </div>

        {/* Text Preview Box */}
        <div className="mb-4 relative">
          <textarea
            readOnly
            rows={10}
            value={lineText}
            className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-mono text-xs leading-relaxed focus:outline-hidden"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-xs font-medium transition-colors"
          >
            ปิดหน้าต่าง
          </button>
          <button
            onClick={handleCopy}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'คัดลอกข้อความแล้ว!' : 'คัดลอกข้อความ LINE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
