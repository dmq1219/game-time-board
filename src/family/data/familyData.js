// Mock data for the family hub prototype.
// Events are seeded relative to "today" so the calendar always looks alive.
// Replace buildSeedData() with a Supabase / Google Calendar fetch later.

import { toISODate, addDays, startOfWeek } from "../utils/calendar";

// Family members, each with a high-contrast colour used everywhere they appear.
export const FAMILY_MEMBERS = [
  { id: "mom", name: "Mom", role: "妈妈", color: "#e0457b", soft: "#fdeaf1" },
  { id: "dad", name: "Dad", role: "爸爸", color: "#2f6fed", soft: "#e7efff" },
  { id: "emma", name: "Emma", role: "姐姐", color: "#11a37f", soft: "#e3f7f1" },
  { id: "liam", name: "Liam", role: "哥哥", color: "#8b5cf6", soft: "#f0ebfe" },
  { id: "noah", name: "Noah", role: "弟弟", color: "#f2900d", soft: "#fff1dc" },
  { id: "zoe", name: "Zoe", role: "妹妹", color: "#0aa6c4", soft: "#e0f6fb" }
];

export const EVENT_COLOR_FALLBACK = "#6b7280";

// 5 stars -> 30 minutes of screen time.
export const REWARD_RATE = { stars: 5, minutes: 30 };

export const DEFAULT_SETTINGS = {
  familyName: "The Riverside Family",
  weather: { tempC: 24, tempF: 75, condition: "Sunny", icon: "sun", city: "Home" },
  screensaverMinutes: 3
};

let seq = 0;
const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

function ev(member, date, start, end, title, location = "") {
  return {
    id: uid("evt"),
    title,
    memberId: member,
    date,
    start,
    end,
    allDay: !start,
    location
  };
}

// Build events anchored to the current week/month.
function buildEvents() {
  const today = new Date();
  const iso = (offset) => toISODate(addDays(today, offset));
  const weekStart = startOfWeek(today);
  const wd = (i) => toISODate(addDays(weekStart, i)); // i = 0 Sun .. 6 Sat

  return [
    // ---- Today ----
    ev("emma", iso(0), "07:30", "08:00", "Swim practice", "City Pool"),
    ev("dad", iso(0), "09:00", "09:30", "Team standup", "Home office"),
    ev("liam", iso(0), "15:30", "16:30", "Soccer training", "Field 3"),
    ev("mom", iso(0), "18:00", "19:00", "Yoga class", "Studio B"),
    ev("noah", iso(0), "16:00", "16:45", "Piano lesson", "Ms. Lee"),
    ev("zoe", iso(0), null, null, "Library books due"),
    ev("emma", iso(0), "19:30", "20:30", "Math homework", "Desk"),

    // ---- Rest of this week ----
    ev("liam", wd(1), "08:00", "14:30", "School field trip", "Science Museum"),
    ev("mom", wd(1), "12:30", "13:30", "Dentist", "Bright Smiles"),
    ev("zoe", wd(2), "16:00", "17:00", "Ballet", "Dance Co."),
    ev("dad", wd(2), "19:00", "21:00", "Basketball", "Rec Center"),
    ev("noah", wd(3), "15:30", "16:15", "Reading club", "Library"),
    ev("emma", wd(4), "17:00", "18:30", "Art class", "Studio A"),
    ev("mom", wd(5), "10:00", "11:00", "Grocery run", "Market"),
    ev("dad", wd(6), "09:00", "12:00", "Garage cleanup", "Home"),
    ev("zoe", wd(6), "14:00", "16:00", "Birthday party", "Mia's house"),

    // ---- Later this month ----
    ev("emma", iso(9), "09:00", "15:00", "Swim meet", "Aquatic Center"),
    ev("liam", iso(12), "18:00", "20:00", "Game night", "Home"),
    ev("mom", iso(14), null, null, "Parent-teacher conference"),
    ev("noah", iso(16), "13:00", "14:00", "Doctor checkup", "Clinic"),
    ev("dad", iso(20), "08:00", "17:00", "Work offsite", "Downtown")
  ];
}

function buildChores() {
  return [
    { id: uid("chore"), title: "Make the bed", memberId: "emma", stars: 1, done: true },
    { id: uid("chore"), title: "Feed the dog", memberId: "liam", stars: 1, done: true },
    { id: uid("chore"), title: "Take out trash", memberId: "noah", stars: 2, done: false },
    { id: uid("chore"), title: "Set the table", memberId: "zoe", stars: 1, done: false },
    { id: uid("chore"), title: "Tidy the playroom", memberId: "liam", stars: 2, done: false },
    { id: uid("chore"), title: "Water the plants", memberId: "emma", stars: 1, done: false },
    { id: uid("chore"), title: "Pack school bag", memberId: "noah", stars: 1, done: true },
    { id: uid("chore"), title: "Put away laundry", memberId: "zoe", stars: 2, done: false }
  ];
}

