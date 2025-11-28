// src/types/task.ts
import { type NotifyRunMode } from '../utils/constants';

export interface TaskNotify {
  id: number;
  user_id: number;
  category_id: number;
  item_id: number;
  progress_id: number;
  start_at: string;
  stop_at: string;
  run_mode: NotifyRunMode;
  run_code: number;
  time_at?: string;
  week_at?: number;
  last_executed?: string;
}

export interface TaskProgress {
  id: number;
  user_id?: number;
  item_id: number;
  progress_name: string;
  content: string;
  progress_at: string;
  status: number;
  notifies?: TaskNotify[];
}

export interface TaskItem {
  id: number;
  user_id?: number;
  category_id: number;
  item_name: string;
  content: string;
  item_at: string;
  progresses?: TaskProgress[];
  showProgress?: boolean;
}

export interface TaskCategory {
  id: number;
  category_name: string;
  content: string;
  items?: TaskItem[];
  showItems?: boolean;
}
