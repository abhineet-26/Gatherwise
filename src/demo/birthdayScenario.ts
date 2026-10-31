import type { WorkspaceState } from 'shared/commands/types';
import { inr } from 'shared/domain/money/money';
import { type IsoDate, asIsoDate, addDays } from 'shared/domain/time/dates';

export function createBirthdayScenario(inputToday: string | IsoDate): { id: string; state: WorkspaceState } {
  const today = asIsoDate(inputToday);
  const bdayDate = addDays(today, 21);
  const bdayId = 'demo-birthday-indore';

  const state: WorkspaceState = {
    event: {
      id: bdayId,
      schemaVersion: 1,
      ownerId: 'demo',
      name: "Ananya's 6th Birthday",
      type: 'birthday',
      city: 'Indore',
      cityTier: 'tier2',
      date: bdayDate,
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      venueStatus: 'home',
      setting: 'home',
      budgetTarget: inr(45000),
      budget: inr(45000),
      contingencyPct: 5,
      fundingMode: 'self_funded',
      attendanceModel: 'invite_list',
      audience: 'house_party',
      attendanceAssumptions: { pMaybe: 0.5, pPending: 0.8, bufferPct: 0.05 },
      style: { formality: 'casual', vibe: [] },
      priorities: ['food', 'entertainment', 'decor'],
      dietary: ['nut_allergy'],
      accessibilityNeeds: [],
      culturalNotes: 'Children birthday celebration',
      sideLabels: { a: 'Family', b: 'Friends' },
      guestCount: 35,
      honoreeAge: 6,
      notes: 'Terrace party with 22 children and 13 adults',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    subEvents: [
      {
        id: 'sub-bday-party',
        eventId: bdayId,
        name: 'Terrace Magic & Cake Celebration',
        date: bdayDate,
        startTime: '17:00',
        endTime: '20:30',
        venue: 'Home Terrace, Indore',
        expectedGuestCount: 35,
      },
    ],
    budgetLines: [
      {
        id: 'bl-bday-cake',
        eventId: bdayId,
        category: 'cake_desserts',
        estimate: inr(6000),
        basis: 'user',
        whyThis: 'Custom 2-tier themed cake',
      },
      {
        id: 'bl-bday-food',
        eventId: bdayId,
        category: 'catering',
        estimate: inr(18000),
        basis: 'template',
        whyThis: 'Child-friendly snack boxes & mini meals',
      },
      {
        id: 'bl-bday-decor',
        eventId: bdayId,
        category: 'decor',
        estimate: inr(10000),
        basis: 'template',
      },
      {
        id: 'bl-bday-entertain',
        eventId: bdayId,
        category: 'entertainment',
        estimate: inr(8000),
        basis: 'user',
        whyThis: 'Magician & game coordinator',
      },
      {
        id: 'bl-bday-return',
        eventId: bdayId,
        category: 'return_gifts',
        estimate: inr(3000),
        basis: 'template',
      },
    ],
    commitments: [],
    payments: [],
    tasks: [
      {
        id: 'task-b-1',
        eventId: bdayId,
        title: 'Order Themed Birthday Cake (Nut-free)',
        category: 'cake_desserts',
        status: 'todo',
        priority: 'high',
        dueDate: addDays(today, 3),
        dependsOn: [],
      },
      {
        id: 'task-b-2',
        eventId: bdayId,
        title: 'Confirm Magician & Sound System',
        category: 'entertainment',
        status: 'in_progress',
        priority: 'medium',
        dueDate: addDays(today, 5),
        dependsOn: [],
      },
    ],
    vendors: [],
    quotes: [],
    guests: [
      {
        id: 'b-gst-1',
        eventId: bdayId,
        name: 'Aarav & Parents (Nut allergy)',
        partySize: 3,
        dietary: 'nut_allergy',
        invitations: { 'sub-bday-party': { invited: true, status: 'attending', confirmedParty: 3 } },
      },
    ],
    risks: [
      {
        id: 'rsk-bday-compressed',
        eventId: bdayId,
        title: 'Compressed Timeline: Only 21 days remaining',
        category: 'schedule',
        severity: 'medium',
        status: 'identified',
        source: 'rule_pack',
      },
    ],
    activity: [
      {
        id: 'act-bday-init',
        eventId: bdayId,
        at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        actor: 'user',
        summary: 'Created birthday event "Ananya\'s 6th Birthday"',
        commandType: 'CREATE_EVENT',
        commandTypes: ['CREATE_EVENT'],
        undone: false,
        reversible: false,
      },
    ],
  };

  return { id: bdayId, state };
}
