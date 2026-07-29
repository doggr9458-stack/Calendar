import { Staff, ShiftInfo, ShiftType } from '../types';

export const INITIAL_STAFF: Staff[] = [
  // BSM Team (2 people) - Can edit (16286, 2609)
  {
    id: 'bsm-mangmum',
    employeeId: '2609',
    name: 'แมงมุม',
    department: 'BSM',
    role: 'BSM',
    fixedOffDay: 2, // Tuesday (วันอังคาร)
    avatarColor: 'bg-purple-600 text-white',
    rotationOffset: 0,
    canEdit: true,
  },
  {
    id: 'bsm-kao',
    employeeId: '16286',
    name: 'เก้า',
    department: 'BSM',
    role: 'ABSM',
    fixedOffDay: 1, // Monday (วันจันทร์)
    avatarColor: 'bg-indigo-600 text-white',
    rotationOffset: 1,
    canEdit: true,
  },

  // PIA Sales Team (4 people)
  {
    id: 'pia-wa',
    employeeId: '29253',
    name: 'วา',
    department: 'PIA',
    role: 'พนักงานขาย PIA',
    fixedOffDay: 1, // Monday (วันจันทร์)
    avatarColor: 'bg-blue-600 text-white',
    rotationOffset: 0,
    canEdit: false,
  },
  {
    id: 'pia-jib',
    employeeId: '24583',
    name: 'จิ๊บ',
    department: 'PIA',
    role: 'พนักงานขาย PIA',
    fixedOffDay: 2, // Tuesday (วันอังคาร)
    avatarColor: 'bg-sky-600 text-white',
    rotationOffset: 1,
    canEdit: false,
  },
  {
    id: 'pia-star',
    employeeId: '35350',
    name: 'สตาร์',
    department: 'PIA',
    role: 'พนักงานขาย PIA',
    fixedOffDay: 4, // Thursday (วันพฤหัสบดี)
    avatarColor: 'bg-cyan-600 text-white',
    rotationOffset: 2,
    canEdit: false,
  },
  {
    id: 'pia-noah',
    employeeId: '33258',
    name: 'โนอา',
    department: 'PIA',
    role: 'พนักงานขาย PIA',
    fixedOffDay: 3, // Wednesday (วันพุธ)
    avatarColor: 'bg-teal-600 text-white',
    rotationOffset: 3,
    canEdit: false,
  },

  // MSC Team (3 people)
  {
    id: 'msc-kim',
    employeeId: '31528',
    name: 'คิม',
    department: 'MSC',
    role: 'พนักงานขาย MSC',
    fixedOffDay: 4, // Thursday (วันพฤหัสบดี)
    avatarColor: 'bg-emerald-600 text-white',
    rotationOffset: 0,
    canEdit: false,
  },
  {
    id: 'msc-yo',
    employeeId: '29790',
    name: 'โย',
    department: 'MSC',
    role: 'พนักงานขาย MSC',
    fixedOffDay: 1, // Monday (วันจันทร์)
    avatarColor: 'bg-green-600 text-white',
    rotationOffset: 1,
    canEdit: false,
  },
  {
    id: 'msc-chocho',
    employeeId: '35295',
    name: 'โจโฉ',
    department: 'MSC',
    role: 'พนักงานขาย MSC',
    fixedOffDay: 3, // Wednesday (วันพุธ)
    avatarColor: 'bg-amber-600 text-white',
    rotationOffset: 2,
    canEdit: false,
  },
];

export const SHIFT_DICTIONARY: Record<ShiftType, ShiftInfo> = {
  MORNING: {
    type: 'MORNING',
    label: 'เช้า (10:00 - 19:00)',
    startTime: '10:00',
    endTime: '19:00',
    colorClass: 'border-blue-500 text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-700 dark:text-blue-300',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border-blue-200 dark:border-blue-800',
  },
  BSM_REGULAR: {
    type: 'BSM_REGULAR',
    label: 'BSM (11:00 - 20:00)',
    startTime: '11:00',
    endTime: '20:00',
    colorClass: 'border-purple-500 text-purple-700 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-300',
    bgLight: 'bg-purple-50',
    textColor: 'text-purple-700 dark:text-purple-300',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border-purple-200 dark:border-purple-800',
  },
  MID: {
    type: 'MID',
    label: 'เที่ยง (12:00 - 21:00)',
    startTime: '12:00',
    endTime: '21:00',
    colorClass: 'border-amber-500 text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-800 dark:text-amber-300',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-200 dark:border-amber-800',
  },
  LATE: {
    type: 'LATE',
    label: 'บ่าย (13:00 - 22:00)',
    startTime: '13:00',
    endTime: '22:00',
    colorClass: 'border-indigo-500 text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300',
    bgLight: 'bg-indigo-50',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800',
  },
  OFF: {
    type: 'OFF',
    label: 'วันหยุด (Off)',
    startTime: '-',
    endTime: '-',
    colorClass: 'border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300',
    bgLight: 'bg-rose-50',
    textColor: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border-rose-200 dark:border-rose-800',
  },
  CUSTOM: {
    type: 'CUSTOM',
    label: 'กำหนดเอง',
    startTime: '09:00',
    endTime: '18:00',
    colorClass: 'border-gray-400 text-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-gray-300',
    bgLight: 'bg-gray-50',
    textColor: 'text-gray-700 dark:text-gray-300',
    badgeBg: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700',
  },
};
