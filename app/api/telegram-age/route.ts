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
  // Updated ranges based on real Telegram ID distribution
  if (userId < 50000000) return 11.5;      // 2013-2014 (very early)
  if (userId < 100000000) return 10.5;     // 2014-2015
  if (userId < 200000000) return 9.5;      // 2015-2016
  if (userId < 400000000) return 8;        // 2016-2017
  if (userId < 600000000) return 7;        // 2017-2018
  if (userId < 900000000) return 6;        // 2018-2019
  if (userId < 1200000000) return 5;       // 2019-2020
  if (userId < 1800000000) return 4;       // 2020-2021
  if (userId < 2500000000) return 3;       // 2021-2022
  if (userId < 4000000000) return 2;       // 2022-2023
  if (userId < 6000000000) return 1.5;     // 2023 (still eligible!)
  if (userId < 7000000000) return 1.2;     // 2023-2024 early (still eligible!)
  if (userId < 7500000000) return 0.9;     // 2024 mid (not eligible)
  return 0.5;                              // 2024 late - 2025 (not eligible)
}
