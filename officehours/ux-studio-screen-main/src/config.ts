/**
 * UX Studio Screen - Configuration File
 * 
 * Edit this file to customize all displayed data across the application.
 * No need to modify individual component files!
 */

// =============================================================================
// WEATHER CONFIGURATION
// =============================================================================
export const weatherConfig = {
  location: 'Charlottesville',
  state: 'VA',
  cacheDurationMs: 60 * 60 * 1000, // 1 hour
};

// =============================================================================
// MUSIC CONFIGURATION
// =============================================================================
export const musicConfig = {
  spotifyPlaylistUrl: 'https://open.spotify.com/playlist/0QigGJUSwwCKdBnD3FXjBA?si=66cc571f63f541b8&pt=f34bab7e630fe2fcdb04397c5d86ab30',
  spotifyEmbedUrl: 'https://open.spotify.com/embed/playlist/0QigGJUSwwCKdBnD3FXjBA?utm_source=generator',
  label: 'LISTEN ON SPOTIFY',
  color: 'retro-lime',
};

// =============================================================================
// CLASS SCHEDULE CONFIGURATION
// =============================================================================
export const scheduleConfig = {
  // Days of week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  days: [3], // Wednesday
  startHour: 18, // 6pm (24-hour format)
  endHour: 19,
  endMinute: 30, // 7:30pm
};

// =============================================================================
// COURSE ANNOUNCEMENTS / ASSIGNMENTS
// =============================================================================
export type AnnouncementType = 'homework' | 'project' | 'quiz' | 'exam' | 'ica' | 'lab' | 'survey' | 'checkpoint';

export interface Announcement {
  title: string;
  date: Date;
  type: AnnouncementType;
}

export const announcements: Announcement[] = [
  // -------------------------------------------------------------------------
  // PROJECTS (40% of Total)
  // -------------------------------------------------------------------------
  { title: 'Project 1: Rapid Spin', date: new Date('2026-09-10T23:59:00'), type: 'project' },
  { title: 'Project 2: Analysis', date: new Date('2026-10-06T23:59:00'), type: 'project' },
  { title: 'Project 3: Design', date: new Date('2026-11-05T23:59:00'), type: 'project' },
  { title: 'Project 4: Prototype & Evaluation', date: new Date('2026-12-03T23:59:00'), type: 'project' },
  { title: 'Project Presentations', date: new Date('2026-12-18T09:00:00'), type: 'project' },

  // Checkpoints
  { title: 'Project 1a: System Concept', date: new Date('2026-09-01T23:59:00'), type: 'checkpoint' },
  { title: 'Project 2a: Interviews', date: new Date('2026-09-22T23:59:00'), type: 'checkpoint' },
  { title: 'Project 3a: Ideation', date: new Date('2026-10-20T23:59:00'), type: 'checkpoint' },
  { title: 'Project 3b: Conceptual Design', date: new Date('2026-10-27T23:59:00'), type: 'checkpoint' },
  { title: 'Project 4a: Prototype', date: new Date('2026-11-19T23:59:00'), type: 'checkpoint' },

  // -------------------------------------------------------------------------
  // HOMEWORK (10% of Total)
  // -------------------------------------------------------------------------
  { title: 'HW-0: Team Formation', date: new Date('2026-08-26T23:59:00'), type: 'homework' },
  { title: 'HW-1: Why A+?', date: new Date('2026-09-08T23:59:00'), type: 'homework' },
  { title: 'HW-2: How will I learn?', date: new Date('2026-09-17T23:59:00'), type: 'homework' },
  { title: 'HW-X1: Mindful Designer (Project 1)', date: new Date('2026-09-15T23:59:00'), type: 'homework' },
  { title: 'HW-X2: Mindful Designer (Project 2)', date: new Date('2026-10-08T23:59:00'), type: 'homework' },
  { title: 'HW-X3: Mindful Designer (Project 3)', date: new Date('2026-11-10T23:59:00'), type: 'homework' },
  { title: 'HW-3: Mind Map', date: new Date('2026-12-01T23:59:00'), type: 'homework' },
  { title: 'HW-X4: Mindful Designer (Project 4)', date: new Date('2026-12-03T23:59:00'), type: 'homework' },
  { title: 'HW-4: Reflection', date: new Date('2026-12-08T23:59:00'), type: 'homework' },
  
  // -------------------------------------------------------------------------
  // QUIZZES (15% of Total)
  // -------------------------------------------------------------------------
  { title: 'Quiz 0: Syllabus & Project', date: new Date('2026-09-03T23:59:00'), type: 'quiz' },
  { title: 'Quiz 1: UXB Chapters 2 & 23', date: new Date('2026-09-08T23:59:00'), type: 'quiz' },
  { title: 'Quiz 2: UXB Chapter 3', date: new Date('2026-09-15T23:59:00'), type: 'quiz' },
  { title: 'Quiz 3: UXB Chapter 4', date: new Date('2026-09-22T23:59:00'), type: 'quiz' },
  { title: 'Quiz 4: UXB Chapters 5–6', date: new Date('2026-09-29T23:59:00'), type: 'quiz' },
  { title: 'Quiz 5: UXB Chapter 7', date: new Date('2026-10-08T23:59:00'), type: 'quiz' },
  { title: 'Quiz 6: UXB Chapters 8 & 20', date: new Date('2026-10-15T23:59:00'), type: 'quiz' },
  { title: 'Quiz 7: UXB Chapters 9 & 22', date: new Date('2026-10-29T23:59:00'), type: 'quiz' },
  { title: 'Quiz 8: UXB Chapters 10–11', date: new Date('2026-11-10T23:59:00'), type: 'quiz' },
  { title: 'Quiz 9: UXB Chapters 12–13', date: new Date('2026-11-17T23:59:00'), type: 'quiz' },
  
  // -------------------------------------------------------------------------
  // EXAM (5% of Total)
  // -------------------------------------------------------------------------
  { title: 'Final Exam', date: new Date('2026-12-08T23:59:00'), type: 'exam' },
  
  // -------------------------------------------------------------------------
  // IN-CLASS ACTIVITIES (ICA)
  // -------------------------------------------------------------------------
  { title: 'ICA1: Team Building', date: new Date('2026-09-03T15:30:00'), type: 'ica' },
  { title: 'ICA2: Contextual Inquiry', date: new Date('2026-09-17T15:30:00'), type: 'ica' },
  { title: 'ICA3: Contextual Analysis', date: new Date('2026-09-24T15:30:00'), type: 'ica' },
  { title: 'ICA4: Flow Modeling', date: new Date('2026-10-01T15:30:00'), type: 'ica' },
  { title: 'ICA5: Design Thinking', date: new Date('2026-10-13T15:30:00'), type: 'ica' },
  { title: 'ICA6: Conceptual Design', date: new Date('2026-10-20T15:30:00'), type: 'ica' },
  { title: 'ICA7: MSLQ', date: new Date('2026-11-05T15:30:00'), type: 'ica' },
  { title: 'ICA8: Prototyping I — Video', date: new Date('2026-11-12T15:30:00'), type: 'ica' },
  { title: 'ICA9: Talk Feedback', date: new Date('2026-12-01T15:30:00'), type: 'ica' },
  { title: 'ICA10: Physical Prototyping', date: new Date('2026-12-03T15:30:00'), type: 'ica' },
  
  // -------------------------------------------------------------------------
  // LABS
  // -------------------------------------------------------------------------
  { title: 'L1: Problem Identification', date: new Date('2026-09-01T15:30:00'), type: 'lab' },
  { title: 'L2: Identify Work Roles', date: new Date('2026-09-15T15:30:00'), type: 'lab' },
  { title: 'L3: DMM & Conceptual Designs', date: new Date('2026-10-22T15:30:00'), type: 'lab' },
  { title: 'Design Studio', date: new Date('2026-10-27T15:30:00'), type: 'lab' },
  { title: 'L4: Evaluation Study Design', date: new Date('2026-11-19T15:30:00'), type: 'lab' },
];

