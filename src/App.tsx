import React, { useState, useEffect, useCallback } from 'react';
import { Staff, ShiftAssignment, CalendarViewMode, Department } from './types';
import { INITIAL_STAFF } from './data/staff';
import { generateMonthlySchedule, THAI_MONTHS, THAI_DAYS_FULL } from './utils/scheduleCalculator';
import { Header } from './components/Header';
import { MonthView } from './components/MonthView';
import { WeekViewMatrix } from './components/WeekViewMatrix';
import { DayView } from './components/DayView';
import { StaffIndividualView } from './components/StaffIndividualView';
import { ShiftEditModal } from './components/ShiftEditModal';
import { LineExportModal } from './components/LineExportModal';
import { TelegramModal } from './components/TelegramModal';
import { sendTelegramNotification } from './utils/telegramNotify';
import { ShieldCheck, Calendar, Info, RefreshCw, Users, Clock, AlertTriangle } from 'lucide-react';

export default function App() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 7, 1));
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedDept, setSelectedDept] = useState<Department | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Edit Mode State (Unlocked by clicking App Logo 10 times)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('bsm_edit_mode_unlocked') === 'true';
  });

  // Secret Logo Click Counter
  const [logoClicks, setLogoClicks] = useState<number>(0);
  const clickResetTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = () => {
    setLogoClicks((prev) => {
      const next = prev + 1;
      if (clickResetTimerRef.current) {
        clearTimeout(clickResetTimerRef.current);
      }

      if (next >= 10) {
        const nextEditState = !isAdmin;
        setIsAdmin(nextEditState);
        localStorage.setItem('bsm_edit_mode_unlocked', String(nextEditState));
        if (nextEditState) {
          alert('🔓 ปลดล็อกโหมดแก้ไขตารางงานสำเร็จ!\n\nคุณสามารถกดเลือกกะงานของพนักงานท่านใดเพื่อแก้ไขได้ทันที ข้อมูลที่เปลี่ยนจะซิงค์ให้ทุกคนเห็นตรงกันเหมือนกันหมด');
        } else {
          alert('🔒 ปิดโหมดแก้ไขตารางงานแล้ว');
        }
        return 0;
      }

      // Auto reset clicks after 4 seconds of inactivity
      clickResetTimerRef.current = setTimeout(() => {
        setLogoClicks(0);
      }, 4000);

      return next;
    });
  };

  const handleToggleEditMode = () => {
    const nextEditState = !isAdmin;
    setIsAdmin(nextEditState);
    localStorage.setItem('bsm_edit_mode_unlocked', String(nextEditState));
  };

  // Custom Overrides State
  const [overrides, setOverrides] = useState<Record<string, ShiftAssignment>>(() => {
    const saved = localStorage.getItem('bsm_schedule_overrides');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved schedule overrides:', e);
      }
    }
    return {};
  });

  // Modals state
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  // Shift Edit Modal State
  const [selectedShiftForEdit, setSelectedShiftForEdit] = useState<{
    assignment: ShiftAssignment;
    staff: Staff;
  } | null>(null);

  // Fetch overrides from backend server for global synchronization
  const fetchRemoteSchedule = useCallback(async () => {
    try {
      const res = await fetch(`/api/schedule?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.overrides) {
          setOverrides((prev) => {
            const stableStringify = (obj: Record<string, any>) => {
              if (!obj) return '{}';
              const sorted: Record<string, any> = {};
              Object.keys(obj).sort().forEach((k) => {
                sorted[k] = obj[k];
              });
              return JSON.stringify(sorted);
            };

            const prevStr = stableStringify(prev);
            const nextStr = stableStringify(data.overrides);
            if (prevStr !== nextStr) {
              localStorage.setItem('bsm_schedule_overrides', JSON.stringify(data.overrides));
              return data.overrides;
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.warn('Failed to sync with schedule server:', err);
    }
  }, []);

  // Poll for remote schedule changes every 2 seconds so all viewers see updates in real-time
  useEffect(() => {
    fetchRemoteSchedule();
    const interval = setInterval(fetchRemoteSchedule, 2000);
    return () => clearInterval(interval);
  }, [fetchRemoteSchedule]);

  // Save overrides locally
  useEffect(() => {
    localStorage.setItem('bsm_schedule_overrides', JSON.stringify(overrides));
  }, [overrides]);

  // Calculate dynamic schedule for current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const schedule = generateMonthlySchedule(year, month, INITIAL_STAFF, overrides);

  // Handle Shift Selection (Opens Edit Modal if Edit Mode is unlocked)
  const handleSelectShift = (assignment: ShiftAssignment, staff: Staff) => {
    if (isAdmin) {
      setSelectedShiftForEdit({ assignment, staff });
    } else {
      handleLogoClick();
    }
  };

  const handleSaveShiftAssignment = async (updated: ShiftAssignment) => {
    const nextOverrides = {
      ...overrides,
      [updated.id]: updated,
    };
    setOverrides(nextOverrides);
    localStorage.setItem('bsm_schedule_overrides', JSON.stringify(nextOverrides));

    // Save to shared server endpoint for cross-user synchronization
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides: nextOverrides, updatedAssignment: updated }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.overrides) {
          setOverrides(data.overrides);
          localStorage.setItem('bsm_schedule_overrides', JSON.stringify(data.overrides));
        }
      }
    } catch (e) {
      console.error('Failed to post updated shift assignment:', e);
    }

    // Send Telegram Notification
    if (selectedShiftForEdit) {
      const { staff } = selectedShiftForEdit;
      const dateObj = new Date(updated.date);
      const dayName = THAI_DAYS_FULL[dateObj.getDay()];
      const dateNum = dateObj.getDate();
      const monthName = THAI_MONTHS[dateObj.getMonth()];
      const thaiYear = dateObj.getFullYear() + 543;

      const shiftDesc = updated.isOff
        ? '🔴 วันหยุด (OFF)'
        : `🟢 ${updated.startTime} - ${updated.endTime}`;

      const msg =
        `<b>📢 แจ้งเตือนการเปลี่ยนตารางงาน!</b>\n\n` +
        `👤 <b>พนักงาน:</b> ${staff.name} (${staff.role || staff.department})\n` +
        `📅 <b>วันที่:</b> ${dayName}ที่ ${dateNum} ${monthName} ${thaiYear}\n` +
        `⏰ <b>กะงานใหม่:</b> ${shiftDesc}\n` +
        `${updated.note ? `📝 <b>หมายเหตุ:</b> ${updated.note}\n` : ''}` +
        `✍️ <b>ผู้ทำรายการ:</b> ระบบแก้ไขตารางงานออนไลน์`;

      sendTelegramNotification(msg);
    }
  };

  const handleResetShiftToAuto = async (assignmentId: string) => {
    const copy = { ...overrides };
    delete copy[assignmentId];
    setOverrides(copy);
    localStorage.setItem('bsm_schedule_overrides', JSON.stringify(copy));

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides: copy, resetAssignmentId: assignmentId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.overrides) {
          setOverrides(data.overrides);
          localStorage.setItem('bsm_schedule_overrides', JSON.stringify(data.overrides));
        }
      }
    } catch (e) {
      console.error('Failed to post reset shift assignment:', e);
    }

    if (selectedShiftForEdit) {
      const { staff, assignment } = selectedShiftForEdit;
      const dateObj = new Date(assignment.date);
      const dateNum = dateObj.getDate();
      const monthName = THAI_MONTHS[dateObj.getMonth()];

      const msg =
        `<b>🔄 คืนค่าตารางงานเป็นอัตโนมัติ</b>\n\n` +
        `👤 <b>พนักงาน:</b> ${staff.name}\n` +
        `📅 <b>วันที่:</b> ${dateNum} ${monthName}\n` +
        `✍️ <b>ผู้ทำรายการ:</b> ระบบแก้ไขตารางงานออนไลน์`;

      sendTelegramNotification(msg);
    }
  };

  const handleResetEntireSchedule = async () => {
    if (window.confirm('คุณต้องการรีเซ็ตตารางกะงานทั้งหมดกลับเป็นกฎเริ่มต้นใช่หรือไม่?')) {
      setOverrides({});
      localStorage.removeItem('bsm_schedule_overrides');

      try {
        await fetch('/api/schedule/reset', { method: 'POST' });
      } catch (e) {
        console.error('Failed to reset schedule on server:', e);
      }

      const msg =
        `<b>⚠️ คืนค่าตารางงานหลักทั้งหมด</b>\n\n` +
        `รีเซ็ตการแก้ไขกะงานทั้งหมดกลับเป็นค่าเริ่มต้นระบบแล้ว\n` +
        `✍️ <b>ผู้ทำรายการ:</b> ระบบแก้ไขตารางงานออนไลน์`;

      sendTelegramNotification(msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* App Navigation Header */}
      <Header
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isAdmin={isAdmin}
        onToggleEditMode={handleToggleEditMode}
        onOpenLineModal={() => setIsLineModalOpen(true)}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
        onResetSchedule={handleResetEntireSchedule}
        onRefreshData={fetchRemoteSchedule}
        selectedDept={selectedDept}
        setSelectedDept={setSelectedDept}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        logoClicks={logoClicks}
        onLogoClick={handleLogoClick}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Rules Overview Badge Bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Users className="w-4 h-4 text-blue-600" />
              <span>พนักงาน 9 คน:</span>
            </div>

            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 font-medium">
              BSM (2 คน): แมงมุม (BSM), เก้า (ABSM)
            </span>

            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 font-medium">
              PIA (4 คน): วา, จิ๊บ, สตาร์, โนอาห์
            </span>

            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 font-medium">
              MSC (3 คน): คิม, โย, โจโฉ
            </span>
          </div>
        </div>

        {/* Calendar Main Views */}
        {viewMode === 'month' && (
          <MonthView
            currentDate={currentDate}
            staffList={INITIAL_STAFF}
            schedule={schedule}
            isAdmin={isAdmin}
            onSelectShift={handleSelectShift}
            onSelectDay={(date) => {
              setCurrentDate(date);
              setViewMode('day');
            }}
            selectedDept={selectedDept}
            searchTerm={searchTerm}
          />
        )}

        {viewMode === 'week' && (
          <WeekViewMatrix
            currentDate={currentDate}
            staffList={INITIAL_STAFF}
            schedule={schedule}
            isAdmin={isAdmin}
            onSelectShift={handleSelectShift}
            selectedDept={selectedDept}
            searchTerm={searchTerm}
            onNavigateWeek={setCurrentDate}
          />
        )}

        {viewMode === 'day' && (
          <DayView
            currentDate={currentDate}
            staffList={INITIAL_STAFF}
            schedule={schedule}
            isAdmin={isAdmin}
            onSelectShift={handleSelectShift}
            selectedDept={selectedDept}
            onNavigateDay={setCurrentDate}
          />
        )}

        {viewMode === 'staff' && (
          <StaffIndividualView
            currentDate={currentDate}
            staffList={INITIAL_STAFF}
            schedule={schedule}
            isAdmin={isAdmin}
            onSelectShift={handleSelectShift}
          />
        )}
      </main>

      {/* Footer Disclaimer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>
          ระบบจัดตารางงานพนักงาน BSM • PIA • MSC — ตารางข้อมูลเชื่อมโยงตรงกันทุกคนแบบเรียลไทม์
        </p>
      </footer>

      {/* Modals & Drawers */}
      <ShiftEditModal
        isOpen={!!selectedShiftForEdit}
        onClose={() => setSelectedShiftForEdit(null)}
        assignment={selectedShiftForEdit?.assignment || null}
        staff={selectedShiftForEdit?.staff || null}
        onSave={handleSaveShiftAssignment}
        onResetToAuto={() => {
          if (selectedShiftForEdit) {
            handleResetShiftToAuto(selectedShiftForEdit.assignment.id);
          }
        }}
      />

      <LineExportModal
        isOpen={isLineModalOpen}
        onClose={() => setIsLineModalOpen(false)}
        currentDate={currentDate}
        staffList={INITIAL_STAFF}
        schedule={schedule}
      />

      <TelegramModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
      />
    </div>
  );
}
