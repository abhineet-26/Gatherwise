import type {
  Event,
  SubEvent,
  BudgetLine,
  Commitment,
  Payment,
  Task,
  Vendor,
  Quotation,
  Guest,
  Risk,
  ActivityEntry,
} from '../schemas';
import type { RunOfShowItem } from '../domain/runofshow/types';
import type { FundingSource } from '../domain/funding/types';

export interface WorkspaceState {
  event: Event;
  subEvents: SubEvent[];
  budgetLines: BudgetLine[];
  commitments: Commitment[];
  payments: Payment[];
  tasks: Task[];
  vendors: Vendor[];
  quotes: Quotation[];
  guests: Guest[];
  risks: Risk[];
  activity: ActivityEntry[];
  runOfShow?: RunOfShowItem[];
  funding?: FundingSource[];
}

export type CommandType =
  | 'CREATE_EVENT'
  | 'UPDATE_EVENT'
  | 'DELETE_EVENT'
  | 'ADD_SUB_EVENT'
  | 'UPDATE_SUB_EVENT'
  | 'DELETE_SUB_EVENT'
  | 'ADD_BUDGET_LINE'
  | 'UPDATE_BUDGET_LINE'
  | 'DELETE_BUDGET_LINE'
  | 'ADD_COMMITMENT'
  | 'CANCEL_COMMITMENT'
  | 'RECORD_PAYMENT'
  | 'UPDATE_PAYMENT'
  | 'DELETE_PAYMENT'
  | 'ADD_TASK'
  | 'UPDATE_TASK'
  | 'COMPLETE_TASK'
  | 'DELETE_TASK'
  | 'REFLOW_TASKS'
  | 'ADD_VENDOR'
  | 'UPDATE_VENDOR'
  | 'DELETE_VENDOR'
  | 'ADD_QUOTATION'
  | 'UPDATE_QUOTATION'
  | 'ACCEPT_QUOTATION'
  | 'DELETE_QUOTATION'
  | 'ADD_GUEST'
  | 'UPDATE_GUEST'
  | 'SET_RSVP'
  | 'DELETE_GUEST'
  | 'UPDATE_RISK_STATUS'
  | 'ADD_RUN_OF_SHOW_ITEM'
  | 'UPDATE_RUN_OF_SHOW_ITEM'
  | 'APPLY_RUN_OF_SHOW_DELAY'
  | 'DELETE_RUN_OF_SHOW_ITEM'
  | 'ADD_FUNDING_SOURCE'
  | 'UPDATE_FUNDING_SOURCE'
  | 'DELETE_FUNDING_SOURCE';

export interface BaseCommand {
  type: CommandType;
  eventId: string;
  payload: Record<string, unknown>;
  meta?: {
    actor?: 'user' | 'assistant_proposal' | 'system';
    proposalId?: string;
    summary?: string;
    timestamp?: string;
  };
}

export interface CommandResult {
  nextState: WorkspaceState;
  inverse: BaseCommand | null;
  summary: string;
}

/**
 * Commands allowed to be proposed by AI Copilot
 */
export const AI_ALLOWED_COMMANDS: ReadonlySet<CommandType> = new Set([
  'UPDATE_EVENT',
  'ADD_BUDGET_LINE',
  'UPDATE_BUDGET_LINE',
  'ADD_TASK',
  'UPDATE_TASK',
  'COMPLETE_TASK',
  'ADD_VENDOR',
  'UPDATE_VENDOR',
  'ADD_QUOTATION',
  'UPDATE_RISK_STATUS',
]);
