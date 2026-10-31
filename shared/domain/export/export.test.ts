import { describe, expect, it } from 'vitest';
import { sanitizeCsvCell, buildCsv } from './csv';
import { escapeIcsText, foldIcsLine, buildIcsCalendar } from './ics';
import { asIsoDate } from '../time/dates';
import type { Task } from '../../schemas';

describe('Export Security & Standards Compliance', () => {
  describe('CSV Export', () => {
    it('guards against formula injection by prefixing dangerous characters with single quote', () => {
      expect(sanitizeCsvCell('=1+1')).toBe(`"'=1+1"`);
      expect(sanitizeCsvCell('+cmd|')).toBe(`"'+cmd|"`);
      expect(sanitizeCsvCell('-5')).toBe(`"'-5"`);
      expect(sanitizeCsvCell('@SUM(A1:A5)')).toBe(`"'@SUM(A1:A5)"`);
      expect(sanitizeCsvCell('\tmalicious')).toBe(`"'\tmalicious"`);
    });

    it('escapes quotes and produces valid CSV rows', () => {
      const csv = buildCsv(['Name', 'Category'], [['Sharma "Grand" Catering', 'Food']]);
      expect(csv).toBe('"Name","Category"\r\n"Sharma ""Grand"" Catering","Food"');
    });
  });

  describe('ICS Export', () => {
    it('escapes characters per RFC 5545', () => {
      expect(escapeIcsText('Hello, world; test\\break\nnext')).toBe('Hello\\, world\\; test\\\\break\\nnext');
    });

    it('folds lines longer than 75 characters with CRLF and space', () => {
      const longText = 'SUMMARY:' + 'A'.repeat(80);
      const folded = foldIcsLine(longText);
      const lines = folded.split('\r\n');
      expect(lines.length).toBe(2);
      expect(lines[0]?.length).toBeLessThanOrEqual(75);
      expect(lines[1]?.startsWith(' ')).toBe(true);
    });

    it('generates valid VCALENDAR with task events', () => {
      const tasks: Task[] = [
        {
          id: 't-1',
          eventId: 'evt-1',
          title: 'Finalize Catering Menu',
          category: 'catering',
          priority: 'critical',
          dueDate: asIsoDate('2026-11-10'),
          dueDateLocked: false,
          status: 'todo',
          dependsOn: [],
          notes: '',
          effort: 'M',
          origin: { kind: 'template' },
        },
      ];

      const ics = buildIcsCalendar(tasks, 'My Wedding');
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('SUMMARY:Finalize Catering Menu');
      expect(ics).toContain('DTSTART;VALUE=DATE:20261110');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('END:VCALENDAR');
    });
  });
});
