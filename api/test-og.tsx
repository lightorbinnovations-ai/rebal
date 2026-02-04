import { ImageResponse } from '@vercel/og';

export const config = {
    runtime: 'edge',
};

export default async function handler() {
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
                        backgroundColor: '#0F172A',
                        color: 'white',
                        fontSize: 60,
                        fontWeight: 'bold',
                    }}
                >
                    Test Image
                </div>
            ),
            {
                width: 1200,
                height: 630,
            },
        );
    } catch (error) {
        return new Response(JSON.stringify({
            error: 'Failed to generate image',
            message: error instanceof Error ? error.message : String(error)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
