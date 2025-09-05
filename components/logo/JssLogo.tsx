import React from 'react';
import { Link } from 'react-router-dom';

interface JssLogoProps {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
  className?: string;
  textColor?: string;
}

const JssLogo: React.FC<JssLogoProps> = ({ 
  size = 'md', 
  withText = true,
  className = '',
  textColor = 'text-white'
}) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <Link to="/" className={`flex items-center gap-3 ${className} transition-transform hover:scale-105 duration-200`}>
      <div className={`relative ${sizes[size]} shadow-lg rounded-full overflow-hidden`}>
        {/* Logo background */}
        <div className="absolute inset-0 bg-primary rounded-full"></div>
        
        {/* Calming Snow-Capped Mountains */}
        <div className="absolute inset-0 flex items-end justify-center overflow-hidden">
          {/* Far mountain range (smaller, lighter color) */}
          <div className="relative" style={{ position: 'absolute', bottom: '15%', left: '5%', width: '90%', height: '60%', opacity: 0.5 }}>
            <div 
              className="absolute w-full h-[40%] bg-[#4A7296]" 
              style={{ 
                clipPath: 'polygon(0% 100%, 12% 75%, 20% 85%, 28% 65%, 38% 80%, 50% 60%, 62% 80%, 72% 65%, 85% 80%, 100% 60%, 100% 100%)'
              }}
            ></div>
          </div>
          
          {/* Large mountain with snow cap */}
          <div className="relative" style={{ position: 'absolute', bottom: '15%', left: '15%', width: '40%', height: '70%' }}>
            <div 
              className="absolute w-full h-full bg-[#355C7D]" 
              style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}
            ></div>
            {/* Snow cap for large mountain */}
            <div 
              className="absolute w-full h-[35%] bg-white" 
              style={{ clipPath: 'polygon(50% 0%, 68% 100%, 32% 100%)' }}
            ></div>
          </div>
          
          {/* Medium mountain with snow cap */}
          <div className="relative" style={{ position: 'absolute', bottom: '15%', left: '40%', width: '35%', height: '55%' }}>
            <div 
              className="absolute w-full h-full bg-[#355C7D]" 
              style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}
            ></div>
            {/* Snow cap for medium mountain */}
            <div 
              className="absolute w-full h-[30%] bg-white" 
              style={{ clipPath: 'polygon(50% 0%, 65% 100%, 35% 100%)' }}
            ></div>
          </div>
          
          {/* Small mountain with snow cap */}
          <div className="relative" style={{ position: 'absolute', bottom: '15%', right: '15%', width: '30%', height: '40%' }}>
            <div 
              className="absolute w-full h-full bg-[#355C7D]" 
              style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}
            ></div>
            {/* Snow cap for small mountain */}
            <div 
              className="absolute w-full h-[25%] bg-white" 
              style={{ clipPath: 'polygon(50% 0%, 60% 100%, 40% 100%)' }}
            ></div>
          </div>
        </div>
      </div>
      {withText && (
        <span className={`font-bold tracking-wider ${textSizes[size]} ${textColor}`}>
          JSS
        </span>
      )}
    </Link>
  );
};

export default JssLogo;