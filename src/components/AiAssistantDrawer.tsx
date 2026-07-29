import React, { useState } from 'react';
import { Staff, ShiftAssignment } from '../types';
import { X, Sparkles, Send, Copy, Check, Bot, User, Loader2, MessageSquare } from 'lucide-react';
import { THAI_MONTHS, formatDateKey } from '../utils/scheduleCalculator';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  staffList: Staff[];
  schedule: Record<string, ShiftAssignment>;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  currentDate,
  staffList,
  schedule,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'สวัสดีครับ! ผมคือ AI ผู้ช่วยตรวจสอบตารางกะงาน สามารถสอบถามตารางเวลา สรุปวันหยุด หรือให้ร่างข้อความแจ้งสลับกะได้เลยครับ 😊',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const monthName = THAI_MONTHS[currentDate.getMonth()];
  const year = currentDate.getFullYear() + 543;

  const quickPrompts = [
    'ใครเข้ากะเช้าวันนี้บ้าง?',
    'สรุปวันหยุดสัปดาห์นี้ให้หน่อย',
    'ร่างข้อความขอสลับกะเป็นทางการ',
    'ตรวจสอบว่ากะไหนคนน้อยกว่าปกติ',
  ];

  const handleSend = async (promptToSend?: string) => {
    const text = promptToSend || inputPrompt;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptToSend) setInputPrompt('');
    setLoading(true);

    try {
      // Prepare compact schedule context data
      const contextData = {
        selectedMonth: `${monthName} ${year}`,
        currentDate: formatDateKey(currentDate),
        staffList: staffList.map((s) => ({
          name: s.name,
          dept: s.department,
          role: s.role,
          fixedOffDay: s.fixedOffDay,
        })),
        sampleTodayShifts: staffList.map((s) => {
          const key = `${formatDateKey(currentDate)}-${s.id}`;
          const assign = schedule[key];
          return {
            name: s.name,
            shift: assign?.isOff ? 'หยุด' : `${assign?.startTime}-${assign?.endTime}`,
          };
        }),
      };

      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          contextData,
          mode: 'chat',
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const aiMsg: Message = {
        sender: 'ai',
        text: data.text || 'ขออภัย ไม่พบคำตอบ',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถติดต่อ AI ได้ในขณะนี้'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-gray-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col relative border-l border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-bold text-base">AI ผู้ช่วยตารางงาน</h2>
              <p className="text-xs text-indigo-100">ตอบคำถามด้วย Gemini 2.5 AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Prompts Bar */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-800 flex gap-2 overflow-x-auto scrollbar-thin text-xs">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="px-2.5 py-1 bg-white dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-600 shrink-0 font-medium transition-all"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Message History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[82%] p-3.5 rounded-2xl text-xs relative group ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-700'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/10 dark:border-white/10 text-[10px] opacity-70">
                  <span>{m.time}</span>
                  {m.sender === 'ai' && (
                    <button
                      onClick={() => handleCopyMessage(m.text, idx)}
                      className="hover:underline flex items-center gap-1 font-medium"
                    >
                      {copiedIdx === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>คัดลอก</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-gray-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 p-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>AI กำลังวิเคราะห์ข้อมูลตารางงาน...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="ถาม AI เกี่ยวกับตารางกะงาน..."
            disabled={loading}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !inputPrompt.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 transition-colors shadow-2xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
