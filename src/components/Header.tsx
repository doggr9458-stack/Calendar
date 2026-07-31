import React from 'react';
import {
  Calendar as CalendarIcon,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  Share2,
  Send,
  Printer,
  Grid,
  Columns,
  ListFilter,
  UserCheck,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { CalendarViewMode, Department, Staff } from '../types';
import { THAI_MONTHS } from '../utils/scheduleCalculator';

interface HeaderProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  viewMode: CalendarViewMode;
  setViewMode: (mode: CalendarViewMode) => void;
  isAdmin: boolean;
  loggedInStaff: Staff | null;
  onOpenAdminModal: () => void;
  onLogoutAdmin: () => void;
  onOpenLineModal: () => void;
  onOpenTelegramModal: () => void;
  onResetSchedule: () => void;
  onRefreshData?: () => void;
  selectedDept: Department | 'ALL';
  setSelectedDept: (dept: Department | 'ALL') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  setCurrentDate,
  viewMode,
  setViewMode,
  isAdmin,
  loggedInStaff,
  onOpenAdminModal,
  onLogoutAdmin,
  onOpenLineModal,
  onOpenTelegramModal,
  onResetSchedule,
  onRefreshData,
  selectedDept,
  setSelectedDept,
  searchTerm,
  setSearchTerm,
}) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    if (onRefreshData) {
      onRefreshData();
    } else {
      window.location.reload();
    }
    setTimeout(() => setIsRefreshing(false), 600);
  };
  const year = currentDate.getFullYear();
  const thaiYear = year + 543;
  const monthName = THAI_MONTHS[currentDate.getMonth()];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      {/* Top Banner Notice */}
      <div className={`px-3 py-0.5 text-[11px] font-medium text-center flex flex-wrap items-center justify-center gap-2 transition-colors ${
        isAdmin
          ? 'bg-amber-500 text-white'
          : loggedInStaff
          ? 'bg-blue-600 text-white'
          : 'bg-slate-800 text-white'
      }`}>
        {loggedInStaff ? (
          <>
            {isAdmin ? (
              <Unlock className="w-3 h-3 animate-pulse" />
            ) : (
              <Lock className="w-3 h-3" />
            )}
            <span>
              ผู้ใช้งาน: <strong>{loggedInStaff.name}</strong> (ID: <span className="font-mono">{loggedInStaff.employeeId}</span>) — {isAdmin ? 'สิทธิ์แก้ไขตารางกะ (Admin)' : 'ดูได้อย่างเดียว'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onLogoutAdmin}
                className="underline hover:no-underline font-semibold bg-black/20 hover:bg-black/30 px-1.5 py-0.5 rounded text-white text-[10px]"
              >
                ออกจากระบบ
              </button>
              {!isAdmin && (
                <button
                  onClick={onOpenAdminModal}
                  className="underline hover:no-underline font-semibold bg-white/20 hover:bg-white/30 px-1.5 py-0.5 rounded text-white text-[10px]"
                >
                  สลับผู้ใช้
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <Lock className="w-3 h-3" />
            <span className="text-[11px]">โหมดผู้เยี่ยมชม — ยืนยันตัวตนด้วย ID พนักงานเพื่อแก้ไข</span>
            <button
              onClick={onOpenAdminModal}
              className="underline hover:no-underline font-semibold bg-white/20 hover:bg-white/30 px-1.5 py-0.5 rounded text-white text-[10px]"
            >
              ยืนยันตัวตน (ID พนักงาน)
            </button>
          </>
        )}
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 sm:py-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5 sm:gap-2">
          {/* App Title & Date Navigation */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-2xs shrink-0">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h1 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-none">
                  ตารางงานกะพนักงาน BSM • PIA • MSC
                </h1>
                <p className="text-[10px] text-slate-500 hidden sm:block mt-0.5">
                  คำนวณวันหยุด กะวน 3 วัน และกะ BSM สลับสัปดาห์อัตโนมัติ
                </p>
              </div>
            </div>
          </div>

          {/* Controls row: Date month switcher + Action buttons */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-1.5">
            {/* Month & Date Selector Controls */}
            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg w-full sm:w-auto justify-between sm:justify-start border border-slate-200/80">
              <button
                onClick={handlePrevMonth}
                className="p-1 text-slate-700 hover:text-slate-900 hover:bg-white rounded-md transition-all flex items-center justify-center"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-2 font-bold text-slate-900 text-xs sm:min-w-[110px] text-center">
                {monthName} {thaiYear}
              </span>

              <button
                onClick={handleNextMonth}
                className="p-1 text-slate-700 hover:text-slate-900 hover:bg-white rounded-md transition-all flex items-center justify-center"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleToday}
                className="px-2 py-0.5 text-xs font-bold bg-white text-blue-600 rounded-md shadow-2xs hover:bg-blue-50 transition-all border border-slate-200"
              >
                วันนี้
              </button>

              <button
                onClick={handleRefreshClick}
                className="px-2 py-0.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs transition-all flex items-center gap-1 active:scale-95"
                title="กดเพื่ออัปเดต/รีเฟรชข้อมูลตารางล่าสุด"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>รีเฟรชตาราง</span>
              </button>
            </div>

            {/* Quick Action Buttons (Only visible to Admin ID 16286 / 2609) */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              {isAdmin && (
                <>
                  <button
                    onClick={onOpenLineModal}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all active:scale-95"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>ส่ง LINE</span>
                  </button>

                  <button
                    onClick={onOpenTelegramModal}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all active:scale-95"
                    title="ตั้งค่าแจ้งเตือน Telegram"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Telegram</span>
                  </button>
                </>
              )}

              {!loggedInStaff ? (
                <button
                  onClick={onOpenAdminModal}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-all shrink-0"
                >
                  <Lock className="w-3 h-3" />
                  <span className="hidden sm:inline">ยืนยันตัวตน (ID)</span>
                  <span className="sm:hidden">ยืนยันตัวตน</span>
                </button>
              ) : (
                <button
                  onClick={onLogoutAdmin}
                  className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all shrink-0"
                >
                  <Unlock className="w-3 h-3" />
                  <span className="hidden sm:inline">ออกจากระบบ ({loggedInStaff.name})</span>
                  <span className="sm:hidden">ออก</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* View Switcher & Department Filter Toolbar */}
        <div className="mt-1.5 pt-1.5 border-t border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-1.5">
          {/* View Modes */}
          <div className="grid grid-cols-4 sm:flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg text-xs border border-slate-200/80">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center justify-center gap-1 px-2 py-1 rounded-md font-bold transition-all text-xs ${
                viewMode === 'month'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>รายเดือน</span>
            </button>

            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center justify-center gap-1 px-2 py-1 rounded-md font-bold transition-all text-xs ${
                viewMode === 'week'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>สัปดาห์</span>
            </button>

            <button
              onClick={() => setViewMode('day')}
              className={`flex items-center justify-center gap-1 px-2 py-1 rounded-md font-bold transition-all text-xs ${
                viewMode === 'day'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>รายวัน</span>
            </button>

            <button
              onClick={() => setViewMode('staff')}
              className={`flex items-center justify-center gap-1 px-2 py-1 rounded-md font-bold transition-all text-xs ${
                viewMode === 'staff'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>รายคน</span>
            </button>
          </div>

          {/* Department Filter & Search */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5">
            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg text-xs border border-slate-200/80 flex-1 sm:flex-none">
              {(['ALL', 'BSM', 'PIA', 'MSC'] as const).map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`flex-1 sm:flex-none px-2 py-1 rounded-md font-bold transition-all text-xs text-center ${
                    selectedDept === dept
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {dept === 'ALL' ? 'ทั้งหมด' : dept}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="ค้นชื่อพนักงาน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-28 sm:w-36"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
