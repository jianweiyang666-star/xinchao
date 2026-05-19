import React from 'react';

export default function Link({ href, children, className, 'aria-label': ariaLabel }: any) {
  return (
    <a href={`#${href}`} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  );
}
