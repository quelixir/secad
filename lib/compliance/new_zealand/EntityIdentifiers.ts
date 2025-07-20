import { validateNZBN } from './EntityIdentifierNZBN';
import type { IdentifierType } from '../types/IdentifierType';

export const newZealandIdentifierTypes: IdentifierType[] = [
  {
    abbreviation: 'ACN',
    name: 'Australian Company Number',
    description:
      'A unique 13-digit identifier for entities registered with the New Zealand Business Register',
    formatPattern: 'XXXXXXXXXXXXX',
    format: (value: string) => value,
    validate: validateNZBN,
    placeholder: '1234567891234',
  },
];
