import { useCallback, useEffect, useMemo, useState } from 'react';
import Board from './components/Board';
import StatsPanel from './components/StatsPanel';
import TaskForm, { TaskFormPayload } from './components/TaskForm';
import TimerPanel from './components/TimerPanel';
import ViolationsPanel from './components/ViolationsPanel';
import { AppState, ColumnId, Task, TimerState } from './types';
import {
  baseAppState,
  defaultTimerState,
  deepCycleSeconds,
  getDayKey,
  shallowCycleSeconds,
} from './utils';

const STORAGE_KEY = 'execution-board-state-v1';

const hydrateState = (): AppState => {
  if (typeof window === 'undefined') return baseAppState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return baseAppState();
    const parsed = JSON.parse(raw) as AppState;
    const todayKey = getDayKey();
    if (parsed.currentDayKey !== todayKey) {
      return resetForNewDay(parsed, todayKey);
    }
    return parsed;
  } catch (error) {
    console.error('Failed to parse stored state', error);
    return baseAppState();
  }
};

const resetForNewDay = (state: AppState, dayKey: string): AppState => {
  const updatedTasks = state.tasks.map((task) => {
    if (task.column === 'TODAY' || task.column === 'ACTIVE') {
      const target: ColumnId = task.dependencyOwner && task.dependencyItem ? 'BLOCKED' : 'READY';
      return {
        ...task,
        column: target,
        status: 'OPEN',
        history: [...(task.history || []), { at: new Date().toISOString(), from: task.column, to: target, note: 'Daily reset' }],
      };
    }
    return task;
  });

  return {
    ...state,
    currentDayKey: dayKey,
    todayDeepBlocksUsed: 0,
    todayShallowBlocksUsed: 0,
    timer: { ...defaultTimerState },
    tasks: updatedTasks,
  };
};

