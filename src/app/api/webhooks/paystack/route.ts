import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');
    const secret = process.env.PAYSTACK_SECRET_KEY || '';

    if (secret && signature) {
      const expectedHash = crypto
        .createHmac('sha512', secret)
        .update(rawBody)
        .digest('hex');

      if (expectedHash !== signature) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    if (payload.event === 'charge.success') {
      // Idempotent webhook confirmation received
      return NextResponse.json({
        received: true,
        event: payload.event,
        reference: payload.data?.reference,
      });
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}
