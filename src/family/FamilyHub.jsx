import React, { useMemo, useState } from "react";
import TopBar from "./components/TopBar";
import AppNav from "./components/AppNav";
import Dashboard from "./components/Dashboard";
import MealPlanPage from "./components/MealPlanPage";
import ImportPage from "./components/ImportPage";
import PhotosPage from "./components/PhotosPage";
import EventModal from "./components/EventModal";
import Screensaver from "./components/Screensaver";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useClock } from "./hooks/useClock";
import { useIdleScreensaver } from "./hooks/useIdleScreensaver";
import { nextEvent } from "./utils/events";
import {
  FAMILY_MEMBERS,
  DEFAULT_SETTINGS,
  REWARD_RATE,
  buildSeedData,
  newId
} from "./data/familyData";

// "09:00" -> "10:00"
function addHour(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const next = (h + 1) % 24;
  return `${String(next).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function FamilyHub() {
  const seed = useMemo(() => buildSeedData(), []);

  const [members] = useLocalStorage("familyHub.members", FAMILY_MEMBERS);
  const [events, setEvents] = useLocalStorage("familyHub.events", seed.events);
  const [chores, setChores] = useLocalStorage("familyHub.chores", seed.chores);
  const [todos, setTodos] = useLocalStorage("familyHub.todos", seed.todos);
  const [grocery, setGrocery] = useLocalStorage("familyHub.grocery", seed.grocery);
  const [meals, setMeals] = useLocalStorage("familyHub.meals.v2", seed.meals);
  const [rewards, setRewards] = useLocalStorage("familyHub.rewards", seed.rewards);
  const [photos, setPhotos] = useLocalStorage("familyHub.photos", seed.photos);
  const [settings, setSettings] = useLocalStorage("familyHub.settings", DEFAULT_SETTINGS);

  const [page, setPage] = useState("dashboard");
  const [view, setView] = useState("today");
  const [cursor, setCursor] = useState(() => new Date());
  const [modal, setModal] = useState(null); // event draft or null

  const now = useClock(1000);
  const { idle, wake, sleep } = useIdleScreensaver(settings.screensaverMinutes ?? 3);
  const today = useMemo(() => new Date(), [now.getMinutes()]); // stable within the minute
  const nextEvt = useMemo(() => nextEvent(events, now), [events, now]);

  // ---- Event handlers ----
  const openAdd = (prefill = {}) =>
    setModal({
      memberId: members[0]?.id,
      allDay: false,
      end: prefill.start ? addHour(prefill.start) : "10:00",
      ...prefill
    });

  const openAddForMember = (memberId, dateKey) =>
    setModal({ memberId, date: dateKey, start: "09:00", end: "10:00", allDay: false });

  const saveEvent = (evt) => {
    setEvents((list) => {
      if (evt.id) return list.map((e) => (e.id === evt.id ? evt : e));
      return [...list, { ...evt, id: newId("evt") }];
    });
    setModal(null);
  };

  const deleteEvent = (id) => {
    setEvents((list) => list.filter((e) => e.id !== id));
    setModal(null);
  };

  // Magic Import: approve a reviewed candidate into the real calendar.
  const approveCandidate = (cand) => {
    setEvents((list) => [
      ...list,
      {
        id: newId("evt"),
        title: cand.title.trim(),
        memberId: cand.memberId || members[0]?.id,
        date: cand.date,
        allDay: !cand.start,
        start: cand.start || null,
        end: cand.end || null,
        location: cand.location || "",
        notes: cand.notes || ""
      }
    ]);
  };

  // ---- Chores / lists ----
  const toggleChore = (id) =>
    setChores((list) => list.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));

  const todoApi = {
    toggle: (id) => setTodos((l) => l.map((t) => (t.id === id ? { ...t, done: !t.done } : t))),
    add: (title) => setTodos((l) => [...l, { id: newId("todo"), title, done: false }]),
    remove: (id) => setTodos((l) => l.filter((t) => t.id !== id))
  };

  const groceryApi = {
    toggle: (id) => setGrocery((l) => l.map((g) => (g.id === id ? { ...g, got: !g.got } : g))),
    add: (name) => setGrocery((l) => [...l, { id: newId("groc"), name, qty: "", got: false }]),
    remove: (id) => setGrocery((l) => l.filter((g) => g.id !== id))
  };

  // ---- Meals ----
  const editMealSlot = (day, slotKey, patch) =>
    setMeals((list) =>
      list.map((m) => (m.day === day ? { ...m, [slotKey]: { ...m[slotKey], ...patch } } : m))
    );

  // Add a meal's ingredients to the grocery list (skip names already present).
  const addIngredientsToGrocery = (ingredients, source) =>
    setGrocery((list) => {
      const have = new Set(list.map((g) => g.name.toLowerCase()));
      const additions = ingredients
        .filter((name) => !have.has(name.toLowerCase()))
        .map((name) => ({ id: newId("groc"), name, qty: "", got: false, source }));
      return [...list, ...additions];
    });

  // ---- Photos ----
  const photoApi = {
    add: (src, name) =>
      setPhotos((l) => [...l, { id: newId("photo"), src, name: name || "Photo", favorite: false }]),
    remove: (id) => setPhotos((l) => l.filter((p) => p.id !== id)),
    toggleFavorite: (id) =>
      setPhotos((l) => l.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)))
  };

  // ---- Rewards: stars (from chores) -> screen time ----
  const redeem = (memberId) => {
    const earned = chores
      .filter((c) => c.done && c.memberId === memberId)
      .reduce((sum, c) => sum + c.stars, 0);
    setRewards((r) => {
      const cur = r[memberId] ?? { redeemedStars: 0, screenMinutes: 0 };
      if (earned - cur.redeemedStars < REWARD_RATE.stars) return r;
      return {
        ...r,
        [memberId]: {
          redeemedStars: cur.redeemedStars + REWARD_RATE.stars,
          screenMinutes: cur.screenMinutes + REWARD_RATE.minutes
        }
      };
    });
  };

  // ---- Kiosk controls ----
  const editFamilyName = () => {
    const next = window.prompt("Family name", settings.familyName);
    if (next && next.trim()) setSettings((s) => ({ ...s, familyName: next.trim() }));
  };
  const resetDemo = () => {
    if (!window.confirm("Reset all demo data? This clears your local changes.")) return;
    const fresh = buildSeedData();
    setEvents(fresh.events);
    setChores(fresh.chores);
    setTodos(fresh.todos);
    setGrocery(fresh.grocery);
    setMeals(fresh.meals);
    setRewards(fresh.rewards);
    setPhotos(fresh.photos);
  };

  if (idle) {
    return (
      <Screensaver now={now} photos={photos} members={members} nextEvt={nextEvt} onWake={wake} />
    );
  }

  return (
    <div className="fh-root">
      <div className="fh-app">
        <TopBar now={now} familyName={settings.familyName} weather={settings.weather} />
        <AppNav page={page} onChange={setPage} nextEvt={nextEvt} members={members} />

        {page === "dashboard" && (
          <Dashboard
            view={view}
            setView={setView}
            cursor={cursor}
            setCursor={setCursor}
            events={events}
            members={members}
            today={today}
            chores={chores}
            todos={todos}
            grocery={grocery}
            meals={meals}
            rewards={rewards}
            onEventClick={(e) => setModal(e)}
            onAddEvent={openAdd}
            onAddForMember={openAddForMember}
            onToggleChore={toggleChore}
            onRedeem={redeem}
            todoApi={todoApi}
            groceryApi={groceryApi}
            onOpenPlanner={() => setPage("meals")}
          />
        )}

        {page === "meals" && (
          <MealPlanPage
            meals={meals}
            grocery={grocery}
            onEditSlot={editMealSlot}
            onAddIngredients={addIngredientsToGrocery}
            groceryApi={groceryApi}
          />
        )}

        {page === "import" && (
          <ImportPage members={members} events={events} onApprove={approveCandidate} />
        )}

        {page === "photos" && (
          <PhotosPage
            photos={photos}
            onAdd={photoApi.add}
            onDelete={photoApi.remove}
            onToggleFavorite={photoApi.toggleFavorite}
            onStartScreensaver={sleep}
          />
        )}

        <footer className="fh-footer">
          <span>Mock data · localStorage · 原型演示</span>
          <div className="fh-footer-actions">
            <button type="button" onClick={editFamilyName}>
              Rename family
            </button>
            <button type="button" onClick={sleep}>
              Photo mode
            </button>
            <button type="button" onClick={resetDemo}>
              Reset demo
            </button>
          </div>
        </footer>
      </div>

      {modal && (
        <EventModal
          draft={modal}
          members={members}
          onSave={saveEvent}
          onDelete={deleteEvent}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
