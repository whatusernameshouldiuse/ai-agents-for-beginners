import { FormEvent, useState } from 'react';
import { BlockType, ProjectId } from '../types';

export interface TaskFormPayload {
  title: string;
  project: ProjectId;
  dependencyOwner?: string;
  dependencyItem?: string;
  nextCheck?: string;
  workMinutes: number;
  rampMinutes: number;
  blocks: number;
  blockType: BlockType;
}

interface TaskFormProps {
  onSubmit: (payload: TaskFormPayload, quickTriage: boolean) => void;
}

const TaskForm = ({ onSubmit }: TaskFormProps) => {
  const [title, setTitle] = useState('');
  const [project, setProject] = useState<ProjectId>('OTHER');
  const [isBlocked, setIsBlocked] = useState(false);
  const [dependencyOwner, setDependencyOwner] = useState('');
  const [dependencyItem, setDependencyItem] = useState('');
  const [nextCheck, setNextCheck] = useState('');
  const [workMinutes, setWorkMinutes] = useState(30);
  const [rampMinutes, setRampMinutes] = useState(10);
  const [blocks, setBlocks] = useState(1);
  const [blockType, setBlockType] = useState<BlockType>('DEEP');

  const resetForm = () => {
    setTitle('');
    setProject('OTHER');
    setIsBlocked(false);
    setDependencyOwner('');
    setDependencyItem('');
    setNextCheck('');
    setWorkMinutes(30);
    setRampMinutes(10);
    setBlocks(1);
    setBlockType('DEEP');
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>, quickTriage: boolean) => {
    e.preventDefault();
    if (!title.trim()) return;
    const payload: TaskFormPayload = {
      title: title.trim(),
      project,
      dependencyOwner: isBlocked ? dependencyOwner : undefined,
      dependencyItem: isBlocked ? dependencyItem : undefined,
      nextCheck: isBlocked && nextCheck ? new Date(nextCheck).toISOString() : undefined,
      workMinutes,
      rampMinutes,
      blocks,
      blockType,
    };
    onSubmit(payload, quickTriage);
    resetForm();
  };

  return (
    <form className="space-y-3" onSubmit={(e) => handleSubmit(e, false)}>
      <div>
        <label className="text-xs font-bold uppercase">Title</label>
        <input
          className="w-full border-2 border-black rounded-md px-3 py-2 mt-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold uppercase">Project</label>
          <select
            className="w-full border-2 border-black rounded-md px-2 py-2 mt-1"
            value={project}
            onChange={(e) => setProject(e.target.value as ProjectId)}
          >
            <option value="RENTAGUN">Rentagun</option>
            <option value="GUNSTREAMER">Gunstreamer</option>
            <option value="BBGV">BBGV</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase">Blocked?</label>
          <select
            className="w-full border-2 border-black rounded-md px-2 py-2 mt-1"
            value={isBlocked ? 'yes' : 'no'}
            onChange={(e) => setIsBlocked(e.target.value === 'yes')}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
      </div>
      {isBlocked && (
        <div className="grid grid-cols-1 gap-2">
          <div>
            <label className="text-xs font-bold uppercase">Dependency Owner</label>
            <input
              className="w-full border-2 border-black rounded-md px-3 py-2 mt-1"
              value={dependencyOwner}
              onChange={(e) => setDependencyOwner(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase">Dependency Item</label>
            <input
              className="w-full border-2 border-black rounded-md px-3 py-2 mt-1"
              value={dependencyItem}
              onChange={(e) => setDependencyItem(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase">Next Check</label>
            <input
              type="datetime-local"
              className="w-full border-2 border-black rounded-md px-3 py-2 mt-1"
              value={nextCheck}
              onChange={(e) => setNextCheck(e.target.value)}
            />
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-bold uppercase">Work (m)</label>
          <input
            type="number"
            min={0}
            className="w-full border-2 border-black rounded-md px-3 py-2 mt-1"
            value={workMinutes}
            onChange={(e) => setWorkMinutes(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase">Ramp (m)</label>
          <input
            type="number"
            min={0}
            className="w-full border-2 border-black rounded-md px-3 py-2 mt-1"
            value={rampMinutes}
            onChange={(e) => setRampMinutes(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase">Blocks</label>
          <input
            type="number"
            min={1}
            max={3}
            className="w-full border-2 border-black rounded-md px-3 py-2 mt-1"
            value={blocks}
            onChange={(e) => setBlocks(Number(e.target.value))}
          />
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs font-bold uppercase">
        <label>
          <input
            type="radio"
            className="mr-1"
            checked={blockType === 'DEEP'}
            onChange={() => setBlockType('DEEP')}
          />
          Deep
        </label>
        <label>
          <input
            type="radio"
            className="mr-1"
            checked={blockType === 'SHALLOW'}
            onChange={() => setBlockType('SHALLOW')}
          />
          Shallow
        </label>
      </div>
      <div className="flex flex-col gap-2">
        <button type="submit" className="neo-btn">
          Add to inbox
        </button>
        <button type="button" className="neo-btn bg-accentYellow" onClick={(e) => handleSubmit(e as any, true)}>
          Add + Quick triage
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
