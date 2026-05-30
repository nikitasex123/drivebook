const STORAGE_KEY = "drivingLessonBookings";
const SETTINGS_KEY = "drivingLessonSettings";
const INSTRUCTORS_KEY = "drivingLessonInstructors";
const INSTRUCTOR_SESSION_KEY = "driveBookInstructorSession";
const ANY_INSTRUCTOR_ID = "any";
const INTERNAL_TEST_INSTRUCTOR_IDS = new Set(["codex-test-instructor"]);
const DAY_COUNT = 7;
const DRAWER_TRANSITION_MS = 300;
const DEFAULT_SETTINGS = {
  workDays: [1, 2, 3, 4, 5, 6],
  startTime: "09:00",
  endTime: "18:00",
  lessonDuration: 60,
  breakStart: "",
  breakEnd: "",
  minAdvanceHours: 2,
  blockedDates: [],
};
const DEFAULT_NOTIFICATIONS = {
  email: true,
  whatsapp: false,
  telegram: false,
  reminderHours: 24,
};
const WEEKDAY_NAMES = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const SUPABASE_CONFIG = window.DRIVEBOOK_SUPABASE ?? {};
const supabaseClient = SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey && window.supabase
  ? window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
  : null;
const isSupabaseEnabled = Boolean(supabaseClient);

const state = {
  activeDate: null,
  selectedSlot: null,
  selectedInstructorId: ANY_INSTRUCTOR_ID,
  editingId: null,
  calendarStart: getStartOfWeek(new Date()),
  bookings: loadBookings(),
  instructors: loadInstructors(),
  currentInstructorId: localStorage.getItem(INSTRUCTOR_SESSION_KEY),
};

const roleView = document.querySelector("#roleView");
const studentEntry = document.querySelector("#studentEntry");
const instructorEntry = document.querySelector("#instructorEntry");
const instructorLoginView = document.querySelector("#instructorLoginView");
const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const showRegister = document.querySelector("#showRegister");
const showLogin = document.querySelector("#showLogin");
const loginNote = document.querySelector("#loginNote");
const registerNote = document.querySelector("#registerNote");
const instructorShell = document.querySelector("#instructorShell");
const currentInstructorName = document.querySelector("#currentInstructorName");
const logoutInstructor = document.querySelector("#logoutInstructor");
const backHomeButtons = document.querySelectorAll("[data-back-home]");
const bookingView = document.querySelector("#bookingView");
const studentInstructorFilter = document.querySelector("#studentInstructorFilter");
const dayTabs = document.querySelector("#dayTabs");
const slotGrid = document.querySelector("#slotGrid");
const bookingDrawer = document.querySelector("#bookingDrawer");
const bookingForm = document.querySelector("#bookingForm");
const closeBooking = document.querySelector("#closeBooking");
const cancelBooking = document.querySelector("#cancelBooking");
const bookingSuccess = document.querySelector("#bookingSuccess");
const selectedSlot = document.querySelector("#selectedSlot");
const bookingList = document.querySelector("#bookingList");
const formNote = document.querySelector("#formNote");
const adminNote = document.querySelector("#adminNote");
const exportCsv = document.querySelector("#exportCsv");
const clearDemo = document.querySelector("#clearDemo");
const adminView = document.querySelector("#adminView");
const calendarView = document.querySelector("#calendarView");
const analyticsView = document.querySelector("#analyticsView");
const settingsView = document.querySelector("#settingsView");
const notificationList = document.querySelector("#notificationList");
const calendarWeekLabel = document.querySelector("#calendarWeekLabel");
const calendarGrid = document.querySelector("#calendarGrid");
const analyticsCards = document.querySelector("#analyticsCards");
const analyticsBars = document.querySelector("#analyticsBars");
const prevWeek = document.querySelector("#prevWeek");
const todayWeek = document.querySelector("#todayWeek");
const nextWeek = document.querySelector("#nextWeek");
const settingsForm = document.querySelector("#settingsForm");
const settingsSummary = document.querySelector("#settingsSummary");
const settingsNote = document.querySelector("#settingsNote");
const resetSettings = document.querySelector("#resetSettings");
const addBlockedDate = document.querySelector("#addBlockedDate");
const blockedDateList = document.querySelector("#blockedDateList");
const editDrawer = document.querySelector("#editDrawer");
const bookingEditForm = document.querySelector("#bookingEditForm");
const cancelEdit = document.querySelector("#cancelEdit");
const closeEdit = document.querySelector("#closeEdit");
const editNote = document.querySelector("#editNote");
const viewButtons = document.querySelectorAll("[data-view]");

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  weekday: "short",
});

const shortDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
});

const fullDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  weekday: "long",
});

const compactDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
});

function loadBookings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function loadLegacySettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    return normalizeSettings(saved);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function loadInstructors() {
  try {
    const saved = JSON.parse(localStorage.getItem(INSTRUCTORS_KEY)) ?? [];
    return saved.map(normalizeInstructor).filter(isVisibleInstructor);
  } catch {
    return [];
  }
}

function isVisibleInstructor(instructor) {
  return Boolean(instructor) && !INTERNAL_TEST_INSTRUCTOR_IDS.has(instructor.id);
}

function saveBookings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookings));
  return syncBookingsToSupabase();
}

function saveInstructors() {
  localStorage.setItem(INSTRUCTORS_KEY, JSON.stringify(state.instructors));
  return syncInstructorsToSupabase();
}

function mapInstructorFromRow(row) {
  return normalizeInstructor({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    patronymic: row.patronymic,
    phone: row.phone,
    email: row.email,
    login: row.login,
    password: row.password,
    schedule: row.schedule,
    notifications: row.notifications,
    createdAt: row.created_at,
  });
}

function mapInstructorToRow(instructor) {
  return {
    id: instructor.id,
    first_name: instructor.firstName,
    last_name: instructor.lastName,
    patronymic: instructor.patronymic,
    phone: instructor.phone,
    email: instructor.email,
    login: instructor.login,
    password: instructor.password,
    schedule: instructor.schedule,
    notifications: instructor.notifications,
    created_at: instructor.createdAt,
  };
}

function normalizeBooking(booking) {
  return {
    id: String(booking.id ?? createId("booking")),
    date: String(booking.date ?? "").slice(0, 10),
    time: String(booking.time ?? "").slice(0, 5),
    name: String(booking.name ?? "").trim(),
    phone: String(booking.phone ?? "").trim(),
    email: String(booking.email ?? "").trim(),
    instructorId: booking.instructorId ?? booking.instructor_id ?? "",
    instructorName: booking.instructorName ?? booking.instructor_name ?? booking.instructor ?? "Инструктор не назначен",
    instructor: booking.instructor ?? booking.instructorName ?? booking.instructor_name ?? "Инструктор не назначен",
    comment: String(booking.comment ?? "").trim(),
    mailing: Boolean(booking.mailing),
    createdAt: booking.createdAt ?? booking.created_at ?? new Date().toISOString(),
    updatedAt: booking.updatedAt ?? booking.updated_at ?? null,
  };
}

