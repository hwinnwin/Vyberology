import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { submitFeedback, FeedbackType } from "@/services/feedback";
import { MessageSquare, Bug, Lightbulb, TrendingUp, Send } from "lucide-react";

interface FeedbackDialogProps {
  trigger?: React.ReactNode;
}

export function FeedbackDialog({ trigger }: FeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const feedbackTypes = [
    { value: "bug", label: "Bug Report", icon: Bug, color: "text-red-600" },
    { value: "feature", label: "Feature Request", icon: Lightbulb, color: "text-yellow-600" },
    { value: "improvement", label: "Improvement", icon: TrendingUp, color: "text-blue-600" },
    { value: "other", label: "Other", icon: MessageSquare, color: "text-gray-600" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and description.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await submitFeedback({
        type,
        title: title.trim(),
        description: description.trim(),
        email: email.trim() || undefined,
        pageUrl: window.location.href,
      });

      toast({
        title: "Thank You!",
        description: "Your feedback has been submitted. We'll review it and get back to you if needed.",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setEmail("");
      setType("feature");
      setOpen(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Submission Failed",
        description: "We couldn't submit your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MessageSquare className="w-4 h-4 mr-2" />
            Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            Share Your Feedback
          </DialogTitle>
          <DialogDescription>
            We're always improving. Report bugs, request features, or suggest improvements.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Feedback Type */}
          <div className="space-y-2">
            <Label htmlFor="type">What would you like to share?</Label>
            <Select value={type} onValueChange={(value) => setType(value as FeedbackType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {feedbackTypes.map((feedbackType) => {
                  const Icon = feedbackType.icon;
                  return (
                    <SelectItem key={feedbackType.value} value={feedbackType.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${feedbackType.color}`} />
                        <span>{feedbackType.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Brief summary of your feedback"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
            <p className="text-xs text-gray-500">{title.length}/200 characters</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Tell us more... What happened? What would you like to see? How can we improve?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              maxLength={2000}
              required
            />
            <p className="text-xs text-gray-500">{description.length}/2000 characters</p>
          </div>

          {/* Email (optional) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com - for follow-up questions"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              We'll only contact you if we need more details about your feedback.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Your voice matters!</strong> We read every piece of feedback and use it to make
            Vyberology better. Thank you for helping us improve.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
