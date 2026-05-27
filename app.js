const STORAGE_KEY = "drivingLessonBookings";
const WORK_HOURS = ["09:00", "11:00", "13:00", "15:00", "17:00"];
const DAY_COUNT = 7;

const state = {
  activeDate: null,
  selectedSlot: null,
  bookings: loadBookings(),
};

const dayTabs = document.querySelector("#dayTabs");
const slotGrid = document.querySelector("#slotGrid");
const bookingForm = document.querySelector("#bookingForm");
const selectedSlot = document.querySelector("#selectedSlot");
const bookingList = document.querySelector("#bookingList");
const formNote = document.querySelector("#formNote");
const exportCsv = document.querySelector("#exportCsv");
const clearDemo = document.querySelector("#clearDemo");
const bookingView = document.querySelector("#bookingView");
const adminView = document.querySelector("#adminView");
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

function saveBookings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookings));
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

  while (days.length < DAY_COUNT) {
    const candidate = new Date(date);
    candidate.setDate(date.getDate() + offset);
    offset += 1;

    if (candidate.getDay() !== 0) {
      days.push(candidate);
    }
  }

  return days;
}

function formatSlot(dateKey, time) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return `${fullDateFormatter.format(date)}, ${time}`;
}

function isSlotBooked(dateKey, time) {
  return state.bookings.some((booking) => booking.date === dateKey && booking.time === time);
}

function renderDays() {
  const days = getDays();

  if (!state.activeDate) {
    state.activeDate = toDateKey(days[0]);
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
  slotGrid.innerHTML = WORK_HOURS.map((time) => {
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
        <span>${booked ? "уже занято" : "60 минут"}</span>
      </button>
    `;
  }).join("");
}

function renderSelectedSlot() {
  if (!state.selectedSlot) {
    selectedSlot.textContent = "Выберите дату и время";
    selectedSlot.classList.remove("ready");
    return;
  }

  selectedSlot.textContent = formatSlot(state.selectedSlot.date, state.selectedSlot.time);
  selectedSlot.classList.add("ready");
}

function renderBookings() {
  const bookings = [...state.bookings].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  if (bookings.length === 0) {
    bookingList.innerHTML = `<p class="empty-state">Пока нет заявок. Новые записи появятся здесь сразу после отправки формы.</p>`;
    return;
  }

  bookingList.innerHTML = bookings
    .map((booking) => `
      <article class="booking-card">
        <div>
          <p class="booking-time">${formatSlot(booking.date, booking.time)}</p>
          <p>${booking.instructor}</p>
        </div>
        <div>
          <h3>${escapeHtml(booking.name)}</h3>
          <p>${escapeHtml(booking.phone)}${booking.email ? ` · ${escapeHtml(booking.email)}` : ""}</p>
        </div>
        <div>
          <span class="status-pill">${booking.mailing ? "email включен" : "только связь"}</span>
          <p>${booking.comment ? escapeHtml(booking.comment) : "Без комментария"}</p>
        </div>
        <button type="button" data-delete="${booking.id}">Удалить</button>
      </article>
    `)
    .join("");
}

function render() {
  renderDays();
  renderSlots();
  renderSelectedSlot();
  renderBookings();
}

function showNote(message, isError = false) {
  formNote.textContent = message;
  formNote.classList.toggle("error", isError);
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
  showNote("Готово. Заявка добавлена в журнал.");
  render();
}

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `booking-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function deleteBooking(id) {
  state.bookings = state.bookings.filter((booking) => booking.id !== id);
  saveBookings();
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
    showNote("Экспортировать пока нечего.", true);
    return;
  }

  const rows = [
    ["Дата", "Время", "Имя", "Телефон", "Email", "Инструктор", "Рассылка", "Комментарий", "Создано"],
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

dayTabs.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-date]");
  if (!tab) return;

  state.activeDate = tab.dataset.date;
  state.selectedSlot = null;
  showNote("");
  render();
});

slotGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-time]");
  if (!button || button.disabled) return;

  state.selectedSlot = {
    date: state.activeDate,
    time: button.dataset.time,
  };
  showNote("");
  render();
});

bookingList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;
  deleteBooking(button.dataset.delete);
});

bookingForm.addEventListener("submit", handleSubmit);
exportCsv.addEventListener("click", exportBookings);
clearDemo.addEventListener("click", () => {
  state.bookings = [];
  state.selectedSlot = null;
  saveBookings();
  render();
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const isAdmin = button.dataset.view === "admin";

    bookingView.hidden = isAdmin;
    adminView.hidden = !isAdmin;
    viewButtons.forEach((item) => item.classList.toggle("active", item === button));
  });
});

render();
