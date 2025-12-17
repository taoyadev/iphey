'use client';

import React from 'react';

interface IPHLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export const IPHLogo: React.FC<IPHLogoProps> = ({
  size = 40,
  className = '',
  animated = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Gradient for the circular background */}
        <linearGradient id="iphBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Glow effect */}
        <filter id="iphGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Inner shadow */}
        <filter id="innerShadow">
          <feOffset dx="0" dy="2" />
          <feGaussianBlur stdDeviation="2" result="offset-blur" />
          <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
          <feFlood floodColor="black" floodOpacity="0.2" result="color" />
          <feComposite operator="in" in="color" in2="inverse" result="shadow" />
          <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        </filter>
      </defs>

      {/* Main circular background */}
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="url(#iphBgGradient)"
        filter="url(#innerShadow)"
      />

      {/* Outer ring */}
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeOpacity="0.3"
      />

      {/* Inner decorative ring */}
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="none"
        stroke="white"
        strokeWidth="1"
        strokeOpacity="0.15"
        strokeDasharray="4 4"
      />

      {/* Character face - GO gopher inspired */}
      {/* Eyes */}
      <g filter="url(#iphGlow)">
        {/* Left eye white */}
        <ellipse cx="35" cy="42" rx="10" ry="11" fill="white" />
        {/* Right eye white */}
        <ellipse cx="65" cy="42" rx="10" ry="11" fill="white" />

        {/* Left pupil */}
        <circle cx="37" cy="43" r="5" fill="#1e293b">
          {animated && (
            <animate
              attributeName="cx"
              values="37;39;37;35;37"
              dur="3s"
              repeatCount="indefinite"
            />
          )}
        </circle>
        {/* Right pupil */}
        <circle cx="67" cy="43" r="5" fill="#1e293b">
          {animated && (
            <animate
              attributeName="cx"
              values="67;69;67;65;67"
              dur="3s"
              repeatCount="indefinite"
            />
          )}
        </circle>

        {/* Eye highlights */}
        <circle cx="34" cy="40" r="2" fill="white" fillOpacity="0.8" />
        <circle cx="64" cy="40" r="2" fill="white" fillOpacity="0.8" />
      </g>

      {/* Nose */}
      <ellipse cx="50" cy="55" rx="6" ry="4" fill="#047857" />
      <ellipse cx="50" cy="54" rx="4" ry="2.5" fill="#059669" />

      {/* Smile */}
      <path
        d="M 40 62 Q 50 70 60 62"
        fill="none"
        stroke="#047857"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* IPH text below face - stylized */}
      <g fill="white" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="bold">
        <text x="50" y="85" textAnchor="middle" fontSize="16" letterSpacing="2">
          IPH
        </text>
      </g>

      {/* Decorative elements - antenna/ears like gopher */}
      <g stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" strokeOpacity="0.6">
        {/* Left ear */}
        <path d="M 25 25 Q 20 15 30 18" />
        {/* Right ear */}
        <path d="M 75 25 Q 80 15 70 18" />
      </g>

      {/* Sparkle effect */}
      <g fill="white" fillOpacity="0.8">
        <circle cx="78" cy="28" r="2">
          {animated && (
            <animate
              attributeName="opacity"
              values="0.8;0.2;0.8"
              dur="2s"
              repeatCount="indefinite"
            />
          )}
        </circle>
        <circle cx="22" cy="32" r="1.5">
          {animated && (
            <animate
              attributeName="opacity"
              values="0.2;0.8;0.2"
              dur="2s"
              repeatCount="indefinite"
            />
          )}
        </circle>
      </g>
    </svg>
  );
};

export default IPHLogo;
