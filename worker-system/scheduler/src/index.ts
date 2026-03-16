import { TaskQueue, Job } from '../../queue/src/index';

export class Scheduler {
  constructor(private queue: TaskQueue) {}

  schedule(type: string, payload: any, priority: number = 0): string {
    const id = Math.random().toString(36).substring(7);
    const job: Job = { id, type, payload, priority };
    this.queue.push(job);
    console.log(`[Scheduler] Scheduled job ${id} (${type})`);
    return id;
  }
}
