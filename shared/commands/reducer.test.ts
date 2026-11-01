import { describe, expect, it } from 'vitest';
import { reduceCommand } from './reducer';
import type { WorkspaceState, BaseCommand } from './types';
import { inr } from '../domain/money/money';
import { asIsoDate } from '../domain/time/dates';

function createInitialState(): WorkspaceState {
  return {
    event: {
      id: 'evt-1',
      schemaVersion: 1,
      ownerId: 'demo',
      type: 'wedding',
      name: "Ananya & Arjun's Wedding",
      date: asIsoDate('2026-11-24'),
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      city: 'Bhubaneswar',
      cityTier: 'tier2',
      venueStatus: 'booked',
      setting: 'indoor',
      budgetTarget: inr(10_00_000),
      contingencyPct: 7,
      fundingMode: 'self_funded',
      attendanceModel: 'invite_list',
      audience: 'local',
      attendanceAssumptions: { pMaybe: 0.5, pPending: 0.8, bufferPct: 0.05 },
      style: { formality: 'semi_formal', vibe: [] },
      priorities: ['food', 'photography'],
      dietary: [],
      accessibilityNeeds: [],
      culturalNotes: '',
      sideLabels: { a: 'Side A', b: 'Side B' },
      createdAt: '2026-10-21T12:00:00Z',
      updatedAt: '2026-10-21T12:00:00Z',
    },
    subEvents: [],
    budgetLines: [],
    commitments: [],
    payments: [],
    tasks: [],
    vendors: [],
    quotes: [],
    guests: [],
    risks: [],
    activity: [],
  };
}

