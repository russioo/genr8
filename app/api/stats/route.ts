import { NextResponse } from 'next/server';
import { getStatsFromDB } from '@/lib/stats-db';

export async function GET() {
  try {
    const stats = await getStatsFromDB();
    
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Failed to get stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', message: error.message },
      { status: 500 }
    );
  }
}