function mapBookingFromRow(row) {
  return normalizeBooking({
    id: row.id,
    date: row.lesson_date,
    time: row.lesson_time,
    name: row.student_name,
    phone: row.phone,
    email: row.email,
    instructorId: row.instructor_id,
    instructorName: row.instructor_name,
    instructor: row.instructor_name,
    comment: row.comment,
    mailing: row.mailing,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function mapBookingToRow(booking) {
  const normalized = normalizeBooking(booking);
  return {
    id: normalized.id,
    lesson_date: normalized.date,
    lesson_time: normalized.time,
    student_name: normalized.name,
    phone: normalized.phone,
    email: normalized.email,
    instructor_id: normalized.instructorId,
    instructor_name: normalized.instructorName,
    comment: normalized.comment,
    mailing: normalized.mailing,
    created_at: normalized.createdAt,
    updated_at: normalized.updatedAt,
  };
}

async function loadSupabaseState() {
  if (!isSupabaseEnabled) {
    return;
  }

  try {
    const localInstructors = [...state.instructors];
    const localBookings = [...state.bookings];
    const [instructorsResult, bookingsResult] = await Promise.all([
      supabaseClient.from("instructors").select("*").order("created_at", { ascending: true }),
      supabaseClient.from("bookings").select("*").order("lesson_date", { ascending: true }).order("lesson_time", { ascending: true }),
    ]);

    if (instructorsResult.error) throw instructorsResult.error;
    if (bookingsResult.error) throw bookingsResult.error;

    const remoteInstructors = instructorsResult.data.map(mapInstructorFromRow).filter(isVisibleInstructor);
    const remoteBookings = bookingsResult.data
      .map(mapBookingFromRow)
      .filter((booking) => !INTERNAL_TEST_INSTRUCTOR_IDS.has(booking.instructorId));

    if (remoteInstructors.length === 0 && localInstructors.length > 0) {
      state.instructors = localInstructors;
      state.bookings = localBookings;
      await Promise.all([
        syncInstructorsToSupabase(),
        syncBookingsToSupabase(),
      ]);
    } else {
      state.instructors = remoteInstructors;
      state.bookings = remoteBookings;
    }

    localStorage.setItem(INSTRUCTORS_KEY, JSON.stringify(state.instructors));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookings));

    if (state.currentInstructorId && !getCurrentInstructor()) {
      setInstructorSession(null);
    }
  } catch (error) {
    console.error("Supabase load failed", error);
  }
}

async function syncInstructorsToSupabase() {
  const instructorsToSync = state.instructors.filter(isVisibleInstructor);

  if (!isSupabaseEnabled || instructorsToSync.length === 0) {
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("instructors")
      .upsert(instructorsToSync.map(mapInstructorToRow), { onConflict: "id" });

    if (error) throw error;
  } catch (error) {
    console.error("Supabase instructors sync failed", error);
  }
}

async function syncBookingsToSupabase() {
  if (!isSupabaseEnabled || state.bookings.length === 0) {
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("bookings")
      .upsert(state.bookings.map(mapBookingToRow), { onConflict: "id" });

    if (error) throw error;
  } catch (error) {
    console.error("Supabase bookings sync failed", error);
  }
}

async function deleteBookingFromSupabase(id) {
  if (!isSupabaseEnabled) {
    return;
  }

  try {
    const { error } = await supabaseClient.from("bookings").delete().eq("id", id);
    if (error) throw error;
  } catch (error) {
    console.error("Supabase booking delete failed", error);
  }
}

async function deleteInstructorBookingsFromSupabase(instructorId) {
  if (!isSupabaseEnabled) {
    return;
  }

  try {
    const { error } = await supabaseClient.from("bookings").delete().eq("instructor_id", instructorId);
    if (error) throw error;
  } catch (error) {
    console.error("Supabase instructor bookings clear failed", error);
  }
}

function normalizeSettings(settings) {
  const next = {
    ...DEFAULT_SETTINGS,
    ...(settings ?? {}),
  };

  next.workDays = Array.isArray(next.workDays)
    ? next.workDays.map(Number).filter((day) => day >= 0 && day <= 6)
    : DEFAULT_SETTINGS.workDays;

  if (next.workDays.length === 0) {
    next.workDays = DEFAULT_SETTINGS.workDays;
  }

  next.lessonDuration = Number(next.lessonDuration) || DEFAULT_SETTINGS.lessonDuration;
  next.breakStart = isValidTime(next.breakStart) ? next.breakStart : "";
  next.breakEnd = isValidTime(next.breakEnd) ? next.breakEnd : "";

  if (next.breakStart && next.breakEnd && timeToMinutes(next.breakStart) >= timeToMinutes(next.breakEnd)) {
    next.breakStart = "";
    next.breakEnd = "";
  }

  next.minAdvanceHours = Number(next.minAdvanceHours);
  if (!Number.isFinite(next.minAdvanceHours) || next.minAdvanceHours < 0) {
    next.minAdvanceHours = DEFAULT_SETTINGS.minAdvanceHours;
  }
  next.blockedDates = normalizeBlockedDates(next.blockedDates);
  return next;
}

function normalizeBlockedDates(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  const seen = new Set();
  return items
    .map((item) => {
      const date = String(item?.date ?? "").trim();
      if (!isDateKey(date) || seen.has(date)) {
        return null;
      }

      seen.add(date);
      return {
        id: String(item.id ?? createId("blocked")),
        date,
        reason: String(item.reason ?? "").trim(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function normalizeNotifications(notifications) {
  const next = {
    ...DEFAULT_NOTIFICATIONS,
    ...(notifications ?? {}),
  };

  next.email = Boolean(next.email);
  next.whatsapp = Boolean(next.whatsapp);
  next.telegram = Boolean(next.telegram);
  next.reminderHours = Number(next.reminderHours) || DEFAULT_NOTIFICATIONS.reminderHours;
  return next;
}

function isValidTime(value) {
  return /^\d{2}:\d{2}$/.test(String(value ?? ""));
}

function isDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""));
}

function normalizeLogin(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeInstructor(instructor) {
  if (!instructor || typeof instructor !== "object") {
    return null;
  }

  const login = normalizeLogin(instructor.login);
  const firstName = String(instructor.firstName ?? "").trim();
  const lastName = String(instructor.lastName ?? "").trim();

  if (!login || !firstName || !lastName) {
    return null;
  }

  return {
    id: String(instructor.id ?? createId("instructor")),
    firstName,
    lastName,
    patronymic: String(instructor.patronymic ?? "").trim(),
    phone: String(instructor.phone ?? "").trim(),
    email: String(instructor.email ?? "").trim(),
    login,
    password: String(instructor.password ?? ""),
    schedule: normalizeSettings(instructor.schedule),
    notifications: normalizeNotifications(instructor.notifications),
    createdAt: instructor.createdAt ?? new Date().toISOString(),
  };
}

function hasInstructorSession() {
  return Boolean(getCurrentInstructor());
}

function setInstructorSession(instructorId) {
  state.currentInstructorId = instructorId || null;

  if (instructorId) {
    localStorage.setItem(INSTRUCTOR_SESSION_KEY, instructorId);
    return;
  }

  localStorage.removeItem(INSTRUCTOR_SESSION_KEY);
}

function getCurrentInstructor() {
  return state.instructors.find((instructor) => instructor.id === state.currentInstructorId) ?? null;
}

function getInstructorById(instructorId) {
  return state.instructors.find((instructor) => instructor.id === instructorId) ?? null;
}

function getInstructorByLogin(login) {
  const normalizedLogin = normalizeLogin(login);
  return state.instructors.find((instructor) => instructor.login === normalizedLogin) ?? null;
}

function getInstructorName(instructor) {
  if (!instructor) {
    return "Инструктор не назначен";
  }

  return [instructor.lastName, instructor.firstName, instructor.patronymic]
    .filter(Boolean)
    .join(" ");
}

function getBookingInstructorId(booking) {
  if (booking.instructorId) {
    return booking.instructorId;
  }

  const legacyName = booking.instructorName ?? booking.instructor;
  const matchedInstructor = state.instructors.find((instructor) => getInstructorName(instructor) === legacyName);
  return matchedInstructor?.id ?? null;
}

function getBookingInstructorName(booking) {
  const instructor = getInstructorById(getBookingInstructorId(booking));
  return booking.instructorName ?? (instructor ? getInstructorName(instructor) : booking.instructor) ?? "Инструктор не назначен";
}

function getCurrentInstructorBookings() {
  const currentInstructor = getCurrentInstructor();
  if (!currentInstructor) {
    return [];
  }

  return state.bookings.filter((booking) => getBookingInstructorId(booking) === currentInstructor.id);
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateFromKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(date.getDate() + amount);
  return next;
}

function getStartOfWeek(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  const offset = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - offset);
  return next;
}

function getBookingStartDate(dateKey, time) {
  const date = getDateFromKey(dateKey);
  const [hours, minutes] = time.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function getBlockedDate(settings, dateKey) {
  return normalizeSettings(settings).blockedDates.find((item) => item.date === dateKey) ?? null;
}

function getStudentInstructorCandidates() {
  if (state.selectedInstructorId === ANY_INSTRUCTOR_ID) {
    return state.instructors;
  }

  return [getInstructorById(state.selectedInstructorId)].filter(Boolean);
}

function getDays() {
  const days = [];
  const date = new Date();
  let offset = 0;

  while (days.length < DAY_COUNT && offset < 60) {
    const candidate = new Date(date);
    candidate.setDate(date.getDate() + offset);
    offset += 1;

    const dateKey = toDateKey(candidate);
    if (getStudentInstructorCandidates().some((instructor) => getAvailableTimesForInstructor(instructor, dateKey).length > 0)) {
      days.push(candidate);
    }
  }

  return days;
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value) {
  const hours = String(Math.floor(value / 60)).padStart(2, "0");
  const minutes = String(value % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getWorkHours(settings) {
  const schedule = normalizeSettings(settings);
  const start = timeToMinutes(schedule.startTime);
  const end = timeToMinutes(schedule.endTime);
  const duration = schedule.lessonDuration;
  const slots = [];

  for (let time = start; time + duration <= end; time += duration) {
    const slotEnd = time + duration;
    if (!isSlotOverlappingBreak(schedule, time, slotEnd)) {
      slots.push(minutesToTime(time));
    }
  }

  return slots;
}

function isSlotOverlappingBreak(settings, slotStart, slotEnd) {
  if (!settings.breakStart || !settings.breakEnd) {
    return false;
  }

  const breakStart = timeToMinutes(settings.breakStart);
  const breakEnd = timeToMinutes(settings.breakEnd);
  return slotStart < breakEnd && slotEnd > breakStart;
}

function isInstructorWorkingOnDate(instructor, dateKey) {
  if (getBlockedDate(instructor.schedule, dateKey)) {
    return false;
  }

  const date = getDateFromKey(dateKey);
  return instructor.schedule.workDays.includes(date.getDay());
}

function isSlotInSchedule(instructor, dateKey, time) {
  return isInstructorWorkingOnDate(instructor, dateKey) && getWorkHours(instructor.schedule).includes(time);
}

function isSlotBooked(dateKey, time, instructorId, ignoredId = null) {
  return state.bookings.some((booking) => (
    booking.id !== ignoredId
    && booking.date === dateKey
    && booking.time === time
    && getBookingInstructorId(booking) === instructorId
  ));
}

function countInstructorBookings(instructorId, dateKey) {
  return state.bookings.filter((booking) => (
    booking.date === dateKey && getBookingInstructorId(booking) === instructorId
  )).length;
}

function isSlotBookableByAdvance(instructor, dateKey, time) {
  const minAdvanceMs = normalizeSettings(instructor.schedule).minAdvanceHours * 60 * 60 * 1000;
  return getBookingStartDate(dateKey, time).getTime() - Date.now() >= minAdvanceMs;
}

function getAvailableTimesForInstructor(instructor, dateKey, options = {}) {
  const { ignoredId = null, respectAdvance = true } = options;

  if (!isInstructorWorkingOnDate(instructor, dateKey)) {
    return [];
  }

  return getWorkHours(instructor.schedule).filter((time) => (
    !isSlotBooked(dateKey, time, instructor.id, ignoredId)
    && (!respectAdvance || isSlotBookableByAdvance(instructor, dateKey, time))
  ));
}

function findAvailableInstructorForSlot(dateKey, time, requestedInstructorId = state.selectedInstructorId, ignoredId = null, options = {}) {
  const { respectAdvance = true } = options;
  const candidates = requestedInstructorId === ANY_INSTRUCTOR_ID
    ? state.instructors
    : [getInstructorById(requestedInstructorId)].filter(Boolean);

  return candidates
    .filter((instructor) => (
      isSlotInSchedule(instructor, dateKey, time)
      && !isSlotBooked(dateKey, time, instructor.id, ignoredId)
      && (!respectAdvance || isSlotBookableByAdvance(instructor, dateKey, time))
    ))
    .sort((a, b) => countInstructorBookings(a.id, dateKey) - countInstructorBookings(b.id, dateKey))
    .at(0) ?? null;
}

function getStudentSlotTimes(dateKey) {
  if (!dateKey) {
    return [];
  }

  const slots = new Set();
  getStudentInstructorCandidates().forEach((instructor) => {
    if (!isInstructorWorkingOnDate(instructor, dateKey)) {
      return;
    }

    getAvailableTimesForInstructor(instructor, dateKey).forEach((time) => slots.add(time));
  });

  return [...slots].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
}

function formatSlot(dateKey, time) {
  const date = getDateFromKey(dateKey);
  return `${fullDateFormatter.format(date)}, ${time}`;
}

function renderStudentInstructorFilter() {
  if (!studentInstructorFilter) return;

  const hasInstructors = state.instructors.length > 0;

  if (!hasInstructors) {
    state.selectedInstructorId = ANY_INSTRUCTOR_ID;
    studentInstructorFilter.disabled = true;
    studentInstructorFilter.innerHTML = `<option value="${ANY_INSTRUCTOR_ID}">Пока нет зарегистрированных инструкторов</option>`;
    return;
  }

  const selectedExists = state.selectedInstructorId === ANY_INSTRUCTOR_ID || state.instructors.some((instructor) => instructor.id === state.selectedInstructorId);
  if (!selectedExists) {
    state.selectedInstructorId = ANY_INSTRUCTOR_ID;
  }

  studentInstructorFilter.disabled = false;
  studentInstructorFilter.innerHTML = [
    `<option value="${ANY_INSTRUCTOR_ID}">Любой свободный инструктор</option>`,
    ...state.instructors.map((instructor) => (
      `<option value="${escapeHtml(instructor.id)}">${escapeHtml(getInstructorName(instructor))}</option>`
    )),
  ].join("");
  studentInstructorFilter.value = state.selectedInstructorId;
}

function renderDays() {
  if (!dayTabs) return;

  const days = getDays();
  const visibleDates = days.map(toDateKey);

  if (days.length === 0) {
    state.activeDate = null;
    state.selectedSlot = null;
    dayTabs.innerHTML = "";
    return;
  }

  if (!visibleDates.includes(state.activeDate)) {
    state.activeDate = toDateKey(days[0]);
    state.selectedSlot = null;
  }

  dayTabs.innerHTML = days
    .map((date) => {
      const dateKey = toDateKey(date);
      const isActive = dateKey === state.activeDate;
      return `
        <button class="day-tab ${isActive ? "active" : ""}" type="button" data-date="${dateKey}" role="tab" aria-selected="${isActive}">
          <strong>${dateFormatter.format(date).replace(".", "")}</strong>
          <span>${shortDateFormatter.format(date)}</span>
        </button>
      `;
    })
    .join("");
}

function renderSlots() {
  if (!slotGrid) return;

  if (state.instructors.length === 0) {
    slotGrid.innerHTML = `<p class="empty-state">Пока нет зарегистрированных инструкторов. Инструктор должен сначала создать кабинет и настроить расписание.</p>`;
    return;
  }

  const selectedInstructor = state.selectedInstructorId === ANY_INSTRUCTOR_ID
    ? null
    : getInstructorById(state.selectedInstructorId);

  if (state.selectedInstructorId !== ANY_INSTRUCTOR_ID && !selectedInstructor) {
    slotGrid.innerHTML = `<p class="empty-state">Этот инструктор больше не найден. Выберите другого инструктора.</p>`;
    return;
  }

  const slots = getStudentSlotTimes(state.activeDate);

  if (slots.length === 0) {
    slotGrid.innerHTML = `<p class="empty-state">Для выбранного инструктора пока нет доступных дней и времени.</p>`;
    return;
  }

  slotGrid.innerHTML = slots.map((time) => {
    const availableInstructor = findAvailableInstructorForSlot(state.activeDate, time);
    const booked = !availableInstructor;
    const selected = state.selectedSlot?.date === state.activeDate && state.selectedSlot?.time === time;
    const duration = availableInstructor?.schedule.lessonDuration ?? selectedInstructor?.schedule.lessonDuration ?? DEFAULT_SETTINGS.lessonDuration;
    return `
      <button
        class="slot-button ${selected ? "selected" : ""}"
        type="button"
        data-time="${time}"
        ${booked ? "disabled" : ""}
        aria-pressed="${selected}"
      >
        <strong>${time}</strong>
        <span>${booked ? "уже занято" : `${duration} минут`}</span>
      </button>
    `;
  }).join("");
}

function renderSelectedSlot() {
  if (!selectedSlot) return;

  if (!state.selectedSlot) {
    selectedSlot.textContent = "Выберите дату и время";
    selectedSlot.classList.remove("ready");
    return;
  }

  const instructor = state.selectedSlot.requestedInstructorId === ANY_INSTRUCTOR_ID
    ? null
    : getInstructorById(state.selectedSlot.requestedInstructorId);
  const instructorLabel = instructor ? getInstructorName(instructor) : "любой свободный инструктор";

  selectedSlot.textContent = `${formatSlot(state.selectedSlot.date, state.selectedSlot.time)} · ${instructorLabel}`;
  selectedSlot.classList.add("ready");
}

function renderBookings() {
  if (!bookingList) return;

  const bookings = getCurrentInstructorBookings()
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  if (bookings.length === 0) {
    bookingList.innerHTML = `<p class="empty-state">Пока нет заявок. Здесь будут только ученики, записанные к вам.</p>`;
    return;
  }

  bookingList.innerHTML = bookings
    .map((booking) => `
      <article class="booking-card ${state.editingId === booking.id ? "editing" : ""}">
        <div>
          <p class="booking-time">${formatSlot(booking.date, booking.time)}</p>
          <p>${escapeHtml(getBookingInstructorName(booking))}</p>
        </div>
        <div>
          <h3>${escapeHtml(booking.name)}</h3>
          <p>${escapeHtml(booking.phone)}${booking.email ? ` · ${escapeHtml(booking.email)}` : ""}</p>
        </div>
        <div>
          <span class="status-pill">${booking.mailing ? "email включен" : "только связь"}</span>
          <p>${booking.comment ? escapeHtml(booking.comment) : "Без комментария"}</p>
        </div>
        <div class="card-actions">
          <button type="button" data-edit="${booking.id}">Изменить</button>
          <button class="danger-action" type="button" data-delete="${booking.id}">Удалить</button>
        </div>
      </article>
    `)
    .join("");
}

function renderCurrentInstructorName() {
  if (!currentInstructorName) return;

  const instructor = getCurrentInstructor();
  currentInstructorName.textContent = instructor ? getInstructorName(instructor) : "";
}

function renderSettingsForm() {
  if (!settingsForm || !settingsSummary) return;

  const instructor = getCurrentInstructor();

  if (!instructor) {
    settingsForm.reset();
    settingsSummary.textContent = "Войдите в кабинет инструктора, чтобы настроить расписание.";
    return;
  }

  const settings = instructor.schedule;
  settingsForm.startTime.value = settings.startTime;
  settingsForm.endTime.value = settings.endTime;
  settingsForm.lessonDuration.value = String(settings.lessonDuration);
  settingsForm.breakStart.value = settings.breakStart;
  settingsForm.breakEnd.value = settings.breakEnd;
  settingsForm.minAdvanceHours.value = String(settings.minAdvanceHours);
  settingsForm.notifyEmail.checked = instructor.notifications.email;
  settingsForm.notifyWhatsapp.checked = instructor.notifications.whatsapp;
  settingsForm.notifyTelegram.checked = instructor.notifications.telegram;
  settingsForm.reminderHours.value = String(instructor.notifications.reminderHours);

  settingsForm.querySelectorAll("[name='workDays']").forEach((input) => {
    input.checked = settings.workDays.includes(Number(input.value));
  });

  const days = settings.workDays
    .map((day) => WEEKDAY_NAMES[day])
    .join(", ");
  const slotCount = getWorkHours(settings).length;
  const breakText = settings.breakStart && settings.breakEnd ? ` Перерыв: ${settings.breakStart}-${settings.breakEnd}.` : "";
  const blockedText = settings.blockedDates.length ? ` Недоступных дат: ${settings.blockedDates.length}.` : "";
  const channels = getNotificationChannelLabels(instructor.notifications).join(", ") || "выключены";
  settingsSummary.textContent = `Рабочие дни: ${days}. Время: ${settings.startTime}-${settings.endTime}.${breakText} Длительность: ${settings.lessonDuration} минут. Слотов в день: ${slotCount}. Запись минимум за ${settings.minAdvanceHours} ч.${blockedText} Уведомления: ${channels}.`;
  renderBlockedDateList();
}

function getNotificationChannelLabels(notifications) {
  const settings = normalizeNotifications(notifications);
  const labels = [];

  if (settings.email) labels.push("email");
  if (settings.whatsapp) labels.push("WhatsApp");
  if (settings.telegram) labels.push("Telegram");
  return labels;
}

function renderBlockedDateList() {
  if (!blockedDateList) return;

  const instructor = getCurrentInstructor();
  if (!instructor || instructor.schedule.blockedDates.length === 0) {
    blockedDateList.innerHTML = `<p class="empty-state compact-empty">Пока нет отдельных выходных или отпуска.</p>`;
    return;
  }

  blockedDateList.innerHTML = instructor.schedule.blockedDates
    .map((item) => `
      <div class="blocked-date-item">
        <span>
          <strong>${escapeHtml(shortDateFormatter.format(getDateFromKey(item.date)))}</strong>
          ${item.reason ? escapeHtml(item.reason) : "Недоступно"}
        </span>
        <button type="button" data-remove-blocked="${escapeHtml(item.id)}">Удалить</button>
      </div>
    `)
    .join("");
}

function getUpcomingBookings(daysAhead = 14) {
  const now = new Date();
  const end = addDays(now, daysAhead);

  return getCurrentInstructorBookings()
    .filter((booking) => {
      const startsAt = getBookingStartDate(booking.date, booking.time);
      return startsAt >= now && startsAt <= end;
    })
    .sort((a, b) => getBookingStartDate(a.date, a.time) - getBookingStartDate(b.date, b.time));
}

function renderNotifications() {
  if (!notificationList) return;

  const instructor = getCurrentInstructor();
  if (!instructor) {
    notificationList.innerHTML = `<p class="empty-state compact-empty">Войдите в кабинет, чтобы видеть напоминания.</p>`;
    return;
  }

  const channels = getNotificationChannelLabels(instructor.notifications);
  if (channels.length === 0) {
    notificationList.innerHTML = `<p class="empty-state compact-empty">Каналы уведомлений выключены. Их можно включить в настройках.</p>`;
    return;
  }

  const reminders = getUpcomingBookings(14).slice(0, 4);
  if (reminders.length === 0) {
    notificationList.innerHTML = `<p class="empty-state compact-empty">На ближайшие две недели напоминаний нет.</p>`;
    return;
  }

  notificationList.innerHTML = reminders
    .map((booking) => {
      const startsAt = getBookingStartDate(booking.date, booking.time);
      const remindAt = new Date(startsAt.getTime() - instructor.notifications.reminderHours * 60 * 60 * 1000);
      return `
        <article class="notification-item">
          <strong>${escapeHtml(booking.name)} · ${escapeHtml(formatSlot(booking.date, booking.time))}</strong>
          <span>Напомнить ${escapeHtml(compactDateFormatter.format(remindAt))} в ${minutesToTime(remindAt.getHours() * 60 + remindAt.getMinutes())} · ${escapeHtml(channels.join(", "))}</span>
        </article>
      `;
    })
    .join("");
}

function renderCalendar() {
  if (!calendarGrid || !calendarWeekLabel) return;

  const instructor = getCurrentInstructor();
  if (!instructor) {
    calendarGrid.innerHTML = `<p class="empty-state">Войдите в кабинет инструктора, чтобы увидеть календарь.</p>`;
    return;
  }

  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(state.calendarStart, index));
  const weekStart = compactDateFormatter.format(weekDays[0]);
  const weekEnd = compactDateFormatter.format(weekDays[6]);
  calendarWeekLabel.textContent = `${weekStart} - ${weekEnd}`;

  calendarGrid.innerHTML = weekDays
    .map((date) => {
      const dateKey = toDateKey(date);
      const blocked = getBlockedDate(instructor.schedule, dateKey);
      const dayBookings = getCurrentInstructorBookings()
        .filter((booking) => booking.date === dateKey)
        .sort((a, b) => a.time.localeCompare(b.time));
      const freeSlots = getAvailableTimesForInstructor(instructor, dateKey, { respectAdvance: false }).length;

      return `
        <section class="calendar-day">
          <div class="calendar-day-head">
            <strong>${escapeHtml(dateFormatter.format(date).replace(".", ""))}</strong>
            <span>${blocked ? escapeHtml(blocked.reason || "Недоступно") : `${freeSlots} свободных`}</span>
          </div>
          <div class="calendar-bookings">
            ${dayBookings.length ? dayBookings.map((booking) => `
              <button class="calendar-booking" type="button" data-edit="${escapeHtml(booking.id)}">
                <strong>${escapeHtml(booking.time)} · ${escapeHtml(booking.name)}</strong>
                <span>${escapeHtml(booking.phone)}${booking.comment ? ` · ${escapeHtml(booking.comment)}` : ""}</span>
              </button>
            `).join("") : `<p class="calendar-empty">Записей нет</p>`}
          </div>
        </section>
      `;
    })
    .join("");
}

function renderAnalytics() {
  if (!analyticsCards || !analyticsBars) return;

  const instructor = getCurrentInstructor();
  if (!instructor) {
    analyticsCards.innerHTML = `<p class="empty-state">Войдите в кабинет инструктора, чтобы увидеть аналитику.</p>`;
    analyticsBars.innerHTML = "";
    return;
  }

  const bookings = getCurrentInstructorBookings();
  const now = new Date();
  const inSevenDays = addDays(now, 7);
  const upcoming = bookings.filter((booking) => {
    const startsAt = getBookingStartDate(booking.date, booking.time);
    return startsAt >= now && startsAt <= inSevenDays;
  });
  const todayKey = toDateKey(now);
  const todayCount = bookings.filter((booking) => booking.date === todayKey).length;
  const mailingCount = bookings.filter((booking) => booking.mailing).length;
  const nextWeekDates = Array.from({ length: 7 }, (_, index) => addDays(now, index));
  const totalSlots = nextWeekDates.reduce((sum, date) => {
    const dateKey = toDateKey(date);
    return sum + (isInstructorWorkingOnDate(instructor, dateKey) ? getWorkHours(instructor.schedule).length : 0);
  }, 0);
  const occupancy = totalSlots ? Math.round((upcoming.length / totalSlots) * 100) : 0;

  analyticsCards.innerHTML = [
    ["Всего заявок", bookings.length],
    ["В ближайшие 7 дней", upcoming.length],
    ["Сегодня", todayCount],
    ["Email-согласий", mailingCount],
    ["Загрузка недели", `${occupancy}%`],
  ].map(([label, value]) => `
    <article class="analytics-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `).join("");

  const dailyCounts = nextWeekDates.map((date) => {
    const dateKey = toDateKey(date);
    return {
      date,
      count: bookings.filter((booking) => booking.date === dateKey).length,
    };
  });
  const maxCount = Math.max(...dailyCounts.map((item) => item.count), 1);

  analyticsBars.innerHTML = dailyCounts.map((item) => {
    const width = Math.max(8, Math.round((item.count / maxCount) * 100));
    return `
      <div class="analytics-bar-row">
        <span>${escapeHtml(shortDateFormatter.format(item.date))}</span>
        <div class="analytics-track"><i style="width: ${width}%"></i></div>
        <strong>${item.count}</strong>
      </div>
    `;
  }).join("");
}

function renderEditInstructorOptions(selectedInstructorId) {
  if (!bookingEditForm?.editInstructor) return;

  if (state.instructors.length === 0) {
    bookingEditForm.editInstructor.innerHTML = `<option value="">Нет зарегистрированных инструкторов</option>`;
    return;
  }

  bookingEditForm.editInstructor.innerHTML = state.instructors
    .map((instructor) => (
      `<option value="${escapeHtml(instructor.id)}">${escapeHtml(getInstructorName(instructor))}</option>`
    ))
    .join("");

  bookingEditForm.editInstructor.value = selectedInstructorId;
}

function renderEditForm() {
  if (!bookingEditForm) return;

  const booking = state.bookings.find((item) => item.id === state.editingId);

  if (!booking) {
    bookingEditForm.reset();
    renderEditInstructorOptions("");
    return;
  }

  const instructorId = getBookingInstructorId(booking) ?? getCurrentInstructor()?.id ?? "";
  renderEditInstructorOptions(instructorId);

  bookingEditForm.editDate.value = booking.date;
  bookingEditForm.editTime.value = booking.time;
  bookingEditForm.editInstructor.value = instructorId;
  bookingEditForm.editName.value = booking.name;
  bookingEditForm.editPhone.value = booking.phone;
  bookingEditForm.editEmail.value = booking.email ?? "";
  bookingEditForm.editComment.value = booking.comment ?? "";
  bookingEditForm.editMailing.checked = Boolean(booking.mailing);
}

function render() {
  renderStudentInstructorFilter();
  renderDays();
  renderSlots();
  renderSelectedSlot();
  renderBookings();
  renderCurrentInstructorName();
  renderSettingsForm();
  renderNotifications();
  renderCalendar();
  renderAnalytics();
  renderEditForm();
}

function openDrawer(drawer, focusTarget) {
  if (!drawer) return;

  window.clearTimeout(drawer.closeTimer);
  drawer.hidden = false;
  window.requestAnimationFrame(() => {
    drawer.classList.add("is-open");
  });

  if (focusTarget) {
    window.setTimeout(() => focusTarget.focus(), 180);
  }
}

function closeDrawer(drawer, afterClose) {
  if (!drawer || drawer.hidden) {
    afterClose?.();
    return;
  }

  drawer.classList.remove("is-open");
  window.clearTimeout(drawer.closeTimer);
  drawer.closeTimer = window.setTimeout(() => {
    if (!drawer.classList.contains("is-open")) {
      drawer.hidden = true;
      afterClose?.();
    }
  }, DRAWER_TRANSITION_MS);
}

function openBookingDrawer() {
  openDrawer(bookingDrawer, bookingForm?.studentName);
}

function closeBookingDrawer() {
  closeDrawer(bookingDrawer, () => {
    showNote("");
  });
}

function hideBookingSuccess() {
  if (!bookingSuccess) return;
  bookingSuccess.hidden = true;
  bookingSuccess.textContent = "";
}

function showBookingSuccess(booking) {
  if (!bookingSuccess) return;

  bookingSuccess.innerHTML = `
    <strong>Вы успешно записаны на занятие.</strong>
    <span>${formatSlot(booking.date, booking.time)} · ${escapeHtml(getBookingInstructorName(booking))}</span>
  `;
  bookingSuccess.hidden = false;
}

function showAppScreen(screen) {
  if (roleView) {
    roleView.hidden = screen !== "role";
  }
  if (bookingView) {
    bookingView.hidden = screen !== "student";
  }
  if (instructorLoginView) {
    instructorLoginView.hidden = screen !== "login";
  }
  if (instructorShell) {
    instructorShell.hidden = screen !== "instructor";
  }

  if (screen !== "instructor") {
    state.editingId = null;
    closeDrawer(editDrawer);
    renderEditForm();
  }
  if (screen !== "student") {
    closeBookingDrawer();
    hideBookingSuccess();
  }
}

function showRoleChoice() {
  window.history.replaceState(null, "", "index.html");
  showAppScreen("role");
}

function showStudentBooking() {
  window.history.replaceState(null, "", "index.html#student");
  showAppScreen("student");
  render();
}

function showLoginMode() {
  if (loginForm) {
    loginForm.hidden = false;
  }
  if (registerForm) {
    registerForm.hidden = true;
  }
  showLoginNote("");
  showRegisterNote("");
  loginForm?.loginName.focus();
}

function showRegisterMode() {
  if (loginForm) {
    loginForm.hidden = true;
  }
  if (registerForm) {
    registerForm.hidden = false;
  }
  showLoginNote("");
  showRegisterNote("");
  registerForm?.lastName.focus();
}

function showInstructorLogin() {
  window.history.replaceState(null, "", "index.html#instructor");
  showAppScreen("login");
  showLoginMode();
}

function setInstructorView(view) {
  const views = {
    admin: adminView,
    calendar: calendarView,
    analytics: analyticsView,
    settings: settingsView,
  };

  Object.entries(views).forEach(([key, element]) => {
    if (element) {
      element.hidden = key !== view;
    }
  });

  viewButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  render();
}

function showInstructorDashboard() {
  window.history.replaceState(null, "", "index.html#instructor");

  showAppScreen("instructor");
  setInstructorView("admin");
}

function openInstructorFlow() {
  if (hasInstructorSession()) {
    showInstructorDashboard();
    return;
  }

  setInstructorSession(null);
  showInstructorLogin();
}

function showNote(message, isError = false) {
  if (!formNote) return;
  formNote.textContent = message;
  formNote.classList.toggle("error", isError);
}

function showAdminNote(message, isError = false) {
  if (!adminNote) return;
  adminNote.textContent = message;
  adminNote.classList.toggle("error", isError);
}

function showEditNote(message, isError = false) {
  if (!editNote) return;
  editNote.textContent = message;
  editNote.classList.toggle("error", isError);
}

function showSettingsNote(message, isError = false) {
  if (!settingsNote) return;
  settingsNote.textContent = message;
  settingsNote.classList.toggle("error", isError);
}

function showLoginNote(message, isError = false) {
  if (!loginNote) return;
  loginNote.textContent = message;
  loginNote.classList.toggle("error", isError);
}

function showRegisterNote(message, isError = false) {
  if (!registerNote) return;
  registerNote.textContent = message;
  registerNote.classList.toggle("error", isError);
}

function validatePhone(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10;
}

function handleSubmit(event) {
  event.preventDefault();

  if (!state.selectedSlot) {
    showNote("Сначала выберите свободное время.", true);
    return;
  }

  const assignedInstructor = findAvailableInstructorForSlot(
    state.selectedSlot.date,
    state.selectedSlot.time,
    state.selectedSlot.requestedInstructorId,
  );

  if (!assignedInstructor) {
    showNote("Это время уже заняли. Выберите другой слот.", true);
    state.selectedSlot = null;
    render();
    return;
  }

  const formData = new FormData(bookingForm);
  const name = formData.get("studentName").trim();
  const phone = formData.get("phone").trim();
  const email = formData.get("email").trim();

  if (!validatePhone(phone)) {
    showNote("Проверьте телефон: нужно минимум 10 цифр.", true);
    return;
  }

  const instructorName = getInstructorName(assignedInstructor);
  const booking = {
    id: createId("booking"),
    date: state.selectedSlot.date,
    time: state.selectedSlot.time,
    name,
    phone,
    email,
    instructorId: assignedInstructor.id,
    instructorName,
    instructor: instructorName,
    comment: formData.get("comment").trim(),
    mailing: formData.get("mailing") === "on",
    createdAt: new Date().toISOString(),
  };

  state.bookings.push(booking);
  saveBookings();
  bookingForm.reset();
  state.selectedSlot = null;
  closeBookingDrawer();
  render();
  showBookingSuccess(booking);
}

function createId(prefix = "item") {
  if (window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function startEditBooking(id) {
  state.editingId = id;
  showEditNote("");
  render();
  openDrawer(editDrawer, bookingEditForm?.editName);
}

function cancelEditBooking() {
  state.editingId = null;
  showEditNote("");
  renderBookings();
  closeDrawer(editDrawer, () => {
    renderEditForm();
  });
}

function updateBooking(event) {
  event.preventDefault();

  const booking = state.bookings.find((item) => item.id === state.editingId);
  if (!booking) return;

  const formData = new FormData(bookingEditForm);
  const date = formData.get("editDate");
  const time = formData.get("editTime");
  const instructorId = formData.get("editInstructor");
  const instructor = getInstructorById(instructorId);
  const name = formData.get("editName").trim();
  const phone = formData.get("editPhone").trim();
  const email = formData.get("editEmail").trim();

  if (!instructor) {
    showEditNote("Выберите зарегистрированного инструктора.", true);
    return;
  }

  if (!validatePhone(phone)) {
    showEditNote("Проверьте телефон: нужно минимум 10 цифр.", true);
    return;
  }

  if (!isSlotInSchedule(instructor, date, time)) {
    showEditNote("У этого инструктора нет такого времени в расписании.", true);
    return;
  }

  if (isSlotBooked(date, time, instructor.id, booking.id)) {
    showEditNote("На это время уже есть другая заявка.", true);
    return;
  }

  const instructorName = getInstructorName(instructor);
  Object.assign(booking, {
    date,
    time,
    name,
    phone,
    email,
    instructorId: instructor.id,
    instructorName,
    instructor: instructorName,
    comment: formData.get("editComment").trim(),
    mailing: formData.get("editMailing") === "on",
    updatedAt: new Date().toISOString(),
  });

  saveBookings();
  state.editingId = null;
  showAdminNote("Заявка обновлена.");
  render();
  closeDrawer(editDrawer);
}

function deleteBooking(id) {
  const booking = state.bookings.find((item) => item.id === id);
  const currentInstructor = getCurrentInstructor();

  if (!booking || !currentInstructor || getBookingInstructorId(booking) !== currentInstructor.id) {
    showAdminNote("Эта заявка не относится к текущему инструктору.", true);
    return;
  }

  state.bookings = state.bookings.filter((item) => item.id !== id);

  if (state.editingId === id) {
    state.editingId = null;
    closeDrawer(editDrawer);
  }

  saveBookings();
  deleteBookingFromSupabase(id);
  showAdminNote("Заявка удалена.");
  render();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function exportBookings() {
  const bookings = getCurrentInstructorBookings();

  if (bookings.length === 0) {
    showAdminNote("Экспортировать пока нечего.", true);
    return;
  }

  const rows = [
    ["Дата", "Время", "Имя", "Телефон", "Email", "Инструктор", "Рассылка", "Комментарий", "Создано", "Обновлено"],
    ...bookings.map((booking) => [
      booking.date,
      booking.time,
      booking.name,
      booking.phone,
      booking.email,
      getBookingInstructorName(booking),
      booking.mailing ? "да" : "нет",
      booking.comment,
      booking.createdAt,
      booking.updatedAt ?? "",
    ]),
  ];

  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "driving-bookings.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function handleSettingsSubmit(event) {
  event.preventDefault();

  const instructor = getCurrentInstructor();
  if (!instructor) {
    showSettingsNote("Сначала войдите в кабинет инструктора.", true);
    return;
  }

  const formData = new FormData(settingsForm);
  const workDays = formData.getAll("workDays").map(Number);
  const startTime = formData.get("startTime");
  const endTime = formData.get("endTime");
  const lessonDuration = Number(formData.get("lessonDuration"));
  const breakStart = formData.get("breakStart");
  const breakEnd = formData.get("breakEnd");
  const minAdvanceHours = Number(formData.get("minAdvanceHours"));

  if (workDays.length === 0) {
    showSettingsNote("Выберите хотя бы один рабочий день.", true);
    return;
  }

  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    showSettingsNote("Конец дня должен быть позже начала.", true);
    return;
  }

  if (timeToMinutes(startTime) + lessonDuration > timeToMinutes(endTime)) {
    showSettingsNote("Рабочий день короче одного занятия.", true);
    return;
  }

  if ((breakStart && !breakEnd) || (!breakStart && breakEnd)) {
    showSettingsNote("Для перерыва нужно указать и начало, и конец.", true);
    return;
  }

  if (breakStart && breakEnd && timeToMinutes(breakStart) >= timeToMinutes(breakEnd)) {
    showSettingsNote("Конец перерыва должен быть позже начала.", true);
    return;
  }

  instructor.schedule = normalizeSettings({
    workDays,
    startTime,
    endTime,
    lessonDuration,
    breakStart,
    breakEnd,
    minAdvanceHours,
    blockedDates: instructor.schedule.blockedDates,
  });
  instructor.notifications = normalizeNotifications({
    email: formData.get("notifyEmail") === "on",
    whatsapp: formData.get("notifyWhatsapp") === "on",
    telegram: formData.get("notifyTelegram") === "on",
    reminderHours: formData.get("reminderHours"),
  });
  state.activeDate = null;
  state.selectedSlot = null;
  saveInstructors();
  showSettingsNote("Расписание сохранено. Страница ученика обновится при открытии.");
  render();
}

function handleLogin(event) {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const login = formData.get("loginName").trim();
  const password = formData.get("loginPassword").trim();
  const instructor = getInstructorByLogin(login);

  if (!instructor || instructor.password !== password) {
    showLoginNote("Неверный логин или пароль.", true);
    return;
  }

  setInstructorSession(instructor.id);
  loginForm.reset();
  showLoginNote("");
  showInstructorDashboard();
}

function handleRegister(event) {
  event.preventDefault();

  const formData = new FormData(registerForm);
  const firstName = formData.get("firstName").trim();
  const lastName = formData.get("lastName").trim();
  const patronymic = formData.get("patronymic").trim();
  const phone = formData.get("phone").trim();
  const email = formData.get("email").trim();
  const login = normalizeLogin(formData.get("registerLogin"));
  const password = formData.get("registerPassword").trim();

  if (!firstName || !lastName || !login || !password) {
    showRegisterNote("Заполните имя, фамилию, логин и пароль.", true);
    return;
  }

  if (password.length < 4) {
    showRegisterNote("Пароль должен быть не короче 4 символов.", true);
    return;
  }

  if (phone && !validatePhone(phone)) {
    showRegisterNote("Проверьте телефон: нужно минимум 10 цифр.", true);
    return;
  }

  if (getInstructorByLogin(login)) {
    showRegisterNote("Такой логин уже занят.", true);
    return;
  }

  const instructor = {
    id: createId("instructor"),
    firstName,
    lastName,
    patronymic,
    phone,
    email,
    login,
    password,
    schedule: loadLegacySettings(),
    notifications: { ...DEFAULT_NOTIFICATIONS },
    createdAt: new Date().toISOString(),
  };

  state.instructors.push(instructor);
  saveInstructors();
  setInstructorSession(instructor.id);
  registerForm.reset();
  showRegisterNote("");
  showInstructorDashboard();
}

studentEntry?.addEventListener("click", showStudentBooking);
instructorEntry?.addEventListener("click", openInstructorFlow);
backHomeButtons.forEach((button) => button.addEventListener("click", showRoleChoice));
showRegister?.addEventListener("click", showRegisterMode);
showLogin?.addEventListener("click", showLoginMode);
loginForm?.addEventListener("submit", handleLogin);
registerForm?.addEventListener("submit", handleRegister);
logoutInstructor?.addEventListener("click", () => {
  setInstructorSession(null);
  showRoleChoice();
});

studentInstructorFilter?.addEventListener("change", () => {
  state.selectedInstructorId = studentInstructorFilter.value;
  state.activeDate = null;
  state.selectedSlot = null;
  hideBookingSuccess();
  showNote("");
  render();
});

dayTabs?.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-date]");
  if (!tab) return;

  state.activeDate = tab.dataset.date;
  state.selectedSlot = null;
  showNote("");
  hideBookingSuccess();
  render();
});

slotGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-time]");
  if (!button || button.disabled) return;

  state.selectedSlot = {
    date: state.activeDate,
    time: button.dataset.time,
    requestedInstructorId: state.selectedInstructorId,
  };
  showNote("");
  hideBookingSuccess();
  render();
  openBookingDrawer();
});

bookingList?.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  if (editButton) {
    startEditBooking(editButton.dataset.edit);
    return;
  }

  if (deleteButton) {
    deleteBooking(deleteButton.dataset.delete);
  }
});

