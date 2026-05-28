const STORAGE_KEY = "drivingLessonBookings";
const SETTINGS_KEY = "drivingLessonSettings";
const INSTRUCTORS_KEY = "drivingLessonInstructors";
const INSTRUCTOR_SESSION_KEY = "driveBookInstructorSession";
const ANY_INSTRUCTOR_ID = "any";
const DAY_COUNT = 7;
const DRAWER_TRANSITION_MS = 300;
const DEFAULT_SETTINGS = {
  workDays: [1, 2, 3, 4, 5, 6],
  startTime: "09:00",
  endTime: "18:00",
  lessonDuration: 60,
};
const WEEKDAY_NAMES = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const state = {
  activeDate: null,
  selectedSlot: null,
  selectedInstructorId: ANY_INSTRUCTOR_ID,
  editingId: null,
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
const settingsView = document.querySelector("#settingsView");
const settingsForm = document.querySelector("#settingsForm");
const settingsSummary = document.querySelector("#settingsSummary");
const settingsNote = document.querySelector("#settingsNote");
const resetSettings = document.querySelector("#resetSettings");
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
    return saved.map(normalizeInstructor).filter(Boolean);
  } catch {
    return [];
  }
}

function saveBookings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookings));
}

function saveInstructors() {
  localStorage.setItem(INSTRUCTORS_KEY, JSON.stringify(state.instructors));
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
  return next;
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
    if (getStudentInstructorCandidates().some((instructor) => isInstructorWorkingOnDate(instructor, dateKey))) {
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
    slots.push(minutesToTime(time));
  }

  return slots;
}

function isInstructorWorkingOnDate(instructor, dateKey) {
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

function findAvailableInstructorForSlot(dateKey, time, requestedInstructorId = state.selectedInstructorId, ignoredId = null) {
  const candidates = requestedInstructorId === ANY_INSTRUCTOR_ID
    ? state.instructors
    : [getInstructorById(requestedInstructorId)].filter(Boolean);

  return candidates
    .filter((instructor) => (
      isSlotInSchedule(instructor, dateKey, time)
      && !isSlotBooked(dateKey, time, instructor.id, ignoredId)
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

    getWorkHours(instructor.schedule).forEach((time) => slots.add(time));
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

  settingsForm.querySelectorAll("[name='workDays']").forEach((input) => {
    input.checked = settings.workDays.includes(Number(input.value));
  });

  const days = settings.workDays
    .map((day) => WEEKDAY_NAMES[day])
    .join(", ");
  const slotCount = getWorkHours(settings).length;
  settingsSummary.textContent = `Рабочие дни: ${days}. Время: ${settings.startTime}-${settings.endTime}. Длительность: ${settings.lessonDuration} минут. Слотов в день: ${slotCount}.`;
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

function showInstructorDashboard() {
  window.history.replaceState(null, "", "index.html#instructor");

  if (adminView) {
    adminView.hidden = false;
  }
  if (settingsView) {
    settingsView.hidden = true;
  }
  viewButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === "admin"));

  showAppScreen("instructor");
  render();
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

  instructor.schedule = normalizeSettings({
    workDays,
    startTime,
    endTime,
    lessonDuration,
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
  showAdminNote("Журнал очищен.");
  render();
  closeDrawer(editDrawer);
});

settingsForm?.addEventListener("submit", handleSettingsSubmit);
resetSettings?.addEventListener("click", () => {
  const instructor = getCurrentInstructor();

  if (!instructor) {
    showSettingsNote("Сначала войдите в кабинет инструктора.", true);
    return;
  }

  instructor.schedule = { ...DEFAULT_SETTINGS };
  state.activeDate = null;
  state.selectedSlot = null;
  saveInstructors();
  showSettingsNote("Настройки сброшены.");
  render();
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const view = button.dataset.view;

    if (adminView) {
      adminView.hidden = view !== "admin";
    }
    if (settingsView) {
      settingsView.hidden = view !== "settings";
    }

    viewButtons.forEach((item) => item.classList.toggle("active", item === button));
  });
});

render();

if (window.location.hash === "#student") {
  showStudentBooking();
} else if (window.location.hash === "#instructor") {
  openInstructorFlow();
} else {
  showAppScreen("role");
}
