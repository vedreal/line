import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { telegramId } = await request.json();

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Telegram ID is required' },
        { status: 400 }
      );
    }

    if (!TELEGRAM_BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return NextResponse.json(
        { accountAgeYears: estimateAccountAge(parseInt(telegramId)), error: 'Bot token not configured' },
        { status: 500 }
      );
    }

    // Get user info from Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat?chat_id=${telegramId}`,
      { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Telegram API error:', errorData);
      return NextResponse.json(
        { accountAgeYears: estimateAccountAge(parseInt(telegramId)), error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    if (!data.ok || !data.result) {
      return NextResponse.json(
        { accountAgeYears: estimateAccountAge(parseInt(telegramId)), error: 'Invalid response from Telegram' },
        { status: 500 }
      );
    }

    // Estimate based on User ID
    const userId = parseInt(telegramId);
    const accountAgeYears = estimateAccountAge(userId);

    return NextResponse.json({
      accountAgeYears: parseFloat(accountAgeYears.toFixed(2)),
      userId,
      username: data.result.username || null,
      firstName: data.result.first_name || null
    });

  } catch (error) {
    console.error('Error in telegram-age API:', error);
    return NextResponse.json(
      { accountAgeYears: 0, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function estimateAccountAge(userId: number): number {
  if (userId < 50000000) return 11;
  if (userId < 100000000) return 10;
  if (userId < 200000000) return 9;
  if (userId < 400000000) return 7.5;
  if (userId < 700000000) return 6;
  if (userId < 1000000000) return 5;
  if (userId < 1500000000) return 3.5;
  if (userId < 2000000000) return 2.5;
  if (userId < 3000000000) return 2;
  if (userId < 5000000000) return 1.2;
  if (userId < 6500000000) return 0.8;
  if (userId < 7500000000) return 0.5;
  return 0.2;
}
