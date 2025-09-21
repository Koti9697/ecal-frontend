import React from 'react';
import { Button } from '../ui/Button';

interface FormulaBuilderProps {
  onInsert: (text: string) => void;
  availableFields: { id: string, label: string }[];
}

export function FormulaBuilder({ onInsert, availableFields }: FormulaBuilderProps) {
  const operators = ['+', '-', '*', '/', '(', ')'];
  const functions = [
    { name: 'SUM', example: 'SUM(A1, A2)' },
    { name: 'AVERAGE', example: 'AVERAGE(A1, A2)' },
    { name: 'STDEV', example: 'STDEV(A1, A2)' },
    { name: 'MIN', example: 'MIN(A1, A2)' },
    { name: 'MAX', example: 'MAX(A1, A2)' },
    { name: 'LOG', example: 'LOG(A1)' },
    { name: 'LN', example: 'LN(A1)' },
    { name: 'SQRT', example: 'SQRT(A1)' },
    { name: 'ABS', example: 'ABS(A1)' },
    { name: 'ROUND', example: 'ROUND(A1, 2)' },
  ];

  return (
    <div className="p-4 border rounded-md bg-slate-50 mt-2">
      <h5 className="text-md font-semibold mb-2">Formula Assistant</h5>
      
      <div className="mb-3">
        <p className="text-sm font-medium text-slate-600 mb-1">Operators</p>
        <div className="flex flex-wrap gap-2">
          {operators.map(op => (
            <Button key={op} type="button" variant="secondary" onClick={() => onInsert(op)} className="font-mono">
              {op}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm font-medium text-slate-600 mb-1">Available Fields (Cell IDs)</p>
        <div className="flex flex-wrap gap-2">
          {availableFields.map(field => (
            <Button key={field.id} type="button" variant="secondary" onClick={() => onInsert(field.id)} title={field.label}>
              {field.id}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-600 mb-1">Functions</p>
        <div className="flex flex-wrap gap-2">
          {functions.map(fn => (
            <Button key={fn.name} type="button" variant="secondary" onClick={() => onInsert(fn.example)} title={fn.example}>
              {fn.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}