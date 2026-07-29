// Telegram Notification Utility

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export function getTelegramConfig(): TelegramConfig {
  try {
    const saved = localStorage.getItem('telegram_config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse telegram config:', e);
  }
  return {
    botToken: '',
    chatId: '',
    enabled: false,
  };
}

export function saveTelegramConfig(config: TelegramConfig): void {
  localStorage.setItem('telegram_config', JSON.stringify(config));
}

export async function sendTelegramNotification(text: string): Promise<{ success: boolean; error?: string }> {
  const config = getTelegramConfig();
  if (!config.enabled || !config.botToken || !config.chatId) {
    return { success: false, error: 'ยังไม่ได้เปิดใช้งาน หรือยังไม่ได้ตั้งค่า Telegram Bot Token / Chat ID' };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    if (data.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.description || 'เกิดข้อผิดพลาดจาก Telegram API' };
    }
  } catch (err: any) {
    console.error('Telegram notification fetch error:', err);
    return { success: false, error: err.message || 'ไม่สามารถเชื่อมต่อกับ Telegram API ได้' };
  }
}
