import type { TemplatePack } from '../types';

export const communityPack: TemplatePack = {
  id: 'community',
  segmentLabel: 'Session',
  presets: [
    {
      id: 'one-day-programme',
      name: 'Single Day Community Gathering',
      startingFunctions: ['Opening Ceremony & Keynote', 'Interactive Sessions', 'Cultural Evening & Dinner'],
    },
    {
      id: 'college-fest-3day',
      name: '3-Day Campus Festival',
      startingFunctions: ['Day 1: Technical & Inaugural', 'Day 2: Literary & Arts', 'Day 3: Star Night & Valedictory'],
    },
  ],
  budgetProfiles: {
    standard: {
      venue: 20,
      stage_av: 25,
      artists: 20,
      catering: 15,
      publicity: 10,
      security: 5,
      misc: 5,
    },
    lean: {
      venue: 15,
      stage_av: 25,
      artists: 15,
      catering: 15,
      publicity: 15,
      security: 5,
      misc: 10,
    },
  },
  categories: [
    { id: 'venue', label: 'Grounds & Auditorium', scalesWithHeadcount: false, vendorCategory: 'venue' },
    { id: 'stage_av', label: 'Stage, Sound & Lights', scalesWithHeadcount: false, vendorCategory: 'stage_av' },
    { id: 'artists', label: 'Performers & Speakers', scalesWithHeadcount: false, vendorCategory: 'artists' },
    { id: 'catering', label: 'Food Stalls & Hospitality', scalesWithHeadcount: true, vendorCategory: 'catering' },
    { id: 'publicity', label: 'Publicity & Signage', scalesWithHeadcount: false, vendorCategory: 'publicity' },
    { id: 'security', label: 'Security & Crowd Safety', scalesWithHeadcount: false, vendorCategory: 'security' },
    { id: 'misc', label: 'Trophies & Volunteer Kits', scalesWithHeadcount: false, vendorCategory: 'misc' },
  ],
  essentials: [
    { category: 'venue', bookByDays: 45, weight: 2 },
    { category: 'stage_av', bookByDays: 30, weight: 2 },
    { category: 'artists', bookByDays: 40, weight: 1 },
    { category: 'security', bookByDays: 20, weight: 1 },
  ],
  tasks: [
    { id: 'c-brief', title: 'Define event goals, audience format and success KPIs', priority: 'critical', leadDays: 90, minLeadDays: 21, category: 'general' },
    { id: 'c-team', title: 'Form core committee & allocate department heads', priority: 'critical', leadDays: 90, minLeadDays: 21, after: ['c-brief'], category: 'general' },
    { id: 'c-approval', title: 'Obtain institution / society permission & date clearance', priority: 'critical', leadDays: 80, minLeadDays: 21, after: ['c-brief'], category: 'general' },
    { id: 'c-venue', title: 'Book auditorium / campus grounds & finalise stage layout', priority: 'critical', leadDays: 75, minLeadDays: 21, after: ['c-approval'], category: 'venue' },
    { id: 'c-sponsor-deck', title: 'Build sponsorship brochure with deliverables tiers', priority: 'high', leadDays: 75, minLeadDays: 21, category: 'budget', appliesWhen: e => e.fundingMode === 'sponsored' },
    { id: 'c-sponsor-outreach', title: 'Pitch corporate brands & alumni sponsor network', priority: 'critical', leadDays: 60, minLeadDays: 21, after: ['c-sponsor-deck'], category: 'budget', appliesWhen: e => e.fundingMode === 'sponsored' },
    { id: 'c-stage-av', title: 'Contract sound line-array, lighting truss & generator', priority: 'high', leadDays: 45, minLeadDays: 14, after: ['c-venue'], category: 'stage_av' },
    { id: 'c-permissions', title: 'Verify sound curfew, police permission and local civic NOCs', priority: 'critical', leadDays: 45, minLeadDays: 14, after: ['c-venue'], category: 'general' },
    { id: 'c-artists', title: 'Contract headline performers / judges with rider agreements', priority: 'high', leadDays: 45, minLeadDays: 14, after: ['c-venue'], category: 'artists' },
    { id: 'c-volunteers', title: 'Conduct volunteer induction and assign shift rosters', priority: 'high', leadDays: 20, minLeadDays: 7, after: ['c-team'], category: 'general' },
    { id: 'c-security', title: 'Coordinate entry barricades, metal detectors and paramedic crew', priority: 'high', leadDays: 20, minLeadDays: 7, after: ['c-venue'], category: 'security' },
    { id: 'c-run-of-show', title: 'Finalise minute-by-minute stage sequence & MC script', priority: 'high', leadDays: 10, minLeadDays: 3, after: ['c-stage-av', 'c-artists'], category: 'general' },
  ],
  vendorChecklists: {
    venue: ['Emergency fire exit clearance', 'Dedicated electrical feeder with diesel generator sync', 'Sanitation and mobile toilet count'],
    stage_av: ['Decibel check calibration', 'Delay towers for large grounds (> 500 pax)', 'Microphone battery backups and wired mics for podium'],
  },
  riskRules: [
    {
      id: 'community.permissions-open',
      title: 'Civic or sound permissions pending with less than 21 days remaining',
      severity: 'critical',
      mitigation: 'Escalate to institutional committee to ensure compliance with local noise curfews.',
      evaluate: ({ tasks, daysToEvent }) => daysToEvent < 21 && !tasks.some(t => t.id === 'c-permissions' && t.status === 'done'),
    },
  ],
  ideaLibrary: [
    {
      id: 'idea-tech-hack',
      kind: 'activity',
      title: '24-Hour AI for Social Good Hackathon',
      summary: 'Student teams prototype working apps tackling local urban issues with industry mentorship.',
      whyItFits: ['High sponsor visibility', 'Generates tangible civic impact and student portfolio projects'],
      budgetTier: 2,
      effort: 3,
      tags: ['technical', 'campus', 'hackathon'],
    },
  ],
  outlinePrompts: [
    'Is the event self-funded or backed by corporate / institutional sponsors?',
    'What is the estimated attendee footfall count across peak hours?',
  ],
};