// =============================================================================
// FONTS OF THE WEEK
// =============================================================================
export interface FontInfo {
  name: string;
  designer: string;
  year: number;
  funFact: string;
  googleFontUrl?: string;
  sampleText?: string;
}

export const fonts: FontInfo[] = [
  {
    name: "El Messiri",
    designer: "Mohamed Gaber",
    year: 2014,
    funFact: "El Messiri began life as an Arabic companion to Jovanny Lemonad's Latin and Cyrillic typeface 'Philosopher.' Mohamed Gaber designed the Arabic side to harmonize across all three scripts — a tricky balancing act, since Arabic's flowing baseline and contextual letterforms behave very differently from Latin's rigid grid. The result is a modern Arabic family that spans nine weights from Thin to Black and reads comfortably alongside its Latin counterpart.",
    googleFontUrl: "https://fonts.google.com/specimen/El+Messiri",
    sampleText: "Typography is the craft of endowing human language with a durable visual form."
  },
];

// =============================================================================
// RECOMMENDED CONTENT
// =============================================================================
export type ContentType = 'read' | 'watch';

export interface RecommendedContentItem {
  type: ContentType;
  title: string;
  source: string;
  url?: string;
  thumbnail?: string;
  description?: string;
}

export const recommendations: RecommendedContentItem[] = [
  {
    type: "read",
    title: "Being good isn’t enough",
    source: "Josh Swords",
    url: "https://joshs.bearblog.dev/being-good-isnt-enough/",
    description: "",
    thumbnail: ""
  }
];

// =============================================================================
// QUOTES
// =============================================================================
export interface Quote {
  text: string;
  author: string;
  role?: string;
}

export const quotes: Quote[] = [
  {
    text: "The recipe for great work is: very exacting taste, plus the ability to gratify it",
    author: "Paul Graham",
    role: "Co-Founder of Viaweb and YCombinator"
  },
];
