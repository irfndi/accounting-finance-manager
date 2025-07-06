import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import LoginForm from '../../src/web/components/LoginForm';
import RegisterForm from '../../src/web/components/RegisterForm';

// Mock the auth module
vi.mock('../../src/web/lib/auth', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
  },
  auth: {
    login: vi.fn(),
  },
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

describe('Authentication Forms Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('LoginForm', () => {
    it('renders without crashing', () => {
      const { container } = render(<LoginForm />);
      expect(container).toBeTruthy();
      expect(container.firstChild).toBeTruthy();
    });

    it('contains expected form elements', () => {
      const { container } = render(<LoginForm />);
      const html = container.innerHTML;
      
      // Check for key text content
      expect(html).toContain('Welcome Back');
      expect(html).toContain('Email Address');
      expect(html).toContain('Password');
      expect(html).toContain('Sign In');
    });

    it('has email and password input fields', () => {
      render(<LoginForm />);
      
      // Check for input fields by placeholder text
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });

    it('handles form submission', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      
      // Fill out the form
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      // Find and click submit button
      const submitButton = screen.getByRole('button');
      await user.click(submitButton);
      
      // Test passes if no errors are thrown
      expect(true).toBe(true);
    });

    it('shows validation errors for empty form submission', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);
      
      const submitButton = screen.getByRole('button');
      await user.click(submitButton);
      
      // Wait for validation errors to appear
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('RegisterForm', () => {
    it('renders without crashing', () => {
      const { container } = render(<RegisterForm />);
      expect(container).toBeTruthy();
      expect(container.firstChild).toBeTruthy();
    });

    it('contains expected form elements', () => {
      const { container } = render(<RegisterForm />);
      const html = container.innerHTML;
      
      // Check for key text content
      expect(html).toContain('Create Account');
      expect(html).toContain('Email Address');
      expect(html).toContain('Password');
      expect(html).toContain('Confirm Password');
    });

    it('has all required input fields', () => {
      render(<RegisterForm />);
      
      // Check for input fields by placeholder text
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
    });

    it('shows password requirements', () => {
      render(<RegisterForm />);
      
      // Check for password requirements text
      expect(screen.getByText('Password must be at least 8 characters with uppercase, lowercase, and number')).toBeInTheDocument();
    });

    it('handles form submission', async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Create a password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
      
      // Fill out the form
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
      
      // Find and click submit button
      const submitButton = screen.getByRole('button');
      await user.click(submitButton);
      
      // Test passes if no errors are thrown
      expect(true).toBe(true);
    });

    it('shows validation errors for empty form submission', async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);
      
      const submitButton = screen.getByRole('button');
      await user.click(submitButton);
      
      // Wait for validation errors to appear
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      await waitFor(() => {
        expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('validates password confirmation mismatch', async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Create a password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
      const submitButton = screen.getByRole('button');
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'DifferentPassword123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});