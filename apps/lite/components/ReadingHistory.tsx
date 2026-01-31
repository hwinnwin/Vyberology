"use client";

import { useState, useEffect } from "react";
import { Reading, ELEMENT_INFO, Element } from "@/lib/types";
import { getReadingHistory, deleteReading } from "@/lib/supabase";

interface ReadingHistoryProps {
  refreshTrigger?: number;
  onSelectReading?: (reading: Reading) => void;
}

export default function ReadingHistory({
  refreshTrigger,
  onSelectReading,
}: ReadingHistoryProps) {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const history = await getReadingHistory(10);
      setReadings(history);
      setLoading(false);
    }
    fetchHistory();
  }, [refreshTrigger]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this reading?")) {
      const success = await deleteReading(id);
      if (success) {
        setReadings((prev) => prev.filter((r) => r.id !== id));
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto mt-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (readings.length === 0) {
    return null;
  }

  const visibleReadings = expanded ? readings : readings.slice(0, 3);

  return (
    <div className="w-full max-w-md mx-auto mt-10">
      <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-4 flex items-center gap-2">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Recent Readings
      </h2>

      <div className="space-y-2">
        {visibleReadings.map((reading) => {
          const element = reading.element as Element;
          const elementInfo = ELEMENT_INFO[element] || ELEMENT_INFO.fire;

          return (
            <div
              key={reading.id}
              onClick={() => onSelectReading?.(reading)}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-4
                       hover:border-primary-700/50 transition-all cursor-pointer
                       group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{elementInfo.emoji}</span>
                  <div>
                    <p className="text-white font-mono text-lg">
                      {reading.input_time}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {formatDate(reading.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-primary-400">
                    {reading.core_number}
                  </span>
                  <button
                    onClick={(e) => handleDelete(reading.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5
                             hover:bg-red-900/30 rounded-lg transition-all"
                  >
                    <svg
                      className="w-4 h-4 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {readings.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-primary-400
                   transition-colors flex items-center justify-center gap-1"
        >
          {expanded ? (
            <>
              Show less
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </>
          ) : (
            <>
              Show {readings.length - 3} more
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
      )}
    </div>
  );
}
