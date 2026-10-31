import type { TemplatePack } from '../types';

export const birthdayPack: TemplatePack = {
  id: 'birthday',
  segmentLabel: 'Session',
  presets: [
    {
      id: 'kids-party',
      name: 'Kids Themed Birthday',
      startingFunctions: ['Cake Cutting & Party Games'],
    },
    {
      id: 'milestone-adult',
      name: 'Milestone Dinner Party',
      startingFunctions: ['Evening Cocktails & Dinner'],
    },
  ],
  budgetProfiles: {
    standard: {
      venue: 20,
      catering: 35,
      decor: 15,
      entertainment: 15,
      gifts: 8,
      photography: 4,
      invitations: 1,
      misc: 2,
    },
    lean: {
      venue: 15,
      catering: 40,
      decor: 12,
      entertainment: 12,
      gifts: 10,
      photography: 5,
      invitations: 1,
      misc: 5,
    },
  },
  categories: [
    { id: 'venue', label: 'Venue / Terrace Setup', scalesWithHeadcount: false, vendorCategory: 'venue' },
    { id: 'catering', label: 'Food & Cake', scalesWithHeadcount: true, vendorCategory: 'catering' },
    { id: 'decor', label: 'Decor & Theme', scalesWithHeadcount: false, vendorCategory: 'decor' },
    { id: 'entertainment', label: 'Games & Entertainment', scalesWithHeadcount: false, vendorCategory: 'entertainment' },
    { id: 'gifts', label: 'Return Gifts & Favours', scalesWithHeadcount: true, vendorCategory: 'gifts' },
    { id: 'photography', label: 'Photography', scalesWithHeadcount: false, vendorCategory: 'photography' },
    { id: 'invitations', label: 'Digital Invites', scalesWithHeadcount: false, vendorCategory: 'invitations' },
    { id: 'misc', label: 'Prizes & Misc', scalesWithHeadcount: false, vendorCategory: 'misc' },
  ],
  essentials: [
    { category: 'venue', bookByDays: 21, weight: 2 },
    { category: 'catering', bookByDays: 10, weight: 2 },
    { category: 'entertainment', bookByDays: 21, weight: 1 },
  ],
  tasks: [
    { id: 'b-budget', title: 'Set budget and headcount (kids and adults separately)', priority: 'critical', leadDays: 45, minLeadDays: 7, category: 'budget' },
    { id: 'b-date', title: 'Fix date and party time window', priority: 'critical', leadDays: 45, minLeadDays: 7, category: 'general' },
    { id: 'b-venue', title: 'Book venue or plan home/clubhouse setup', priority: 'critical', leadDays: 40, minLeadDays: 7, after: ['b-budget', 'b-date'], category: 'venue' },
    { id: 'b-theme', title: 'Pick party theme and list must-have games', priority: 'high', leadDays: 35, minLeadDays: 7, after: ['b-budget'], category: 'decor' },
    { id: 'b-invite', title: 'Design and send WhatsApp invitations', priority: 'high', leadDays: 25, minLeadDays: 7, after: ['b-theme', 'b-date'], category: 'invitations' },
    { id: 'b-rsvp', title: 'Track RSVPs and note food allergies', priority: 'high', leadDays: 14, minLeadDays: 4, after: ['b-invite'], category: 'guests' },
    { id: 'b-cake', title: 'Order custom cake (flavour, size, eggless/vegan option)', priority: 'critical', leadDays: 14, minLeadDays: 3, after: ['b-rsvp'], category: 'catering' },
    { id: 'b-food', title: 'Plan kid-friendly snacks and adult dining menu', priority: 'high', leadDays: 14, minLeadDays: 3, after: ['b-budget'], category: 'catering' },
    { id: 'b-activities', title: 'Book game host / magician or plan DIY craft tables', priority: 'high', leadDays: 21, minLeadDays: 5, after: ['b-theme'], category: 'entertainment', appliesWhen: e => (e.honoreeAge ?? 0) < 13 },
    { id: 'b-favours', title: 'Pack age-appropriate return gift hampers', priority: 'medium', leadDays: 10, minLeadDays: 3, after: ['b-rsvp'], category: 'gifts' },
    { id: 'b-safety', title: 'Safety check: allergy list, first-aid box, stair gates', priority: 'high', leadDays: 7, minLeadDays: 2, after: ['b-venue'], category: 'general', appliesWhen: e => (e.honoreeAge ?? 0) < 13 },
    { id: 'b-run', title: 'Draft 3-hour run-of-show schedule', priority: 'medium', leadDays: 5, minLeadDays: 1, after: ['b-activities', 'b-food'], category: 'general' },
    { id: 'b-final-count', title: 'Confirm final plate count for food and cake weight', priority: 'high', leadDays: 3, minLeadDays: 1, after: ['b-rsvp'], category: 'catering' },
  ],
  vendorChecklists: {
    venue: ['Dedicated cake table area', 'Air conditioning / fan ventilation', 'Parking for parents during pickup/drop'],
    catering: ['Finger food for kids', 'Nut-free and egg-free assurance', 'Beverage / mocktail station for parents'],
  },
  riskRules: [
    {
      id: 'birthday.cake-gap',
      title: 'Custom cake not booked with 7 days remaining',
      severity: 'high',
      mitigation: 'Artisan custom bakers require 3-5 days advance notice.',
      evaluate: ({ tasks, daysToEvent }) => daysToEvent < 7 && !tasks.some(t => t.id === 'b-cake' && t.status === 'done'),
    },
  ],
  ideaLibrary: [
    {
      id: 'idea-science-lab',
      kind: 'activity',
      title: 'Little Scientists Slime & Volcano Station',
      summary: 'Safe, hands-on science experiments with lab coats and take-home slime pots.',
      whyItFits: ['High engagement for ages 6-11', 'Acts as both entertainment and return gift'],
      budgetTier: 2,
      effort: 2,
      tags: ['interactive', 'kids', 'science'],
    },
  ],
  outlinePrompts: [
    'What is the honoree age and favourite theme or hobby?',
    'What is the split between child and adult guests?',
  ],
};
