import { useState, useEffect, useCallback } from "react";

export const useExamTimer = (initialTime, onTimeEnd) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning || timeLeft === null) return;
    if (timeLeft <= 0) {
      onTimeEnd?.();
      setIsRunning(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isRunning, onTimeEnd]);

  const pause = useCallback(() => setIsRunning(false), []);
  const resume = useCallback(() => setIsRunning(true), []);
  const reset = useCallback((newTime) => {
    setTimeLeft(newTime);
    setIsRunning(true);
  }, []);

  return { timeLeft, pause, resume, reset, isRunning };
};
