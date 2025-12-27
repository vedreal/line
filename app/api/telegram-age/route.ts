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
        { accountAgeYears: 0, error: 'Bot token not configured' },
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
        { accountAgeYears: 0, error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    if (!data.ok || !data.result) {
      return NextResponse.json(
        { accountAgeYears: 0, error: 'Invalid response from Telegram' },
        { status: 500 }
      );
    }

    // Telegram user ID is assigned sequentially
    // Lower IDs = older accounts
    // Rough estimation based on ID ranges:
    const userId = parseInt(telegramId);
    let accountAgeYears = 0;

    if (userId < 100000000) {
      // Very old accounts (2013-2015) - ID < 100M
      accountAgeYears = 9 + Math.random() * 3; // 9-12 years
    } else if (userId < 500000000) {
      // Old accounts (2015-2018) - ID 100M-500M
      accountAgeYears = 6 + Math.random() * 3; // 6-9 years
    } else if (userId < 1000000000) {
      // Medium accounts (2018-2020) - ID 500M-1B
      accountAgeYears = 4 + Math.random() * 2; // 4-6 years
    } else if (userId < 2000000000) {
      // Recent accounts (2020-2022) - ID 1B-2B
      accountAgeYears = 2 + Math.random() * 2; // 2-4 years
    } else if (userId < 5000000000) {
      // New accounts (2022-2023) - ID 2B-5B
      accountAgeYears = 1 + Math.random(); // 1-2 years
    } else if (userId < 7000000000) {
      // Very new accounts (2023-2024) - ID 5B-7B
      accountAgeYears = 0.5 + Math.random() * 0.5; // 0.5-1 years
    } else {
      // Brand new accounts (2024+) - ID > 7B
      accountAgeYears = Math.random() * 0.5; // 0-0.5 years
    }

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
