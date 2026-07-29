export type Department = 'BSM' | 'PIA' | 'MSC';

export type ShiftType = 'MORNING' | 'BSM_REGULAR' | 'MID' | 'LATE' | 'OFF' | 'CUSTOM';

export interface ShiftInfo {
  type: ShiftType;
  label: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  colorClass: string;
  bgLight: string;
  textColor: string;
  badgeBg: string;
}

export interface Staff {
  id: string;
  employeeId: string;
  name: string;
  department: Department;
  role: string;
  fixedOffDay: number; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  avatarColor: string;
  rotationOffset: number; // Stagger rotation start
  canEdit: boolean;
}

export interface ShiftAssignment {
  id: string; // date-staffId
  date: string; // YYYY-MM-DD
  staffId: string;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  isOff: boolean;
  isCustomOverride?: boolean;
  note?: string;
}

export type CalendarViewMode = 'month' | 'week' | 'day' | 'staff';

export interface DailyCoverage {
  date: string;
  morningCount: number;
  bsmCount: number;
  midCount: number;
  lateCount: number;
  offCount: number;
  totalWorking: number;
}
