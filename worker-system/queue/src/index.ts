export interface Job {
  id: string;
  type: string;
  payload: any;
  priority: number;
}

export class TaskQueue {
  private queue: Job[] = [];

  push(job: Job): void {
    this.queue.push(job);
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  pop(): Job | undefined {
    return this.queue.shift();
  }

  size(): number {
    return this.queue.length;
  }
}
