/**
 * Error Feedback Component
 *
 * Collects user feedback on errors and recovery attempts
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, X, AlertCircle, CheckCircle } from 'lucide-react';
import { submitFeedback } from '@/lib/advanced-error-tracking';

interface ErrorFeedbackProps {
  errorId: string;
  errorMessage: string;
  recoveryAttempted?: boolean;
  recovered?: boolean;
  onClose: () => void;
}

export function ErrorFeedback({
  errorId,
  errorMessage,
  recoveryAttempted = false,
  recovered = false,
  onClose,
}: ErrorFeedbackProps) {
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (helpful: boolean) => {
    setIsSubmitting(true);

    try {
      await submitFeedback(errorId, {
        helpful,
        message: feedbackMessage.trim() || undefined,
        timestamp: Date.now(),
      });

      setSubmitted(true);

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-lf-aurora/30 bg-lf-ink/90 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-3 text-lf-aurora">
          <CheckCircle className="h-6 w-6" />
          <div>
            <p className="font-semibold">Thank you for your feedback!</p>
            <p className="text-sm text-lf-slate">This helps us improve Vyberology.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-lf-violet/30 bg-lf-ink/90 p-6 backdrop-blur-xl">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {recovered ? (
            <CheckCircle className="h-6 w-6 text-lf-aurora" />
          ) : (
            <AlertCircle className="h-6 w-6 text-lf-violet" />
          )}
          <div>
            <h3 className="font-semibold text-white">
              {recovered ? 'Issue Resolved' : 'We encountered an issue'}
            </h3>
            <p className="text-sm text-lf-slate">{errorMessage}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-lf-slate hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {recoveryAttempted && (
        <p className="text-sm text-lf-slate mb-4">
          {recovered
            ? 'We were able to recover automatically. Was this helpful?'
            : 'We tried to recover but were unsuccessful. Your feedback helps us improve.'}
        </p>
      )}

      <div className="space-y-4">
        <Textarea
          placeholder="Tell us what happened or how we can improve... (optional)"
          value={feedbackMessage}
          onChange={(e) => setFeedbackMessage(e.target.value)}
          className="bg-lf-midnight/50 border-lf-violet/30 text-white placeholder:text-lf-slate/50 resize-none"
          rows={3}
        />

        <div className="flex gap-3">
          <Button
            onClick={() => handleFeedback(true)}
            disabled={isSubmitting}
            className="flex-1 bg-lf-aurora/20 text-lf-aurora border border-lf-aurora/30 hover:bg-lf-aurora/30"
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Helpful
          </Button>
          <Button
            onClick={() => handleFeedback(false)}
            disabled={isSubmitting}
            variant="outline"
            className="flex-1 border-lf-violet/30 text-lf-slate hover:text-white hover:bg-lf-violet/10"
          >
            <ThumbsDown className="h-4 w-4 mr-2" />
            Not Helpful
          </Button>
        </div>

        <p className="text-xs text-lf-slate/70 text-center">
          Error ID: {errorId.slice(0, 16)}... • Your privacy is protected
        </p>
      </div>
    </Card>
  );
}