calendarGrid?.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit]");
  if (editButton) {
    startEditBooking(editButton.dataset.edit);
  }
});

bookingForm?.addEventListener("submit", handleSubmit);
closeBooking?.addEventListener("click", closeBookingDrawer);
cancelBooking?.addEventListener("click", closeBookingDrawer);
bookingDrawer?.addEventListener("click", (event) => {
  if (event.target === bookingDrawer) {
    closeBookingDrawer();
  }
});
bookingEditForm?.addEventListener("submit", updateBooking);
cancelEdit?.addEventListener("click", cancelEditBooking);
closeEdit?.addEventListener("click", cancelEditBooking);
editDrawer?.addEventListener("click", (event) => {
  if (event.target === editDrawer) {
    cancelEditBooking();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (editDrawer?.classList.contains("is-open")) {
    cancelEditBooking();
  }
  if (bookingDrawer?.classList.contains("is-open")) {
    closeBookingDrawer();
  }
});
exportCsv?.addEventListener("click", exportBookings);
clearDemo?.addEventListener("click", () => {
  const currentInstructor = getCurrentInstructor();

  if (!currentInstructor) {
    showAdminNote("Сначала войдите в кабинет инструктора.", true);
    return;
  }

  state.bookings = state.bookings.filter((booking) => getBookingInstructorId(booking) !== currentInstructor.id);
  state.selectedSlot = null;
  state.editingId = null;
  saveBookings();
  deleteInstructorBookingsFromSupabase(currentInstructor.id);
  showAdminNote("Журнал очищен.");
  render();
  closeDrawer(editDrawer);
});

settingsForm?.addEventListener("submit", handleSettingsSubmit);
addBlockedDate?.addEventListener("click", () => {
  const instructor = getCurrentInstructor();

  if (!instructor) {
    showSettingsNote("Сначала войдите в кабинет инструктора.", true);
    return;
  }

  const date = settingsForm.blockedDate.value;
  const reason = settingsForm.blockedReason.value.trim();

  if (!isDateKey(date)) {
    showSettingsNote("Выберите дату, которую нужно закрыть.", true);
    return;
  }

  if (instructor.schedule.blockedDates.some((item) => item.date === date)) {
    showSettingsNote("Эта дата уже добавлена.", true);
    return;
  }

  instructor.schedule.blockedDates = normalizeBlockedDates([
    ...instructor.schedule.blockedDates,
    { id: createId("blocked"), date, reason },
  ]);
  settingsForm.blockedDate.value = "";
  settingsForm.blockedReason.value = "";
  state.activeDate = null;
  state.selectedSlot = null;
  saveInstructors();
  showSettingsNote("Дата закрыта для записи.");
  render();
});

blockedDateList?.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-blocked]");
  if (!removeButton) return;

  const instructor = getCurrentInstructor();
  if (!instructor) return;

  instructor.schedule.blockedDates = instructor.schedule.blockedDates
    .filter((item) => item.id !== removeButton.dataset.removeBlocked);
  state.activeDate = null;
  state.selectedSlot = null;
  saveInstructors();
  showSettingsNote("Дата снова доступна по рабочему расписанию.");
  render();
});

resetSettings?.addEventListener("click", () => {
  const instructor = getCurrentInstructor();

  if (!instructor) {
    showSettingsNote("Сначала войдите в кабинет инструктора.", true);
    return;
  }

  instructor.schedule = { ...DEFAULT_SETTINGS };
  instructor.notifications = { ...DEFAULT_NOTIFICATIONS };
  state.activeDate = null;
  state.selectedSlot = null;
  saveInstructors();
  showSettingsNote("Настройки сброшены.");
  render();
});

prevWeek?.addEventListener("click", () => {
  state.calendarStart = addDays(state.calendarStart, -7);
  renderCalendar();
});

todayWeek?.addEventListener("click", () => {
  state.calendarStart = getStartOfWeek(new Date());
  renderCalendar();
});

nextWeek?.addEventListener("click", () => {
  state.calendarStart = addDays(state.calendarStart, 7);
  renderCalendar();
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setInstructorView(button.dataset.view);
  });
});

async function initApp() {
  await loadSupabaseState();
  render();

  if (window.location.hash === "#student") {
    showStudentBooking();
  } else if (window.location.hash === "#instructor") {
    openInstructorFlow();
  } else {
    showAppScreen("role");
  }
}

initApp();
