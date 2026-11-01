import { describe, it, expect } from 'vitest';
import {
  applyDelay,
  detectConflicts,
  timeToMinutes,
  minutesToTime,
} from '../shared/domain/runofshow/delayCascade';
import type { RunOfShowItem } from '../shared/domain/runofshow/types';
import {
  computeFundingSummary,
} from '../shared/domain/funding/funding';
import type { FundingSource } from '../shared/domain/funding/types';
import { FirestoreRepository } from '../src/services/repositories/firestore';
import { t, setLanguage, getLanguage, translations } from '../src/i18n';
import { minor } from '../shared/domain/money/money';

describe('Phase 6 — Execution and Cloud Suite', () => {
  describe('Journey J8 — Run-of-Show & Delay Cascade (EXE-01, EXE-02)', () => {
    const sampleItems: RunOfShowItem[] = [
      {
        id: 'ros-1',
        subEventId: 'se-1',
        title: 'Baraat Arrival & Welcome',
        startTime: '10:00',
        durationMinutes: 60,
        endTime: '11:00',
        bufferAfterMinutes: 30, // 30 min buffer until 11:30
        isFixedTime: false,
        owner: 'Groom Family',
        status: 'upcoming',
      },
      {
        id: 'ros-2',
        subEventId: 'se-1',
        title: 'Varmala Ceremony',
        startTime: '11:30',
        durationMinutes: 45,
        endTime: '12:15',
        bufferAfterMinutes: 15,
        isFixedTime: false,
        owner: 'Priest & Coordinator',
        status: 'upcoming',
      },
      {
        id: 'ros-3',
        subEventId: 'se-1',
        title: 'Auspicious Muhurat Pheras',
        startTime: '12:30',
        durationMinutes: 75,
        endTime: '13:45',
        bufferAfterMinutes: 15,
        isFixedTime: true, // Fixed ritual time — cannot move!
        owner: 'Head Pandit',
        status: 'upcoming',
      },
    ];

    it('absorbs delay using available buffer without shifting subsequent items if within buffer', () => {
      // 20 minute delay on Baraat (buffer is 30m)
      const res = applyDelay(sampleItems, 'ros-1', 20);

      expect(res.conflicts).toHaveLength(0);
      const baraat = res.updatedItems.find(i => i.id === 'ros-1')!;
      expect(baraat.startTime).toBe('10:20');
      expect(baraat.endTime).toBe('11:20');
      // Buffer absorbed the 20m, remaining buffer is 10m, so Varmala still starts at 11:30
      const varmala = res.updatedItems.find(i => i.id === 'ros-2')!;
      expect(varmala.startTime).toBe('11:30');
    });

    it('cascades delay when buffer is exceeded and raises fixed-time breach', () => {
      // 60 minute delay on Baraat
      const res = applyDelay(sampleItems, 'ros-1', 60);

      const fixedConflict = res.conflicts.find(c => c.type === 'fixed_time_breach');
      expect(fixedConflict).toBeDefined();
      expect(fixedConflict?.itemId).toBe('ros-3');

      // Muhurat is fixed-time so its startTime MUST NOT change
      const muhurat = res.updatedItems.find(i => i.id === 'ros-3')!;
      expect(muhurat.startTime).toBe('12:30');
    });

    it('correctly converts between time strings and minutes', () => {
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('09:30')).toBe(570);
      expect(timeToMinutes('23:59')).toBe(1439);
      expect(minutesToTime(570)).toBe('09:30');
      expect(minutesToTime(1445)).toBe('00:05'); // Modulo 1440 wraparound
    });

    it('detects schedule overlaps', () => {
      const overlapping: RunOfShowItem[] = [
        {
          id: 'o-1',
          subEventId: 'se-1',
          title: 'Photo Session',
          startTime: '10:00',
          durationMinutes: 60,
          endTime: '11:00',
          bufferAfterMinutes: 0,
          isFixedTime: false,
          owner: 'Photographer',
          status: 'upcoming',
        },
        {
          id: 'o-2',
          subEventId: 'se-1',
          title: 'Guest High Tea',
          startTime: '10:30',
          durationMinutes: 60,
          endTime: '11:30',
          bufferAfterMinutes: 0,
          isFixedTime: false,
          owner: 'Photographer', // Same owner double booked
          status: 'upcoming',
        },
      ];

      const conflicts = detectConflicts(overlapping);
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0]!.type).toBe('overlap');
    });
  });

  describe('Journey J9 — Funding & Sponsor Tracker (FND-01)', () => {
    const targetBudget = minor(50000000); // ₹5,00,000

    it('computes coverage ratios and expected pipeline accurately', () => {
      const sources: FundingSource[] = [
        {
          id: 'f-1',
          name: 'Tech Corp Title Sponsor',
          kind: 'sponsor',
          stage: 'received',
          amountPaise: minor(20000000), // ₹2,00,000
          isInKind: false,
          deliverables: [
            { id: 'd-1', title: 'Logo on Stage Backdrop', isCompleted: true },
            { id: 'd-2', title: 'VIP Pass Allotment', isCompleted: true },
          ],
        },
        {
          id: 'f-2',
          name: 'Beverage Partner In-Kind',
          kind: 'sponsor',
          stage: 'confirmed',
          amountPaise: minor(10000000), // ₹1,00,000
          isInKind: true, // In-kind does not count toward cash coverage
          deliverables: [
            { id: 'd-3', title: '1000 beverage cans', isCompleted: false },
          ],
        },
        {
          id: 'f-3',
          name: 'Startup Pitching Sponsor',
          kind: 'sponsor',
          stage: 'pitched', // 0.25 weight
          amountPaise: minor(10000000), // ₹1,00,000 * 0.25 weight = ₹25,000
          isInKind: false,
          deliverables: [],
        },
      ];

      const summary = computeFundingSummary(sources, targetBudget);

      expect(summary.totalConfirmedPaise).toBe(20000000); // Only cash confirmed
      expect(summary.confirmedCoverageRatio).toBe(0.4); // 2L / 5L = 40%
      // Expected = 20000000*1.0 + 10000000*0.25 = 22500000
      expect(summary.totalExpectedPaise).toBe(22500000);
      expect(summary.expectedCoverageRatio).toBe(0.45);
      expect(summary.totalInKindPaise).toBe(10000000);
      expect(summary.fundingGapPaise).toBe(27500000); // 5L - 2.25L = 2.75L
    });

    it('flags concentration risk when a single sponsor exceeds 50% of confirmed funding', () => {
      const sources: FundingSource[] = [
        {
          id: 'f-big',
          name: 'Mega Enterprises',
          kind: 'sponsor',
          stage: 'confirmed',
          amountPaise: minor(40000000), // ₹4,00,000 (80% of confirmed)
          isInKind: false,
          deliverables: [],
        },
        {
          id: 'f-small',
          name: 'Local Cafe',
          kind: 'sponsor',
          stage: 'confirmed',
          amountPaise: minor(10000000), // ₹1,00,000
          isInKind: false,
          deliverables: [],
        },
      ];

      const summary = computeFundingSummary(sources, targetBudget);
      expect(summary.isConcentrationRisk).toBe(true);
      expect(summary.concentratedSourceName).toBe('Mega Enterprises');
    });
  });

  describe('Hindi UI & i18n Dictionary (SYS-06)', () => {
    it('provides both English and Hindi translations with complete parity for core keys', () => {
      expect(translations.en).toBeDefined();
      expect(translations.hi).toBeDefined();

      const enKeys = Object.keys(translations.en);
      const hiKeys = Object.keys(translations.hi);

      expect(enKeys.length).toBeGreaterThan(25);
      expect(hiKeys.length).toBe(enKeys.length);

      for (const k of enKeys) {
        expect(translations.hi[k as keyof typeof translations.hi]).toBeDefined();
        expect(typeof translations.hi[k as keyof typeof translations.hi]).toBe('string');
      }
    });

    it('switches languages cleanly', () => {
      setLanguage('hi');
      expect(getLanguage()).toBe('hi');
      expect(t('dashboard')).toBe('डैशबोर्ड');
      expect(t('runofshow')).toBe('कार्यक्रम क्रम');
      expect(t('funding')).toBe('प्रायोजन और फंडिंग');

      setLanguage('en');
      expect(getLanguage()).toBe('en');
      expect(t('dashboard')).toBe('Dashboard');
    });
  });

  describe('Firestore Repository Contract (SYS-05)', () => {
    it('implements WorkspaceRepository and performs CRUD operations in cache', async () => {
      const repo = new FirestoreRepository();
      const testEventId = 'test-evt-cloud';

      const mockData = {
        event: { id: testEventId, name: 'Cloud Test Event', ownerId: 'user-1' } as any,
        subEvents: [],
        tasks: [],
        budgetLines: [],
        commitments: [],
        payments: [],
        vendors: [],
        quotations: [],
        guests: [],
        risks: [],
        activity: [],
      };

      await repo.saveWorkspace(testEventId, mockData);
      const fetched = await repo.getWorkspace(testEventId);
      expect(fetched?.event.name).toBe('Cloud Test Event');

      const events = await repo.listEvents('user-1');
      expect(events).toHaveLength(1);
      expect(events[0]!.id).toBe(testEventId);

      const deleted = await repo.deleteEvent(testEventId);
      expect(deleted).toBe(true);
      const afterDelete = await repo.getWorkspace(testEventId);
      expect(afterDelete).toBeNull();
    });
  });
});
