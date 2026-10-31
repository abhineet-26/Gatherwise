import type { WorkspaceState, BaseCommand, CommandResult } from './types';
import { handleTaskAndEventCommands } from './reducers/taskReducers';
import { handleBudgetCommands } from './reducers/budgetReducers';
import { handleVendorCommands } from './reducers/vendorReducers';
import { handleGuestAndRiskCommands } from './reducers/guestReducers';

export function reduceCommand(state: WorkspaceState, command: BaseCommand): CommandResult {
  const taskOrEventRes = handleTaskAndEventCommands(state, command);
  if (taskOrEventRes) return taskOrEventRes;

  const budgetRes = handleBudgetCommands(state, command);
  if (budgetRes) return budgetRes;

  const vendorRes = handleVendorCommands(state, command);
  if (vendorRes) return vendorRes;

  const guestOrRiskRes = handleGuestAndRiskCommands(state, command);
  if (guestOrRiskRes) return guestOrRiskRes;

  return {
    nextState: state,
    inverse: null,
    summary: `Unknown command ${command.type}`,
  };
}
