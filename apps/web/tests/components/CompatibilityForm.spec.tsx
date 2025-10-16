import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { CompatibilityForm } from '@/components/CompatibilityForm';

describe('CompatibilityForm Component', () => {
  it('should render form fields for both people', () => {
    const mockOnGenerate = vi.fn();
    render(<CompatibilityForm onGenerate={mockOnGenerate} isLoading={false} />);

    // Person A fields
    expect(screen.getByText(/person a/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/full name/i)[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText(/date of birth/i)[0]).toBeInTheDocument();

    // Person B fields
    expect(screen.getByText(/person b/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/full name/i)[1]).toBeInTheDocument();
    expect(screen.getAllByLabelText(/date of birth/i)[1]).toBeInTheDocument();

    // Submit button
    expect(screen.getByRole('button', { name: /generate compatibility reading/i })).toBeInTheDocument();
  });

  it('should display helper text when fields are empty', () => {
    const mockOnGenerate = vi.fn();
    render(<CompatibilityForm onGenerate={mockOnGenerate} isLoading={false} />);

    expect(screen.getByText(/enter both names and dates of birth/i)).toBeInTheDocument();
  });

  it('should show validation error for empty Person A name', async () => {
    const mockOnGenerate = vi.fn();
    render(<CompatibilityForm onGenerate={mockOnGenerate} isLoading={false} />);

    const submitButton = screen.getByRole('button', { name: /generate compatibility reading/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a real name for person a/i)).toBeInTheDocument();
    });

    expect(mockOnGenerate).not.toHaveBeenCalled();
  });

  it('should show validation error for short Person A name', async () => {
    const mockOnGenerate = vi.fn();
    render(<CompatibilityForm onGenerate={mockOnGenerate} isLoading={false} />);

    const nameInputs = screen.getAllByLabelText(/full name/i);
    fireEvent.change(nameInputs[0], { target: { value: 'A' } });

    const submitButton = screen.getByRole('button', { name: /generate compatibility reading/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a real name for person a/i)).toBeInTheDocument();
    });

    expect(mockOnGenerate).not.toHaveBeenCalled();
  });

  it('should show validation error for invalid Person A date', async () => {
    const mockOnGenerate = vi.fn();
    render(<CompatibilityForm onGenerate={mockOnGenerate} isLoading={false} />);

    const nameInputs = screen.getAllByLabelText(/full name/i);
    const dobInputs = screen.getAllByLabelText(/date of birth/i);

    fireEvent.change(nameInputs[0], { target: { value: 'John Doe' } });
    fireEvent.change(dobInputs[0], { target: { value: 'invalid-date' } });

    const submitButton = screen.getByRole('button', { name: /generate compatibility reading/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // There might be multiple "valid date" messages
      const errorMessages = screen.queryAllByText(/please enter a valid date/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    expect(mockOnGenerate).not.toHaveBeenCalled();
  });

  it('should show validation error for empty Person B name', async () => {
    const mockOnGenerate = vi.fn();
    render(<CompatibilityForm onGenerate={mockOnGenerate} isLoading={false} />);

    const nameInputs = screen.getAllByLabelText(/full name/i);
    const dobInputs = screen.getAllByLabelText(/date of birth/i);

    // Fill Person A but leave Person B empty
    fireEvent.change(nameInputs[0], { target: { value: 'John Doe' } });
    fireEvent.change(dobInputs[0], { target: { value: '1990-05-15' } });

    const submitButton = screen.getByRole('button', { name: /generate compatibility reading/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a real name for person b/i)).toBeInTheDocument();
    });

    expect(mockOnGenerate).not.toHaveBeenCalled();
  });

  it('should show validation error for invalid Person B date', async () => {
    const mockOnGenerate = vi.fn();
    render(<CompatibilityForm onGenerate={mockOnGenerate} isLoading={false} />);

    const nameInputs = screen.getAllByLabelText(/full name/i);
    const dobInputs = screen.getAllByLabelText(/date of birth/i);

    fireEvent.change(nameInputs[0], { target: { value: 'John Doe' } });
    fireEvent.change(dobInputs[0], { target: { value: '1990-05-15' } });
    fireEvent.change(nameInputs[1], { target: { value: 'Jane Smith' } });
    fireEvent.change(dobInputs[1], { target: { value: 'invalid' } });

    const submitButton = screen.getByRole('button', { name: /generate compatibility reading/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // There might be multiple "valid date" messages, just check that at least one exists
      const errorMessages = screen.queryAllByText(/please enter a valid date/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    expect(mockOnGenerate).not.toHaveBeenCalled();
  });

  it('should call onGenerate with valid inputs for both people', async () => {
    const mockOnGenerate = vi.fn();
    render(<CompatibilityForm onGenerate={mockOnGenerate} isLoading={false} />);

    const nameInputs = screen.getAllByLabelText(/full name/i);
    const dobInputs = screen.getAllByLabelText(/date of birth/i);

    fireEvent.change(nameInputs[0], { target: { value: 'John Doe' } });
    fireEvent.change(dobInputs[0], { target: { value: '1990-05-15' } });
    fireEvent.change(nameInputs[1], { target: { value: 'Jane Smith' } });
    fireEvent.change(dobInputs[1], { target: { value: '1992-08-20' } });

    const submitButton = screen.getByRole('button', { name: /generate compatibility reading/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalledWith(
        'John Doe',
        '1990-05-15',
        'Jane Smith',
        '1992-08-20'
      );
    });
  });

  it('should disable submit button when loading', () => {
    const mockOnGenerate = vi.fn();
    render(<CompatibilityForm onGenerate={mockOnGenerate} isLoading={true} />);

    const submitButton = screen.getByRole('button', { name: /generating compatibility/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show loading text when loading', () => {
    const mockOnGenerate = vi.fn();
    render(<CompatibilityForm onGenerate={mockOnGenerate} isLoading={true} />);

    expect(screen.getByText(/generating compatibility/i)).toBeInTheDocument();
  });

  it('should clear validation errors when corrected', async () => {
    const mockOnGenerate = vi.fn();
    render(<CompatibilityForm onGenerate={mockOnGenerate} isLoading={false} />);

    // Submit with empty fields to trigger errors
    const submitButton = screen.getByRole('button', { name: /generate compatibility reading/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a real name for person a/i)).toBeInTheDocument();
    });

    // Fill in valid data
    const nameInputs = screen.getAllByLabelText(/full name/i);
    const dobInputs = screen.getAllByLabelText(/date of birth/i);

    fireEvent.change(nameInputs[0], { target: { value: 'John Doe' } });
    fireEvent.change(dobInputs[0], { target: { value: '1990-05-15' } });
    fireEvent.change(nameInputs[1], { target: { value: 'Jane Smith' } });
    fireEvent.change(dobInputs[1], { target: { value: '1992-08-20' } });

    // Submit again
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText(/please enter a real name for person a/i)).not.toBeInTheDocument();
      expect(mockOnGenerate).toHaveBeenCalled();
    });
  });

  it('should accept names with special characters', async () => {
    const mockOnGenerate = vi.fn();
    render(<CompatibilityForm onGenerate={mockOnGenerate} isLoading={false} />);

    const nameInputs = screen.getAllByLabelText(/full name/i);
    const dobInputs = screen.getAllByLabelText(/date of birth/i);

    fireEvent.change(nameInputs[0], { target: { value: "Mary-Jane O'Brien" } });
    fireEvent.change(dobInputs[0], { target: { value: '1990-05-15' } });
    fireEvent.change(nameInputs[1], { target: { value: 'José García' } });
    fireEvent.change(dobInputs[1], { target: { value: '1992-08-20' } });

    const submitButton = screen.getByRole('button', { name: /generate compatibility reading/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalledWith(
        "Mary-Jane O'Brien",
        '1990-05-15',
        'José García',
        '1992-08-20'
      );
    });
  });

  it('should have proper accessibility attributes', () => {
    const mockOnGenerate = vi.fn();
    render(<CompatibilityForm onGenerate={mockOnGenerate} isLoading={false} />);

    const nameInputs = screen.getAllByLabelText(/full name/i);
    const dobInputs = screen.getAllByLabelText(/date of birth/i);

    nameInputs.forEach(input => {
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('placeholder');
    });

    dobInputs.forEach(input => {
      expect(input).toHaveAttribute('type', 'date');
    });
  });
});
