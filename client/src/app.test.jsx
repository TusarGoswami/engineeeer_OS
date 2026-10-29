import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Button } from './components/Button.jsx';
import { Card, CardTitle, CardContent } from './components/Card.jsx';
import { Badge } from './components/Badge.jsx';
import { Input } from './components/Input.jsx';
import { LoginPage } from './features/auth/LoginPage.jsx';
import { AuthProvider } from './features/auth/AuthContext.jsx';

describe('Shared UI Kit Tests', () => {
  it('renders Button with primary variant and handles click', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit Action</Button>);

    const button = screen.getByRole('button', { name: /submit action/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders Button in loading state with disabled attribute', () => {
    render(<Button isLoading>Processing</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders Card with header and content', () => {
    render(
      <Card>
        <CardTitle>Algorithm Challenge</CardTitle>
        <CardContent>Solve Two Sum in O(N) time complexity.</CardContent>
      </Card>
    );

    expect(screen.getByText('Algorithm Challenge')).toBeInTheDocument();
    expect(screen.getByText(/solve two sum/i)).toBeInTheDocument();
  });

  it('renders Badge with correct label', () => {
    render(<Badge variant="brand">Student</Badge>);
    expect(screen.getByText('Student')).toBeInTheDocument();
  });

  it('renders Input with label, placeholder and error message', () => {
    render(
      <Input
        label="University Email"
        placeholder="user@mit.edu"
        error="Invalid university domain"
      />
    );

    expect(screen.getByLabelText(/university email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('user@mit.edu')).toBeInTheDocument();
    expect(screen.getByText('Invalid university domain')).toBeInTheDocument();
  });
});

describe('LoginPage Component', () => {
  it('renders login form elements', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
