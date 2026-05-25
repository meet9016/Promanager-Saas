import React from 'react';

export const Table = ({ children, className = '', ...props }) => (
  <table className={`w-full border-separate border-spacing-0 ${className}`} {...props}>
    {children}
  </table>
);

export const TableHeader = ({ children, className = '', ...props }) => (
  <thead className={`sticky top-0 z-10 bg-[var(--color-primary-dark)] ${className}`} {...props}>
    {children}
  </thead>
);

export const TableBody = ({ children, className = '', ...props }) => (
  <tbody className={`divide-y divide-[var(--color-border-secondary)] ${className}`} {...props}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '', ...props }) => (
  <tr className={`transition-colors ${className}`} {...props}>
    {children}
  </tr>
);

export const TableHeaderRow = ({ children, className = '', ...props }) => (
  <tr className={`border-b border-[var(--color-primary-light)] ${className}`} {...props}>
    {children}
  </tr>
);

export const Th = ({ children, small, className = '', ...props }) => (
  <th className={`px-2 sm:px-4 py-3 text-center ${small ? 'text-[11px]' : 'text-xs'} font-semibold text-white uppercase tracking-wider ${className}`} {...props}>
    {children}
  </th>
);

export const Td = ({ children, small, className = '', colSpan, ...props }) => (
  <td className={`px-2 sm:px-4 py-3 text-center ${small ? 'text-xs' : 'text-sm'} text-[var(--color-text-primary)] ${className}`} colSpan={colSpan} {...props}>
    {children}
  </td>
);
