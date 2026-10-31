import type { WorkspaceState } from 'shared/commands/types';
import { createWeddingScenario } from './weddingScenario';
import { createBirthdayScenario } from './birthdayScenario';
import { createFestScenario } from './festScenario';

export function createSeededScenarios(today: string): Record<string, WorkspaceState> {
  const wedding = createWeddingScenario(today);
  const birthday = createBirthdayScenario(today);
  const fest = createFestScenario(today);

  return {
    [wedding.id]: wedding.state,
    [birthday.id]: birthday.state,
    [fest.id]: fest.state,
  };
}
