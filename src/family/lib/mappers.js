// Convert between the app's camelCase objects and Postgres snake_case rows.
// Each collection defines toRow (app -> db) and fromRow (db -> app).
// Tables whose columns already match the app shape use the identity helpers.

const identity = (x) => ({ ...x });

export const MAPPERS = {
  events: {
    toRow: (e) => ({
      id: e.id,
      title: e.title,
      member_id: e.memberId ?? null,
      date: e.date,
      all_day: !!e.allDay,
      start_time: e.start ?? null,
      end_time: e.end ?? null,
      location: e.location ?? "",
      notes: e.notes ?? ""
    }),
    fromRow: (r) => ({
      id: r.id,
      title: r.title,
      memberId: r.member_id,
      date: r.date,
      allDay: !!r.all_day,
      start: r.start_time,
      end: r.end_time,
      location: r.location ?? "",
      notes: r.notes ?? ""
    })
  },

  chores: {
    toRow: (c) => ({
      id: c.id,
      title: c.title,
      member_id: c.memberId ?? null,
      stars: c.stars ?? 1,
      done: !!c.done
    }),
    fromRow: (r) => ({
      id: r.id,
      title: r.title,
      memberId: r.member_id,
      stars: r.stars ?? 1,
      done: !!r.done
    })
  },

  todos: {
    toRow: (t) => ({ id: t.id, title: t.title, done: !!t.done }),
    fromRow: (r) => ({ id: r.id, title: r.title, done: !!r.done })
  },

  grocery: {
    toRow: (g) => ({
      id: g.id,
      name: g.name,
      qty: g.qty ?? "",
      got: !!g.got,
      source: g.source ?? ""
    }),
    fromRow: (r) => ({
      id: r.id,
      name: r.name,
      qty: r.qty ?? "",
      got: !!r.got,
      source: r.source ?? ""
    })
  },

  meals: {
    // Omit id on seed so Postgres generates it; include it when known (updates).
    toRow: (m) => {
      const row = {
        day: m.day,
        label: m.label,
        breakfast: m.breakfast,
        lunch: m.lunch,
        dinner: m.dinner
      };
      if (m.id) row.id = m.id;
      return row;
    },
    fromRow: (r) => ({
      id: r.id,
      day: r.day,
      label: r.label,
      breakfast: r.breakfast,
      lunch: r.lunch,
      dinner: r.dinner
    })
  },

  photos: {
    toRow: (p) => ({
      id: p.id,
      name: p.name ?? "Photo",
      src: p.src,
      favorite: !!p.favorite
    }),
    fromRow: (r) => ({
      id: r.id,
      name: r.name,
      src: r.src,
      favorite: !!r.favorite
    })
  },

  family_members: {
    toRow: (m) => ({
      id: m.id,
      name: m.name,
      role: m.role ?? "",
      color: m.color,
      soft: m.soft
    }),
    fromRow: identity
  },

  // import_candidates: db -> Candidate shape used by the Review UI.
  import_candidates: {
    toRow: (c) => ({
      id: c.id,
      title: c.title,
      date: c.date ?? null,
      start_time: c.start ?? null,
      end_time: c.end ?? null,
      location: c.location ?? "",
      member_id: c.memberId ?? null,
      notes: c.notes ?? "",
      source: c.source ?? "email",
      raw_input: c.rawInput ?? null,
      status: c.status ?? "pending"
    }),
    fromRow: (r) => ({
      id: r.id,
      tempId: r.id,
      title: r.title,
      date: r.date,
      start: r.start_time,
      end: r.end_time,
      location: r.location ?? "",
      memberId: r.member_id,
      notes: r.notes ?? "",
      source: r.source ?? "email",
      status: r.status ?? "pending",
      remote: true
    })
  }
};

// rewards: app keeps an object keyed by memberId; db keeps one row per member.
export const rewardsFromRows = (rows) =>
  (rows || []).reduce((acc, r) => {
    acc[r.member_id] = {
      redeemedStars: r.redeemed_stars ?? 0,
      screenMinutes: r.screen_minutes ?? 0
    };
    return acc;
  }, {});

export const rewardToRow = (memberId, value) => ({
  member_id: memberId,
  redeemed_stars: value.redeemedStars ?? 0,
  screen_minutes: value.screenMinutes ?? 0
});

// settings: app keeps one object; db stores it as a single row key='app'.
export const SETTINGS_KEY = "app";
