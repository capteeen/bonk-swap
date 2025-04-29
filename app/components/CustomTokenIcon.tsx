import React from 'react';

interface CustomTokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

/**
 * Component for displaying custom token icons with fallback to symbol letters
 */
const CustomTokenIcon: React.FC<CustomTokenIconProps> = ({ 
  symbol, 
  size = 64,
  className = ''
}) => {
  // Get first 1-2 letters of symbol for the icon
  const displayLetters = symbol.substring(0, symbol.length <= 3 ? symbol.length : 2).toUpperCase();
  
  return (
    <div 
      className={`flex items-center justify-center rounded-full overflow-hidden ${className}`}
      style={{ 
        width: size, 
        height: size,
        background: 'linear-gradient(135deg, #ffd700, #ffa500)', 
      }}
    >
      <div 
        className="font-bold text-center"
        style={{ 
          color: '#333', 
          fontSize: `${Math.max(size / 2.5, 12)}px`,
          letterSpacing: '-0.5px'
        }}
      >
        {displayLetters}
      </div>
    </div>
  );
};

export default CustomTokenIcon; 