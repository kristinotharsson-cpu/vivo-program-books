// ---- Shared primitives ----

export type AccentColor =
  | 'plum' | 'green' | 'cream' | 'tangerine' | 'orange'
  | 'blue' | 'sky-blue' | 'light-green' | 'lavender' | 'black';

export type BrushStyle = 'harmony' | 'wave' | 'arc' | 'scatter' | 'none';

// ---- Cover ----

export interface FooterSponsor {
  name: string;
  line: string;
  href?: string;
  logoSrc?: string;
}

export interface Cover {
  eyebrow: string;
  title: string;
  subtitle?: string;
  date: string;
  time?: string;
  venue?: string;
  accent?: AccentColor;
  brush?: BrushStyle;
  photoSrc?: string;
  photoCaption?: string;
  calloutLabel?: string;
  calloutName?: string;
  calloutPhotoSrc?: string;
  presentedBy?: string;
  footerSponsor?: FooterSponsor;
}

// ---- Program pieces ----

export interface ProgramPiece {
  kind?: 'intermission';
  composer?: string;
  work?: string;
  meta?: string;
  movements?: string[];
}

// ---- Bios ----
// Note: actual data uses body: string[] (paragraphs), not a single blurb string.

export interface Bio {
  id: string;
  name: string;
  role?: string;
  body?: string[];
  photoSrc?: string;
  initials?: string;
}

// ---- Cast ----
// Note: actual data uses h (heading) and an optional id on groups, not name.

export interface CastGroup {
  id?: string;
  h?: string;
  rows: CastRow[];
}

export interface CastRow {
  role: string;
  name: string;
  bioId?: string;
  blurb?: string;
  photoSrc?: string;
}

// ---- Roster ----
// Roster groups use a players string array, not CastRow rows.

export interface RosterGroup {
  h?: string;
  players: string[];
}

// ---- Events ----

export interface EventCard {
  title: string;
  month?: string;
  day?: string;
  meta?: string;
  href?: string;
  websiteUrl?: string;
  programUrl?: string;
  slug?: string;
  thumb?: string;
  accent?: AccentColor;
}

// ---- Supporters / Donors ----

export interface SupporterTier {
  tier: string;
  members: string[];
}

// Structured supporters data used by the supporters-list section.
export interface SupportersDonorTier {
  amount: string;
  label: string;
  donors: string[];
}

export interface SupportersCategory {
  id: string;
  title: string;
  accent?: string;
  brush?: string;
  tiers: SupportersDonorTier[];
}

export interface SupportersData {
  categories: SupportersCategory[];
  footer?: string;
}

// ---- Staff / Board ----

export interface StaffDepartment {
  name: string;
  members: StaffMember[];
  credits?: string[];
}

export interface StaffMember {
  name: string;
  title?: string;
  email?: string;
}

export interface StaffData {
  departments: StaffDepartment[];
  credits?: unknown[];
}

// Note: actual board data uses title, not role.
export interface BoardMember {
  name: string;
  title?: string;
}

export interface BoardData {
  directors?: BoardMember[];
  emeriti?: BoardMember[];
  advisors?: BoardMember[];
}

// ---- Shared Vivo content (for VivoShared resolution at runtime) ----

export interface VivoShared {
  staff?: StaffData;
  boards?: BoardData;
  supporters?: SupportersData;
  about?: Record<string, string[]>;
  audienceInfo?: AudienceInfoItem[];
}

export interface AudienceInfoItem {
  id?: string;
  icon?: string;
  title?: string;
  label?: string;
  body?: string | string[];
}

// ---- Sponsor ads (used in sponsors section) ----

export interface SponsorAd {
  eyebrow?: string;
  name: string;
  tagline?: string;
  url?: string;
}

// ---- Promo cards ----

export interface PromoCard {
  headline?: string;
  body?: string;
  accent?: AccentColor;
  href?: string;
  imageSrc?: string;
}

// ---- Sections (discriminated union) ----

interface SectionBase {
  id: string;
  title: string;
  eyebrow?: string;
  hidden?: boolean;
}

export interface WelcomeSection extends SectionBase {
  kind: 'welcome';
  quote: string;
  body: string[];
  signature: { name: string; role: string };
}

export interface ProgramSection extends SectionBase {
  kind: 'program';
  lead?: string;
  pieces: ProgramPiece[];
  runtimeNote?: string;
  extras?: string[];
  subtitle?: string;
  sponsor?: {
    label?: string;
    name?: string;
    line?: string;
    perfSponsorLabel?: string;
    perfSponsors?: string;
    additionalLabel?: string;
    additionalSponsors?: string;
    seasonSponsorsLabel?: string;
    seasonSponsors?: string;
    publicSupport?: string;
    closing?: string;
  };
}

export interface NotesSection extends SectionBase {
  kind: 'notes';
  lead?: string;
  sections: { h: string; sub?: string; body: string[] }[];
  author?: { name: string; role: string };
}

