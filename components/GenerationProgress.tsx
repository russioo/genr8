'use client';

import { useEffect, useState } from 'react';

interface GenerationProgressProps {
  status: 'pending' | 'processing' | 'completed';
  elapsedTime: number;
  estimatedTotal?: number;
  type?: 'image' | 'video';
}

export default function GenerationProgress({
  status,
  elapsedTime,
  estimatedTotal = 150,
  type = 'video',
}: GenerationProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (status === 'completed') {
      setProgress(100);
    } else {
      const calculated = Math.min((elapsedTime / estimatedTotal) * 100, 98);
      setProgress(calculated);
    }
  }, [elapsedTime, estimatedTotal, status]);

  const statusText = {
    pending: 'Initializing...',
    processing: type === 'image' ? 'Creating image...' : 'Creating video...',
    completed: 'Complete',
  };

  return (
    <div className="py-8 px-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 border border-[#333] mb-4">
          <div className="w-5 h-5 border-2 border-[#333] border-t-[#c8ff00] rounded-full animate-spin" />
        </div>
        <h3 className="text-lg font-medium mb-1">{statusText[status]}</h3>
        <p className="text-[#666] text-sm">{elapsedTime}s elapsed</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#666]">Progress</span>
          <span className="mono">{Math.round(progress)}%</span>
        </div>
        <div className="h-1 bg-[#1a1a1a]">
          <div
            className="h-full bg-[#c8ff00] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="text-center mt-6">
        <p className="text-[#666] text-xs">
          Est. ~{estimatedTotal}s
        </p>
        {elapsedTime > estimatedTotal && (
          <p className="text-[#666] text-xs mt-1">Taking longer than expected...</p>
        )}
      </div>
    </div>
  );
}
