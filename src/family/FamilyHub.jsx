import React, { useMemo, useState } from "react";
import TopBar from "./components/TopBar";
import Dashboard from "./components/Dashboard";
import MealPlanPage from "./components/MealPlanPage";
import ImportPage from "./components/ImportPage";
import PhotosPage from "./components/PhotosPage";
import EventModal from "./components/EventModal";
import Screensaver from "./components/Screensaver";
import { useClock } from "./hooks/useClock";
import { useIdleScreensaver } from "./hooks/useIdleScreensaver";
import { useFamilyData } from "./hooks/useFamilyData";
import { useWeather } from "./hooks/useWeather";
import { nextEvent } from "./utils/events";

// "09:00" -> "10:00"
function addHour(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const next = (h + 1) % 24;
  return `${String(next).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function FamilyHub() {
  const {
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
    api
  } = useFamilyData();

  const [page, setPage] = useState("dashboard");
  const [view, setView] = useState("today");
  const [cursor, setCursor] = useState(() => new Date());
  const [modal, setModal] = useState(null); // event draft or null

  const now = useClock(1000);
  const weather = useWeather(settings.weather);
  const { idle, wake, sleep } = useIdleScreensaver(settings.screensaverMinutes ?? 3);
  const today = useMemo(() => new Date(), [now.getMinutes()]); // stable within the minute
  const nextEvt = useMemo(() => nextEvent(events, now), [events, now]);

  // ---- Event modal ----
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
    api.saveEvent(evt);
    setModal(null);
  };
  const deleteEvent = (id) => {
    api.deleteEvent(id);
    setModal(null);
  };

  // ---- Kiosk controls ----
  const editFamilyName = () => {
    const next = window.prompt("Family name", settings.familyName);
    if (next && next.trim()) api.patchSettings({ familyName: next.trim() });
  };
  const resetDemo = () => {
    if (!window.confirm("Reset all demo data? This clears your local changes.")) return;
    api.resetDemo();
  };

  if (!ready) {
    return (
      <div className="fh-root">
        <div className="fh-loading">Loading family hub…</div>
      </div>
    );
  }

  if (idle) {
    return (
      <Screensaver now={now} photos={photos} members={members} nextEvt={nextEvt} onWake={wake} />
    );
  }

  return (
    <div className="fh-root">
      <div className="fh-app">
        <TopBar
          now={now}
          familyName={settings.familyName}
          weather={weather}
          nextEvt={nextEvt}
          members={members}
          page={page}
          onChangePage={setPage}
          importCount={candidates.length}
          onRename={editFamilyName}
          onPhotoMode={sleep}
          onReset={resetDemo}
          onAddForMember={openAddForMember}
        />

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
            onToggleChore={api.toggleChore}
            onRedeem={api.redeem}
            todoApi={api.todoApi}
            groceryApi={api.groceryApi}
            onOpenPlanner={() => setPage("meals")}
          />
        )}

        {page === "meals" && (
          <MealPlanPage
            meals={meals}
            grocery={grocery}
            onEditSlot={api.editMealSlot}
            onAddIngredients={api.addIngredientsToGrocery}
            groceryApi={api.groceryApi}
          />
        )}

        {page === "import" && (
          <ImportPage
            members={members}
            events={events}
            candidates={candidates}
            onApprove={api.approveCandidate}
            onReject={api.rejectCandidate}
          />
        )}

        {page === "photos" && (
          <PhotosPage
            photos={photos}
            onAdd={api.photoApi.add}
            onDelete={api.photoApi.remove}
            onToggleFavorite={api.photoApi.toggleFavorite}
            onStartScreensaver={sleep}
          />
        )}

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
