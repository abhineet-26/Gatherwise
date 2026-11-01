import { describe, expect, it } from 'vitest';
import {
  timeToMinutes,
  minutesToTime,
  computeEndTime,
  applyDelay,
  detectConflicts,
} from './delayCascade';
import type { RunOfShowItem } from './types';

describe('Run-of-show Delay Cascade (DOMAIN-MODEL.md §5.11)', () => {
  it('converts times to minutes and back accurately', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('18:30')).toBe(1110);
    expect(timeToMinutes('23:59')).toBe(1439);

    expect(minutesToTime(0)).toBe('00:00');
    expect(minutesToTime(1110)).toBe('18:30');
    expect(computeEndTime('18:30', 45)).toBe('19:15');
  });

  it('cascades delay through items while subtracting buffers', () => {
    const items: RunOfShowItem[] = [
      {
        id: 'baraat',
        subEventId: 'wedding',
        title: 'Baraat Procession',
        startTime: '17:00',
        durationMinutes: 60,
        endTime: '18:00',
        bufferAfterMinutes: 15, // 15 min buffer
        isFixedTime: false,
        owner: 'Groom Family',
        status: 'upcoming',
      },
      {
        id: 'jaimala',
        subEventId: 'wedding',
        title: 'Jaimala Varmala',
        startTime: '18:15',
        durationMinutes: 30,
        endTime: '18:45',
        bufferAfterMinutes: 10, // 10 min buffer
        isFixedTime: false,
        owner: 'Anchor Amit',
        status: 'upcoming',
      },
      {
        id: 'dinner',
        subEventId: 'wedding',
        title: 'Dinner Buffet Opens',
        startTime: '19:00',
        durationMinutes: 120,
        endTime: '21:00',
        bufferAfterMinutes: 0,
        isFixedTime: false,
        owner: 'Catering Lead',
        status: 'upcoming',
      },
    ];

    // Baraat is delayed by 30 mins
    // Baraat new time: 17:30 - 18:30
    // Jaimala: carried = 30 - 15 (buffer) = 15 mins. New time: 18:30 - 19:00
    // Dinner: carried = 15 - 10 (buffer) = 5 mins. New time: 19:05 - 21:05
    const res = applyDelay(items, 'baraat', 30);
    expect(res.conflicts).toHaveLength(0);

    const baraat = res.updatedItems.find(it => it.id === 'baraat')!;
    expect(baraat.startTime).toBe('17:30');
    expect(baraat.endTime).toBe('18:30');
    expect(baraat.status).toBe('delayed');

    const jaimala = res.updatedItems.find(it => it.id === 'jaimala')!;
    expect(jaimala.startTime).toBe('18:30');
    expect(jaimala.endTime).toBe('19:00');

    const dinner = res.updatedItems.find(it => it.id === 'dinner')!;
    expect(dinner.startTime).toBe('19:05');
    expect(dinner.endTime).toBe('21:05');
  });

  it('stops cascade at fixed-time item and reports fixed_time_breach conflict', () => {
    const items: RunOfShowItem[] = [
      {
        id: 'baraat',
        subEventId: 'wedding',
        title: 'Baraat Procession',
        startTime: '17:00',
        durationMinutes: 60,
        endTime: '18:00',
        bufferAfterMinutes: 10,
        isFixedTime: false,
        owner: 'Groom Family',
        status: 'upcoming',
      },
      {
        id: 'pheras',
        subEventId: 'wedding',
        title: 'Vedic Pheras (Auspicious Muhurat)',
        startTime: '18:30',
        durationMinutes: 60,
        endTime: '19:30',
        bufferAfterMinutes: 0,
        isFixedTime: true, // Fixed Muhurat
        owner: 'Panditji',
        status: 'upcoming',
      },
      {
        id: 'reception',
        subEventId: 'wedding',
        title: 'Reception',
        startTime: '20:00',
        durationMinutes: 120,
        endTime: '22:00',
        bufferAfterMinutes: 0,
        isFixedTime: false,
        owner: 'Event Planner',
        status: 'upcoming',
      },
    ];

    // Baraat is delayed by 30 mins
    // Carried to Pheras = 30 - 10 = 20 mins.
    // Pheras is fixed-time -> cannot move!
    const res = applyDelay(items, 'baraat', 30);
    const pheras = res.updatedItems.find(it => it.id === 'pheras')!;
    expect(pheras.startTime).toBe('18:30'); // Did not move

    const breach = res.conflicts.find(c => c.type === 'fixed_time_breach');
    expect(breach).toBeDefined();
    expect(breach?.minutesLate).toBe(20);
    expect(breach?.message).toContain('fixed-time');
  });

  it('detects duplicate owner overlap conflicts', () => {
    const items: RunOfShowItem[] = [
      {
        id: 'item1',
        subEventId: 'sangeet',
        title: 'Couple Dance Performance',
        startTime: '19:00',
        durationMinutes: 30,
        endTime: '19:30',
        bufferAfterMinutes: 0,
        isFixedTime: false,
        owner: 'DJ Rahul',
        status: 'upcoming',
      },
      {
        id: 'item2',
        subEventId: 'sangeet',
        title: 'Family Flashmob',
        startTime: '19:15',
        durationMinutes: 30,
        endTime: '19:45',
        bufferAfterMinutes: 0,
        isFixedTime: false,
        owner: 'DJ Rahul', // Same DJ!
        status: 'upcoming',
      },
    ];

    const conflicts = detectConflicts(items);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]!.type).toBe('overlap');
    expect(conflicts[0]!.message).toContain('DJ Rahul');
  });
});
