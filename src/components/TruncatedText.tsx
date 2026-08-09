'use client';

import { useState } from 'react';

/**
 * Free-text table values here are effectively unbounded in practice — a
 * full "street, postal code city, country" address, a long business/
 * event name, a full email — and rendering any of them at their real
 * length inline can single-handedly blow out a row's height or force
 * the whole table wider than the page. Truncates with a CSS ellipsis at
 * `maxWidth`, and reveals the full value two ways: hovering (the native
 * `title` tooltip — works everywhere, no extra markup) and clicking
 * (toggles inline expansion, which is the only way to see the full
 * value on a touch device, where hover doesn't exist — click again to
 * re-collapse).
 */
export function TruncatedText({
  text,
  maxWidth = 200,
  className = '',
}: {
  text: string | null | undefined;
  maxWidth?: number;
  className?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  return (
    <span
      onClick={() => setIsExpanded((v) => !v)}
      title={text}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsExpanded((v) => !v);
        }
      }}
      className={
        isExpanded
          ? `inline-block cursor-pointer whitespace-normal break-words ${className}`
          : `inline-block max-w-full cursor-pointer truncate align-bottom ${className}`
      }
      style={isExpanded ? undefined : { maxWidth }}
    >
      {text}
    </span>
  );
}
