import React from 'react';

const MiniChart: React.FC = () => (
  <div className="w-full h-12 bg-white/70 rounded-xl flex items-center justify-center">
    {/* Placeholder for mini line chart */}
    <svg width="80" height="32" viewBox="0 0 80 32">
      <polyline
        fill="none"
        stroke="#f59e42"
        strokeWidth="3"
        points="0,28 10,20 20,24 30,12 40,16 50,8 60,18 70,10 80,14"
      />
    </svg>
  </div>
);

export default MiniChart; 