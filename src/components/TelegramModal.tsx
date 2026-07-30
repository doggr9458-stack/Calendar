import React, { useState, useEffect } from 'react';
import { X, Send, Bell, CheckCircle2, AlertCircle, HelpCircle, Key, MessageSquare } from 'lucide-react';
import { getTelegramConfig, saveTelegramConfig, sendTelegramNotification, TelegramConfig } from '../utils/telegramNotify';

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramModal: React.FC<TelegramModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<TelegramConfig>({ botToken: '', chatId: '', enabled: false });
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getTelegramConfig());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveTelegramConfig(config);
    setStatusMsg({ type: 'success', text: 'บันทึกการตั้งค่า Telegram เรียบร้อยแล้ว!' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    setStatusMsg(null);
    saveTelegramConfig(config);

    const testMsg = `<b>🔔 ทดสอบการแจ้งเตือนจากระบบจัดตารางงาน</b>\n\n` +
      `เวลา: ${new Date().toLocaleString('th-TH')}\n` +
      `สถานะ: เชื่อมต่อ Telegram Bot สำเร็จพร้อมใช้งาน! ✨`;

    const res = await sendTelegramNotification(testMsg);
    setIsTesting(false);

    if (res.success) {
      setStatusMsg({ type: 'success', text: 'ส่งข้อความทดสอบไปยัง Telegram สำเร็จแล้ว!' });
    } else {
      setStatusMsg({ type: 'error', text: `ส่งไม่สำเร็จ: ${res.error}` });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 relative">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">การแจ้งเตือน Telegram</h2>
              <p className="text-xs text-slate-500">แจ้งเตือนอัตโนมัติเมื่อมีการเปลี่ยนแปลงตารางงาน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div className={`mb-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-bold text-slate-800">เปิดใช้งานการแจ้งเตือนอัตโนมัติ</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-slate-500" />
              <span>Bot Token (จาก @BotFather)</span>
            </label>
            <input
              type="text"
              placeholder="เช่น 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              value={config.botToken}
              onChange={(e) => setConfig({ ...config, botToken: e.target.value.trim() })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>Chat ID / Group ID (ไอดีแชทหรือกลุ่ม)</span>
            </label>
            <input
              type="text"
              placeholder="เช่น 987654321 หรือ -100123456789"
              value={config.chatId}
              onChange={(e) => setConfig({ ...config, chatId: e.target.value.trim() })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="bg-sky-50 p-3 rounded-xl border border-sky-100 text-[11px] text-sky-900 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
              <span>วิธีสร้าง Telegram Bot & หา Chat ID:</span>
            </div>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-700 pl-1">
              <li>ค้นหา <b>@BotFather</b> ใน Telegram แล้วพิมพ์ <code>/newbot</code> เพื่อสร้างบอทและรับ Token</li>
              <li>ดึงบอทเข้ากลุ่มของคุณ แล้วพิมพ์ข้อความหาบอท</li>
              <li>ดู Chat ID ได้จาก <b>@userinfobot</b> หรือ <b>@GetIDBot</b></li>
            </ol>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleTestNotification}
              disabled={isTesting || !config.botToken || !config.chatId}
              className="flex-1 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTesting ? 'กำลังทดสอบ...' : 'ทดสอบส่งข้อความ'}</span>
            </button>

            <button
              type="submit"
              className="flex-1 px-3 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              บันทึกการตั้งค่า
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
