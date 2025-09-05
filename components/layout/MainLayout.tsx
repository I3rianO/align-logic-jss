import React from 'react';
import JssLogo from '../logo/JssLogo';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  showHeader = true,
  showFooter = true
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#f7f9fa]">
      {showHeader && (
        <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-blue-900 text-white py-6 relative overflow-hidden">
          {/* Mountain background with proper opacity control */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30" 
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=200&fit=crop')" }}
          ></div>
          
          {/* Dark gradient overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 to-blue-900/70"></div>
          
          <div className="container mx-auto px-6 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-6">
              <JssLogo size="md" textColor="text-white" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide drop-shadow-md mb-2">
                  {title || "Job Selection System"}
                </h1>
                <p className="text-sm md:text-base text-white/90 font-medium tracking-wide">Efficient Workforce Management</p>
              </div>
            </div>
          </div>
          
          {/* Bottom wave divider for smooth transition */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-6">
              <path 
                fill="#f7f9fa" 
                fillOpacity="1" 
                d="M0,24L80,32C160,40,320,56,480,56C640,56,800,40,960,32C1120,24,1280,24,1360,24L1440,24L1440,60L1360,60C1280,60,1120,60,960,60C800,60,640,60,480,60C320,60,160,60,80,60L0,60Z"
              ></path>
            </svg>
          </div>
        </header>
      )}
      
      <main className="flex-1">
        {children}
      </main>
      
      {showFooter && (
        <footer className="mt-auto relative">
          {/* Mountain-inspired top border */}
          <div className="h-4 bg-gradient-to-r from-blue-700 to-indigo-800"></div>
          
          <div className="bg-gradient-to-b from-indigo-900 to-slate-900 text-white py-8 relative overflow-hidden">
            {/* Mountain silhouette in footer */}
            <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="absolute bottom-0">
                <path fill="#ffffff" fillOpacity="1" d="M0,96L120,128L240,96L360,192L480,128L600,160L720,32L840,96L960,256L1080,224L1200,96L1320,128L1440,32L1440,320L1320,320L1200,320L1080,320L960,320L840,320L720,320L600,320L480,320L360,320L240,320L120,320L0,320Z"></path>
              </svg>
            </div>
            
            <div className="container mx-auto px-4 text-center relative z-10">
              <div className="flex justify-center mb-4">
                <JssLogo size="md" withText={true} textColor="text-white" />
              </div>
              <p className="text-lg font-medium text-white/90 mb-0 max-w-none">
                © {new Date().getFullYear()} Brian P. O'Leary | All Rights Reserved
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default MainLayout;