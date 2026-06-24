import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, hasSupabase } from "../lib/supabase";
import {
  MAPPERS,
  rewardsFromRows,
  rewardToRow,
  SETTINGS_KEY
} from "../lib/mappers";
import {
  FAMILY_MEMBERS,
  DEFAULT_SETTINGS,
  REWARD_RATE,
  buildSeedData,
  newId
} from "../data/familyData";

// Optimistic upsert/delete on a local array keyed by id.
function upsertInto(list, obj) {
  const i = list.findIndex((x) => x.id === obj.id);
  if (i === -1) return [...list, obj];
  const copy = list.slice();
  copy[i] = obj;
  return copy;
}
function removeFrom(list, id) {
  return list.filter((x) => x.id !== id);
}

async function run(promise, label) {
  const { error } = await promise;
  if (error) console.error(`[familyHub] ${label} failed:`, error.message);
  return !error;
}

// Insert the seed data into an empty database. Guarded so concurrent mounts
// (e.g. React StrictMode double-invoke) can't double-seed.
let seedPromise = null;
function seedDatabase() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const seed = buildSeedData();
    const rewardsRows = FAMILY_MEMBERS.map((m) =>
      rewardToRow(m.id, { redeemedStars: 0, screenMinutes: 0 })
    );
    await run(
      supabase.from("family_members").upsert(FAMILY_MEMBERS.map(MAPPERS.family_members.toRow)),
      "seed members"
    );
    await Promise.all([
      run(supabase.from("events").insert(seed.events.map(MAPPERS.events.toRow)), "seed events"),
      run(supabase.from("chores").insert(seed.chores.map(MAPPERS.chores.toRow)), "seed chores"),
      run(supabase.from("todos").insert(seed.todos.map(MAPPERS.todos.toRow)), "seed todos"),
      run(supabase.from("grocery").insert(seed.grocery.map(MAPPERS.grocery.toRow)), "seed grocery"),
      run(supabase.from("meals").insert(seed.meals.map(MAPPERS.meals.toRow)), "seed meals"),
      run(supabase.from("photos").upsert(seed.photos.map(MAPPERS.photos.toRow)), "seed photos"),
      run(supabase.from("rewards").upsert(rewardsRows), "seed rewards")
    ]);
    await run(
      supabase.from("settings").upsert({ key: SETTINGS_KEY, value: DEFAULT_SETTINGS }),
      "seed settings"
    );
  })();
  return seedPromise;
}

/**
 * Loads the whole family hub from Supabase, keeps it live via realtime, and
 * exposes optimistic CRUD methods. Falls back to in-memory seed data (no
 * persistence) when Supabase credentials are absent.
 */
