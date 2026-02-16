import { ImageResponse } from '@vercel/og';

export const config = {
    runtime: 'edge',
};

export default function handler(req) {
    try {
        return new ImageResponse(
            (
                <div
                    style={{
                        fontSize: 40,
                        color: 'black',
                        background: 'white',
                        width: '100%',
                        height: '100%',
                        padding: '50px 200px',
                        textAlign: 'center',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    👋 Hello from Edge!
                </div>
            ),
            {
                width: 1200,
                height: 630,
            },
        );
    } catch (e) {
        return new Response(`Failed: ${e.message}`, {
            status: 500,
        });
    }
}
