import type { ToolDeclaration, ToolResult, AiContext } from '../types';
import { executeTool } from './handlers';

export const TOOL_DECLARATIONS: ToolDeclaration[] = [
  {
    name: 'get_event_overview',
    description: 'Fetch high-level event details: type, city, date, days left, target budget, guest counts.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_budget_summary',
    description: 'Calculate official budget status, totals, committed amounts, paid, remaining, and overdue payments using the pure domain kernel.',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Optional category to inspect' },
      },
    },
  },
  {
    name: 'list_tasks',
    description: 'List event tasks filtered by status (overdue, critical, due_soon, all) with lead days.',
    parameters: {
      type: 'object',
      properties: {
        filter: { type: 'string', enum: ['overdue', 'due_soon', 'critical', 'all'], description: 'Filter category' },
        limit: { type: 'number', description: 'Maximum tasks to return (max 30)' },
      },
    },
  },
  {
    name: 'list_risks',
    description: 'List open planning risks and mitigations identified for this celebration.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'compare_quotes',
    description: 'Perform deterministic tax-inclusive quotation normalisation and side-by-side MCDA scoring.',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Category e.g. catering, venue, photography' },
      },
      required: ['category'],
    },
  },
  {
    name: 'get_headcount_plan',
    description: 'Get projected attendance (low, likely, high) and catering plate order headcount with buffers.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_benchmarks',
    description: 'Retrieve indicative Indian celebration planning benchmarks and typical cost allocations.',
    parameters: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Topic keyword e.g. catering, photography, buffer' },
      },
    },
  },
  // Proposal tools
  {
    name: 'propose_tasks',
    description: 'Draft new tasks for the user to approve and add to their timeline.',
    parameters: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              category: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              dueDate: { type: 'string', description: 'YYYY-MM-DD' },
              whyThis: { type: 'string' },
            },
            required: ['title', 'category'],
          },
        },
      },
      required: ['tasks'],
    },
  },
  {
    name: 'propose_budget_reallocation',
    description: 'Draft a zero-sum budget reallocation moving existing funds between two categories.',
    parameters: {
      type: 'object',
      properties: {
        fromCategory: { type: 'string' },
        toCategory: { type: 'string' },
        amountPaise: { type: 'number', description: 'Amount to move in paise' },
      },
      required: ['fromCategory', 'toCategory', 'amountPaise'],
    },
  },
  {
    name: 'propose_payment_record',
    description: 'Draft a quick-add payment record for user confirmation.',
    parameters: {
      type: 'object',
      properties: {
        vendorName: { type: 'string' },
        amountPaise: { type: 'number' },
        mode: { type: 'string', enum: ['upi', 'cash', 'bank_transfer', 'cheque'] },
      },
      required: ['vendorName', 'amountPaise'],
    },
  },
];

const MAX_TOOL_RESULT_BYTES = 16 * 1024; // 16 KB cap (AI-DESIGN.md §5)

export async function runTool(
  name: string,
  args: Record<string, unknown>,
  context: AiContext
): Promise<ToolResult> {
  const result = executeTool(name, args, context);

  // Enforce 16 KB payload cap
  const json = JSON.stringify(result);
  if (json.length > MAX_TOOL_RESULT_BYTES) {
    return {
      toolName: name,
      data: {
        summary: 'Result truncated due to 16KB payload cap',
        preview: JSON.parse(json.slice(0, 1000) + '...'),
      },
      display: result.display,
      truncated: true,
    };
  }

  return result;
}
