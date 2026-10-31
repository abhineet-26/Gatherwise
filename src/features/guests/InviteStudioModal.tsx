import React, { useState } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import {
  Mail,
  Copy,
  ExternalLink,
  X,
  Check,
  ShieldAlert,
} from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'mr', label: 'Marathi (मराठी)' },
  { code: 'gu', label: 'Gujarati (ગુજરાતી)' },
  { code: 'pa', label: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'bn', label: 'Bengali (বাংলা)' },
  { code: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'te', label: 'Telugu (తెలుగు)' },
];

const TONES = [
  { id: 'warm', label: 'Warm & Traditional' },
  { id: 'formal', label: 'Formal & Elegant' },
  { id: 'playful', label: 'Festive & Playful' },
];

export const InviteStudioModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { workspace } = useWorkspaceStore();
  const [lang, setLang] = useState('en');
  const [tone, setTone] = useState('warm');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen || !workspace) return null;

  const eventName = workspace.event.name;
  const eventCity = workspace.event.city;
  const eventDate = workspace.event.date;

  const getDrafts = () => {
    if (lang === 'hi') {
      return [
        {
          title: 'पारंपरिक निमंत्रण',
          text: `नमस्ते {guest_name} जी 🙏\n\nबड़े हर्ष के साथ हम आपको ${eventName} के शुभ अवसर पर सादर आमंत्रित करते हैं।\n\n📅 तिथि: ${eventDate}\n📍 स्थान: ${eventCity}\n\nआपकी उपस्थिति हमारे उत्सव की शोभा बढ़ाएगी। कृपया नीचे दिए गए लिंक पर अपनी उपस्थिति (RSVP) अवश्य दर्ज करें:\n🔗 {rsvp_link}\n\nस्नेही,\nपरिवार`,
        },
        {
          title: 'संक्षिप्त व आत्मीय',
          text: `प्रिय {guest_name},\n\nहमारे विशेष दिन ${eventName} पर आपका साथ हमारे लिए अनमोल है।\n\n📅 ${eventDate} | 📍 ${eventCity}\n\nकृपया RSVP करें: {rsvp_link}\n\nमिलने की प्रतीक्षा में!`,
        },
      ];
    }

    if (lang === 'mr') {
      return [
        {
          title: 'पारंपरिक स्नेहनिमंत्रण',
          text: `सस्नेह नमस्कार {guest_name} 🙏\n\nआमच्या परिवारातर्फे ${eventName} या शुभ सोहळ्यास आपण सहकुटुंब उपस्थित राहून वधू-वरांना शुभाशीर्वाद द्यावेत, ही आग्रहाची विनंती.\n\n📅 दिनांक: ${eventDate}\n📍 स्थळ: ${eventCity}\n\nकृपया उपस्थितीची नोंद करावी (RSVP): {rsvp_link}`,
        },
      ];
    }

    return [
      {
        title: 'Warm & Traditional',
        text: `Dear {guest_name},\n\nWith immense joy and gratitude, we warmly invite you and your family to celebrate ${eventName}.\n\n📅 Date: ${eventDate}\n📍 Location: ${eventCity}\n\nYour presence and blessings will make our special day truly complete.\n\nPlease confirm your attendance via our RSVP link:\n🔗 {rsvp_link}\n\nWarm regards,\nFamily`,
      },
      {
        title: 'Modern & Elegant',
        text: `Hi {guest_name},\n\nWe would be delighted to have you join us for ${eventName} in ${eventCity} on ${eventDate}.\n\nPlease let us know if you can make it by tapping the link below:\n👉 {rsvp_link}\n\nLooking forward to celebrating together!`,
      },
      {
        title: 'Festive & Celebratory',
        text: `Get ready to celebrate! 🎉\n\n${eventName} is happening on ${eventDate} in ${eventCity}. We cannot imagine this milestone without your presence, laughter, and dance moves!\n\nLock in your RSVP here:\n🔗 {rsvp_link}`,
      },
    ];
  };

  const drafts = getDrafts();

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div
      role="dialog"
      aria-label="Invite Studio"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Invite Studio</h2>
              <p className="text-xs text-text-muted">Generate multi-lingual WhatsApp & SMS invitations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-text-muted hover:bg-surface-subtle hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="border-b border-border bg-surface-subtle p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-text-muted uppercase block">Language</label>
              <select
                value={lang}
                onChange={e => setLang(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text-primary focus:border-primary"
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-text-muted uppercase block">Tone</label>
              <select
                value={tone}
                onChange={e => setTone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text-primary focus:border-primary"
              >
                {TONES.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* AI Responsible Notice */}
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
            <span>AI-assisted draft. Have a fluent speaker verify names, dates, and rituals before sending.</span>
          </div>
        </div>

        {/* Drafts List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {drafts.map((draft, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border bg-surface p-4 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary">{draft.title}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(draft.text, idx)}
                    className="inline-flex items-center gap-1 rounded bg-surface-subtle border border-border px-2.5 py-1 text-xs text-text-muted hover:text-text-primary hover:border-primary"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-secondary" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </>
                    )}
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(draft.text)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                </div>
              </div>

              {/* Set lang attribute on draft text */}
              <div
                lang={lang}
                className="rounded-lg bg-surface-subtle p-3 text-xs leading-relaxed text-text-primary font-mono whitespace-pre-wrap border border-border/60"
              >
                {draft.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