const App = () => {
  const [state, setState] = useState<AppState>(() => hydrateState());

  const activeTask = useMemo(() => state.tasks.find((task) => task.column === 'ACTIVE'), [state.tasks]);

  // Save to localStorage with debounce
  useEffect(() => {
    const id = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, 300);
    return () => window.clearTimeout(id);
  }, [state]);

  // Daily reset watcher
  useEffect(() => {
    const interval = window.setInterval(() => {
      const today = getDayKey();
      setState((prev) => {
        if (prev.currentDayKey !== today) {
          return resetForNewDay(prev, today);
        }
        return prev;
      });
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (state.timer.mode !== 'RUNNING') return;
    const tick = window.setInterval(() => {
      setState((prev) => {
        if (prev.timer.mode !== 'RUNNING') return prev;
        const remaining = Math.max(prev.timer.secondsRemaining - 1, 0);
        const mode: TimerState['mode'] = remaining === 0 ? 'PAUSED' : 'RUNNING';
        return {
          ...prev,
          timer: {
            ...prev.timer,
            secondsRemaining: remaining,
            mode,
          },
        };
      });
    }, 1000);
    return () => window.clearInterval(tick);
  }, [state.timer.mode]);

  const logViolation = useCallback(
    (rule: string, taskId?: string, comment?: string) => {
      setState((prev) => ({
        ...prev,
        violations: [
          {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            rule,
            taskId,
            comment,
          },
          ...prev.violations,
        ].slice(0, 50),
      }));
    },
    [],
  );

  const moveTaskToColumn = (task: Task, target: ColumnId, note?: string): Task => {
    const now = new Date().toISOString();
    return {
      ...task,
      column: target,
      lastUpdated: now,
      history: [...(task.history || []), { at: now, from: task.column, to: target, note }],
    };
  };

  const triageTask = (
    prev: AppState,
    targetId: string,
  ): { nextState: AppState; violation?: { rule: string; taskId?: string; comment?: string } } => {
    const target = prev.tasks.find((t) => t.id === targetId);
    if (!target) {
      return { nextState: prev, violation: { rule: 'Task not found', taskId: targetId } };
    }
    if (target.column !== 'INBOX') {
      return { nextState: prev, violation: { rule: 'Triage only allowed in Inbox', taskId: target.id } };
    }
    const shouldBlock = Boolean(target.dependencyOwner && target.dependencyItem && target.nextCheck);
    if (shouldBlock) {
      if (!target.dependencyOwner || !target.dependencyItem || !target.nextCheck) {
        return { nextState: prev, violation: { rule: 'Blocked tasks require dependency info', taskId: target.id } };
      }
      return {
        nextState: {
          ...prev,
          tasks: prev.tasks.map((task) =>
            task.id === targetId ? { ...moveTaskToColumn(task, 'BLOCKED', 'Triage'), status: 'OPEN' } : task,
          ),
        },
      };
    }
    if (!target.workMinutes || !target.blocks || !target.blockType) {
      return { nextState: prev, violation: { rule: 'Ready tasks require estimates', taskId: target.id } };
    }
    return {
      nextState: {
        ...prev,
        tasks: prev.tasks.map((task) =>
          task.id === targetId ? { ...moveTaskToColumn(task, 'READY', 'Triage'), status: 'OPEN' } : task,
        ),
      },
    };
  };

  const handleTriage = (task: Task) => {
    let violation: { rule: string; taskId?: string; comment?: string } | undefined;
    setState((prev) => {
      const result = triageTask(prev, task.id);
      if (result.violation) {
        violation = result.violation;
        return prev;
      }
      return result.nextState;
    });
    if (violation) {
      logViolation(violation.rule, violation.taskId, violation.comment);
    }
  };

  const handleFormSubmit = (payload: TaskFormPayload, quickTriage: boolean) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: payload.title,
      project: payload.project,
      column: 'INBOX',
      status: 'OPEN',
      dependencyOwner: payload.dependencyOwner,
      dependencyItem: payload.dependencyItem,
      nextCheck: payload.nextCheck,
      workMinutes: payload.workMinutes,
      rampMinutes: payload.rampMinutes,
      blocks: payload.blocks,
      blockType: payload.blockType,
      lastUpdated: now,
      history: [],
    };
    setState((prev) => {
      const baseNext: AppState = {
        ...prev,
        tasks: [newTask, ...prev.tasks],
      };
      if (!quickTriage) {
        return baseNext;
      }
      const result = triageTask(baseNext, newTask.id);
      if (result.violation) {
        setTimeout(() => logViolation(result.violation!.rule, result.violation!.taskId, result.violation!.comment), 0);
        return baseNext;
      }
      return result.nextState;
    });
  };

  const handleMoveToToday = (task: Task) => {
    if (task.column !== 'READY') {
      logViolation('Only READY tasks can move to Today', task.id);
      return;
    }
    const capacityUsed = task.blockType === 'DEEP' ? state.todayDeepBlocksUsed : state.todayShallowBlocksUsed;
    const capacityMax = task.blockType === 'DEEP' ? state.todayDeepBlocksMax : state.todayShallowBlocksMax;
    if (capacityUsed + task.blocks > capacityMax) {
      logViolation('Daily capacity exceeded', task.id, 'Cannot move to Today');
      return;
    }
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === task.id ? { ...moveTaskToColumn(t, 'TODAY', 'Planned today'), status: 'OPEN' } : t)),
      todayDeepBlocksUsed:
        task.blockType === 'DEEP' ? prev.todayDeepBlocksUsed + task.blocks : prev.todayDeepBlocksUsed,
      todayShallowBlocksUsed:
        task.blockType === 'SHALLOW' ? prev.todayShallowBlocksUsed + task.blocks : prev.todayShallowBlocksUsed,
    }));
  };

  const detachTimer = (timerOverride?: TimerState) => {
    setState((prev) => ({
      ...prev,
      timer: timerOverride ? timerOverride : { ...defaultTimerState },
    }));
  };

  const handleActivate = (task: Task) => {
    if (task.column !== 'TODAY') {
      logViolation('Only Today tasks can activate', task.id);
      return;
    }
    setState((prev) => {
      const currentActive = prev.tasks.find((t) => t.column === 'ACTIVE');
      const now = new Date().toISOString();
      const updatedTasks = prev.tasks.map((t) => {
        if (currentActive && t.id === currentActive.id) {
          return {
            ...t,
            column: 'TODAY',
            status: 'PAUSED',
            lastPausedNote: 'Interrupted to switch task',
            lastUpdated: now,
            history: [...(t.history || []), { at: now, from: 'ACTIVE', to: 'TODAY', note: 'Auto pause' }],
          };
        }
        if (t.id === task.id) {
          return {
            ...t,
            column: 'ACTIVE',
            status: 'ACTIVE',
            lastUpdated: now,
            history: [...(t.history || []), { at: now, from: 'TODAY', to: 'ACTIVE', note: 'Activate' }],
          };
        }
        return t;
      });
      const seconds = task.blockType === 'DEEP' ? deepCycleSeconds : shallowCycleSeconds;
      return {
        ...prev,
        tasks: updatedTasks,
        timer: {
          mode: 'IDLE',
          secondsRemaining: seconds,
          totalSeconds: seconds,
          attachedTaskId: task.id,
          currentCycleType: task.blockType,
        },
      };
    });
  };

  const handleComplete = (task: Task) => {
    if (task.column !== 'ACTIVE') {
      logViolation('Complete only from Active', task.id);
      return;
    }
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === task.id ? { ...moveTaskToColumn(t, 'DONE', 'Complete'), status: 'DONE' } : t)),
      timer: { ...defaultTimerState },
    }));
  };

  const handlePause = (task: Task) => {
    if (task.column !== 'ACTIVE') {
      logViolation('Pause only from Active', task.id);
      return;
    }
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === task.id
          ? { ...moveTaskToColumn(t, 'TODAY', 'Paused'), status: 'PAUSED', lastPausedNote: 'Manual pause' }
          : t,
      ),
      timer: { ...defaultTimerState },
    }));
  };

  const handleResolveDependency = (task: Task) => {
    if (task.column !== 'BLOCKED') {
      logViolation('Only blocked tasks can resolve', task.id);
      return;
    }
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === task.id ? { ...moveTaskToColumn(t, 'READY', 'Dependency resolved'), status: 'OPEN' } : t,
      ),
    }));
  };

  const handleUpdateNextCheck = (task: Task, value: string) => {
    updateTask(task.id, (current) => ({ ...current, nextCheck: value ? new Date(value).toISOString() : undefined }));
  };

  const handleDelete = (task: Task) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== task.id),
    }));
  };

  const handleStartTimer = () => {
    if (!activeTask) {
      logViolation('No active task to start timer');
      return;
    }
    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        mode: 'RUNNING',
        secondsRemaining: prev.timer.secondsRemaining || prev.timer.totalSeconds,
        totalSeconds: prev.timer.totalSeconds,
      },
    }));
  };

  const handlePauseTimer = () => {
    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        mode: 'PAUSED',
      },
    }));
  };

  const handleResetTimer = () => {
    setState((prev) => ({
      ...prev,
      timer: prev.timer.attachedTaskId
        ? {
            ...prev.timer,
            mode: 'IDLE',
            secondsRemaining: prev.timer.totalSeconds,
          }
        : { ...defaultTimerState },
    }));
  };

  const handleCycleAction = (action: 'done' | 'continue' | 'pause') => {
    if (!activeTask) return;
    if (action === 'done') {
      handleComplete(activeTask);
      return;
    }
    if (action === 'pause') {
      handlePause(activeTask);
      return;
    }
    // continue same task
    const seconds = activeTask.blockType === 'DEEP' ? deepCycleSeconds : shallowCycleSeconds;
    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        secondsRemaining: seconds,
        totalSeconds: seconds,
        mode: 'IDLE',
      },
    }));
  };

  const currentDate = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#111] text-black">
      <div className="max-w-[1300px] mx-auto px-4 py-8">
        <div className="bg-white border-4 border-black rounded-2xl shadow-brutal p-6 space-y-6">
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b-4 border-black pb-4">
            <h1 className="text-3xl font-black uppercase tracking-wide">Execution Board</h1>
            <div className="flex flex-wrap gap-2 text-xs font-bold uppercase">
              <span className="px-3 py-1 border-2 border-black rounded-full bg-accentBlue text-white">
                Deep blocks: {state.todayDeepBlocksUsed} / {state.todayDeepBlocksMax}
              </span>
              <span className="px-3 py-1 border-2 border-black rounded-full bg-accentYellow">
                Shallow: {state.todayShallowBlocksUsed} / {state.todayShallowBlocksMax}
              </span>
              <span className="px-3 py-1 border-2 border-black rounded-full bg-gray-100">{currentDate}</span>
            </div>
          </header>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <Board
                tasks={state.tasks}
                onTriage={handleTriage}
                onMoveToToday={handleMoveToToday}
                onActivate={handleActivate}
                onComplete={handleComplete}
                onPause={handlePause}
                onResolveDependency={handleResolveDependency}
                onUpdateNextCheck={handleUpdateNextCheck}
                onDelete={handleDelete}
              />
            </div>
            <aside className="w-full lg:w-96 space-y-4">
              <div className="bg-white border-4 border-black rounded-xl shadow-brutal p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase">Task creator</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 border border-black rounded-full bg-accentYellow">
                    Inbox first
                  </span>
                </div>
                <TaskForm onSubmit={handleFormSubmit} />
              </div>
              <TimerPanel
                timer={state.timer}
                activeTask={activeTask}
                onStart={handleStartTimer}
                onPause={handlePauseTimer}
                onReset={handleResetTimer}
                onCycleAction={handleCycleAction}
              />
              <StatsPanel
                tasks={state.tasks}
                deepUsed={state.todayDeepBlocksUsed}
                deepMax={state.todayDeepBlocksMax}
                shallowUsed={state.todayShallowBlocksUsed}
                shallowMax={state.todayShallowBlocksMax}
              />
              <ViolationsPanel violations={state.violations} />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
