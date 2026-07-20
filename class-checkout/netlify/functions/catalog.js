export const CATALOG = {
  'Prompt Frameworks for Better Results': { price: 79, type: 'individual' },
  'AI as a Thinking Partner': { price: 79, type: 'individual' },
  'Chat / Projects / Cowork / Code(x)': { price: 79, type: 'individual' },
  'Hallucination, Pricing, and Privacy Basics': { price: 79, type: 'individual' },
  'Chat / Projects / Cowork / Code(x) (Intermediate)': { price: 99, type: 'individual' },
  'Quantitative Analysis with an LLM': { price: 99, type: 'individual' },
  'Building and Working with Agents': { price: 99, type: 'individual' },
  'Projects — When You Actually Want a Siloed Experience': { price: 99, type: 'individual' },
  'Data Privacy and Security': { price: 99, type: 'individual' },
  'When to Automate': { price: 99, type: 'individual' },
  'AI Foundations for Market Research Leaders': { price: 499, type: 'individual' },
  'Practical AI': { price: 499, type: 'individual' },
  'Governance, Risk, and Tool Standardization': { price: 499, type: 'individual' },
  'Workflows — Let\'s Map and Decide (2-session sequence)': { price: 499, type: 'individual' },
  'Workflows — Let\'s Map and Decide (2-part sequence)': { price: 499, type: 'individual' },
  'AI Beginners 4-Week Bundle (cohort)': { price: 249, type: 'cohort' },
  'Intermediate AI 6-Week Cohort': { price: 499, type: 'cohort' },
  'AI for Market Research Team Leaders — 6-week Cohort': { price: 2595, type: 'cohort' },
};

const SCHEDULES = {
  'Prompt Frameworks for Better Results': { weekday: 2, nth: [1], hour: 12 },
  'AI as a Thinking Partner': { weekday: 2, nth: [2], hour: 12 },
  'Chat / Projects / Cowork / Code(x)': { weekday: 2, nth: [3], hour: 12 },
  'Hallucination, Pricing, and Privacy Basics': { weekday: 2, nth: [4], hour: 12 },
  'Chat / Projects / Cowork / Code(x) (Intermediate)': { weekday: 1, nth: [1], hour: 12 },
  'Quantitative Analysis with an LLM': { weekday: 4, nth: [4], hour: 12 },
  'Building and Working with Agents': { weekday: 4, nth: [2], hour: 12 },
  'Projects — When You Actually Want a Siloed Experience': { weekday: 1, nth: [4], hour: 12 },
  'Data Privacy and Security': { weekday: 1, nth: [2], hour: 12 },
  'When to Automate': { weekday: 1, nth: [3], hour: 12 },
  'AI Foundations for Market Research Leaders': { weekday: 3, nth: [1], hour: 12 },
  'Practical AI': { weekday: 4, nth: [1], hour: 12 },
  'Governance, Risk, and Tool Standardization': { weekday: 5, nth: [2], hour: 12 },
  'Workflows — Let\'s Map and Decide (2-session sequence)': { weekday: 5, nth: [3, 4], hour: 12 },
  'Workflows — Let\'s Map and Decide (2-part sequence)': { weekday: 5, nth: [3, 4], hour: 12 },
  'AI Beginners 4-Week Bundle (cohort)': { weekday: 2, nth: [2], hour: 9, cadenceMonths: 2, cadenceAnchor: '2026-08' },
  'Intermediate AI 6-Week Cohort': { weekday: 4, nth: [2], hour: 9, cadenceMonths: 2, cadenceAnchor: '2026-08' },
  'AI for Market Research Team Leaders — 6-week Cohort': { weekday: 5, nth: [1], hour: 9, cadenceMonths: 2, cadenceAnchor: '2026-08' },
};

export function isScheduledDate(name, date) {
  const schedule = SCHEDULES[name];
  const parsed = new Date(date);
  if (!schedule || Number.isNaN(parsed.getTime())) return false;

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(parsed);
  const value = (type) => Number(parts.find(part => part.type === type)?.value);
  const day = value('day');
  const year = value('year');
  const month = value('month') - 1;
  const weekday = parsed.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', weekday: 'long' });
  const weekdayNumber = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(weekday);
  const nth = Math.floor((day - 1) / 7) + 1;
  const cadenceAnchor = schedule.cadenceAnchor ? /^\d{4}-(\d{2})$/.exec(schedule.cadenceAnchor) : null;
  const cadenceAnchorIndex = cadenceAnchor
    ? Number(schedule.cadenceAnchor.slice(0, 4)) * 12 + Number(cadenceAnchor[1]) - 1
    : null;
  const cadenceMatches = !schedule.cadenceMonths || cadenceAnchorIndex === null ||
    (year * 12 + month - cadenceAnchorIndex) % schedule.cadenceMonths === 0;
  return weekdayNumber === schedule.weekday && schedule.nth.includes(nth) && cadenceMatches &&
    value('hour') === schedule.hour && value('minute') === 0;
}
