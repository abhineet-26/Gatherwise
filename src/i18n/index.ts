import { create } from 'zustand';

export type SupportedLanguage = 'en' | 'hi';

export const translations = {
  en: {
    // Navigation & Shell
    dashboard: 'Dashboard',
    budget: 'Budget Planner',
    tasks: 'Timeline & Tasks',
    vendors: 'Vendors & Quotes',
    guests: 'Guests & RSVP',
    ideas: 'Idea Studio',
    'what-if': 'What-if Lab',
    runofshow: 'Run-of-Show',
    funding: 'Sponsorship & Funding',
    settings: 'Settings',
    copilot: 'AI Copilot',
    myEvents: 'My Events',
    searchPlaceholder: 'Search tasks, vendors, budget lines...',

    // Common Actions
    createEvent: 'Create Your Event',
    tryDemo: 'Try the Demo',
    resumePlanning: 'Resume Planning',
    dayOfMode: 'Launch Day-of Mode',
    addActivity: 'Add Activity',
    addSource: 'Add Funding Source',
    applyDelay: 'Delay / Cascade',
    markComplete: 'Mark Complete',
    undoChange: 'Undo change',
    save: 'Save',
    cancel: 'Cancel',

    // Statuses
    upcoming: 'Upcoming',
    inProgress: 'In Progress',
    completed: 'Completed',
    delayed: 'Delayed',
    fixedTime: 'Fixed Muhurat',

    // Financial
    confirmedCash: 'Confirmed Cash',
    expectedPipeline: 'Expected Pipeline',
    fundingGap: 'Funding Gap',
    targetBudget: 'Target Budget',
  },
  hi: {
    // Navigation & Shell
    dashboard: 'डैशबोर्ड',
    budget: 'बजट योजना',
    tasks: 'समयरेखा और कार्य',
    vendors: 'विक्रेता और उद्धरण',
    guests: 'अतिथि और आमंत्रण',
    ideas: 'विचार स्टूडियो',
    'what-if': 'परिदृश्य प्रयोगशाला',
    runofshow: 'कार्यक्रम क्रम',
    funding: 'प्रायोजन और फंडिंग',
    settings: 'सेटिंग्स',
    copilot: 'एआई कोपायलट',
    myEvents: 'मेरे आयोजन',
    searchPlaceholder: 'कार्य, विक्रेता, बजट खोजें...',

    // Common Actions
    createEvent: 'अपना आयोजन बनाएं',
    tryDemo: 'डेमो आज़माएं',
    resumePlanning: 'योजना जारी रखें',
    dayOfMode: 'आयोजन दिन मोड',
    addActivity: 'गतिविधि जोड़ें',
    addSource: 'फंडिंग स्रोत जोड़ें',
    applyDelay: 'विलंब / क्रमबद्ध करें',
    markComplete: 'पूर्ण चिह्नित करें',
    undoChange: 'बदलाव पूर्ववत करें',
    save: 'सहेजें',
    cancel: 'रद्द करें',

    // Statuses
    upcoming: 'आगामी',
    inProgress: 'प्रगति पर',
    completed: 'पूर्ण',
    delayed: 'विलंबित',
    fixedTime: 'निश्चित मुहूर्त',

    // Financial
    confirmedCash: 'पक्का नकद',
    expectedPipeline: 'अपेक्षित पाइपलाइन',
    fundingGap: 'फंडिंग अंतर',
    targetBudget: 'लक्षित बजट',
  },
};

interface I18nStore {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: keyof typeof translations['en']) => string;
}

export const useI18n = create<I18nStore>((set, get) => ({
  language: 'en',
  setLanguage: (lang: SupportedLanguage) => set({ language: lang }),
  t: (key: keyof typeof translations['en']) => {
    const lang = get().language;
    return translations[lang]?.[key] || translations.en[key] || key;
  },
}));

export const t = (key: keyof typeof translations['en']): string => {
  return useI18n.getState().t(key);
};

export const setLanguage = (lang: SupportedLanguage): void => {
  useI18n.getState().setLanguage(lang);
};

export const getLanguage = (): SupportedLanguage => {
  return useI18n.getState().language;
};

