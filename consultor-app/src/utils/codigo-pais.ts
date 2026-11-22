import { getLocales } from 'expo-localization';

import { CONSULTOR } from '@/constants/consultor';

// Prefijo telefónico por país (código ISO de región → prefijo).
const PREFIJOS: Record<string, string> = {
  // América
  AR: '54',
  BO: '591',
  BR: '55',
  BZ: '501',
  CA: '1',
  CL: '56',
  CO: '57',
  CR: '506',
  CU: '53',
  DO: '1',
  EC: '593',
  GT: '502',
  GY: '592',
  HN: '504',
  HT: '509',
  JM: '1',
  MX: '52',
  NI: '505',
  PA: '507',
  PE: '51',
  PR: '1',
  PY: '595',
  SR: '597',
  SV: '503',
  TT: '1',
  US: '1',
  UY: '598',
  VE: '58',
  // Europa
  AD: '376',
  AT: '43',
  BE: '32',
  BG: '359',
  CH: '41',
  CY: '357',
  CZ: '420',
  DE: '49',
  DK: '45',
  EE: '372',
  ES: '34',
  FI: '358',
  FR: '33',
  GB: '44',
  GR: '30',
  HR: '385',
  HU: '36',
  IE: '353',
  IS: '354',
  IT: '39',
  LT: '370',
  LU: '352',
  LV: '371',
  MC: '377',
  MT: '356',
  NL: '31',
  NO: '47',
  PL: '48',
  PT: '351',
  RO: '40',
  RS: '381',
  RU: '7',
  SE: '46',
  SI: '386',
  SK: '421',
  TR: '90',
  UA: '380',
  // África
  AO: '244',
  CV: '238',
  DZ: '213',
  EG: '20',
  GH: '233',
  GQ: '240',
  KE: '254',
  MA: '212',
  MZ: '258',
  NG: '234',
  SN: '221',
  TN: '216',
  ZA: '27',
  // Asia y Oceanía
  AE: '971',
  AU: '61',
  CN: '86',
  HK: '852',
  ID: '62',
  IL: '972',
  IN: '91',
  JP: '81',
  KR: '82',
  MY: '60',
  NZ: '64',
  PH: '63',
  PK: '92',
  SA: '966',
  SG: '65',
  TH: '66',
  TW: '886',
  VN: '84',
};

/** Prefijo de un país (ES → +34), o null si no lo conocemos. */
export function prefijoDeRegion(region: string | null | undefined): string | null {
  const p = region ? PREFIJOS[region.toUpperCase()] : undefined;
  return p ? `+${p}` : null;
}

/**
 * El prefijo del país configurado en este teléfono. Si el teléfono no indica
 * su país, usa el del consultor (constants/consultor.ts).
 */
export function prefijoDelTelefono(): string {
  try {
    for (const l of getLocales()) {
      const p = prefijoDeRegion(l.regionCode);
      if (p) return p;
    }
  } catch {
    // Sin información de idioma/región: se usa el prefijo por defecto.
  }
  return CONSULTOR.codigoPais;
}
