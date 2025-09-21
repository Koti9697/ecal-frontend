// In src/components/templates/ExcelRibbon.tsx

import React from 'react';

// A simple placeholder component for the Excel-like ribbon
export function ExcelRibbon() {
  const RibbonButton = ({ children }: { children: React.ReactNode }) => (
    <button
      type="button"
      className="px-4 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-md"
      // onClick={() => alert(`${children} functionality not yet implemented.`)}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-slate-100 p-2 rounded-t-md border-b-2 border-slate-300">
      <div className="flex items-center space-x-2">
        <RibbonButton>Home</RibbonButton>
        <RibbonButton>Formulas</RibbonButton>
        <RibbonButton>Page Layout</RibbonButton>
        <RibbonButton>Insert Chart</RibbonButton>
      </div>
    </div>
  );
}