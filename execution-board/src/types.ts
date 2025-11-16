export type ColumnId = 'INBOX' | 'BLOCKED' | 'READY' | 'TODAY' | 'ACTIVE' | 'DONE';
export type ProjectId = 'RENTAGUN' | 'GUNSTREAMER' | 'BBGV' | 'OTHER';
export type TaskStatus = 'OPEN' | 'ACTIVE' | 'PAUSED' | 'IN_REVIEW' | 'DONE';
export type BlockType = 'DEEP' | 'SHALLOW';

export interface TaskHistoryEntry {
  at: string;
  from: ColumnId;
  to: ColumnId;
  note?: string;
}

export interface Task {
  id: string;
  title: string;
  project: ProjectId;
  column: ColumnId;
  status: TaskStatus;
  dependencyOwner?: string;
  dependencyItem?: string;
  nextCheck?: string;
  workMinutes: number;
  rampMinutes: number;
  blocks: number;
  blockType: BlockType;
  lastPausedNote?: string;
  lastUpdated: string;
  history?: TaskHistoryEntry[];
}

export type TimerMode = 'IDLE' | 'RUNNING' | 'PAUSED';

export interface TimerState {
  mode: TimerMode;
  secondsRemaining: number;
  totalSeconds: number;
  attachedTaskId?: string;
  currentCycleType: BlockType | null;
}

export interface ViolationEntry {
  id: string;
  timestamp: string;
  rule: string;
  taskId?: string;
  comment?: string;
}

export interface AppState {
  tasks: Task[];
  todayDeepBlocksMax: number;
  todayShallowBlocksMax: number;
  todayDeepBlocksUsed: number;
  todayShallowBlocksUsed: number;
  violations: ViolationEntry[];
  timer: TimerState;
  currentDayKey: string;
}
