import type { ToolResult } from './types';

/**
 * Number Audit (AI-DESIGN.md §8)
 * Checks that any rupee or percentage figures cited in the LLM text
 * are present in the tool results or user message.
 */
export function auditNumbers(
  text: string,
  userMessage: string,
  toolResults: ToolResult[]
): string[] {
  // Extract rupee patterns like ₹4,95,600, Rs. 50,000, 4.5 lakh, or percentages like 18%
  const rupeePattern = /(?:₹|Rs\.?)\s*[\d,]+(?:\.\d+)?|\b\d+(?:\.\d+)?\s*(?:lakh|cr|crore|%)/gi;
  const matches = text.match(rupeePattern) || [];

  if (matches.length === 0) return [];

  // Build corpus of allowed known figures from tool results & user message
  const toolText = JSON.stringify(toolResults);
  const allowedCorpus = `${userMessage} ${toolText}`.replace(/\s+/g, ' ').toLowerCase();

  const unverified: string[] = [];

  for (const match of matches) {
    const rawNumber = match.replace(/[^0-9]/g, '');
    if (!rawNumber) continue;

    // Check if the number or cleaned number exists in the allowed corpus
    const cleanMatch = match.trim().toLowerCase();
    const isDirectMatch = allowedCorpus.includes(cleanMatch);
    const isNumberInCorpus = allowedCorpus.includes(rawNumber);

    if (!isDirectMatch && !isNumberInCorpus) {
      unverified.push(match);
    }
  }

  return Array.from(new Set(unverified));
}
