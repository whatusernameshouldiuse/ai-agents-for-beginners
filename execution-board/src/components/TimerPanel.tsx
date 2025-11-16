import { Task, TimerState } from '../types';
import { blockTypeLabels } from '../utils';

interface TimerPanelProps {
  timer: TimerState;
  activeTask?: Task;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onCycleAction: (action: 'done' | 'continue' | 'pause') => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
};

const TimerPanel = ({ timer, activeTask, onStart, onPause, onReset, onCycleAction }: TimerPanelProps) => {
  const cycleFinished = timer.attachedTaskId && timer.secondsRemaining === 0 && timer.totalSeconds > 0;

  return (
    <div className="bg-white border-4 border-black rounded-xl shadow-brutal p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase">Focus Timer</h3>
        {timer.currentCycleType && (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 border border-black rounded-full bg-accentBlue text-white">
            {blockTypeLabels[timer.currentCycleType]}
          </span>
        )}
      </div>
      <div className="text-5xl font-black tracking-tight text-center">{formatTime(timer.secondsRemaining)}</div>
      <p className="text-xs text-center uppercase">
        {activeTask ? `Attached to: ${activeTask.title}` : 'No active task'}
      </p>
      <div className="flex gap-2">
        <button className="neo-btn flex-1" onClick={onStart} disabled={!activeTask}>
          Start
        </button>
        <button className="neo-btn flex-1" onClick={onPause}>
          Pause
        </button>
        <button className="neo-btn flex-1" onClick={onReset}>
          Reset
        </button>
      </div>
      {cycleFinished && (
        <div className="border-2 border-black rounded-lg p-3 bg-yellow-100 space-y-2">
          <p className="text-xs font-bold uppercase">Cycle finished</p>
          <div className="flex flex-col gap-2">
            <button className="neo-btn bg-green-200" onClick={() => onCycleAction('done')}>
              Task done
            </button>
            <button className="neo-btn" onClick={() => onCycleAction('continue')}>
              Continue same task
            </button>
            <button className="neo-btn bg-red-100" onClick={() => onCycleAction('pause')}>
              Pause task
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimerPanel;
