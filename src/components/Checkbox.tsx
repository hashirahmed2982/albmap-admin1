'use client';

import { useEffect, useRef, InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** True "some but not all" state for a select-all header checkbox — the
   * DOM only exposes this via the element's `.indeterminate` property, not
   * an attribute/prop, so it has to be set imperatively via a ref. */
  indeterminate?: boolean;
}

export function Checkbox({ indeterminate = false, className, ...props }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className={`h-4 w-4 cursor-pointer rounded border-gray-300 text-red-600 focus:ring-1 focus:ring-red-500 ${className ?? ''}`}
      {...props}
    />
  );
}
