export interface TransactionReason {
  code: string;
  reason: string;
  description: string;
}

export const TransactionReasons: TransactionReason[] = [
  {
    code: 'ADJ',
    reason: 'Adjustment',
    description:
      'Any adjustment where no specific reason code is applicable. For example, error fixing or unusual corporate actions',
  },
  {
    code: 'AFO',
    reason: 'Adjustment for foreign ownership',
    description:
      'Adjustments to CHESS Holdings due to divestment procedures for securities subject to CHESS foreign ownership restrictions. All other processing for divestment takes place outside of CHESS',
  },
  {
    code: 'ALT',
    reason: 'Miscellaneous allotment',
    description:
      'Any allotment of securities where no specific reason code is applicable',
  },
  {
    code: 'BON',
    reason: 'Bonus issue allotment',
    description: 'Allotment of shares in a bonus issue',
  },
  {
    code: 'BSP',
    reason: 'Bonus plan allotment',
    description: 'Allotment of shares in a bonus share plan',
  },
  {
    code: 'BYB',
    reason: 'Buy back',
    description:
      'Removal of securities where a holder has failed to issue instructions for a compulsory buyback',
  },
  {
    code: 'CAL',
    reason: 'Call paid',
    description:
      'Payment of calls for partly paid shares of either a limited or no liability company',
  },
  {
    code: 'CAQ',
    reason: 'Compulsory acquisition by offeror',
    description:
      'Movement of securities from the client to the offeror for a takeover subject to a compulsory acquisition by the offeror',
  },
  {
    code: 'CNA',
    reason: 'Convertible note allotment',
    description: 'Allotment of a convertible note',
  },
  {
    code: 'CNR',
    reason: 'Convertible note redemption / maturity',
    description: 'Redemption or Maturity of a convertible note',
  },
  {
    code: 'CNV',
    reason: 'Miscellaneous conversion',
    description: 'Conversions of securities other than convertible notes',
  },
  {
    code: 'CRI',
    reason: 'Collateral removal',
    description:
      'Security no longer meets the criteria for eligibility as collateral cover',
  },
  {
    code: 'CSC',
    reason: 'CHESS subregister closed',
    description:
      'Movement due to the CHESS subregister closing, for example, in the event of an Issuer being delisted',
  },
  {
    code: 'DIS',
    reason: 'Distribution in specie',
    description:
      'Allotment of securities as a result of a distribution in specie.',
  },
  {
    code: 'DRP',
    reason: 'Dividend plan allotment',
    description: 'Allotment of shares in a dividend n reinvestment plan',
  },
  {
    code: 'DVM',
    reason: 'Divestment',
    description:
      'Adjustments to CHESS Holdings due to divestment procedures for securities other than those subject to CHESS foreign ownership restrictions',
  },
  {
    code: 'EXP',
    reason: 'Collateral removal',
    description: 'The imminent expiry of a security used as collateral',
  },
  {
    code: 'FLT',
    reason: 'Float',
    description: 'Allotment of securities as a result of a company float',
  },
  {
    code: 'FOR',
    reason: 'Forfeiture of partly paid shares',
    description: 'Removal of shares on which a call has not been paid',
  },
  {
    code: 'IDA',
    reason: 'Income Distribution allotment',
    description:
      'Allotment of securities in a reinvestment of income other than dividend income, for example, interest, trust income',
  },
  {
    code: 'MER',
    reason: 'Company merger',
    description: 'Allotment of securities as a result of a company merger',
  },
  {
    code: 'NCN',
    reason: 'Convertible note',
    description: 'Conversion of a convertible note',
  },
  {
    code: 'NRE',
    reason: 'Non-renounceable issue allotment',
    description:
      'Allotment of new securities following acceptance of the issue.',
  },
  { code: 'OEX', reason: 'Option exercised', description: 'Option exercised' },
  {
    code: 'OPT',
    reason: 'Option allotment',
    description: 'Allotment of options',
  },
  {
    code: 'PLC',
    reason: 'Placement',
    description: 'Allotment due to a placement of securities',
  },
  {
    code: 'PRI',
    reason: 'Priority issue',
    description: 'Effects of a priority issue',
  },
  {
    code: 'REC',
    reason: 'Reconstruction',
    description: 'Effects of a capital reconstruction',
  },
  {
    code: 'RED',
    reason: 'Miscellaneous redemption',
    description: 'Redemption of securities other than convertible notes.',
  },
  {
    code: 'REV',
    reason: 'Allotment reversal',
    description:
      'Reversal of an allotment or transfer due to various errors/events',
  },
  {
    code: 'RHA',
    reason: 'Renounceable',
    description:
      'Removal of rights entitlements (rights securities) upon acceptance',
  },
  {
    code: 'RHE',
    reason: 'Renounceable rights entitlement allotment',
    description: 'Allotment of rights entitlements (rights securities)',
  },
  {
    code: 'RHT',
    reason: 'Renounceable Rights Issue Allotment',
    description:
      'Allotment of new securities following acceptance of a rights entitlement OR Transformation of rights securities to new securities',
  },
  {
    code: 'SAR',
    reason: 'Sub-register archived',
    description: 'Movement due to the CHESS sub-register being archived',
  },
  {
    code: 'SCD',
    reason: 'Scrip Dividend',
    description:
      'Payment of dividend in the form of securities. Distinct from a DRP where the dividend is paid in cash and the holder has the option of converting cash to a security',
  },
  {
    code: 'SOA',
    reason: 'Scheme of Arrangement',
    description: 'Effects of a scheme of arrangement',
  },
  {
    code: 'SPP',
    reason: 'Share purchase plan',
    description: 'Allotment of securities as a result of a share purchase plan',
  },
  {
    code: 'STP',
    reason: 'Share top-up plan',
    description: 'Allotment of securities as a result of a share top up plan',
  },
  {
    code: 'TKA',
    reason: 'Takeover consideration allotment',
    description:
      'Allotment of securities as consideration from a takeover that is unconditional',
  },
  {
    code: 'WAL',
    reason: 'Warrant allotment',
    description: 'Allotment of a warrant',
  },
  {
    code: 'WDL',
    reason: 'Warrant delivery',
    description: 'Delivery of a warrant',
  },
  {
    code: 'WEX',
    reason: 'Warrant exercise',
    description: 'Exercise of a warrant',
  },
  {
    code: 'WRL',
    reason: 'Warrant rollover',
    description: 'Rollover of a warrant',
  },
  {
    code: 'WUX',
    reason: 'Warrant underlying exercise',
    description: 'Exercise of the underlying security',
  },
];
