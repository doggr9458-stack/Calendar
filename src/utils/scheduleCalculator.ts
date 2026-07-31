import { Staff, ShiftAssignment, ShiftType, Department } from '../types';
import { INITIAL_STAFF } from '../data/staff';

/**
 * Returns the week index of the month (1, 2, 3, 4, 5)
 */
export function getWeekOfMonth(date: Date): number {
  const day = date.getDate();
  return Math.ceil(day / 7);
}

/**
 * Calculates BSM / ABSM specific shift assignments
 */
export function calculateBsmDefaultShift(staff: Staff, date: Date): ShiftAssignment {
  const dateStr = formatDateKey(date);
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

  if (dayOfWeek === staff.fixedOffDay) {
    return {
      id: `${dateStr}-${staff.id}`,
      date: dateStr,
      staffId: staff.id,
      shiftType: 'OFF',
      startTime: '-',
      endTime: '-',
      isOff: true,
      note: 'วันหยุดประจำสัปดาห์',
    };
  }

  const weekIndex = getWeekOfMonth(date);
  const isOddWeek = weekIndex % 2 !== 0; // Week 1, 3, 5

  if (staff.id === 'bsm-mangmum') {
    if (dayOfWeek === 1) { // Monday
      if (isOddWeek) {
        return {
          id: `${dateStr}-${staff.id}`,
          date: dateStr,
          staffId: staff.id,
          shiftType: 'MORNING',
          startTime: '10:00',
          endTime: '19:00',
          isOff: false,
          note: 'กะเช้าประจำสัปดาห์ (วีค 1/3/5)',
        };
      } else {
        return {
          id: `${dateStr}-${staff.id}`,
          date: dateStr,
          staffId: staff.id,
          shiftType: 'BSM_REGULAR',
          startTime: '11:00',
          endTime: '20:00',
          isOff: false,
          note: 'กะ BSM ปกติ (วีค 2/4)',
        };
      }
    }

    if (isOddWeek) {
      return {
        id: `${dateStr}-${staff.id}`,
        date: dateStr,
        staffId: staff.id,
        shiftType: 'MORNING',
        startTime: '10:00',
        endTime: '19:00',
        isOff: false,
        note: 'กะเช้า (วีค 1/3/5)',
      };
    } else {
      return {
        id: `${dateStr}-${staff.id}`,
        date: dateStr,
        staffId: staff.id,
        shiftType: 'MID',
        startTime: '12:00',
        endTime: '20:00',
        isOff: false,
        note: 'กะเที่ยง (วีค 2/4)',
      };
    }
  } else if (staff.id === 'bsm-kao') {
    if (dayOfWeek === 2) { // Tuesday
      if (isOddWeek) {
        return {
          id: `${dateStr}-${staff.id}`,
          date: dateStr,
          staffId: staff.id,
          shiftType: 'MID',
          startTime: '12:00',
          endTime: '20:00',
          isOff: false,
          note: 'กะเที่ยงประจำอังคาร (วีค 1/3/5)',
        };
      } else {
        return {
          id: `${dateStr}-${staff.id}`,
          date: dateStr,
          staffId: staff.id,
          shiftType: 'MORNING',
          startTime: '10:00',
          endTime: '19:00',
          isOff: false,
          note: 'กะเช้าประจำอังคาร (วีค 2/4)',
        };
      }
    }

    if (isOddWeek) {
      return {
        id: `${dateStr}-${staff.id}`,
        date: dateStr,
        staffId: staff.id,
        shiftType: 'MID',
        startTime: '12:00',
        endTime: '20:00',
        isOff: false,
        note: 'กะเที่ยง (วีค 1/3/5)',
      };
    } else {
      return {
        id: `${dateStr}-${staff.id}`,
        date: dateStr,
        staffId: staff.id,
        shiftType: 'MORNING',
        startTime: '10:00',
        endTime: '19:00',
        isOff: false,
        note: 'กะเช้า (วีค 2/4)',
      };
    }
  }

  return {
    id: `${dateStr}-${staff.id}`,
    date: dateStr,
    staffId: staff.id,
    shiftType: 'MORNING',
    startTime: '10:00',
    endTime: '19:00',
    isOff: false,
  };
}

/**
 * Helper to get standard start/end times for shift types
 */
export function getTimesForShiftType(shiftType: ShiftType): { startTime: string; endTime: string } {
  switch (shiftType) {
    case 'MORNING':
      return { startTime: '10:00', endTime: '19:00' };
    case 'LATE':
      return { startTime: '13:00', endTime: '22:00' };
    case 'MID':
      return { startTime: '12:00', endTime: '21:00' };
    case 'BSM_REGULAR':
      return { startTime: '11:00', endTime: '20:00' };
    default:
      return { startTime: '10:00', endTime: '19:00' };
  }
}

