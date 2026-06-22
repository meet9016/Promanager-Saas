import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Table = React.forwardRef(({ className, wrapperClassName, ...props }, ref) => (
  <div className={cn("relative w-full overflow-auto max-h-[585px]", wrapperClassName)}>
    <table
      ref={ref}
      className={cn("w-full border-separate border-spacing-0 caption-bottom text-sm", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("sticky top-0 z-30 bg-[var(--color-primary-dark)]", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("divide-y divide-[var(--color-border-secondary)]", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHeaderRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn("border-b border-[var(--color-primary-light)]", className)}
    {...props}
  />
));
TableHeaderRow.displayName = "TableHeaderRow";

const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const Th = React.forwardRef(({ className, small, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "sticky top-0 z-50 bg-[var(--color-primary-dark)] px-2 sm:px-4 py-3 text-center font-semibold text-white uppercase tracking-wider",
      small ? "text-[11px]" : "text-xs",
      className
    )}
    {...props}
  />
));
Th.displayName = "Th";

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const Td = React.forwardRef(({ className, small, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "px-2 sm:px-4 py-3 text-center text-[var(--color-text-primary)]",
      small ? "text-xs" : "text-sm",
      className
    )}
    {...props}
  />
));
Td.displayName = "Td";

const TableCaption = React.forwardRef(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableHeaderRow,
  TableCell,
  TableCaption,
  Th,
  Td,
};
