import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as { email: string };
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email address' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // For security, always return success even if email doesn't exist
    // This prevents email enumeration attacks
    console.log(`Password reset requested for email: ${email}`);
    
    // TODO: Implement actual password reset logic:
    // 1. Check if user exists in database
    // 2. Generate secure reset token
    // 3. Store token with expiration
    // 4. Send email with reset link
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'If an account with that email exists, we\'ve sent you a password reset link.'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Forgot password error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred. Please try again later.' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};