/**
 * Generates paired assignments for all staff on a specific date.
 * Rule: 
 * 1. Wa (PIA) & Yo (MSC) work as a paired shift when both are on duty.
 * 2. Morning (10-19) must have 1 PIA + 1 MSC.
 * 3. Late (13-22) must have 1 PIA + 1 MSC.
 * 4. Other sales staff rotate dynamically based on daily off days & schedule conditions.
 */
export function generateDailyAssignmentsForDate(
  date: Date,
  staffList: Staff[] = INITIAL_STAFF,
  overrides: Record<string, ShiftAssignment> = {}
): Record<string, ShiftAssignment> {
  const dateStr = formatDateKey(date);
  const dayOfWeek = date.getDay();
  const assignments: Record<string, ShiftAssignment> = {};

  // UTC-based day calculation to ensure 100% timezone-independent and consistent calculations on all devices
  const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const utcAnchor = Date.UTC(2026, 0, 1);
  const diffDays = Math.floor((utcDate - utcAnchor) / 86400000);

  // Group rotation into 3-day blocks (3 days in a row per shift block)
  const shiftBlock = Math.floor(diffDays / 3);

  // 1. BSM Team
  const bsmStaff = staffList.filter((s) => s.department === 'BSM');
  bsmStaff.forEach((staff) => {
    const key = `${dateStr}-${staff.id}`;
    if (overrides[key]) {
      assignments[key] = overrides[key];
    } else {
      assignments[key] = calculateBsmDefaultShift(staff, date);
    }
  });

  // Identify Wa & Yo for pairing
  const waStaff = staffList.find((s) => s.id === 'pia-wa');
  const yoStaff = staffList.find((s) => s.id === 'msc-yo');

  const waWorking = waStaff && waStaff.fixedOffDay !== dayOfWeek;
  const yoWorking = yoStaff && yoStaff.fixedOffDay !== dayOfWeek;
  const isWaYoPaired = waWorking && yoWorking;

  // Cycle Wa & Yo paired shift between MORNING and LATE every 3 consecutive working days
  const waYoShiftCycle: ShiftType[] = ['MORNING', 'LATE'];
  const waYoShiftType = isWaYoPaired ? waYoShiftCycle[Math.abs(shiftBlock) % 2] : null;

  // 2. PIA Team Assignment
  const piaStaff = staffList.filter((s) => s.department === 'PIA');
  piaStaff.filter((s) => s.fixedOffDay === dayOfWeek).forEach((staff) => {
    const key = `${dateStr}-${staff.id}`;
    assignments[key] = overrides[key] || {
      id: key,
      date: dateStr,
      staffId: staff.id,
      shiftType: 'OFF',
      startTime: '-',
      endTime: '-',
      isOff: true,
      note: 'วันหยุดประจำสัปดาห์',
    };
  });

  const workingPia = piaStaff.filter((s) => s.fixedOffDay !== dayOfWeek);

  if (isWaYoPaired && waStaff && waYoShiftType) {
    const waKey = `${dateStr}-${waStaff.id}`;
    if (overrides[waKey]) {
      assignments[waKey] = overrides[waKey];
    } else {
      const times = getTimesForShiftType(waYoShiftType);
      assignments[waKey] = {
        id: waKey,
        date: dateStr,
        staffId: waStaff.id,
        shiftType: waYoShiftType,
        startTime: times.startTime,
        endTime: times.endTime,
        isOff: false,
        note: 'กะคู่พิเศษ (วา PIA + โย MSC)',
      };
    }
  }

  const otherWorkingPia = workingPia.filter((s) => !(isWaYoPaired && s.id === 'pia-wa'));
  const neededPiaShifts: ShiftType[] = ['MORNING', 'LATE', 'MID'];
  if (isWaYoPaired && waYoShiftType) {
    const idx = neededPiaShifts.indexOf(waYoShiftType);
    if (idx !== -1) neededPiaShifts.splice(idx, 1);
  }

  const piaRotationLen = Math.max(1, otherWorkingPia.length);
  const startPiaIdx = ((shiftBlock % piaRotationLen) + piaRotationLen) % piaRotationLen;

  otherWorkingPia.forEach((staff, i) => {
    const key = `${dateStr}-${staff.id}`;
    if (overrides[key]) {
      assignments[key] = overrides[key];
      return;
    }

    const pos = (i - startPiaIdx + otherWorkingPia.length) % otherWorkingPia.length;
    const assignedShift = neededPiaShifts[pos] || 'MID';
    const times = getTimesForShiftType(assignedShift);

    let note = 'กะหมุนเวียนปกติ';
    if (assignedShift === 'MORNING') note = 'กะเช้าคู่ (PIA 1 + MSC 1)';
    else if (assignedShift === 'LATE') note = 'กะบ่ายคู่ (PIA 1 + MSC 1)';
    else if (assignedShift === 'MID') note = 'กะเที่ยง (12:00 - 21:00)';

    assignments[key] = {
      id: key,
      date: dateStr,
      staffId: staff.id,
      shiftType: assignedShift,
      startTime: times.startTime,
      endTime: times.endTime,
      isOff: false,
      note,
    };
  });

  // 3. MSC Team Assignment
  const mscStaff = staffList.filter((s) => s.department === 'MSC');
  mscStaff.filter((s) => s.fixedOffDay === dayOfWeek).forEach((staff) => {
    const key = `${dateStr}-${staff.id}`;
    assignments[key] = overrides[key] || {
      id: key,
      date: dateStr,
      staffId: staff.id,
      shiftType: 'OFF',
      startTime: '-',
      endTime: '-',
      isOff: true,
      note: 'วันหยุดประจำสัปดาห์',
    };
  });

  const workingMsc = mscStaff.filter((s) => s.fixedOffDay !== dayOfWeek);

  if (isWaYoPaired && yoStaff && waYoShiftType) {
    const yoKey = `${dateStr}-${yoStaff.id}`;
    if (overrides[yoKey]) {
      assignments[yoKey] = overrides[yoKey];
    } else {
      const times = getTimesForShiftType(waYoShiftType);
      assignments[yoKey] = {
        id: yoKey,
        date: dateStr,
        staffId: yoStaff.id,
        shiftType: waYoShiftType,
        startTime: times.startTime,
        endTime: times.endTime,
        isOff: false,
        note: 'กะคู่พิเศษ (วา PIA + โย MSC)',
      };
    }
  }

  const otherWorkingMsc = workingMsc.filter((s) => !(isWaYoPaired && s.id === 'msc-yo'));
  const neededMscShifts: ShiftType[] = ['MORNING', 'LATE', 'MID'];
  if (isWaYoPaired && waYoShiftType) {
    const idx = neededMscShifts.indexOf(waYoShiftType);
    if (idx !== -1) neededMscShifts.splice(idx, 1);
  }

  const mscRotationLen = Math.max(1, otherWorkingMsc.length);
  const startMscIdx = ((shiftBlock % mscRotationLen) + mscRotationLen) % mscRotationLen;

  otherWorkingMsc.forEach((staff, i) => {
    const key = `${dateStr}-${staff.id}`;
    if (overrides[key]) {
      assignments[key] = overrides[key];
      return;
    }

    const pos = (i - startMscIdx + otherWorkingMsc.length) % otherWorkingMsc.length;
    const assignedShift = neededMscShifts[pos] || 'MID';
    const times = getTimesForShiftType(assignedShift);

    let note = 'กะหมุนเวียนปกติ';
    if (assignedShift === 'MORNING') note = 'กะเช้าคู่ (PIA 1 + MSC 1)';
    else if (assignedShift === 'LATE') note = 'กะบ่ายคู่ (PIA 1 + MSC 1)';
    else if (assignedShift === 'MID') note = 'กะเที่ยง (12:00 - 21:00)';

    assignments[key] = {
      id: key,
      date: dateStr,
      staffId: staff.id,
      shiftType: assignedShift,
      startTime: times.startTime,
      endTime: times.endTime,
      isOff: false,
      note,
    };
  });

  return assignments;
}

/**
 * Calculates default shift assignment for a given staff on a specific date based on business rules
 */
export function calculateDefaultShift(staff: Staff, date: Date): ShiftAssignment {
  const dateStr = formatDateKey(date);
  const key = `${dateStr}-${staff.id}`;
  const daily = generateDailyAssignmentsForDate(date, INITIAL_STAFF, {});
  return (
    daily[key] || {
      id: key,
      date: dateStr,
      staffId: staff.id,
      shiftType: 'OFF',
      startTime: '-',
      endTime: '-',
      isOff: true,
    }
  );
}

/**
 * Generate full monthly schedule for given staff list and month
 */
export function generateMonthlySchedule(
  year: number,
  monthIndex: number, // 0-11
  staffList: Staff[] = INITIAL_STAFF,
  overrides: Record<string, ShiftAssignment> = {}
): Record<string, ShiftAssignment> {
  const schedule: Record<string, ShiftAssignment> = {};
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day);
    const dailyAssignments = generateDailyAssignmentsForDate(date, staffList, overrides);
    Object.assign(schedule, dailyAssignments);
  }

  return schedule;
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

export const THAI_DAYS_FULL = [
  'วันอาทิตย์',
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์',
];

export const THAI_DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

