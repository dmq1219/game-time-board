import React, { useState } from "react";
import GroceryPanel from "./GroceryPanel";

const SLOTS = [
  { key: "breakfast", label: "Breakfast", cn: "早餐", icon: "🥞" },
  { key: "lunch", label: "Lunch", cn: "午餐", icon: "🥪" },
  { key: "dinner", label: "Dinner", cn: "晚餐", icon: "🍲" }
];

// Inline editor for one meal slot: name, notes, ingredients -> shopping list.
function SlotEditor({ day, slot, value, onSave, onAddIngredients, onClose }) {
  const [name, setName] = useState(value.name || "");
  const [notes, setNotes] = useState(value.notes || "");
  const [ingredients, setIngredients] = useState(value.ingredients || []);
  const [draft, setDraft] = useState("");

  const addIngredient = () => {
    const v = draft.trim();
    if (!v) return;
    if (!ingredients.some((i) => i.toLowerCase() === v.toLowerCase())) {
      setIngredients([...ingredients, v]);
    }
    setDraft("");
  };

  const save = () => {
    onSave(day.day, slot.key, { name: name.trim(), notes: notes.trim(), ingredients });
    onClose();
  };

  return (
    <div className="fh-modal-backdrop" onClick={onClose}>
      <div className="fh-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="fh-modal-head">
          <h3>
            {day.label} · {slot.label} {slot.icon}
          </h3>
          <button type="button" className="fh-modal-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="fh-modal-body">
          <label className="fh-field">
            <span>Dish 菜名</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spaghetti" autoFocus />
          </label>
          <label className="fh-field">
            <span>Notes 备注</span>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </label>
          <div className="fh-field">
            <span>Ingredients 食材</span>
            <div className="fh-ingredient-chips">
              {ingredients.map((ing) => (
                <span key={ing} className="fh-ingredient">
                  {ing}
                  <button
                    type="button"
                    onClick={() => setIngredients(ingredients.filter((x) => x !== ing))}
                    aria-label={`Remove ${ing}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {ingredients.length === 0 && <em className="fh-muted">None yet</em>}
            </div>
            <div className="fh-add-row">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIngredient())}
                placeholder="Add ingredient…"
              />
              <button type="button" className="fh-mini-btn" onClick={addIngredient}>
                Add
              </button>
            </div>
          </div>

          <div className="fh-modal-actions">
            <button
              type="button"
              className="fh-btn-ghost"
              disabled={ingredients.length === 0}
              onClick={() => {
                onAddIngredients(ingredients, `${day.label} · ${slot.label}`);
              }}
            >
              🛒 Add to shopping list
            </button>
            <div className="fh-modal-actions-right">
              <button type="button" className="fh-btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="fh-btn-primary" onClick={save}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MealPlanPage({ meals, grocery, onEditSlot, onAddIngredients, groceryApi }) {
  const [editing, setEditing] = useState(null); // { day, slot }

  return (
    <div className="fh-page fh-meal-page">
      <div className="fh-meal-grid-wrap">
        <h2 className="fh-page-title">Meal Plan · 本周餐食</h2>
        <div className="fh-meal-grid">
          {meals.map((day) => (
            <div key={day.day} className="fh-meal-day-card">
              <div className="fh-meal-day-head">{day.label}</div>
              {SLOTS.map((slot) => {
                const value = day[slot.key] || { name: "", ingredients: [] };
                return (
                  <button
                    key={slot.key}
                    type="button"
                    className="fh-meal-slot"
                    onClick={() => setEditing({ day, slot })}
                  >
                    <span className="fh-meal-slot-label">
                      {slot.icon} {slot.label}
                    </span>
                    <span className="fh-meal-slot-name">{value.name || "Tap to plan…"}</span>
                    {value.ingredients?.length > 0 && (
                      <span className="fh-meal-slot-ing">🛒 {value.ingredients.length}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="fh-meal-grocery">
        <GroceryPanel
          grocery={grocery}
          onToggle={groceryApi.toggle}
          onAdd={groceryApi.add}
          onRemove={groceryApi.remove}
        />
      </div>

      {editing && (
        <SlotEditor
          day={editing.day}
          slot={editing.slot}
          value={editing.day[editing.slot.key] || { name: "", notes: "", ingredients: [] }}
          onSave={onEditSlot}
          onAddIngredients={onAddIngredients}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
