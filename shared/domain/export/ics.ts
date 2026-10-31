import type { Task } from '../../schemas';

/**
 * Escapes characters per RFC 5545 section 3.3.11
 */
export function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Folds lines longer than 75 octets per RFC 5545 section 3.1
 */
export function foldIcsLine(line: string): string {
  if (line.length <= 75) return line;

  const chunks: string[] = [];
  let remaining = line;

  chunks.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);

  while (remaining.length > 74) {
    chunks.push(` ${remaining.slice(0, 74)}`);
    remaining = remaining.slice(74);
  }

  if (remaining.length > 0) {
    chunks.push(` ${remaining}`);
  }

  return chunks.join('\r\n');
}

export function buildIcsCalendar(tasks: Task[], eventName = 'GatherWise Event'): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GatherWise//Event Planning Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(eventName)}`,
  ];

  for (const task of tasks) {
    const dateStr = task.dueDate.replace(/-/g, '');
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${task.id}@gatherwise.in`);
    lines.push(`DTSTAMP:${dateStr}T090000Z`);
    lines.push(`DTSTART;VALUE=DATE:${dateStr}`);
    lines.push(`DTEND;VALUE=DATE:${dateStr}`);
    lines.push(`SUMMARY:${escapeIcsText(task.title)}`);
    if (task.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(task.description)}`);
    }
    lines.push(`PRIORITY:${task.priority === 'critical' ? '1' : task.priority === 'high' ? '3' : '5'}`);
    lines.push(`STATUS:${task.status === 'done' ? 'COMPLETED' : 'CONFIRMED'}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}
