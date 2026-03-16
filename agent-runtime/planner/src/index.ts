export interface Task {
  id: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  dependencies?: string[];
  result?: any;
}

export interface Plan {
  id: string;
  goal: string;
  tasks: Task[];
  status: 'PLANNING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
}

export class TaskPlanner {
  createPlan(goal: string): Plan {
    // Basic stub planner
    return {
      id: Date.now().toString(),
      goal,
      tasks: [
        {
          id: 'task-1',
          description: `Analyze goal: ${goal}`,
          status: 'PENDING'
        }
      ],
      status: 'PLANNING'
    };
  }

  updateTaskStatus(plan: Plan, taskId: string, status: Task['status'], result?: any): Plan {
    const updatedTasks = plan.tasks.map(t => 
      t.id === taskId ? { ...t, status, result } : t
    );
    
    const allCompleted = updatedTasks.every(t => t.status === 'COMPLETED');
    const anyFailed = updatedTasks.some(t => t.status === 'FAILED');
    
    return {
      ...plan,
      tasks: updatedTasks,
      status: anyFailed ? 'FAILED' : (allCompleted ? 'COMPLETED' : plan.status)
    };
  }
}
