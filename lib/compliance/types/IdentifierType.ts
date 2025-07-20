export interface IdentifierType {
  abbreviation: string;
  name: string;
  description: string;
  formatPattern: string;
  validate: (value: string) => boolean;
  format: (value: string) => string;
  placeholder: string;
}
