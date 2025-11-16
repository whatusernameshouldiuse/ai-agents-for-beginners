import { Task } from '../types';
import { columnLabels, columnOrder } from '../utils';
import Column from './Column';
import TaskCard from './TaskCard';

interface BoardProps {
  tasks: Task[];
  onTriage: (task: Task) => void;
  onMoveToToday: (task: Task) => void;
  onActivate: (task: Task) => void;
  onComplete: (task: Task) => void;
  onPause: (task: Task) => void;
  onResolveDependency: (task: Task) => void;
  onUpdateNextCheck: (task: Task, value: string) => void;
  onDelete: (task: Task) => void;
}

const Board = ({
  tasks,
  onTriage,
  onMoveToToday,
  onActivate,
  onComplete,
  onPause,
  onResolveDependency,
  onUpdateNextCheck,
  onDelete,
}: BoardProps) => {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-h-[420px]">
        {columnOrder.map((col) => {
          const columnTasks = tasks.filter((task) => task.column === col);
          return (
            <Column key={col} title={columnLabels[col]} count={columnTasks.length}>
              {columnTasks.length === 0 && (
                <p className="text-[11px] uppercase text-gray-400">No tasks</p>
              )}
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onTriage={onTriage}
                  onMoveToToday={onMoveToToday}
                  onActivate={onActivate}
                  onComplete={onComplete}
                  onPause={onPause}
                  onResolveDependency={onResolveDependency}
                  onUpdateNextCheck={onUpdateNextCheck}
                  onDelete={onDelete}
                />
              ))}
            </Column>
          );
        })}
      </div>
    </div>
  );
};

export default Board;
