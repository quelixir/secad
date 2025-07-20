import { State } from './State';

export interface Country {
  name: string;
  iso2: string; // ISO 3166-1 alpha-2 code for flag-icons
  states: State[];
}
