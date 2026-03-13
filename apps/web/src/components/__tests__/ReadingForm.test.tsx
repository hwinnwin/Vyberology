import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadingForm } from '../ReadingForm';

describe('ReadingForm', () => {
  const mockOnGenerate = vi.fn();

  it('renders name and date of birth inputs', () => {
    render(<ReadingForm onGenerate={mockOnGenerate} isLoading={false} />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
  });

  it('validates name is at least 2 characters', async () => {
    render(<ReadingForm onGenerate={mockOnGenerate} isLoading={false} />);
    const nameInput = screen.getByLabelText(/full name/i);
    const dobInput = screen.getByLabelText(/date of birth/i);
    const submitButton = screen.getByRole('button', { name: /generate reading/i });

    await userEvent.type(nameInput, 'A');
    await userEvent.type(dobInput, '1990-01-15');
    await userEvent.click(submitButton);

    expect(mockOnGenerate).not.toHaveBeenCalled();
  });

  it('calls onGenerate with name and DOB on valid submit', async () => {
    render(<ReadingForm onGenerate={mockOnGenerate} isLoading={false} />);
    const nameInput = screen.getByLabelText(/full name/i);
    const dobInput = screen.getByLabelText(/date of birth/i);
    const submitButton = screen.getByRole('button', { name: /generate reading/i });

    await userEvent.type(nameInput, 'John Doe');
    await userEvent.type(dobInput, '1990-01-15');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalledWith('John Doe', '1990-01-15');
    });
  });

  it('shows loading state when isLoading is true', () => {
    render(<ReadingForm onGenerate={mockOnGenerate} isLoading={true} />);
    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/generating your reading/i)).toBeInTheDocument();
  });
});