describe('Commands Reducer & Invertibility', () => {
  it('ADD_TASK and inverse DELETE_TASK restores state', () => {
    const state = createInitialState();
    const cmd: BaseCommand = {
      type: 'ADD_TASK',
      eventId: state.event.id,
      payload: {
        id: 't-1',
        eventId: state.event.id,
        title: 'Book Photographer',
        category: 'photography',
        priority: 'high',
        dueDate: asIsoDate('2026-11-01'),
        status: 'todo',
        dependsOn: [],
      },
    };

    const applied = reduceCommand(state, cmd);
    expect(applied.nextState.tasks.length).toBe(1);
    expect(applied.inverse).not.toBeNull();

    const undone = reduceCommand(applied.nextState, applied.inverse!);
    expect(undone.nextState.tasks.length).toBe(0);
  });

  it('UPDATE_TASK and inverse restores previous values', () => {
    const state = createInitialState();
    state.tasks.push({
      id: 't-1',
      eventId: state.event.id,
      title: 'Draft menu',
      category: 'catering',
      priority: 'medium',
      dueDate: asIsoDate('2026-11-01'),
      dueDateLocked: false,
      status: 'todo',
      dependsOn: [],
      notes: '',
      effort: 'M',
      origin: { kind: 'user' },
    });

    const cmd: BaseCommand = {
      type: 'UPDATE_TASK',
      eventId: state.event.id,
      payload: { id: 't-1', title: 'Finalize 5-course menu', priority: 'critical' },
    };

    const applied = reduceCommand(state, cmd);
    expect(applied.nextState.tasks[0]?.title).toBe('Finalize 5-course menu');
    expect(applied.nextState.tasks[0]?.priority).toBe('critical');

    const undone = reduceCommand(applied.nextState, applied.inverse!);
    expect(undone.nextState.tasks[0]?.title).toBe('Draft menu');
    expect(undone.nextState.tasks[0]?.priority).toBe('medium');
  });

  it('ADD_BUDGET_LINE and inverse restores budget lines', () => {
    const state = createInitialState();
    const cmd: BaseCommand = {
      type: 'ADD_BUDGET_LINE',
      eventId: state.event.id,
      payload: {
        id: 'bl-1',
        eventId: state.event.id,
        category: 'catering',
        estimate: inr(3_50_000),
        basis: 'template',
        scalesWithHeadcount: true,
      },
    };

    const applied = reduceCommand(state, cmd);
    expect(applied.nextState.budgetLines.length).toBe(1);

    const undone = reduceCommand(applied.nextState, applied.inverse!);
    expect(undone.nextState.budgetLines.length).toBe(0);
  });

  it('RECORD_PAYMENT and inverse restores payment list', () => {
    const state = createInitialState();
    const cmd: BaseCommand = {
      type: 'RECORD_PAYMENT',
      eventId: state.event.id,
      payload: {
        id: 'pay-1',
        eventId: state.event.id,
        budgetLineId: 'bl-1',
        amount: inr(50_000),
        status: 'paid',
        paidDate: asIsoDate('2026-10-25'),
        method: 'upi',
      },
    };

    const applied = reduceCommand(state, cmd);
    expect(applied.nextState.payments.length).toBe(1);

    const undone = reduceCommand(applied.nextState, applied.inverse!);
    expect(undone.nextState.payments.length).toBe(0);
  });

  it('ACCEPT_QUOTATION creates active commitment and updates quote status', () => {
    const state = createInitialState();
    state.quotes.push({
      id: 'q-1',
      eventId: state.event.id,
      vendorId: 'v-1',
      budgetLineId: 'bl-catering',
      title: 'Grand Banquet Catering Quote',
      pricing: { model: 'per_head', baseAmount: inr(1500) },
      taxMode: 'inclusive',
      status: 'received',
      source: 'manual',
      inclusions: {},
      notes: '',
    });

    const cmd: BaseCommand = {
      type: 'ACCEPT_QUOTATION',
      eventId: state.event.id,
      payload: { quoteId: 'q-1', commitmentAmount: inr(4_50_000) },
    };

    const applied = reduceCommand(state, cmd);
    expect(applied.nextState.quotes[0]?.status).toBe('accepted');
    expect(applied.nextState.commitments.length).toBe(1);
    expect(applied.nextState.commitments[0]?.amount).toBe(inr(4_50_000));

    const undone = reduceCommand(applied.nextState, applied.inverse!);
    expect(undone.nextState.commitments.find(c => c.id === 'com_q-1')?.status).toBe('cancelled');
  });

  it('ADD_GUEST and SET_RSVP updates invitations correctly', () => {
    const state = createInitialState();
    const addGuestCmd: BaseCommand = {
      type: 'ADD_GUEST',
      eventId: state.event.id,
      payload: {
        id: 'g-1',
        eventId: state.event.id,
        name: 'Sharma Family',
        partySize: 4,
        childrenUnder5: 0,
        children5to12: 1,
        side: 'a',
        inviteSent: 'sent',
        invitations: {},
        dietary: ['veg'],
        accessibility: [],
        notes: '',
      },
    };

    const s1 = reduceCommand(state, addGuestCmd).nextState;
    expect(s1.guests.length).toBe(1);

    const rsvpCmd: BaseCommand = {
      type: 'SET_RSVP',
      eventId: state.event.id,
      payload: {
        guestId: 'g-1',
        subEventId: 'se-reception',
        status: 'attending',
        confirmedParty: 4,
      },
    };

    const s2 = reduceCommand(s1, rsvpCmd);
    expect(s2.nextState.guests[0]?.invitations?.['se-reception']?.status).toBe('attending');

    const undone = reduceCommand(s2.nextState, s2.inverse!);
    expect(undone.nextState.guests[0]?.invitations?.['se-reception']?.status).toBe('pending');
  });

  it('proves invertibility of run-of-show and funding commands', () => {
    const state = createInitialState();

    const addRosCmd: BaseCommand = {
      type: 'ADD_RUN_OF_SHOW_ITEM',
      eventId: state.event.id,
      payload: {
        id: 'ros-1',
        subEventId: 'se-1',
        title: 'Baraat Arrival',
        startTime: '17:00',
        durationMinutes: 45,
        endTime: '17:45',
        bufferAfterMinutes: 15,
        isFixedTime: false,
        owner: 'Groom Family',
        status: 'upcoming',
      },
    };

    const s1 = reduceCommand(state, addRosCmd);
    expect(s1.nextState.runOfShow?.length).toBe(1);

    const undoneRos = reduceCommand(s1.nextState, s1.inverse!);
    expect(undoneRos.nextState.runOfShow?.length).toBe(0);

    const addFundingCmd: BaseCommand = {
      type: 'ADD_FUNDING_SOURCE',
      eventId: state.event.id,
      payload: {
        id: 'f-1',
        name: 'TechSponsor',
        kind: 'sponsor',
        stage: 'confirmed',
        amountPaise: 50000000,
        isInKind: false,
      },
    };

    const s2 = reduceCommand(state, addFundingCmd);
    expect(s2.nextState.funding?.length).toBe(1);

    const undoneFunding = reduceCommand(s2.nextState, s2.inverse!);
    expect(undoneFunding.nextState.funding?.length).toBe(0);
  });
});
