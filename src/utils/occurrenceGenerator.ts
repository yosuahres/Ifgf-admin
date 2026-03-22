import { createClient } from "@/lib/supabase/client";

const DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

// Parse 'FREQ=WEEKLY;BYDAY=SU' → { freq: 'WEEKLY', byday: 'SU' }
function parseRule(rule: string) {
  return Object.fromEntries(
    rule.split(";").map((part) => {
      const [k, v] = part.split("=");
      return [k.toLowerCase(), v];
    })
  );
}

// Get all weekly dates from start to end on a given weekday
function weeklyDates(start: Date, end: Date, weekday: string): Date[] {
  const targetDay = DAYS.indexOf(weekday);
  if (targetDay === -1) return [];

  const dates: Date[] = [];
  const cur = new Date(start);

  // Advance to the first occurrence of the target weekday on or after start
  const diff = (targetDay - cur.getDay() + 7) % 7;
  cur.setDate(cur.getDate() + diff);

  while (cur <= end) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 7);
  }
  return dates;
}

export type GenerateResult = {
  inserted: number;
  skipped: number;
  error?: string;
};

export async function generateOccurrences(event: {
  id: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  recurrence_rule: string | null;
  recurrence_end_date: string | null;
}): Promise<GenerateResult> {
  const supabase = createClient();

  let dates: Date[] = [];
  const start = new Date(event.event_date);

  if (event.recurrence_rule && event.recurrence_end_date) {
    const rule = parseRule(event.recurrence_rule);
    const end = new Date(event.recurrence_end_date);

    if (rule.freq === "weekly" && rule.byday) {
      dates = weeklyDates(start, end, rule.byday.toUpperCase());
    }
  } else {
    // Non-recurring: just the event date itself
    dates = [start];
  }

  if (dates.length === 0) {
    return {
      inserted: 0,
      skipped: 0,
      error: "No dates generated. Check recurrence rule and end date.",
    };
  }

  const rows = dates.map((d) => ({
    event_id: event.id,
    occurrence_date: d.toISOString().split("T")[0],
    start_time: event.start_time ?? null,
    end_time: event.end_time ?? null,
  }));

  try {
    // upsert with onConflict skips rows that already exist for
    // the unique(event_id, occurrence_date) constraint
    const { data, error } = await supabase
      .from("event_occurrences")
      .upsert(rows, { onConflict: "event_id,occurrence_date", ignoreDuplicates: true })
      .select();

    if (error) return { inserted: 0, skipped: rows.length, error: error.message };

    const inserted = data?.length ?? 0;
    const skipped = rows.length - inserted;
    return { inserted, skipped };
  } catch (e: any) {
    return { inserted: 0, skipped: rows.length, error: e?.message ?? "Unknown error" };
  }
}