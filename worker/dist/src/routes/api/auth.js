import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { users, createDatabase } from '@finance-manager/db';
import { authMiddleware, getCurrentUser } from '../../middleware/auth';
const authRouter = new Hono();
// Helper to get session duration from environment (default 7 days)
const getSessionDuration = (env) => {
    return env.AUTH_SESSION_DURATION || '7d';
};
// Registration endpoint
authRouter.post('/register', async (c) => {
    const db = createDatabase(c.env.FINANCE_MANAGER_DB);
    const jwtSecret = c.env.JWT_SECRET;
    try {
        const { email, password, name } = await c.req.json();
        if (!email || !password) {
            return c.json({ error: 'Missing required fields', message: 'Email and password are required' }, 400);
        }
        const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
        if (existingUser) {
            return c.json({ error: 'User already exists', message: 'A user with this email already exists' }, 409);
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const [user] = await db.insert(users).values({
            email,
            password: hashedPassword,
            displayName: name || null,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();
        const sessionDuration = getSessionDuration(c.env);
        const token = await sign({ id: user.id, email: user.email, role: 'USER' }, jwtSecret);
        const sessionKey = `session:${user.id}`;
        await c.env.FINANCE_MANAGER_CACHE.put(sessionKey, JSON.stringify({
            userId: user.id,
            email: user.email,
            name: user.displayName,
            createdAt: new Date().toISOString(),
        }), { expirationTtl: 7 * 24 * 60 * 60 });
        return c.json({
            message: 'User registered successfully',
            user: { id: user.id, email: user.email, name: user.displayName, emailVerified: user.emailVerified, createdAt: user.createdAt },
            token,
            expiresIn: sessionDuration,
        }, 201);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Registration error:', errorMessage);
        return c.json({ error: 'Registration failed', message: errorMessage }, 500);
    }
});
// Login endpoint
authRouter.post('/login', async (c) => {
    const db = createDatabase(c.env.FINANCE_MANAGER_DB);
    const jwtSecret = c.env.JWT_SECRET;
    try {
        const { email, password } = await c.req.json();
        if (!email || !password) {
            return c.json({ error: 'Missing credentials', message: 'Email and password are required' }, 400);
        }
        const userResult = await db.select().from(users).where(eq(users.email, email));
        const user = userResult[0];
        if (!user) {
            return c.json({ error: 'Invalid credentials', message: 'Email or password is incorrect' }, 401);
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return c.json({ error: 'Invalid credentials', message: 'Email or password is incorrect' }, 401);
        }
        const sessionDuration = getSessionDuration(c.env);
        const token = await sign({ id: user.id, email: user.email, role: 'USER' }, jwtSecret);
        const sessionKey = `session:${user.id}`;
        await c.env.FINANCE_MANAGER_CACHE.put(sessionKey, JSON.stringify({
            userId: user.id,
            email: user.email,
            name: user.displayName,
            createdAt: new Date().toISOString(),
        }), { expirationTtl: 7 * 24 * 60 * 60 });
        await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id));
        return c.json({
            message: 'Login successful',
            user: { id: user.id, email: user.email, name: user.displayName, emailVerified: user.emailVerified, lastLoginAt: new Date() },
            token,
            expiresIn: sessionDuration,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Login error:', errorMessage);
        return c.json({ error: 'Login failed', message: errorMessage }, 500);
    }
});
// Logout endpoint
authRouter.post('/logout', authMiddleware, async (c) => {
    const user = getCurrentUser(c);
    try {
        const sessionKey = `session:${user.id}`;
        await c.env.FINANCE_MANAGER_CACHE.delete(sessionKey);
        return c.json({ message: 'Logout successful' });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        console.error('Logout error:', errorMessage);
        return c.json({ error: 'Logout failed', message: 'An unexpected error occurred' }, 500);
    }
});
// Get current user profile
authRouter.get('/profile', authMiddleware, async (c) => {
    const user = getCurrentUser(c);
    return c.json({ user });
});
// Update user profile
authRouter.put('/profile', authMiddleware, async (c) => {
    const db = c.get('db');
    const user = getCurrentUser(c);
    try {
        const { name } = await c.req.json();
        const [updatedUser] = await db.update(users).set({ displayName: name, updatedAt: new Date() }).where(eq(users.id, user.id)).returning();
        return c.json({
            message: 'Profile updated successfully',
            user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.displayName, emailVerified: updatedUser.emailVerified, updatedAt: updatedUser.updatedAt },
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Profile update error:', errorMessage);
        return c.json({ error: 'Profile update failed', message: errorMessage }, 500);
    }
});
// Change password endpoint
authRouter.put('/password', authMiddleware, async (c) => {
    const db = c.get('db');
    const user = getCurrentUser(c);
    try {
        const { currentPassword, newPassword } = await c.req.json();
        if (!currentPassword || !newPassword) {
            return c.json({ error: 'Missing required fields', message: 'Current password and new password are required' }, 400);
        }
        const dbUser = await db.select().from(users).where(eq(users.id, user.id)).get();
        if (!dbUser) {
            return c.json({ error: 'User not found' }, 404); // Should not happen if authMiddleware works
        }
        const isValidPassword = await bcrypt.compare(currentPassword, dbUser.password);
        if (!isValidPassword) {
            return c.json({ error: 'Invalid current password', message: 'Current password is incorrect' }, 401);
        }
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await db.update(users).set({ password: hashedNewPassword, updatedAt: new Date() }).where(eq(users.id, user.id));
        return c.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Password change error:', errorMessage);
        return c.json({ error: 'Password change failed', message: errorMessage }, 500);
    }
});
// Validate session endpoint
authRouter.get('/validate', authMiddleware, async (c) => {
    const user = getCurrentUser(c);
    return c.json({ valid: true, user });
});
export default authRouter;
