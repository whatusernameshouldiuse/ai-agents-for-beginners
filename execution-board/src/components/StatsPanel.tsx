import { Task } from '../types';

interface StatsPanelProps {
  tasks: Task[];
  deepUsed: number;
  deepMax: number;
  shallowUsed: number;
  shallowMax: number;
}

const StatsPanel = ({ tasks, deepUsed, deepMax, shallowUsed, shallowMax }: StatsPanelProps) => {
  const counts = tasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.column] = (acc[task.column] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white border-4 border-black rounded-xl shadow-brutal p-4 space-y-3">
      <h3 className="text-xs font-black uppercase">Stats</h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {Object.entries(counts).map(([col, value]) => (
          <div key={col} className="border border-black rounded-md px-2 py-1 flex justify-between">
            <span className="font-semibold uppercase">{col}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
      <div className="space-y-2 text-xs">
        <div className="border border-black rounded-md p-2 bg-yellow-50">
          <p className="font-bold uppercase text-[11px]">Deep blocks</p>
          <p>
            {deepUsed} / {deepMax}
          </p>
        </div>
        <div className="border border-black rounded-md p-2 bg-blue-50">
          <p className="font-bold uppercase text-[11px]">Shallow blocks</p>
          <p>
            {shallowUsed} / {shallowMax}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
