import React, { useMemo, useState } from "react";
import TopBar from "./components/TopBar";
import CalendarPanel from "./components/CalendarPanel";
import MembersToday from "./components/MembersToday";
import ChoresPanel from "./components/ChoresPanel";
import TodoPanel from "./components/TodoPanel";
import GroceryPanel from "./components/GroceryPanel";
import MealPlanPanel from "./components/MealPlanPanel";
import RewardsPanel from "./components/RewardsPanel";
import EventModal from "./components/EventModal";
import Screensaver from "./components/Screensaver";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useClock } from "./hooks/useClock";
import { useIdleScreensaver } from "./hooks/useIdleScreensaver";
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
  const [meals, setMeals] = useLocalStorage("familyHub.meals", seed.meals);
  const [rewards, setRewards] = useLocalStorage("familyHub.rewards", seed.rewards);
  const [settings, setSettings] = useLocalStorage("familyHub.settings", DEFAULT_SETTINGS);

  const [view, setView] = useState("today");
  const [cursor, setCursor] = useState(() => new Date());
  const [modal, setModal] = useState(null); // event draft or null

  const now = useClock(1000);
  const { idle, wake, sleep } = useIdleScreensaver(settings.screensaverMinutes ?? 3);
  const today = useMemo(() => new Date(), [now.getMinutes()]); // stable within the minute

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

  // ---- Chores / lists ----
  const toggleChore = (id) =>
    setChores((list) => list.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));

  const toggleTodo = (id) =>
    setTodos((list) => list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const addTodo = (title) => setTodos((list) => [...list, { id: newId("todo"), title, done: false }]);
  const removeTodo = (id) => setTodos((list) => list.filter((t) => t.id !== id));

  const toggleGrocery = (id) =>
    setGrocery((list) => list.map((g) => (g.id === id ? { ...g, got: !g.got } : g)));
  const addGrocery = (name) =>
    setGrocery((list) => [...list, { id: newId("groc"), name, qty: "", got: false }]);
  const removeGrocery = (id) => setGrocery((list) => list.filter((g) => g.id !== id));

  const editMeal = (day, meal) =>
    setMeals((list) => list.map((m) => (m.day === day ? { ...m, meal } : m)));

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
  };

  if (idle) {
    return <Screensaver now={now} onWake={wake} />;
  }

  return (
    <div className="fh-root">
      <div className="fh-app">
        <TopBar now={now} familyName={settings.familyName} weather={settings.weather} />

        <div className="fh-main">
          <CalendarPanel
            view={view}
            onViewChange={setView}
            cursor={cursor}
            onCursorChange={setCursor}
            events={events}
            members={members}
            onEventClick={(e) => setModal(e)}
            onAddEvent={openAdd}
          />
          <MembersToday
            date={today}
            members={members}
            events={events}
            onEventClick={(e) => setModal(e)}
            onAddForMember={openAddForMember}
          />
        </div>

        <div className="fh-bottom">
          <ChoresPanel chores={chores} members={members} onToggle={toggleChore} />
          <TodoPanel todos={todos} onToggle={toggleTodo} onAdd={addTodo} onRemove={removeTodo} />
          <GroceryPanel
            grocery={grocery}
            onToggle={toggleGrocery}
            onAdd={addGrocery}
            onRemove={removeGrocery}
          />
          <MealPlanPanel meals={meals} todayDow={today.getDay()} onEdit={editMeal} />
          <RewardsPanel members={members} chores={chores} rewards={rewards} onRedeem={redeem} />
        </div>

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
