// #1 Bullet strength meter - fully local, zero AI calls.
const ACTION_VERBS = new Set([
  "accelerated","achieved","architected","automated","built","boosted","championed",
  "consolidated","created","cut","decreased","delivered","designed","developed",
  "directed","drove","eliminated","enabled","engineered","enhanced","established",
  "exceeded","executed","expanded","founded","generated","grew","implemented",
  "improved","increased","initiated","integrated","introduced","launched","led",
  "maintained","managed","mentored","migrated","modernized","optimized","orchestrated",
  "overhauled","owned","pioneered","produced","published","rebuilt","redesigned",
  "reduced","refactored","released","resolved","revamped","scaled","secured",
  "shipped","simplified","spearheaded","standardized","streamlined","strengthened",
  "transformed","upgraded","won","wrote","deployed","monitored","tested","debugged",
  "containerized","instrumented","benchmarked","profiled","documented","reviewed",
]);

export interface BulletStrength {
  verb: boolean;    // starts with a strong action verb
  metric: boolean;  // contains a number / % / scale indicator
  concise: boolean; // 6-28 words
  score: 0 | 1 | 2 | 3;
}

export function bulletStrength(text: string): BulletStrength {
  const t = text.trim();
  const first = t.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
  const verb = ACTION_VERBS.has(first) || /^[a-z]{4,}ed$/.test(first);
  const metric = /\d/.test(t) || /\b(thousand|million|billion|k\+)\b/i.test(t);
  const words = t.split(/\s+/).filter(Boolean).length;
  const concise = words >= 6 && words <= 28;
  const score = ((verb ? 1 : 0) + (metric ? 1 : 0) + (concise ? 1 : 0)) as 0 | 1 | 2 | 3;
  return { verb, metric, concise, score };
}
