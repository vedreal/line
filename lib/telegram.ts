export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export const sendTelegramMessage = async (chatId: number | string, text: string) => {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is not defined');
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
};
