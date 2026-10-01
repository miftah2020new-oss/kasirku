import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showText?: boolean;
  lightMode?: boolean;
  plain?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  lightMode = false,
  plain = false,
}) => {
  const sizeMap = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
    full: 'w-full h-full',
  };

  const textSizeMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl',
    full: 'text-base',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Container Logo Icon - Menggunakan artwork asli logo.png JF Brother */}
      <div
        className={`${
          plain
            ? sizeMap[size]
            : `${sizeMap[size]} bg-white rounded-2xl shadow-xs border border-slate-200/90 p-1`
        } flex items-center justify-center shrink-0 overflow-hidden relative group`}
        title="Ju-Fat Cell (JF Brother)"
      >
        <img
          src="/logo.svg"
          alt="Ju-Fat Cell (JF Brother)"
          className="w-full h-full object-contain select-none"
          loading="eager"
        />
      </div>

      {/* Brand Text Details */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight ${textSizeMap[size]} ${
                lightMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Ju-Fat Cell
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200">
              POS
            </span>
          </div>
          <span
            className={`text-xs ${
              lightMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            POINT OF SALE
          </span>
        </div>
      )}
    </div>
  );
};
