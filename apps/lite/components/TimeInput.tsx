"use client";

import { useState, useCallback } from "react";
import { getCurrentTime, isValidTimeFormat } from "@/lib/numerology";

interface TimeInputProps {
  onSubmit: (time: string) => void;
  isLoading: boolean;
}

export default function TimeInput({ onSubmit, isLoading }: TimeInputProps) {
  const [time, setTime] = useState("");
  const [error, setError] = useState("");

  const handleCaptureNow = useCallback(() => {
    const currentTime = getCurrentTime();
    setTime(currentTime);
    setError("");
    onSubmit(currentTime);
  }, [onSubmit]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (!time.trim()) {
        setError("Please enter a time");
        return;
      }

      if (!isValidTimeFormat(time)) {
        setError("Please use HH:MM format (e.g., 11:11)");
        return;
      }

      onSubmit(time);
    },
    [time, onSubmit]
  );

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow typing freely, format will be validated on submit
    setTime(value);
    if (error) setError("");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={time}
            onChange={handleTimeChange}
            placeholder="HH:MM"
            maxLength={5}
            className="w-full px-6 py-4 text-3xl text-center font-mono bg-gray-900/50
                     border-2 border-primary-700/50 rounded-xl text-white
                     placeholder-gray-500 focus:outline-none focus:border-primary-500
                     focus:ring-2 focus:ring-primary-500/20 transition-all"
            disabled={isLoading}
          />
          {error && (
            <p className="absolute -bottom-6 left-0 right-0 text-center text-red-400 text-sm">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleCaptureNow}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700
                     text-white font-medium rounded-xl border border-gray-700
                     transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeWidth="2" d="M12 6v6l4 2" />
              </svg>
              Capture Now
            </span>
          </button>

          <button
            type="submit"
            disabled={isLoading || !time.trim()}
            className="flex-1 px-6 py-3 bg-primary-700 hover:bg-primary-600
                     text-white font-medium rounded-xl transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-lg shadow-primary-900/30"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Reading...
              </span>
            ) : (
              "Get Reading"
            )}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-gray-500 text-sm">
        Enter a synchronicity time you noticed (like 11:11 or 22:22)
      </p>
    </div>
  );
}
