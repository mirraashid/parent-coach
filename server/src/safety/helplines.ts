import type { HelplineRegion } from '../config.js';
import type { Helpline, Language, RiskCategory } from '../coach/types.js';

interface LocalisedHelpline {
  number: string;
  tel: string;
  label: Record<Language, string>;
}

interface RegionDirectory {
  note: Record<Language, string>;
  emergency: LocalisedHelpline[];
  childProtection: LocalisedHelpline[];
  mentalHealth: LocalisedHelpline[];
}

/*
 * Verified Nov 2026 against government / operator sources:
 *  - PK: Rescue 1122, Police 15, child protection 1121 (PTA-designated, run by
 *    provincial child protection bodies), Madadgaar 1098, Umang 24/7 line.
 *  - AE: Police 999, Ambulance 998, MoI Child Protection Centre 116111 (u.ae).
 * Re-verify before going live; numbers change.
 */
const DIRECTORY: Record<HelplineRegion, RegionDirectory> = {
  PK: {
    note: {
      en: 'Numbers shown are for Pakistan. Elsewhere, call your local emergency number.',
      ur: 'یہ نمبر پاکستان کے ہیں۔ کسی اور ملک میں ہوں تو وہاں کا ایمرجنسی نمبر ملائیں۔',
    },
    emergency: [
      { number: '1122', tel: '1122', label: { en: 'Rescue 1122 (ambulance)', ur: 'ریسکیو 1122 (ایمبولینس)' } },
      { number: '15', tel: '15', label: { en: 'Police', ur: 'پولیس' } },
    ],
    childProtection: [
      { number: '1121', tel: '1121', label: { en: 'Child protection helpline', ur: 'چائلڈ پروٹیکشن ہیلپ لائن' } },
      { number: '1098', tel: '1098', label: { en: 'Madadgaar helpline', ur: 'مددگار ہیلپ لائن' } },
    ],
    mentalHealth: [
      {
        number: '0311 7786264',
        tel: '+923117786264',
        label: { en: 'Umang mental health line (24/7)', ur: 'امنگ ذہنی صحت ہیلپ لائن (24 گھنٹے)' },
      },
    ],
  },
  AE: {
    note: {
      en: 'Numbers shown are for the UAE. Elsewhere, call your local emergency number.',
      ur: 'یہ نمبر متحدہ عرب امارات کے ہیں۔ کسی اور ملک میں ہوں تو وہاں کا ایمرجنسی نمبر ملائیں۔',
    },
    emergency: [
      { number: '998', tel: '998', label: { en: 'Ambulance', ur: 'ایمبولینس' } },
      { number: '999', tel: '999', label: { en: 'Police', ur: 'پولیس' } },
    ],
    childProtection: [
      { number: '116111', tel: '116111', label: { en: 'Child Protection Centre', ur: 'چائلڈ پروٹیکشن سینٹر' } },
    ],
    mentalHealth: [],
  },
  INTL: {
    note: {
      en: 'Call your local emergency number, or a child protection or mental health helpline in your country.',
      ur: 'اپنے ملک کا ایمرجنسی نمبر، یا بچوں کے تحفظ یا ذہنی صحت کی ہیلپ لائن ملائیں۔',
    },
    emergency: [],
    childProtection: [],
    mentalHealth: [],
  },
};

function pick(region: RegionDirectory, category: RiskCategory): LocalisedHelpline[] {
  const [firstEmergency, ...restEmergency] = region.emergency;
  switch (category) {
    case 'emergency':
      return region.emergency;
    case 'abuse':
      // Police (or the first emergency number) for immediate danger, then child protection.
      return [...region.childProtection, ...(restEmergency.length ? restEmergency : region.emergency)];
    case 'self_harm':
      return [...region.mentalHealth, ...(firstEmergency ? [firstEmergency] : [])];
  }
}

export function getHelplines(
  region: HelplineRegion,
  category: RiskCategory,
  language: Language,
): { helplines: Helpline[]; note: string } {
  const directory = DIRECTORY[region];
  return {
    helplines: pick(directory, category).map((h) => ({
      number: h.number,
      tel: h.tel,
      label: h.label[language],
    })),
    note: directory.note[language],
  };
}
