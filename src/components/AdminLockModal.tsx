import React, { useState, useEffect } from 'react';
import { Lock, Unlock, KeyRound, X, ShieldAlert, CheckCircle2, UserCheck, User, Sparkles } from 'lucide-react';
import { Staff } from '../types';
import { INITIAL_STAFF } from '../data/staff';

interface AdminLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: (staff: Staff) => void;
}

export const AdminLockModal: React.FC<AdminLockModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
}) => {
  const [empIdInput, setEmpIdInput] = useState<string>('16286');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Mode: 'login' | 'first_time_change_password' | 'set_password'
  const [mode, setMode] = useState<'login' | 'first_time_change_password' | 'set_password'>('login');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Passwords map stored in localStorage: { [employeeId]: string }
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('bsm_employee_passwords');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse employee passwords:', e);
      }
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('bsm_employee_passwords', JSON.stringify(userPasswords));
  }, [userPasswords]);

  if (!isOpen) return null;

  // Find staff matching typed employee ID or fallback to first staff
  const currentStaff = INITIAL_STAFF.find((s) => s.employeeId.trim() === empIdInput.trim());
  const hasCustomPassword = currentStaff && !!userPasswords[currentStaff.employeeId];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStaff) {
      setErrorMsg('ไม่พบพนักงานจากรหัสที่ระบุ กรุณาตรวจสอบรหัสพนักงานอีกครั้ง');
      return;
    }

    const empId = currentStaff.employeeId;
    const customPass = userPasswords[empId];
    // Default initial password is their own employeeId (or '1234' for admin backward compatibility)
    const isValidDefaultPass = passwordInput === empId || passwordInput === '1234';
    const isValidCustomPass = customPass && passwordInput === customPass;

    if (isValidCustomPass) {
      // Valid custom password -> direct login
      setErrorMsg('');
      setPasswordInput('');
      const canEdit = currentStaff.employeeId === '16286' || currentStaff.employeeId === '2609';
      onSuccessLogin({ ...currentStaff, canEdit });
      onClose();
    } else if (isValidDefaultPass) {
      if (!hasCustomPassword) {
        // First-time login using ID as password -> Redirect to "หน้าเปลี่ยนรหัสเข้าใช้งาน"
        setErrorMsg('');
        setPasswordInput('');
        setMode('first_time_change_password');
      } else {
        // Already set custom password previously, but tried default pass -> Error
        setErrorMsg('รหัสผ่านไม่ถูกต้อง! คุณได้เปลี่ยนรหัสผ่านส่วนตัวไปแล้ว กรุณาใช้รหัสผ่านใหม่ของคุณ');
      }
    } else {
      setErrorMsg('รหัสผ่านไม่ถูกต้อง! (สำหรับใช้งานครั้งแรกใช้ ID พนักงานเป็นรหัสผ่าน)');
    }
  };

  const handleSetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStaff) return;

    if (!newPassword || newPassword.length < 3) {
      setErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    const empId = currentStaff.employeeId;
    setUserPasswords((prev) => ({
      ...prev,
      [empId]: newPassword,
    }));

    setSuccessMsg(`เปลี่ยนรหัสผ่านสำหรับ ${currentStaff.name} (ID: ${empId}) สำเร็จ! กำลังเข้าใช้งาน...`);
    setErrorMsg('');

    const canEdit = currentStaff.employeeId === '16286' || currentStaff.employeeId === '2609';

    setTimeout(() => {
      setSuccessMsg('');
      setNewPassword('');
      setConfirmPassword('');
      setMode('login');
      onSuccessLogin({ ...currentStaff, canEdit });
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 max-w-md w-full p-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              currentStaff?.canEdit
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
            }`}>
              {mode === 'first_time_change_password' ? (
                <Sparkles className="w-6 h-6 text-amber-500 animate-bounce" />
              ) : currentStaff?.canEdit ? (
                <Lock className="w-6 h-6" />
              ) : (
                <UserCheck className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {mode === 'first_time_change_password'
                  ? 'หน้าเปลี่ยนรหัสเข้าใช้งาน (ครั้งแรก)'
                  : mode === 'set_password'
                  ? 'ตั้งค่า / เปลี่ยนรหัสผ่านส่วนตัว'
                  : 'ยืนยันตัวตนด้วยรหัสพนักงาน'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {mode === 'first_time_change_password'
                  ? `ตั้งรหัสผ่านใหม่สำหรับคุณ ${currentStaff?.name} (ID: ${currentStaff?.employeeId})`
                  : mode === 'set_password'
                  ? `ตั้งรหัสผ่านส่วนตัวสำหรับ ID ${currentStaff?.employeeId || empIdInput}`
                  : 'พิมพ์รหัสพนักงานและรหัสผ่านเพื่อเข้าใช้งาน'}
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

        {/* Status messages */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-medium">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGIN MODE */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Employee ID Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                พิมพ์รหัสพนักงาน:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={empIdInput}
                  onChange={(e) => {
                    setEmpIdInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="กรอกรหัสพนักงาน (เช่น 16286, 2609, 29253)"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm tracking-wide focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <User className="w-4 h-4 absolute right-3.5 top-3 text-gray-400 pointer-events-none" />
              </div>

              {/* Display matched staff info */}
              {currentStaff ? (
                <div className="mt-2 p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${(currentStaff.employeeId === '16286' || currentStaff.employeeId === '2609') ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      {currentStaff.name} ({currentStaff.department})
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold ${(currentStaff.employeeId === '16286' || currentStaff.employeeId === '2609') ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                    {(currentStaff.employeeId === '16286' || currentStaff.employeeId === '2609') ? '⭐ สิทธิ์แก้ไข (Admin)' : '👁️ ดูได้อย่างเดียว'}
                  </span>
                </div>
              ) : (
                <div className="mt-1.5 text-xs text-rose-500 font-medium">
                  ⚠️ ไม่พบพนักงานที่มีรหัสนี้ในระบบ
                </div>
              )}
              <div className="mt-2 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                🔒 สิทธิ์แก้ไขตารางงานสงวนไว้เฉพาะ ID <strong className="font-mono text-amber-600">16286 (เก้า)</strong> และ <strong className="font-mono text-amber-600">2609 (แมงมุม)</strong> เท่านั้น
              </div>


            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                รหัสผ่านเข้าใช้งาน:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder={hasCustomPassword ? 'กรอกรหัสผ่านของคุณ' : `รหัสครั้งแรกคือ ID พนักงาน (${currentStaff?.employeeId || 'รหัสพนักงาน'})`}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm tracking-wider focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <KeyRound className="w-4 h-4 absolute right-3.5 top-3 text-gray-400 pointer-events-none" />
              </div>
              <p className="mt-1.5 text-[11px] text-gray-500 text-center">
                *ใช้งานครั้งแรก: ใส่รหัสผ่านเป็น <strong className="text-blue-600 font-mono">ID พนักงาน</strong> ของตนเอง ระบบจะนำไปหน้าเปลี่ยนรหัสผ่านทันที
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-xs font-medium transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={!currentStaff}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Unlock className="w-4 h-4" />
                <span>ยืนยันตัวตน</span>
              </button>
            </div>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('set_password');
                  setErrorMsg('');
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                ตั้งค่า / เปลี่ยนรหัสผ่านสำหรับ ID {empIdInput}?
              </button>
            </div>
          </form>
        )}

        {/* FIRST TIME CHANGE PASSWORD MODE & MANUAL CHANGE PASSWORD MODE */}
        {(mode === 'first_time_change_password' || mode === 'set_password') && (
          <form onSubmit={handleSetPasswordSubmit} className="space-y-4">
            {mode === 'first_time_change_password' && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                <p className="font-bold flex items-center gap-1 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  ยินดีต้อนรับการเข้าใช้งานครั้งแรก!
                </p>
                <p>
                  เนื่องจากคุณใช้ ID พนักงาน (<strong className="font-mono">{currentStaff?.employeeId}</strong>) ยืนยันตัวตนเป็นครั้งแรก กรุณาเปลี่ยนรหัสผ่านใหม่เพื่อความปลอดภัยของบัญชี
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                รหัสผ่านใหม่สำหรับ {currentStaff?.name} (ID: {currentStaff?.employeeId}):
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 3 ตัวอักษร)"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                ยืนยันรหัสผ่านใหม่:
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              {mode === 'set_password' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-xs font-medium"
                >
                  ย้อนกลับ
                </button>
              )}
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>บันทึกรหัสผ่านใหม่และเข้าใช้งาน</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

