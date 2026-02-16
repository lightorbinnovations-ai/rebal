import { ImageResponse } from '@vercel/og';

export const config = {
    runtime: 'nodejs',
};

export default function handler(request: Request) {
    try {
        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#E11D48',
                        color: 'white',
                        fontSize: 60,
                        fontWeight: 'bold',
                    }}
                >
                    Test Image (Should Work)
                </div>
            ),
            {
                width: 1200,
                height: 630,
            },
        );
    } catch (e: any) {
        return new Response(`Failed: ${e.message}`, { status: 500 });
    }
}
