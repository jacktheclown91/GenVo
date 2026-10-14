// Meal actions share consumption and caregiver-learning semantics. Search-only
// forage movements are deliberately absent: they carry no food target.
const MEAL_INTENTS=new Set(['feed','stealth-forage','tendency-forage']);
export function isFeedingIntent(intent){return MEAL_INTENTS.has(intent)}
