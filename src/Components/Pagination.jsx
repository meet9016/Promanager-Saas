import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    loading = false,
    className = '',
    maxVisiblePages = 5
}) => {
    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages = [];

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const handlePageChange = (page) => {
        if (typeof page === 'number' && page >= 1 && page <= totalPages && !loading) {
            onPageChange(page);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1 && !loading) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages && !loading) {
            onPageChange(currentPage + 1);
        }
    };

    // Don't render if there's only one page or no pages
    if (totalPages <= 1) {
        return null;
    }


    return (
        <div className={`px-6 py-4 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-gray)] ${className}`}>
            <div className="flex items-center justify-end flex-wrap gap-4">
                {/* Pagination Controls */}
                <div className="flex items-center space-x-2">
                    {/* Previous Button */}
                    <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1 || loading}
                        className="flex items-center px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-md hover:bg-[var(--color-bg-primary)] hover:text-[var(--color-text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                        {getPageNumbers().map((pageNum, index) => (
                            <button
                                key={`page-${index}`}
                                onClick={() => handlePageChange(pageNum)}
                                disabled={typeof pageNum !== 'number' || loading}
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${pageNum === currentPage
                                    ? 'bg-[var(--color-primary-dark)] text-[var(--color-text-white)] shadow-sm'
                                    : typeof pageNum === 'number'
                                        ? 'text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-primary)] hover:text-[var(--color-text-secondary)]'
                                        : 'text-[var(--color-text-muted)] cursor-default bg-transparent'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                aria-label={typeof pageNum === 'number' ? `Go to page ${pageNum}` : 'More pages'}
                                aria-current={pageNum === currentPage ? 'page' : undefined}
                            >
                                {pageNum}
                            </button>
                        ))}
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages || loading}
                        className="flex items-center px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-md hover:bg-[var(--color-bg-primary)] hover:text-[var(--color-text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Next page"
                    >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pagination;