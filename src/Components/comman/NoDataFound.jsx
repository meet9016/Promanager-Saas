import React from 'react';
import noDataImg from '../../assets/no-data.png';

/**
 * NoDataFound — Common reusable empty-state component.
 *
 * Props:
 *  title    {string}  — Main heading text  (default: "No data found")
 *  subtitle {string}  — Sub-text below heading (optional)
 *  imgSize  {string}  — Tailwind width/height class for the image (default: "w-52 h-52")
 *  className {string} — Extra classes on the wrapper div
 *  children  {node}   — Optional children (like buttons) rendered below the subtitle
 */
const NoDataFound = ({
  title = 'No data found',
  subtitle = '',
  imgSize = 'w-600 h-52',
  className = '',
  children,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-14 px-4 select-none ${className}`}
    >
      <img
        src={noDataImg}
        alt="No data found"
        className={`${imgSize} mb-4 opacity-95`}
      />
      <p className="text-[var(--color-text-primary)] text-2xl font-bold tracking-tight">
        {title}
      </p>
      {subtitle && (
        <p className="text-[var(--color-text-secondary)] text-md mt-1 text-center max-w-lg">
          {subtitle}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

export default NoDataFound;
