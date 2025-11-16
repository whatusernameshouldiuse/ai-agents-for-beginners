import { AppState, BlockType, ColumnId, Task, TimerState } from './types';

export const columnOrder: ColumnId[] = ['INBOX', 'BLOCKED', 'READY', 'TODAY', 'ACTIVE', 'DONE'];

export const columnLabels: Record<ColumnId, string> = {
  INBOX: 'Inbox',
  BLOCKED: 'Blocked',
  READY: 'Ready',
  TODAY: 'Today',
  ACTIVE: 'Active',
  DONE: 'Done',
};

export const projectLabels = {
  RENTAGUN: 'Rentagun',
  GUNSTREAMER: 'Gunstreamer',
  BBGV: 'BBGV',
  OTHER: 'Other',
};

export const blockTypeLabels: Record<BlockType, string> = {
  DEEP: 'Deep',
  SHALLOW: 'Shallow',
};

export const defaultTimerState: TimerState = {
  mode: 'IDLE',
  secondsRemaining: 0,
  totalSeconds: 0,
  attachedTaskId: undefined,
  currentCycleType: null,
};

export const getDayKey = (date = new Date()) => date.toISOString().slice(0, 10);

export const deepCycleSeconds = 50 * 60;
export const shallowCycleSeconds = 25 * 60;

export const seedTasks = (): Task[] => {
  const now = new Date().toISOString();
  return [
    {
      id: crypto.randomUUID(),
      title: 'Capture random ideas here',
      project: 'OTHER',
      column: 'INBOX',
      status: 'OPEN',
      workMinutes: 15,
      rampMinutes: 5,
      blocks: 1,
      blockType: 'SHALLOW',
      lastUpdated: now,
      history: [],
    },
    {
      id: crypto.randomUUID(),
      title: 'Draft feature brief for Rentagun',
      project: 'RENTAGUN',
      column: 'READY',
      status: 'OPEN',
      workMinutes: 90,
      rampMinutes: 15,
      blocks: 2,
      blockType: 'DEEP',
      lastUpdated: now,
      history: [
        { at: now, from: 'INBOX', to: 'READY', note: 'Seed' },
      ],
    },
    {
      id: crypto.randomUUID(),
      title: 'Waiting on vendor quote',
      project: 'BBGV',
      column: 'BLOCKED',
      status: 'OPEN',
      dependencyOwner: 'Vendor X',
      dependencyItem: 'Updated pricing',
      nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      workMinutes: 0,
      rampMinutes: 0,
      blocks: 1,
      blockType: 'SHALLOW',
      lastUpdated: now,
      history: [
        { at: now, from: 'INBOX', to: 'BLOCKED', note: 'Seed' },
      ],
    },
  ];
};

export const baseAppState = (): AppState => ({
  tasks: seedTasks(),
  todayDeepBlocksMax: 2,
  todayShallowBlocksMax: 1,
  todayDeepBlocksUsed: 0,
  todayShallowBlocksUsed: 0,
  violations: [],
  timer: { ...defaultTimerState },
  currentDayKey: getDayKey(),
});
