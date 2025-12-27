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

    // Multi-signal estimation
    const userId = parseInt(telegramId);
    const username = data.result.username || '';
    
    // Base estimation from ID (more generous)
    let accountAgeYears = estimateAccountAge(userId);
    
    // SIGNAL 1: Short username bonus (old accounts have short/premium usernames)
    if (username.length > 0 && username.length <= 5) {
      accountAgeYears += 0.5; // +6 months bonus
      console.log(`Short username bonus: +0.5 years for @${username}`);
    }
    
    // SIGNAL 2: Numeric-only username (usually older accounts)
    if (username.length > 0 && /^\d+$/.test(username)) {
      accountAgeYears += 0.3; // +3-4 months bonus
      console.log(`Numeric username bonus: +0.3 years for @${username}`);
    }
    
    // SIGNAL 3: Username with no numbers (premium/early usernames)
    if (username.length > 0 && username.length <= 8 && !/\d/.test(username)) {
      accountAgeYears += 0.3; // +3-4 months bonus
      console.log(`Clean username bonus: +0.3 years for @${username}`);
    }

    // Cap at reasonable maximum
    if (accountAgeYears > 12) accountAgeYears = 12;

    return NextResponse.json({
      accountAgeYears: parseFloat(accountAgeYears.toFixed(2)),
      userId,
      username: data.result.username || null,
      firstName: data.result.first_name || null,
      estimationMethod: 'multi-signal'
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
  // More generous ranges - better UX
  // Based on real-world Telegram ID distribution patterns
  
  if (userId < 100000000) return 11;       // 2013-2015 (definitely old)
  if (userId < 300000000) return 9;        // 2015-2016
  if (userId < 500000000) return 7.5;      // 2016-2017
  if (userId < 800000000) return 6.5;      // 2017-2018
  if (userId < 1200000000) return 5.5;     // 2018-2019
  if (userId < 1800000000) return 4.5;     // 2019-2020
  if (userId < 2500000000) return 3.5;     // 2020-2021
  if (userId < 3500000000) return 2.8;     // 2021-2022
  if (userId < 5000000000) return 2.2;     // 2022-2023
  if (userId < 6000000000) return 1.7;     // 2023 early-mid (ELIGIBLE)
  if (userId < 7000000000) return 1.3;     // 2023 late - 2024 early (ELIGIBLE)
  if (userId < 7500000000) return 1.0;     // 2024 mid (borderline ELIGIBLE)
  if (userId < 8000000000) return 0.8;     // 2024 late
  
  return 0.5; // 2024 very late - 2025
}
