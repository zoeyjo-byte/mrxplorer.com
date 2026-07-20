import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dataDir = path.join(root, 'data');
const config = JSON.parse(await fs.readFile(path.join(dataDir, 'schedule.json'), 'utf8'));
const overrides = JSON.parse(await fs.readFile(path.join(dataDir, 'schedule-overrides.json'), 'utf8'));
const now = new Date();

const pad = value => String(value).padStart(2, '0');
const dateOnly = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;

function partsInZone(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: config.timezone,
    year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(date);
  const value = type => Number(parts.find(part => part.type === type)?.value);
  return { year: value('year'), month: value('month') - 1, day: value('day'), hour: value('hour'), minute: value('minute') };
}

function offsetFor(date) {
  const value = new Intl.DateTimeFormat('en-US', {
    timeZone: config.timezone,
    timeZoneName: 'longOffset',
  }).formatToParts(date).find(part => part.type === 'timeZoneName').value;
  if (value === 'GMT') return '+00:00';
  const offset = value.replace('GMT', '');
  return /^[+-]\d$/.test(offset) ? `${offset[0]}0${offset[1]}:00` : offset;
}

function makeZonedDate(year, month, day, hour, minute) {
  const date = dateOnly(year, month, day);
  const offset = offsetFor(new Date(Date.UTC(year, month, day, 12)));
  return new Date(`${date}T${pad(hour)}:${pad(minute)}:00${offset}`);
}

function formatISO(date) {
  const p = partsInZone(date);
  return `${dateOnly(p.year, p.month, p.day)}T${pad(p.hour)}:${pad(p.minute)}:00${offsetFor(date)}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: config.timezone,
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(date);
}

function nthWeekday(year, month, weekday, nth) {
  const first = new Date(Date.UTC(year, month, 1));
  const diff = (weekday - first.getUTCDay() + 7) % 7;
  const day = 1 + diff + ((nth - 1) * 7);
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return day <= lastDay ? new Date(Date.UTC(year, month, day)) : null;
}

function candidateDates(rule, includePast = false) {
  const start = partsInZone(now);
  const end = new Date(now);
  end.setUTCMonth(end.getUTCMonth() + config.horizonMonths);
  const dates = [];
  let year = start.year;
  let month = start.month;
  while (new Date(Date.UTC(year, month, 1)) <= end) {
    for (const nth of rule.nth) {
      const day = nthWeekday(year, month, rule.weekday, nth);
      if (!day) continue;
      const candidate = makeZonedDate(year, month, day.getUTCDate(), rule.hour, rule.minute);
      if ((includePast || candidate > now) && candidate <= end) dates.push(candidate);
    }
    month += 1;
    if (month > 11) { month = 0; year += 1; }
  }
  return dates.sort((a, b) => a - b);
}

function observedFixedHoliday(year, month, day) {
  const date = new Date(Date.UTC(year, month, day));
  const weekday = date.getUTCDay();
  if (weekday === 6) date.setUTCDate(date.getUTCDate() - 1);
  if (weekday === 0) date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

function holidayDates(year) {
  const holidays = [
    ['New Year\'s Day', observedFixedHoliday(year, 0, 1)],
    ['Martin Luther King Jr. Day', nthWeekday(year, 0, 1, 3)],
    ['Washington\'s Birthday', nthWeekday(year, 1, 1, 3)],
    ['Memorial Day', lastWeekday(year, 4, 1)],
    ['Juneteenth', observedFixedHoliday(year, 5, 19)],
    ['Independence Day', observedFixedHoliday(year, 6, 4)],
    ['Labor Day', nthWeekday(year, 8, 1, 1)],
    ['Columbus Day', nthWeekday(year, 9, 1, 2)],
    ['Veterans Day', observedFixedHoliday(year, 10, 11)],
    ['Thanksgiving Day', nthWeekday(year, 10, 4, 4)],
    ['Christmas Day', observedFixedHoliday(year, 11, 25)],
  ];
  return holidays.filter(([, date]) => date).map(([name, date]) => ({ name, date: dateOnly(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) }));
}

function lastWeekday(year, month, weekday) {
  const last = new Date(Date.UTC(year, month + 1, 0));
  const diff = (last.getUTCDay() - weekday + 7) % 7;
  last.setUTCDate(last.getUTCDate() - diff);
  return last;
}

function dayDistance(a, b) {
  return Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000);
}

const holidays = [...new Set([now.getUTCFullYear(), now.getUTCFullYear() + 1, now.getUTCFullYear() + 2].flatMap(holidayDates))];
const holidayReview = [];

function applyOverride(name, rawDate, generatedDate) {
  const override = overrides[name]?.[rawDate];
  if (!override) return generatedDate;
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(override)
    ? makeZonedDate(Number(override.slice(0, 4)), Number(override.slice(5, 7)) - 1, Number(override.slice(8, 10)), partsInZone(generatedDate).hour, partsInZone(generatedDate).minute)
    : new Date(override);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid override for ${name} ${rawDate}: ${override}`);
  return parsed;
}

