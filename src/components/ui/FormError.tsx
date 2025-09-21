import React from 'react';

interface FormErrorProps {
  children: React.ReactNode;
}

export function FormError({ children }: FormErrorProps) {
  if (!children) return null;
  return <p className="text-red-500 text-xs mt-1">{children}</p>;
}