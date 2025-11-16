import { ReactNode } from 'react';

interface ColumnProps {
  title: string;
  count: number;
  children: ReactNode;
}

const Column = ({ title, count, children }: ColumnProps) => {
  return (
    <div className="min-w-[220px] max-w-[240px] flex flex-col bg-white border-4 border-black rounded-xl shadow-brutal">
      <div className="px-3 py-2 border-b-4 border-black flex items-center justify-between bg-yellow-50">
        <h3 className="text-xs font-black uppercase tracking-wide">{title}</h3>
        <span className="text-[10px] font-semibold px-2 py-0.5 border border-black rounded-full bg-white">{count}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">{children}</div>
    </div>
  );
};

export default Column;
