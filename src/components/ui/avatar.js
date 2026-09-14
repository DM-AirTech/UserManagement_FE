import React from "react";

export function Avatar({ children }) {
  return (
    <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full text-sm font-medium text-gray-700">
      {children}
    </div>
  );
}

export function AvatarFallback({ children }) {
  return <>{children}</>;
}
