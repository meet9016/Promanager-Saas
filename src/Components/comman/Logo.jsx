import React from 'react';
import logoImg from '../../assets/new_logo.png';

const Logo = ({ alt = "ProManager Logo", className = "", onError, ...props }) => {
    const handleError = (e) => {
        e.target.onerror = null;
        e.target.src = "/logo.png";
        if (onError) {
            onError(e);
        }
    };

    return (
        <img
            src={logoImg}
            alt={alt}
            className={className}
            onError={handleError}
            {...props}
        />
    );
};

export default Logo;
