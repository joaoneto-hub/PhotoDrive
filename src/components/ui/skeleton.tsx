import React from "react";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  style,
}) => (
  <div
    className={`animate-pulse bg-slate-700 rounded ${className}`}
    style={style}
  />
);
