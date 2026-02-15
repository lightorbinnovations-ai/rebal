import { ImageResponse } from '@vercel/og';

export const config = {
    runtime: 'nodejs', // Switched to Node.js to test if Edge is the issue
};

export default async function handler(request: Request) {
    console.log('Test OG: Handler started');
    try {
        console.log('Test OG: Generatng response...');
        const response = new ImageResponse(
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
                    Test Image (Node.js)
                </div>
            ),
            {
                width: 1200,
                height: 630,
            },
        );
        console.log('Test OG: Response generated successfully');
        return response;
    } catch (error) {
        console.error('Test OG: Error generating image:', error);
        return new Response(JSON.stringify({
            error: 'Failed to generate image',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
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
