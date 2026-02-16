export const config = {
    runtime: 'edge', // Back to edge to test basic connectivity
};

export default function handler(request: Request) {
    return new Response('Hello from Vercel Edge Function!', {
        status: 200,
        headers: {
            'content-type': 'text/plain',
        },
    });
}