export interface SynopsisSection extends SectionBase {
  kind: 'synopsis';
  lead?: string;
  sections: { h: string; body: string[] }[];
}

export interface CastSection extends SectionBase {
  kind: 'cast';
  groups: CastGroup[];
}

// Roster groups hold a flat players string array (orchestra rosters).
export interface RosterSection extends SectionBase {
  kind: 'roster';
  lead?: string;
  groups: RosterGroup[];
}

export interface BiosSection extends SectionBase {
  kind: 'bios';
  bios: Bio[];
}

export interface DonorsSection extends SectionBase {
  kind: 'donors';
  tiers: SupporterTier[];
}

export interface EventsSection extends SectionBase {
  kind: 'events';
  lead?: string;
  auto?: boolean;
  count?: number;
  layout?: 'carousel' | 'grid';
  events?: EventCard[];
  hiddenSlugs?: string[];
  thumbs?: Record<string, string>;
  bgColor?: AccentColor;
}

export interface PerformanceSponsorSection extends SectionBase {
  kind: 'performance-sponsor';
  lead?: string;
  blocks: { label: string; name: string; statement?: string }[];
  seasonSponsorsLabel?: string;
  seasonSponsors?: string;
  publicSupport?: string;
  closing?: string;
}

// Note: actual data uses ads[], not tiers[].
export interface SponsorsSection extends SectionBase {
  kind: 'sponsors';
  imageSrc?: string;
  imageCaption?: string;
  ads?: SponsorAd[];
}

// Note: actual data includes audienceInfo[] directly on the section.
export interface InfoSection extends SectionBase {
  kind: 'info';
  audienceInfo?: AudienceInfoItem[];
  sections: { h: string; body: string[]; imageSrc?: string }[];
}

export interface SongTextsSection extends SectionBase {
  kind: 'songtexts';
  items: { title: string; original: string[]; translation: string[] }[];
}

export interface VivoSection extends SectionBase {
  kind: 'vivo';
}

// Note: actual data carries staff and boards directly on the section.
export interface StaffBoardSection extends SectionBase {
  kind: 'staff-board';
  staff?: StaffData;
  boards?: BoardData;
}

// Note: actual data carries supporters directly on the section.
export interface SupportersListSection extends SectionBase {
  kind: 'supporters-list';
  supporters?: SupportersData;
}

// Note: actual field names are heading/buttonLabel/buttonUrl (not headline/ctaLabel/ctaUrl).
export interface PromoSection extends SectionBase {
  kind: 'promo';
  layout?: string;
  heading?: string;
  body?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  buttonColor?: AccentColor;
  imageSrc?: string;
  bgColor?: AccentColor;
  textColor?: AccentColor;
  cardColor?: AccentColor;
  cards?: PromoCard[];
}

export type Section =
  | WelcomeSection
  | ProgramSection
  | NotesSection
  | SynopsisSection
  | CastSection
  | RosterSection
  | BiosSection
  | DonorsSection
  | EventsSection
  | PerformanceSponsorSection
  | SponsorsSection
  | InfoSection
  | SongTextsSection
  | VivoSection
  | StaffBoardSection
  | SupportersListSection
  | PromoSection;

// ---- Program data root ----

export interface ProgramData {
  contentVersion: string;
  cover: Cover;
  sections: Section[];
}

// ---- Storage record ----

export interface ProgramRecord {
  id: string;
  shellId?: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  lastExportedAt?: string | null;
  contentVersion?: string;
  data: { cover: Cover; sections: Section[] };
  theme?: string;
  fontSize?: number;
  tweaks?: Record<string, unknown>;
}

// ---- VivoStore API ----
// Reflects the full public surface of the VivoStore object in storage.ts.

export interface VivoStoreAPI {
  backend(): Promise<string>;
  getProgram(id: string): Promise<ProgramRecord | null>;
  saveProgram(id: string, rec: ProgramRecord): Promise<ProgramRecord>;
  listPrograms(): Promise<Record<string, { status: string; updatedAt: string; lastExportedAt?: string | null }>>;
  deleteProgram(id: string): Promise<void>;
  newRecord(id: string, data: { cover: Cover; sections: Section[] }, status?: string): ProgramRecord;
  touch(rec: ProgramRecord, patch: Partial<ProgramRecord>): ProgramRecord;
  SHARED_KEY: string;
  parseDate(str: string | undefined | null): number | null;
  _readShared(): Record<string, unknown>;
  _writeShared(o: Record<string, unknown>): void;
  getVersions(key: string): Array<{ from: number; value: unknown }>;
  saveVersion(key: string, fromNum: number | null, value: unknown): void;
  resolveVersion(key: string, def: unknown, dateNum: number | null): unknown;
  getSupportersVersions(): Array<{ from: number; supporters: unknown }>;
  saveSupportersVersion(fromNum: number | null, supporters: unknown): void;
  resolveSupporters(defaultSup: unknown, dateNum: number | null): unknown;
}
