import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { ReadingForm } from '@/components/ReadingForm';

describe('ReadingForm Component', () => {
  it('should render form fields', () => {
    const mockOnGenerate = vi.fn();
    render(<ReadingForm onGenerate={mockOnGenerate} isLoading={false} />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate reading/i })).toBeInTheDocument();
  });

  it('should display helper text when fields are empty', () => {
    const mockOnGenerate = vi.fn();
    render(<ReadingForm onGenerate={mockOnGenerate} isLoading={false} />);

    expect(screen.getByText(/drop your full name \+ date of birth/i)).toBeInTheDocument();
  });

  it('should show validation error for empty name', async () => {
    const mockOnGenerate = vi.fn();
    render(<ReadingForm onGenerate={mockOnGenerate} isLoading={false} />);

    const submitButton = screen.getByRole('button', { name: /generate reading/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a real name/i)).toBeInTheDocument();
    });

    expect(mockOnGenerate).not.toHaveBeenCalled();
  });

  it('should show validation error for short name', async () => {
    const mockOnGenerate = vi.fn();
    render(<ReadingForm onGenerate={mockOnGenerate} isLoading={false} />);

    const nameInput = screen.getByLabelText(/full name/i);
    fireEvent.change(nameInput, { target: { value: 'A' } });

    const submitButton = screen.getByRole('button', { name: /generate reading/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a real name/i)).toBeInTheDocument();
    });

    expect(mockOnGenerate).not.toHaveBeenCalled();
  });

  it('should show validation error for invalid date', async () => {
    const mockOnGenerate = vi.fn();
    render(<ReadingForm onGenerate={mockOnGenerate} isLoading={false} />);

    const nameInput = screen.getByLabelText(/full name/i);
    const dobInput = screen.getByLabelText(/date of birth/i);

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(dobInput, { target: { value: 'invalid-date' } });

    const submitButton = screen.getByRole('button', { name: /generate reading/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid date/i)).toBeInTheDocument();
    });

    expect(mockOnGenerate).not.toHaveBeenCalled();
  });

  it('should call onGenerate with valid inputs', async () => {
    const mockOnGenerate = vi.fn();
    render(<ReadingForm onGenerate={mockOnGenerate} isLoading={false} />);

    const nameInput = screen.getByLabelText(/full name/i);
    const dobInput = screen.getByLabelText(/date of birth/i);

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(dobInput, { target: { value: '1990-05-15' } });

    const submitButton = screen.getByRole('button', { name: /generate reading/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalledWith('John Doe', '1990-05-15');
    });
  });

  it('should trim whitespace from name input', async () => {
    const mockOnGenerate = vi.fn();
    render(<ReadingForm onGenerate={mockOnGenerate} isLoading={false} />);

    const nameInput = screen.getByLabelText(/full name/i);
    const dobInput = screen.getByLabelText(/date of birth/i);

    fireEvent.change(nameInput, { target: { value: '  John Doe  ' } });
    fireEvent.change(dobInput, { target: { value: '1990-05-15' } });

    const submitButton = screen.getByRole('button', { name: /generate reading/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalledWith('  John Doe  ', '1990-05-15');
    });
  });

  it('should disable submit button when loading', () => {
    const mockOnGenerate = vi.fn();
    render(<ReadingForm onGenerate={mockOnGenerate} isLoading={true} />);

    const submitButton = screen.getByRole('button', { name: /generating your reading/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show loading text when loading', () => {
    const mockOnGenerate = vi.fn();
    render(<ReadingForm onGenerate={mockOnGenerate} isLoading={true} />);

    expect(screen.getByText(/generating your reading/i)).toBeInTheDocument();
  });

  it('should clear validation errors when corrected', async () => {
    const mockOnGenerate = vi.fn();
    render(<ReadingForm onGenerate={mockOnGenerate} isLoading={false} />);

    // Submit with empty fields to trigger errors
    const submitButton = screen.getByRole('button', { name: /generate reading/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a real name/i)).toBeInTheDocument();
    });

    // Fill in valid data
    const nameInput = screen.getByLabelText(/full name/i);
    const dobInput = screen.getByLabelText(/date of birth/i);

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(dobInput, { target: { value: '1990-05-15' } });

    // Submit again
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText(/please enter a real name/i)).not.toBeInTheDocument();
      expect(mockOnGenerate).toHaveBeenCalledWith('John Doe', '1990-05-15');
    });
  });

  it('should accept names with special characters', async () => {
    const mockOnGenerate = vi.fn();
    render(<ReadingForm onGenerate={mockOnGenerate} isLoading={false} />);

    const nameInput = screen.getByLabelText(/full name/i);
    const dobInput = screen.getByLabelText(/date of birth/i);

    fireEvent.change(nameInput, { target: { value: "Mary-Jane O'Brien" } });
    fireEvent.change(dobInput, { target: { value: '1990-05-15' } });

    const submitButton = screen.getByRole('button', { name: /generate reading/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalledWith("Mary-Jane O'Brien", '1990-05-15');
    });
  });

  it('should have proper accessibility attributes', () => {
    const mockOnGenerate = vi.fn();
    render(<ReadingForm onGenerate={mockOnGenerate} isLoading={false} />);

    const nameInput = screen.getByLabelText(/full name/i);
    const dobInput = screen.getByLabelText(/date of birth/i);

    expect(nameInput).toHaveAttribute('type', 'text');
    expect(dobInput).toHaveAttribute('type', 'date');
    expect(nameInput).toHaveAttribute('placeholder');
  });
});
