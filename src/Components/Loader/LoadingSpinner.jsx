import React from 'react';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg-gradient-start)] bg-gradient-to-br from-[var(--color-bg-gradient-start)] to-[var(--color-bg-gradient-end)]">
    <div className="text-center">
      {/* Custom 3D Spinner */}
      <div className="relative mb-6">
        <span className="loader"></span>
      </div>
      
      {/* Loading text with animation */}
      <p className="text-[var(--color-text-primary)] font-medium animate-pulse text-lg mb-3">
        Loading...
      </p>
      
      {/* Animated dots */}
      <div className="flex space-x-1 justify-center">
        <div className="h-2 w-2 bg-[var(--color-primary)] rounded-full animate-bounce"></div>
        <div 
          className="h-2 w-2 bg-[var(--color-primary)] rounded-full animate-bounce" 
          style={{ animationDelay: '0.1s' }}
        ></div>
        <div 
          className="h-2 w-2 bg-[var(--color-primary)] rounded-full animate-bounce" 
          style={{ animationDelay: '0.2s' }}
        ></div>
      </div>
    </div>

    <style jsx>{`
      .loader {
        transform: rotateZ(45deg);
        perspective: 1000px;
        border-radius: 50%;
        width: 48px;
        height: 48px;
        color: var(--color-primary);
        position: relative;
        display: inline-block;
      }
      
      .loader:before,
      .loader:after {
        content: '';
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: inherit;
        height: inherit;
        border-radius: 50%;
        transform: rotateX(70deg);
        animation: 1s spin linear infinite;
      }
      
      .loader:after {
        color: var(--color-primary);
        transform: rotateY(70deg);
        animation-delay: 0.4s;
      }
      
      @keyframes spin {
        0%, 100% { 
          box-shadow: 0.2em 0px 0 0px currentcolor; 
        }
        12% { 
          box-shadow: 0.2em 0.2em 0 0 currentcolor; 
        }
        25% { 
          box-shadow: 0 0.2em 0 0px currentcolor; 
        }
        37% { 
          box-shadow: -0.2em 0.2em 0 0 currentcolor; 
        }
        50% { 
          box-shadow: -0.2em 0 0 0 currentcolor; 
        }
        62% { 
          box-shadow: -0.2em -0.2em 0 0 currentcolor; 
        }
        75% { 
          box-shadow: 0px -0.2em 0 0 currentcolor; 
        }
        87% { 
          box-shadow: 0.2em -0.2em 0 0 currentcolor; 
        }
      }
    `}</style>
  </div>
);

export default LoadingSpinner;