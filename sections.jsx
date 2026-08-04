// Vivo Program Book — Section page renderers
// Each section.kind gets a dedicated renderer

import React from 'react';
import { WelcomeSection } from './sections/welcome.jsx';
import { ProgramSection } from './sections/program.jsx';
import { NotesSection, SynopsisSection } from './sections/notes.jsx';
import { CastSection, RosterSection, BiosSection } from './sections/cast.jsx';
import { DonorsSection } from './sections/donors.jsx';
import { EventsSection } from './sections/events.jsx';
import { PerformanceSponsorSection, SponsorsSection } from './sections/sponsors.jsx';
import { InfoSection } from './sections/info.jsx';
import { VivoSection, StaffBoardSection, SupportersSection } from './sections/shared-content.jsx';
import { PromoSection } from './sections/promo.jsx';
import { SongTextsSection } from './songtexts.jsx';

// ---- Main switcher ----
const SectionBody = ({ section, update, allSections, onGoSection, expandedBioId, onClearExpandedBio, displayStyle, defaultTransMode, cover, updateCover }) => {
  const biosSection = allSections?.find(s => s.kind === "bios");
  const onGoBio = (bioId) => {
    if (!biosSection) return;
    onGoSection?.(biosSection.id, { expandedBioId: bioId });
  };
  switch (section.kind) {
    case "welcome": return <WelcomeSection s={section} update={update} />;
    case "program": return <ProgramSection s={section} update={update} displayStyle={displayStyle} allSections={allSections} onGoSection={onGoSection} cover={cover} updateCover={updateCover} />;
    case "notes": return <NotesSection s={section} update={update} />;
    case "synopsis": return <SynopsisSection s={section} update={update} />;
    case "cast": return <CastSection s={section} update={update} bios={biosSection?.bios} onGoBio={onGoBio} />;
    case "roster": return <RosterSection s={section} update={update} />;
    case "bios": return <BiosSection s={section} update={update} expandedId={expandedBioId} onClearExpanded={onClearExpandedBio} />;
    case "donors": return <DonorsSection s={section} update={update} />;
    case "events": return <EventsSection s={section} update={update} />;
    case "performance-sponsor": return <PerformanceSponsorSection s={section} update={update} />;
    case "sponsors": return <SponsorsSection s={section} update={update} />;
    case "info": return <InfoSection s={section} update={update} />;
    case "songtexts": return <SongTextsSection s={section} update={update} defaultMode={defaultTransMode} />;
    case "vivo": return <VivoSection s={section} update={update} />;
    case "supporters-list": return <SupportersSection s={section} update={update} />;
    case "staff-board": return <StaffBoardSection s={section} update={update} />;
    case "promo": return <PromoSection s={section} update={update} />;
    default: return null;
  }
};

export { SectionBody };
