"use client";

import { useEffect, useState } from "react";

interface CompactCountdownTimerProps {
  targetTime: number; // timestamp in seconds
  onComplete?: () => void;
  className?: string;
}

export default function CompactCountdownTimer({ targetTime, onComplete, className = "" }: CompactCountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = targetTime - now;
      setTimeRemaining(remaining);

      if (remaining <= 0 && onComplete) {
        onComplete();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onComplete]);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "00:00:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return <div className={className}>{formatTime(timeRemaining)}</div>;
}


