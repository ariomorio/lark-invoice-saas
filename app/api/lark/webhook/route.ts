import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    return NextResponse.json({ status: 'ok', message: 'Webhook endpoint is active' });
}

export async function POST(request: NextRequest) {
    try {
        console.log('--- Webhook Request Start ---');
        const rawBody = await request.text();
        console.log('Raw Body:', rawBody);

        let body;
        try {
            body = JSON.parse(rawBody);
        } catch (e) {
            console.error('JSON Parse Error:', e);
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        // URL Verification
        if (body && body.type === 'url_verification') {
            console.log('Handling URL verification challenge');
            return NextResponse.json({
                challenge: body.challenge,
            });
        }

        console.log('Not a verification header, returning OK');
        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Internal Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
