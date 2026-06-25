import React from "react";
import CalendarPanel from "./CalendarPanel";
import MembersToday from "./MembersToday";
import ChoresPanel from "./ChoresPanel";
import TodoPanel from "./TodoPanel";
import GroceryPanel from "./GroceryPanel";
import MealPlanPanel from "./MealPlanPanel";
import RewardsPanel from "./RewardsPanel";

// The kitchen-screen home view: everything visible at a glance.
export default function Dashboard({
  view,
  setView,
  cursor,
  setCursor,
  events,
  members,
  today,
  chores,
  todos,
  grocery,
  meals,
  rewards,
  onEventClick,
  onAddEvent,
  onAddForMember,
  onToggleChore,
  onRedeem,
  todoApi,
  groceryApi,
  onOpenPlanner
}) {
  const tomorrowDow = (today.getDay() + 1) % 7;
  const groceryRemaining = grocery.filter((g) => !g.got).length;

  return (
    <div className="fh-dashboard">
      <div className="fh-main">
        <CalendarPanel
          view={view}
          onViewChange={setView}
          cursor={cursor}
          onCursorChange={setCursor}
          now={today}
          events={events}
          members={members}
          onEventClick={onEventClick}
          onAddEvent={onAddEvent}
        />
        <MembersToday
          date={today}
          members={members}
          events={events}
          onEventClick={onEventClick}
          onAddForMember={onAddForMember}
        />
      </div>

      <div className="fh-bottom">
        <ChoresPanel chores={chores} members={members} onToggle={onToggleChore} />
        <TodoPanel
          todos={todos}
          onToggle={todoApi.toggle}
          onAdd={todoApi.add}
          onRemove={todoApi.remove}
        />
        <GroceryPanel
          grocery={grocery}
          onToggle={groceryApi.toggle}
          onAdd={groceryApi.add}
          onRemove={groceryApi.remove}
        />
        <MealPlanPanel
          meals={meals}
          todayDow={today.getDay()}
          tomorrowDow={tomorrowDow}
          groceryRemaining={groceryRemaining}
          onOpenPlanner={onOpenPlanner}
        />
        <RewardsPanel members={members} chores={chores} rewards={rewards} onRedeem={onRedeem} />
      </div>
    </div>
  );
}
