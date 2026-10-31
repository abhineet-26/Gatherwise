import type { Event, Task, BudgetLine, Risk } from '../schemas';

export type CategoryId = string;
export type VendorCategory = string;

export interface SubEventPreset {
  id: string;
  name: string;
  startingFunctions: string[];
}

export interface CategoryDef {
  id: CategoryId;
  label: string;
  scalesWithHeadcount: boolean;
  vendorCategory?: VendorCategory;
}

export interface TaskTemplate {
  id: string;
  title: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  leadDays: number;
  minLeadDays: number;
  after?: string[];
  effort?: 'S' | 'M' | 'L';
  category: CategoryId;
  appliesWhen?: (event: Event) => boolean;
}

export interface EssentialDef {
  category: CategoryId;
  bookByDays: number;
  weight: 1 | 2;
}

export interface RiskRule {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
  evaluate: (ctx: {
    event: Event;
    tasks: Task[];
    budgetLines: BudgetLine[];
    risks: Risk[];
    daysToEvent: number;
  }) => boolean;
}

export interface IdeaSeed {
  id: string;
  kind: 'theme' | 'menu' | 'decor' | 'activity' | 'entertainment' | 'favour' | 'sustainability';
  title: string;
  summary: string;
  whyItFits: string[];
  budgetTier: 1 | 2 | 3;
  effort: 1 | 2 | 3;
  tags: string[];
}

export interface TemplatePack {
  id: 'wedding' | 'birthday' | 'community';
  segmentLabel: 'Function' | 'Session' | 'Day';
  presets: SubEventPreset[];
  budgetProfiles: Record<'standard' | 'lean', Record<CategoryId, number>>;
  categories: CategoryDef[];
  essentials: EssentialDef[];
  tasks: TaskTemplate[];
  vendorChecklists: Record<VendorCategory, string[]>;
  riskRules: RiskRule[];
  ideaLibrary: IdeaSeed[];
  outlinePrompts: string[];
}
