import type { Interview, Job } from '@jobster/shared';
import { INTERVIEW_FORMAT_LABELS } from '@jobster/shared';

const slotFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatSlot = (iso: string) => slotFormat.format(new Date(iso));

export const formatTime = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

/** Value for an <input type="datetime-local"> in the viewer's own time zone. */
export function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Build a calendar file so a booked interview can be added to any calendar app. */
export function interviewIcs(interview: Interview, job: Job, withWhom: string): string {
  const start = new Date(interview.chosenSlot!);
  const end = new Date(start.getTime() + interview.durationMinutes * 60_000);
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const escape = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jobster//Interview//EN',
    'BEGIN:VEVENT',
    `UID:${stamp(start)}-${job.id}@jobster`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(`Interview: ${job.title} with ${withWhom}`)}`,
    `DESCRIPTION:${escape(`${INTERVIEW_FORMAT_LABELS[interview.format]}. ${interview.details}`)}`,
    `LOCATION:${escape(interview.details)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
