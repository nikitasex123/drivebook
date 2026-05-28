const STORAGE_KEY = "drivingLessonBookings";
const SETTINGS_KEY = "drivingLessonSettings";
const INSTRUCTOR_SESSION_KEY = "driveBookInstructorSession";
const INSTRUCTOR_LOGIN = "instructor";
const INSTRUCTOR_PASSWORD = "1234";
const DAY_COUNT = 7;
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
  editingId: null,
  bookings: loadBookings(),
  settings: loadSettings(),
};

const roleView = document.querySelector("#roleView");
const studentEntry = document.querySelector("#studentEntry");
const instructorEntry = document.querySelector("#instructorEntry");
const instructorLoginView = document.querySelector("#instructorLoginView");
const loginForm = document.querySelector("#loginForm");
const loginNote = document.querySelector("#loginNote");
const instructorShell = document.querySelector("#instructorShell");
const logoutInstructor = document.querySelector("#logoutInstructor");
const backHomeButtons = document.querySelectorAll("[data-back-home]");
const bookingView = document.querySelector("#bookingView");
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

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    return normalizeSettings(saved);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveBookings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookings));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function hasInstructorSession() {
  return localStorage.getItem(INSTRUCTOR_SESSION_KEY) === "true";
}

function setInstructorSession(value) {
  if (value) {
    localStorage.setItem(INSTRUCTOR_SESSION_KEY, "true");
    return;
  }

  localStorage.removeItem(INSTRUCTOR_SESSION_KEY);
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

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDays() {
  const days = [];
  const date = new Date();
  let offset = 0;

  while (days.length < DAY_COUNT && offset < 60) {
    const candidate = new Date(date);
    candidate.setDate(date.getDate() + offset);
    offset += 1;

    if (state.settings.workDays.includes(candidate.getDay())) {
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

function getWorkHours() {
  const start = timeToMinutes(state.settings.startTime);
  const end = timeToMinutes(state.settings.endTime);
  const duration = state.settings.lessonDuration;
  const slots = [];

  for (let time = start; time + duration <= end; time += duration) {
    slots.push(minutesToTime(time));
  }

  return slots;
}

function formatSlot(dateKey, time) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return `${fullDateFormatter.format(date)}, ${time}`;
}

function isSlotBooked(dateKey, time, ignoredId = null) {
  return state.bookings.some((booking) => (
    booking.id !== ignoredId && booking.date === dateKey && booking.time === time
  ));
}

function renderDays() {
  if (!dayTabs) return;

  const days = getDays();
  const visibleDates = days.map(toDateKey);

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

  const slots = getWorkHours();

  if (slots.length === 0) {
    slotGrid.innerHTML = `<p class="empty-state">В настройках нет доступного времени. Инструктор должен изменить расписание.</p>`;
    return;
  }

  slotGrid.innerHTML = slots.map((time) => {
    const booked = isSlotBooked(state.activeDate, time);
    const selected = state.selectedSlot?.date === state.activeDate && state.selectedSlot?.time === time;
    return `
      <button
        class="slot-button ${selected ? "selected" : ""}"
        type="button"
        data-time="${time}"
        ${booked ? "disabled" : ""}
        aria-pressed="${selected}"
      >
        <strong>${time}</strong>
        <span>${booked ? "уже занято" : `${state.settings.lessonDuration} минут`}</span>
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

  selectedSlot.textContent = formatSlot(state.selectedSlot.date, state.selectedSlot.time);
  selectedSlot.classList.add("ready");
}

function renderBookings() {
  if (!bookingList) return;

  const bookings = [...state.bookings].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  if (bookings.length === 0) {
    bookingList.innerHTML = `<p class="empty-state">Пока нет заявок. Новые записи появятся здесь после отправки учеником формы.</p>`;
    return;
  }

  bookingList.innerHTML = bookings
    .map((booking) => `
      <article class="booking-card ${state.editingId === booking.id ? "editing" : ""}">
        <div>
          <p class="booking-time">${formatSlot(booking.date, booking.time)}</p>
          <p>${escapeHtml(booking.instructor)}</p>
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

function renderSettingsForm() {
  if (!settingsForm || !settingsSummary) return;

  settingsForm.startTime.value = state.settings.startTime;
  settingsForm.endTime.value = state.settings.endTime;
  settingsForm.lessonDuration.value = String(state.settings.lessonDuration);

  settingsForm.querySelectorAll("[name='workDays']").forEach((input) => {
    input.checked = state.settings.workDays.includes(Number(input.value));
  });

  const days = state.settings.workDays
    .map((day) => WEEKDAY_NAMES[day])
    .join(", ");
  const slotCount = getWorkHours().length;
  settingsSummary.textContent = `Рабочие дни: ${days}. Время: ${state.settings.startTime}-${state.settings.endTime}. Длительность: ${state.settings.lessonDuration} минут. Слотов в день: ${slotCount}.`;
}

function renderEditForm() {
  if (!bookingEditForm) return;

  const booking = state.bookings.find((item) => item.id === state.editingId);

  if (editDrawer) {
    editDrawer.hidden = !booking;
  }

  if (!booking) {
    bookingEditForm.reset();
    return;
  }

  bookingEditForm.editDate.value = booking.date;
  bookingEditForm.editTime.value = booking.time;
  bookingEditForm.editInstructor.value = booking.instructor;
  bookingEditForm.editName.value = booking.name;
  bookingEditForm.editPhone.value = booking.phone;
  bookingEditForm.editEmail.value = booking.email;
  bookingEditForm.editComment.value = booking.comment;
  bookingEditForm.editMailing.checked = booking.mailing;
}

function render() {
  renderDays();
  renderSlots();
  renderSelectedSlot();
  renderBookings();
  renderSettingsForm();
  renderEditForm();
}

function openBookingDrawer() {
  if (!bookingDrawer) return;
  bookingDrawer.hidden = false;
  window.setTimeout(() => bookingForm?.studentName.focus(), 0);
}

function closeBookingDrawer() {
  if (!bookingDrawer) return;
  bookingDrawer.hidden = true;
  showNote("");
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
    <span>${formatSlot(booking.date, booking.time)} · ${escapeHtml(booking.instructor)}</span>
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

function showInstructorLogin() {
  window.history.replaceState(null, "", "index.html#instructor");
  showAppScreen("login");
  loginForm?.loginName.focus();
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

  if (isSlotBooked(state.selectedSlot.date, state.selectedSlot.time)) {
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

  const booking = {
    id: createId(),
    date: state.selectedSlot.date,
    time: state.selectedSlot.time,
    name,
    phone,
    email,
    instructor: formData.get("instructor"),
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

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `booking-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function startEditBooking(id) {
  state.editingId = id;
  showEditNote("");
  render();
  window.setTimeout(() => bookingEditForm?.editName.focus(), 0);
}

function cancelEditBooking() {
  state.editingId = null;
  showEditNote("");
  render();
}

function updateBooking(event) {
  event.preventDefault();

  const booking = state.bookings.find((item) => item.id === state.editingId);
  if (!booking) return;

  const formData = new FormData(bookingEditForm);
  const date = formData.get("editDate");
  const time = formData.get("editTime");
  const name = formData.get("editName").trim();
  const phone = formData.get("editPhone").trim();
  const email = formData.get("editEmail").trim();

  if (!validatePhone(phone)) {
    showEditNote("Проверьте телефон: нужно минимум 10 цифр.", true);
    return;
  }

  if (isSlotBooked(date, time, booking.id)) {
    showEditNote("На это время уже есть другая заявка.", true);
    return;
  }

  Object.assign(booking, {
    date,
    time,
    name,
    phone,
    email,
    instructor: formData.get("editInstructor"),
    comment: formData.get("editComment").trim(),
    mailing: formData.get("editMailing") === "on",
    updatedAt: new Date().toISOString(),
  });

  saveBookings();
  state.editingId = null;
  showAdminNote("Заявка обновлена.");
  render();
}

function deleteBooking(id) {
  state.bookings = state.bookings.filter((booking) => booking.id !== id);

  if (state.editingId === id) {
    state.editingId = null;
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
  if (state.bookings.length === 0) {
    showAdminNote("Экспортировать пока нечего.", true);
    return;
  }

  const rows = [
    ["Дата", "Время", "Имя", "Телефон", "Email", "Инструктор", "Рассылка", "Комментарий", "Создано", "Обновлено"],
    ...state.bookings.map((booking) => [
      booking.date,
      booking.time,
      booking.name,
      booking.phone,
      booking.email,
      booking.instructor,
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

  state.settings = normalizeSettings({
    workDays,
    startTime,
    endTime,
    lessonDuration,
  });
  state.activeDate = null;
  state.selectedSlot = null;
  saveSettings();
  showSettingsNote("Расписание сохранено. Страница ученика обновится при открытии.");
  render();
}

function handleLogin(event) {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const login = formData.get("loginName").trim();
  const password = formData.get("loginPassword").trim();

  if (login !== INSTRUCTOR_LOGIN || password !== INSTRUCTOR_PASSWORD) {
    showLoginNote("Неверный логин или пароль.", true);
    return;
  }

  setInstructorSession(true);
  loginForm.reset();
  showLoginNote("");
  showInstructorDashboard();
}

studentEntry?.addEventListener("click", showStudentBooking);
instructorEntry?.addEventListener("click", openInstructorFlow);
backHomeButtons.forEach((button) => button.addEventListener("click", showRoleChoice));
loginForm?.addEventListener("submit", handleLogin);
logoutInstructor?.addEventListener("click", () => {
  setInstructorSession(false);
  showRoleChoice();
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
  if (event.key === "Escape" && state.editingId) {
    cancelEditBooking();
  }
  if (event.key === "Escape" && bookingDrawer && !bookingDrawer.hidden) {
    closeBookingDrawer();
  }
});
exportCsv?.addEventListener("click", exportBookings);
clearDemo?.addEventListener("click", () => {
  state.bookings = [];
  state.selectedSlot = null;
  state.editingId = null;
  saveBookings();
  showAdminNote("Журнал очищен.");
  render();
});

settingsForm?.addEventListener("submit", handleSettingsSubmit);
resetSettings?.addEventListener("click", () => {
  state.settings = { ...DEFAULT_SETTINGS };
  state.activeDate = null;
  state.selectedSlot = null;
  saveSettings();
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