function buildEntry(rule) {
  const candidates = candidateDates(rule, rule.sequence).map(generatedDate => {
    const rawDate = dateOnly(partsInZone(generatedDate).year, partsInZone(generatedDate).month, partsInZone(generatedDate).day);
    const holiday = holidays.find(item => Math.abs(dayDistance(rawDate, item.date)) <= 1);
    if (holiday && generatedDate > now) {
      holidayReview.push({ name: rule.name, page: rule.page, candidateDate: rawDate, holiday: holiday.name, distanceDays: dayDistance(rawDate, holiday.date), override: overrides[rule.name]?.[rawDate] || null });
    }
    return applyOverride(rule.name, rawDate, generatedDate);
  });
  const futureCandidates = candidates.filter(date => date > now);
  let next = futureCandidates.slice(0, 2);
  if (rule.sequence) {
    const groups = new Map();
    for (const date of candidates) {
      const p = partsInZone(date);
      const key = `${p.year}-${p.month}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(date);
    }
    next = [...groups.values()].find(group => group.length === rule.nth.length && group.every(date => date > now)) || [];
  }
  return {
    name: rule.name,
    page: rule.page,
    candidates: candidates.map(formatISO),
    labels: candidates.map(formatDate),
    next: next.map(formatISO),
  };
}

const classes = config.classes.map(buildEntry);
const cohorts = config.cohorts.map(buildEntry);
const generated = {
  timezone: config.timezone,
  classes,
  cohorts,
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function updatePage(file, entries) {
  let html = fsCache.get(file);
  if (!html) return;
  const schemaMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (schemaMatch) {
    const schema = JSON.parse(schemaMatch[1]);
    for (const entry of entries) {
      const course = schema['@graph']?.find(item => item['@type'] === 'Course' && item.name === entry.name);
      if (!course) continue;
      if (Array.isArray(course.hasCourseInstance)) {
        course.hasCourseInstance.forEach((instance, index) => {
          if (entry.next[index]) instance.startDate = entry.next[index];
        });
      } else if (entry.next[0]) {
        course.hasCourseInstance.startDate = entry.next[0];
      }
    }
    html = html.replace(schemaMatch[0], `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`);
  }
  for (const entry of entries) {
    const heading = new RegExp(`(<h3>${escapeRegExp(entry.name)}<\\/h3>[\\s\\S]*?<strong>Next: )[^<]+(</strong>)`);
    const label = entry.next.map(date => formatDate(new Date(date))).join(' & ');
    html = html.replace(heading, `$1${label}$2`);
    const waitlist = new RegExp(`(<div class="waitlist-form" data-class="${escapeRegExp(entry.name)}"[^>]*data-session-date=")[^"]+`);
    if (entry.next[0]) html = html.replace(waitlist, `$1${entry.next[0]}`);
  }
  fsCache.set(file, html);
}

const fsCache = new Map();
for (const file of new Set(config.classes.map(entry => entry.page))) {
  fsCache.set(file, await fs.readFile(path.join(root, file), 'utf8'));
}
for (const page of new Set(config.classes.map(entry => entry.page))) {
  updatePage(page, classes.filter(entry => entry.page === page));
}
for (const page of new Set(cohorts.map(entry => entry.page))) {
  const entries = cohorts.filter(entry => entry.page === page);
  let html = fsCache.get(page);
  for (const entry of entries) {
    const cohortDate = entry.next[0] ? formatDate(new Date(entry.next[0])) : '';
    const pattern = page === 'classes.html'
      ? new RegExp(`(<h3>${escapeRegExp(entry.displayName || entry.name)}[^<]*<\\/h3>[\\s\\S]*?<strong>Next cohort starts )[^<]+(<\\/strong>)`)
      : /(<strong>Next cohort starts )[^<]+(<\/strong>)/;
    html = html.replace(pattern, `$1${cohortDate}$2`);
  }
  fsCache.set(page, html);
}
for (const [file, html] of fsCache) await fs.writeFile(path.join(root, file), html);

const checkoutSchedules = {
  'class-checkout/index.html': {
    classes: Object.fromEntries(classes.filter(entry => entry.page === 'classes.html').map(entry => [entry.name, entry.next])),
    cohorts: Object.fromEntries(cohorts.filter(entry => entry.page === 'classes.html').map(entry => [entry.name, entry.next])),
  },
  'class-checkout/leaders.html': {
    classes: Object.fromEntries(classes.filter(entry => entry.page === 'classes/leaders.html').map(entry => [entry.name, entry.next])),
    cohorts: Object.fromEntries(cohorts.filter(entry => entry.page === 'classes/leaders.html').map(entry => [entry.name, entry.next])),
  },
};
for (const [file, schedule] of Object.entries(checkoutSchedules)) {
  let html = await fs.readFile(path.join(root, file), 'utf8');
  html = html.replace(/const GENERATED_SCHEDULE = [^;]+;/, `const GENERATED_SCHEDULE = ${JSON.stringify(schedule.classes)};`);
  html = html.replace(/const GENERATED_COHORTS = [^;]+;/, `const GENERATED_COHORTS = ${JSON.stringify(schedule.cohorts)};`);
  await fs.writeFile(path.join(root, file), html);
}

await fs.writeFile(path.join(dataDir, 'generated-schedule.json'), `${JSON.stringify(generated, null, 2)}\n`);
const reportLines = [
  '# Holiday Review',
  '',
  holidayReview.length ? 'Review these class occurrences before publishing a schedule override:' : 'No class occurrences landed on or within one day of an observed US holiday in the generated horizon.',
  '',
  '| Class | Candidate date | Holiday | Distance | Override |',
  '|---|---|---|---:|---|',
  ...holidayReview.map(item => `| ${item.name} | ${item.candidateDate} | ${item.holiday} | ${item.distanceDays} day(s) | ${item.override || 'pending'} |`),
  '',
  'Add approved changes to `data/schedule-overrides.json` using the candidate date as the key, then rerun `node scripts/generate-schedule.mjs`.',
];
await fs.writeFile(path.join(dataDir, 'holiday-review.md'), `${reportLines.join('\n')}\n`);
console.log(`Generated ${classes.length} class schedules and ${holidayReview.length} holiday review item(s).`);
