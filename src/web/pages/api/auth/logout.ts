import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // In a real implementation, you might want to:
    // 1. Invalidate the JWT token on the server side (add to blacklist)
    // 2. Clear any server-side session data
    // 3. Log the logout event
    
    // For now, we'll just return a success response
    // The client will handle clearing localStorage
    
    return new Response(
      JSON.stringify({
        message: 'Logout successful',
        success: true
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Logout failed',
        success: false 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};