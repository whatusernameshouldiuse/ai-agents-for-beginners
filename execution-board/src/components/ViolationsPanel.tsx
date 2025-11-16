import { ViolationEntry } from '../types';

interface ViolationsPanelProps {
  violations: ViolationEntry[];
}

const ViolationsPanel = ({ violations }: ViolationsPanelProps) => {
  return (
    <div className="bg-white border-4 border-black rounded-xl shadow-brutal p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase">Violation log</h3>
        <span className="text-[10px] font-semibold px-2 py-0.5 border border-black rounded-full bg-red-100">
          {violations.length}
        </span>
      </div>
      <div className="space-y-2 max-h-52 overflow-y-auto text-xs">
        {violations.length === 0 && <p className="text-gray-500 uppercase">No violations</p>}
        {violations.map((entry) => (
          <div key={entry.id} className="border border-black rounded-md p-2 bg-gray-50">
            <p className="font-bold">{entry.rule}</p>
            <p className="text-[11px] text-gray-500">{new Date(entry.timestamp).toLocaleString()}</p>
            {entry.comment && <p>{entry.comment}</p>}
            {entry.taskId && <p className="text-[11px] text-gray-600">Task: {entry.taskId}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViolationsPanel;