export function useFamilyData() {
  const [ready, setReady] = useState(false);
  const [members, setMembers] = useState(FAMILY_MEMBERS);
  const [events, setEvents] = useState([]);
  const [chores, setChores] = useState([]);
  const [todos, setTodos] = useState([]);
  const [grocery, setGrocery] = useState([]);
  const [meals, setMeals] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [rewards, setRewards] = useState({});
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [candidates, setCandidates] = useState([]);

  // Latest-state ref so stable callbacks can read current values without
  // re-creating themselves on every change.
  const stateRef = useRef({});
  stateRef.current = { members, events, chores, todos, grocery, meals, photos, rewards, settings };

  // ---- Initial load + seed ----
  useEffect(() => {
    if (!hasSupabase) {
      // Offline fallback: load the seed once, no persistence.
      const seed = buildSeedData();
      setEvents(seed.events);
      setChores(seed.chores);
      setTodos(seed.todos);
      setGrocery(seed.grocery);
      setMeals(seed.meals);
      setPhotos(seed.photos);
      setRewards(
        FAMILY_MEMBERS.reduce((a, m) => ({ ...a, [m.id]: { redeemedStars: 0, screenMinutes: 0 } }), {})
      );
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      // Seed if the database is empty (use settings row as the sentinel).
      const { data: settingsRow } = await supabase
        .from("settings")
        .select("value")
        .eq("key", SETTINGS_KEY)
        .maybeSingle();
      if (!settingsRow) await seedDatabase();

      const [
        membersRes,
        eventsRes,
        choresRes,
        todosRes,
        groceryRes,
        mealsRes,
        photosRes,
        rewardsRes,
        settingsRes,
        candidatesRes
      ] = await Promise.all([
        supabase.from("family_members").select("*"),
        supabase.from("events").select("*"),
        supabase.from("chores").select("*"),
        supabase.from("todos").select("*"),
        supabase.from("grocery").select("*"),
        supabase.from("meals").select("*").order("day"),
        supabase.from("photos").select("*"),
        supabase.from("rewards").select("*"),
        supabase.from("settings").select("value").eq("key", SETTINGS_KEY).maybeSingle(),
        supabase.from("import_candidates").select("*").eq("status", "pending")
      ]);
      if (cancelled) return;

      const m = (membersRes.data || []).map(MAPPERS.family_members.fromRow);
      setMembers(m.length ? m : FAMILY_MEMBERS);
      setEvents((eventsRes.data || []).map(MAPPERS.events.fromRow));
      setChores((choresRes.data || []).map(MAPPERS.chores.fromRow));
      setTodos((todosRes.data || []).map(MAPPERS.todos.fromRow));
      setGrocery((groceryRes.data || []).map(MAPPERS.grocery.fromRow));
      setMeals((mealsRes.data || []).map(MAPPERS.meals.fromRow));
      setPhotos((photosRes.data || []).map(MAPPERS.photos.fromRow));
      setRewards(rewardsFromRows(rewardsRes.data));
      setSettings(settingsRes.data?.value || DEFAULT_SETTINGS);
      setCandidates((candidatesRes.data || []).map(MAPPERS.import_candidates.fromRow));
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Realtime ----
  useEffect(() => {
    if (!hasSupabase) return;
    const arraySetters = {
      events: [setEvents, MAPPERS.events.fromRow],
      chores: [setChores, MAPPERS.chores.fromRow],
      todos: [setTodos, MAPPERS.todos.fromRow],
      grocery: [setGrocery, MAPPERS.grocery.fromRow],
      meals: [setMeals, MAPPERS.meals.fromRow],
      photos: [setPhotos, MAPPERS.photos.fromRow],
      family_members: [setMembers, MAPPERS.family_members.fromRow]
    };

    const channel = supabase.channel("family-hub");

    for (const [table, [setter, fromRow]] of Object.entries(arraySetters)) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
        if (payload.eventType === "DELETE") {
          setter((prev) => removeFrom(prev, payload.old.id));
        } else {
          setter((prev) => upsertInto(prev, fromRow(payload.new)));
        }
      });
    }

    channel.on("postgres_changes", { event: "*", schema: "public", table: "rewards" }, (payload) => {
      if (payload.eventType === "DELETE") return;
      const r = payload.new;
      setRewards((prev) => ({
        ...prev,
        [r.member_id]: { redeemedStars: r.redeemed_stars ?? 0, screenMinutes: r.screen_minutes ?? 0 }
      }));
    });

    channel.on("postgres_changes", { event: "*", schema: "public", table: "settings" }, (payload) => {
      if (payload.new?.key === SETTINGS_KEY) setSettings(payload.new.value);
    });

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "import_candidates" },
      (payload) => {
        if (payload.eventType === "DELETE") {
          setCandidates((prev) => removeFrom(prev, payload.old.id));
          return;
        }
        const cand = MAPPERS.import_candidates.fromRow(payload.new);
        setCandidates((prev) =>
          cand.status === "pending" ? upsertInto(prev, cand) : removeFrom(prev, cand.id)
        );
      }
    );

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ---- CRUD (optimistic local update + Supabase write) ----
  const persist = hasSupabase;

  const saveEvent = useCallback((evt) => {
    const full = { ...evt, id: evt.id || newId("evt") };
    setEvents((prev) => upsertInto(prev, full));
    if (persist) run(supabase.from("events").upsert(MAPPERS.events.toRow(full)), "save event");
  }, [persist]);

  const deleteEvent = useCallback((id) => {
    setEvents((prev) => removeFrom(prev, id));
    if (persist) run(supabase.from("events").delete().eq("id", id), "delete event");
  }, [persist]);

  const toggleChore = useCallback((id) => {
    const cur = stateRef.current.chores.find((c) => c.id === id);
    if (!cur) return;
    const done = !cur.done;
    setChores((prev) => prev.map((c) => (c.id === id ? { ...c, done } : c)));
    if (persist) run(supabase.from("chores").update({ done }).eq("id", id), "toggle chore");
  }, [persist]);

  const todoApi = {
    add: useCallback((title) => {
      const t = { id: newId("todo"), title, done: false };
      setTodos((prev) => [...prev, t]);
      if (persist) run(supabase.from("todos").insert(MAPPERS.todos.toRow(t)), "add todo");
    }, [persist]),
    toggle: useCallback((id) => {
      const cur = stateRef.current.todos.find((t) => t.id === id);
      if (!cur) return;
      const done = !cur.done;
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
      if (persist) run(supabase.from("todos").update({ done }).eq("id", id), "toggle todo");
    }, [persist]),
    remove: useCallback((id) => {
      setTodos((prev) => removeFrom(prev, id));
      if (persist) run(supabase.from("todos").delete().eq("id", id), "remove todo");
    }, [persist])
  };

  const groceryApi = {
    add: useCallback((name) => {
      const g = { id: newId("groc"), name, qty: "", got: false, source: "" };
      setGrocery((prev) => [...prev, g]);
      if (persist) run(supabase.from("grocery").insert(MAPPERS.grocery.toRow(g)), "add grocery");
    }, [persist]),
    toggle: useCallback((id) => {
      const cur = stateRef.current.grocery.find((g) => g.id === id);
      if (!cur) return;
      const got = !cur.got;
      setGrocery((prev) => prev.map((g) => (g.id === id ? { ...g, got } : g)));
      if (persist) run(supabase.from("grocery").update({ got }).eq("id", id), "toggle grocery");
    }, [persist]),
    remove: useCallback((id) => {
      setGrocery((prev) => removeFrom(prev, id));
      if (persist) run(supabase.from("grocery").delete().eq("id", id), "remove grocery");
    }, [persist])
  };

  // Add a meal's ingredients to grocery (skip names already present).
  const addIngredientsToGrocery = useCallback((ingredients, source) => {
    const have = new Set(stateRef.current.grocery.map((g) => g.name.toLowerCase()));
    const additions = ingredients
      .filter((name) => name && !have.has(name.toLowerCase()))
      .map((name) => ({ id: newId("groc"), name, qty: "", got: false, source }));
    if (!additions.length) return;
    setGrocery((prev) => [...prev, ...additions]);
    if (persist) run(supabase.from("grocery").insert(additions.map(MAPPERS.grocery.toRow)), "add ingredients");
  }, [persist]);

  const editMealSlot = useCallback((day, slotKey, patch) => {
    const cur = stateRef.current.meals.find((m) => m.day === day);
    if (!cur) return;
    const nextSlot = { ...cur[slotKey], ...patch };
    setMeals((prev) => prev.map((m) => (m.day === day ? { ...m, [slotKey]: nextSlot } : m)));
    if (persist)
      run(supabase.from("meals").update({ [slotKey]: nextSlot }).eq("id", cur.id), "edit meal");
  }, [persist]);

  const photoApi = {
    add: useCallback((src, name) => {
      const p = { id: newId("photo"), src, name: name || "Photo", favorite: false };
      setPhotos((prev) => [...prev, p]);
      if (persist) run(supabase.from("photos").insert(MAPPERS.photos.toRow(p)), "add photo");
    }, [persist]),
    remove: useCallback((id) => {
      setPhotos((prev) => removeFrom(prev, id));
      if (persist) run(supabase.from("photos").delete().eq("id", id), "remove photo");
    }, [persist]),
    toggleFavorite: useCallback((id) => {
      const cur = stateRef.current.photos.find((p) => p.id === id);
      if (!cur) return;
      const favorite = !cur.favorite;
      setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, favorite } : p)));
      if (persist) run(supabase.from("photos").update({ favorite }).eq("id", id), "favorite photo");
    }, [persist])
  };

  const redeem = useCallback((memberId) => {
    const earned = stateRef.current.chores
      .filter((c) => c.done && c.memberId === memberId)
      .reduce((sum, c) => sum + c.stars, 0);
    const cur = stateRef.current.rewards[memberId] ?? { redeemedStars: 0, screenMinutes: 0 };
    if (earned - cur.redeemedStars < REWARD_RATE.stars) return;
    const next = {
      redeemedStars: cur.redeemedStars + REWARD_RATE.stars,
      screenMinutes: cur.screenMinutes + REWARD_RATE.minutes
    };
    setRewards((prev) => ({ ...prev, [memberId]: next }));
    if (persist) run(supabase.from("rewards").upsert(rewardToRow(memberId, next)), "redeem");
  }, [persist]);

  const patchSettings = useCallback((patch) => {
    const next = { ...stateRef.current.settings, ...patch };
    setSettings(next);
    if (persist)
      run(supabase.from("settings").upsert({ key: SETTINGS_KEY, value: next }), "save settings");
  }, [persist]);

  // Magic Import: turn a reviewed candidate into a real calendar event.
  const approveCandidate = useCallback((cand) => {
    const evt = {
      id: newId("evt"),
      title: (cand.title || "").trim(),
      memberId: cand.memberId || stateRef.current.members[0]?.id,
      date: cand.date,
      allDay: !cand.start,
      start: cand.start || null,
      end: cand.end || null,
      location: cand.location || "",
      notes: cand.notes || ""
    };
    setEvents((prev) => upsertInto(prev, evt));
    if (persist) run(supabase.from("events").upsert(MAPPERS.events.toRow(evt)), "approve event");
    // If it came from the realtime import queue, mark it approved.
    if (cand.remote && persist) {
      setCandidates((prev) => removeFrom(prev, cand.id));
      run(supabase.from("import_candidates").update({ status: "approved" }).eq("id", cand.id), "approve candidate");
    }
  }, [persist]);

  const rejectCandidate = useCallback((id) => {
    setCandidates((prev) => removeFrom(prev, id));
    if (persist)
      run(supabase.from("import_candidates").update({ status: "rejected" }).eq("id", id), "reject candidate");
  }, [persist]);

  const resetDemo = useCallback(async () => {
    const seed = buildSeedData();
    setEvents(seed.events);
    setChores(seed.chores);
    setTodos(seed.todos);
    setGrocery(seed.grocery);
    setMeals(seed.meals);
    setPhotos(seed.photos);
    const freshRewards = FAMILY_MEMBERS.reduce(
      (a, m) => ({ ...a, [m.id]: { redeemedStars: 0, screenMinutes: 0 } }),
      {}
    );
    setRewards(freshRewards);
    if (!persist) return;
    // Wipe then reseed (delete-all via a never-null filter).
    const tables = ["events", "chores", "todos", "grocery", "meals", "photos"];
    await Promise.all(
      tables.map((t) => supabase.from(t).delete().not("id", "is", null))
    );
    seedPromise = null; // allow a fresh seed
    await seedDatabase();
  }, [persist]);

  return {
    ready,
    members,
    events,
    chores,
    todos,
    grocery,
    meals,
    photos,
    rewards,
    settings,
    candidates,
    api: {
      saveEvent,
      deleteEvent,
      toggleChore,
      todoApi,
      groceryApi,
      addIngredientsToGrocery,
      editMealSlot,
      photoApi,
      redeem,
      patchSettings,
      approveCandidate,
      rejectCandidate,
      resetDemo
    }
  };
}
