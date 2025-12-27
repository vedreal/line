import { useEffect, useState } from "react";
import { intervalToDuration, isAfter } from "date-fns";

interface CountDownProps {
  targetDate: Date;
  onComplete?: () => void;
  className?: string;
  labels?: boolean;
}

export function CountDown({ targetDate, onComplete, className = "", labels = true }: CountDownProps) {
  const [timeLeft, setTimeLeft] = useState<Duration>({ hours: 0, minutes: 0, seconds: 0 });
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if (isAfter(now, targetDate)) {
        setIsFinished(true);
        clearInterval(timer);
        onComplete?.();
        return;
      }
      
      const duration = intervalToDuration({
        start: now,
        end: targetDate,
      });
      
      setTimeLeft(duration);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (isFinished) {
    return <span className={className}>00:00:00</span>;
  }

  const format = (num?: number) => String(num || 0).padStart(2, '0');

  return (
    <div className={`flex gap-2 items-center justify-center font-mono ${className}`}>
      {labels && (timeLeft.days || 0) > 0 && (
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-white">{format(timeLeft.days)}</span>
          <span className="text-[10px] text-gray-400 uppercase">Days</span>
        </div>
      )}
      
      {(labels && (timeLeft.days || 0) > 0) && <span className="text-xl text-[#0088CC] -mt-4">:</span>}

      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-white">{format(timeLeft.hours)}</span>
        {labels && <span className="text-[10px] text-gray-400 uppercase">Hrs</span>}
      </div>
      
      <span className={`text-xl text-[#0088CC] ${labels ? "-mt-4" : ""}`}>:</span>
      
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-white">{format(timeLeft.minutes)}</span>
        {labels && <span className="text-[10px] text-gray-400 uppercase">Min</span>}
      </div>
      
      <span className={`text-xl text-[#0088CC] ${labels ? "-mt-4" : ""}`}>:</span>
      
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-white">{format(timeLeft.seconds)}</span>
        {labels && <span className="text-[10px] text-gray-400 uppercase">Sec</span>}
      </div>
    </div>
  );
}
