import { Task } from '../types';
import { blockTypeLabels, projectLabels } from '../utils';

interface TaskCardProps {
  task: Task;
  onTriage: (task: Task) => void;
  onMoveToToday: (task: Task) => void;
  onActivate: (task: Task) => void;
  onComplete: (task: Task) => void;
  onPause: (task: Task) => void;
  onResolveDependency: (task: Task) => void;
  onUpdateNextCheck: (task: Task, value: string) => void;
  onDelete: (task: Task) => void;
}

const columnAccent: Record<Task['column'], string> = {
  INBOX: '',
  BLOCKED: 'border-accentRed',
  READY: '',
  TODAY: 'border-accentYellow',
  ACTIVE: 'border-accentBlue',
  DONE: 'border-green-500',
};

export const TaskCard = ({
  task,
  onTriage,
  onMoveToToday,
  onActivate,
  onComplete,
  onPause,
  onResolveDependency,
  onUpdateNextCheck,
  onDelete,
}: TaskCardProps) => {
  const label = projectLabels[task.project];
  const blockLabel = `${task.blocks || 0} block${task.blocks === 1 ? '' : 's'} (${blockTypeLabels[task.blockType]})`;

  const showUpdateField = task.column === 'BLOCKED';

  return (
    <div
      className={`bg-white border-2 ${columnAccent[task.column] || 'border-black'} shadow-brutal rounded-lg p-3 space-y-2 transition transform hover:-translate-y-0.5`}
    >
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm uppercase text-black">{task.title}</h4>
        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 border border-black rounded-full bg-accentYellow">
          {label}
        </span>
      </div>
      <div className="text-xs text-gray-700 flex flex-wrap gap-2">
        <span className="px-2 py-0.5 border border-black rounded-full bg-gray-100">{blockLabel}</span>
        {task.workMinutes > 0 && (
          <span className="px-2 py-0.5 border border-black rounded-full bg-gray-100">{task.workMinutes}m work</span>
        )}
        {task.rampMinutes > 0 && (
          <span className="px-2 py-0.5 border border-black rounded-full bg-gray-100">{task.rampMinutes}m ramp</span>
        )}
        {task.status === 'PAUSED' && (
          <span className="px-2 py-0.5 border border-black rounded-full bg-yellow-200">Paused</span>
        )}
      </div>
      {task.column === 'BLOCKED' && (
        <div className="text-xs space-y-1 border border-dashed border-accentRed rounded p-2 bg-red-50">
          <p className="font-semibold uppercase text-[11px] text-accentRed">Waiting on</p>
          <p>
            {task.dependencyOwner} – {task.dependencyItem}
          </p>
          {task.nextCheck && <p className="text-[11px] text-gray-600">Next check: {new Date(task.nextCheck).toLocaleString()}</p>}
          {showUpdateField && (
            <div className="space-y-1">
              <input
                type="datetime-local"
                className="w-full border border-black rounded px-2 py-1 text-xs"
                value={task.nextCheck ? task.nextCheck.slice(0, 16) : ''}
                onChange={(e) => onUpdateNextCheck(task, e.target.value)}
              />
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        {task.column === 'INBOX' && (
          <button className="neo-btn" onClick={() => onTriage(task)}>
            Quick triage
          </button>
        )}
        {task.column === 'READY' && (
          <button className="neo-btn" onClick={() => onMoveToToday(task)}>
            Plan for today
          </button>
        )}
        {task.column === 'BLOCKED' && (
          <>
            <button className="neo-btn" onClick={() => onResolveDependency(task)}>
              Dependency cleared
            </button>
            <button className="neo-btn bg-red-100" onClick={() => onDelete(task)}>
              Drop task
            </button>
          </>
        )}
        {task.column === 'TODAY' && (
          <button className="neo-btn" onClick={() => onActivate(task)}>
            Activate
          </button>
        )}
        {task.column === 'ACTIVE' && (
          <>
            <button className="neo-btn bg-green-200" onClick={() => onComplete(task)}>
              Mark done
            </button>
            <button className="neo-btn" onClick={() => onPause(task)}>
              Pause to Today
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