function buildTodos() {
  return [
    { id: uid("todo"), title: "Sign Emma's permission slip", done: false },
    { id: uid("todo"), title: "Renew library cards", done: false },
    { id: uid("todo"), title: "Book summer camp", done: true },
    { id: uid("todo"), title: "Call grandma", done: false }
  ];
}

function buildGrocery() {
  return [
    { id: uid("groc"), name: "Milk", qty: "2 gal", got: false },
    { id: uid("groc"), name: "Bananas", qty: "1 bunch", got: false },
    { id: uid("groc"), name: "Bread", qty: "2 loaves", got: true },
    { id: uid("groc"), name: "Eggs", qty: "1 dozen", got: false },
    { id: uid("groc"), name: "Chicken", qty: "3 lb", got: false },
    { id: uid("groc"), name: "Apples", qty: "6", got: false }
  ];
}

// A meal slot holds a dish name, free-text notes, and ingredients that can be
// pushed to the grocery list.
const slot = (name = "", ingredients = [], notes = "") => ({ name, notes, ingredients });

function buildMeals() {
  // Breakfast / lunch / dinner per weekday, keyed by weekday index (0 = Sun).
  return [
    {
      day: 0,
      label: "Sun",
      breakfast: slot("Pancakes", ["Flour", "Maple syrup"]),
      lunch: slot("Grilled cheese"),
      dinner: slot("Roast chicken", ["Whole chicken", "Potatoes", "Carrots"])
    },
    {
      day: 1,
      label: "Mon",
      breakfast: slot("Oatmeal & berries", ["Oats", "Blueberries"]),
      lunch: slot("Turkey sandwich"),
      dinner: slot("Spaghetti", ["Pasta", "Tomato sauce", "Ground beef"])
    },
    {
      day: 2,
      label: "Tue",
      breakfast: slot("Yogurt parfait"),
      lunch: slot("Leftover spaghetti"),
      dinner: slot("Taco night", ["Tortillas", "Cheese", "Lettuce", "Salsa"])
    },
    {
      day: 3,
      label: "Wed",
      breakfast: slot("Scrambled eggs", ["Eggs"]),
      lunch: slot("Pasta salad"),
      dinner: slot("Stir-fry & rice", ["Rice", "Broccoli", "Soy sauce"])
    },
    {
      day: 4,
      label: "Thu",
      breakfast: slot("Cereal"),
      lunch: slot("Ham wrap"),
      dinner: slot("Veggie soup", ["Carrots", "Celery", "Onion"])
    },
    {
      day: 5,
      label: "Fri",
      breakfast: slot("Toast & jam"),
      lunch: slot("Mac & cheese"),
      dinner: slot("Homemade pizza", ["Pizza dough", "Mozzarella", "Pepperoni"])
    },
    {
      day: 6,
      label: "Sat",
      breakfast: slot("Waffles", ["Waffle mix"]),
      lunch: slot("Hot dogs"),
      dinner: slot("BBQ burgers", ["Buns", "Ground beef", "Cheddar"])
    }
  ];
}

// Sample photos shipped in /public/photos. BASE_URL keeps paths correct in
// both dev (/) and the built site (./).
const PHOTO_BASE = import.meta.env.BASE_URL;
export const SAMPLE_PHOTOS = [
  { id: "sample-1", src: `${PHOTO_BASE}photos/sample-1.svg`, name: "Sunset Hills", favorite: true, sample: true },
  { id: "sample-2", src: `${PHOTO_BASE}photos/sample-2.svg`, name: "Beach Day", favorite: false, sample: true },
  { id: "sample-3", src: `${PHOTO_BASE}photos/sample-3.svg`, name: "Snow Trip", favorite: false, sample: true },
  { id: "sample-4", src: `${PHOTO_BASE}photos/sample-4.svg`, name: "Park Picnic", favorite: false, sample: true },
  { id: "sample-5", src: `${PHOTO_BASE}photos/sample-5.svg`, name: "Birthday Party", favorite: true, sample: true }
];

function buildPhotos() {
  return SAMPLE_PHOTOS.map((p) => ({ ...p }));
}

// Stars redeemed for screen time, per member (starts at 0).
function buildRewards() {
  return FAMILY_MEMBERS.reduce((acc, m) => {
    acc[m.id] = { redeemedStars: 0, screenMinutes: 0 };
    return acc;
  }, {});
}

export function buildSeedData() {
  return {
    events: buildEvents(),
    chores: buildChores(),
    todos: buildTodos(),
    grocery: buildGrocery(),
    meals: buildMeals(),
    rewards: buildRewards(),
    photos: buildPhotos()
  };
}

export function newId(prefix = "id") {
  return uid(prefix);
}

export function memberById(members, id) {
  return members.find((m) => m.id === id);
}

export function memberColor(members, id) {
  return memberById(members, id)?.color ?? EVENT_COLOR_FALLBACK;
}
