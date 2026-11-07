import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reference, matricNumber, roleType } = body;

    if (!reference || !matricNumber) {
      return NextResponse.json(
        { error: 'Missing required payment reference or matriculation number.' },
        { status: 400 }
      );
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    // If PAYSTACK_SECRET_KEY is configured in production, verify against live Paystack API
    if (paystackSecret) {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      if (!response.ok || result?.data?.status !== 'success') {
        return NextResponse.json(
          {
            verified: false,
            status: result?.data?.status || 'failed',
            message: 'Transaction could not be verified with Paystack.',
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        verified: true,
        reference: result.data.reference,
        amountNaira: Math.round(result.data.amount / 100),
        paidAt: result.data.paid_at,
        channel: result.data.channel,
      });
    }

    // Fallback when running in pre-key local/staging mode
    return NextResponse.json({
      verified: true,
      reference,
      matricNumber,
      roleType,
      paidAt: new Date().toISOString(),
      mode: 'staging_verified',
    });
  } catch {
    return NextResponse.json(
      { error: 'Server error while verifying payment.' },
      { status: 500 }
    );
  }
}
