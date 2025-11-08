// Cron-compatible endpoint for auto-release
// This endpoint can be called by external cron services like Vercel Cron, GitHub Actions, or cron-job.org
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Security: Check for cron secret token (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'safient-cron-secret-2024';
    
    // Verify authorization if secret is set
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('⚠️ [CRON-AUTO-RELEASE] Unauthorized access attempt');
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    console.log('🕐 [CRON-AUTO-RELEASE] Cron job triggered at:', new Date().toISOString());
    
    // Call the auto-release GET endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/Algorand/Algo-smart/api/auto-release`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    console.log('✅ [CRON-AUTO-RELEASE] Auto-release completed:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Cron job executed successfully',
      autoReleaseResult: data,
      executedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [CRON-AUTO-RELEASE] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Cron job failed'
    }, { status: 500 });
  }
}

// Also support POST for flexibility
export async function POST(request: Request) {
  return GET(request);
}

