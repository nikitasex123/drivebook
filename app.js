const STORAGE_KEY = "drivingLessonBookings";
const SETTINGS_KEY = "drivingLessonSettings";
const INSTRUCTORS_KEY = "drivingLessonInstructors";
const STUDENTS_KEY = "driveBookStudents";
const SCHOOLS_KEY = "driveBookSchools";
const INSTRUCTOR_SESSION_KEY = "driveBookInstructorSession";
const STUDENT_SESSION_KEY = "driveBookStudentSession";
const ADMIN_SESSION_KEY = "driveBookAdminSession";
const ANY_INSTRUCTOR_ID = "any";
const ALL_SCHOOLS_ID = "all";
const ALL_STATUSES_ID = "all";
const ALL_PERIODS_ID = "all";
const INTERNAL_TEST_INSTRUCTOR_IDS = new Set(["codex-test-instructor"]);
const INSTRUCTOR_STATUSES = new Set(["pending", "approved", "blocked"]);
const BOOKING_STATUSES = new Set(["new", "confirmed", "completed", "cancelled"]);
const STUDENT_BOOKING_FILTERS = new Set(["upcoming", "history", "cancelled"]);
const INSTRUCTOR_PERIOD_FILTERS = new Set(["all", "today", "upcoming", "past"]);
const DAY_COUNT = 7;
const DRAWER_TRANSITION_MS = 300;
const MIN_PASSWORD_LENGTH = 8;
const INITIAL_LOCATION_HASH = window.location.hash;
const INITIAL_LOCATION_SEARCH = window.location.search;
const BLOCKED_EMAIL_DOMAINS = new Set([
  "example.com",
  "example.net",
  "example.org",
  "test.com",
  "test.ru",
  "localhost",
  "mailinator.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
]);
const BLOCKED_EMAIL_NAMES = new Set(["test", "fake", "qwe", "qwerty", "asdf", "mail"]);
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
  selectedSchoolId: ALL_SCHOOLS_ID,
  selectedInstructorId: ANY_INSTRUCTOR_ID,
  studentBookingsFilter: "upcoming",
  instructorStatusFilter: ALL_STATUSES_ID,
  instructorPeriodFilter: ALL_PERIODS_ID,
  instructorSearchQuery: "",
  editingId: null,
  calendarStart: getStartOfWeek(new Date()),
  bookings: loadBookings(),
  bookedSlots: [],
  instructors: loadInstructors(),
  students: loadStudents(),
  schools: loadSchools(),
  currentInstructorId: localStorage.getItem(INSTRUCTOR_SESSION_KEY),
  currentStudentId: localStorage.getItem(STUDENT_SESSION_KEY),
  currentAdminId: localStorage.getItem(ADMIN_SESSION_KEY),
  isAdmin: false,
  studentsSchemaReady: false,
  schoolsSchemaReady: false,
  bookingStatusSchemaReady: false,
};

const syncStatus = document.querySelector("#syncStatus");
const syncStatusText = syncStatus?.querySelector(".sync-status__text");
const roleView = document.querySelector("#roleView");
const studentEntry = document.querySelector("#studentEntry");
const instructorEntry = document.querySelector("#instructorEntry");
const adminEntry = document.querySelector("#adminEntry");
const studentLoginView = document.querySelector("#studentLoginView");
const studentLoginForm = document.querySelector("#studentLoginForm");
const studentRegisterForm = document.querySelector("#studentRegisterForm");
const showStudentRegister = document.querySelector("#showStudentRegister");
const showStudentLogin = document.querySelector("#showStudentLogin");
const studentResetPassword = document.querySelector("#studentResetPassword");
const studentLoginNote = document.querySelector("#studentLoginNote");
const studentRegisterNote = document.querySelector("#studentRegisterNote");
const instructorLoginView = document.querySelector("#instructorLoginView");
const adminLoginView = document.querySelector("#adminLoginView");
const loginForm = document.querySelector("#loginForm");
const adminLoginForm = document.querySelector("#adminLoginForm");
const registerForm = document.querySelector("#registerForm");
const showRegister = document.querySelector("#showRegister");
const showLogin = document.querySelector("#showLogin");
const instructorResetPassword = document.querySelector("#instructorResetPassword");
const adminResetPassword = document.querySelector("#adminResetPassword");
const loginNote = document.querySelector("#loginNote");
const adminLoginNote = document.querySelector("#adminLoginNote");
const registerNote = document.querySelector("#registerNote");
const passwordResetView = document.querySelector("#passwordResetView");
const passwordResetForm = document.querySelector("#passwordResetForm");
const passwordResetNote = document.querySelector("#passwordResetNote");
const instructorShell = document.querySelector("#instructorShell");
const adminShell = document.querySelector("#adminShell");
const currentInstructorName = document.querySelector("#currentInstructorName");
const currentStudentName = document.querySelector("#currentStudentName");
const currentAdminName = document.querySelector("#currentAdminName");
const logoutInstructor = document.querySelector("#logoutInstructor");
const logoutStudent = document.querySelector("#logoutStudent");
const logoutAdmin = document.querySelector("#logoutAdmin");
const backHomeButtons = document.querySelectorAll("[data-back-home]");
const bookingView = document.querySelector("#bookingView");
const studentFlowSteps = document.querySelector("#studentFlowSteps");
const studentSchoolFilter = document.querySelector("#studentSchoolFilter");
const studentInstructorFilter = document.querySelector("#studentInstructorFilter");
const studentChoiceSummary = document.querySelector("#studentChoiceSummary");
const studentBookingFilterButtons = document.querySelectorAll("[data-student-booking-filter]");
const studentUpcomingBookings = document.querySelector("#studentUpcomingBookings");
const dayTabs = document.querySelector("#dayTabs");
const slotGrid = document.querySelector("#slotGrid");
const bookingDrawer = document.querySelector("#bookingDrawer");
const bookingForm = document.querySelector("#bookingForm");
const closeBooking = document.querySelector("#closeBooking");
const cancelBooking = document.querySelector("#cancelBooking");
const bookingSuccess = document.querySelector("#bookingSuccess");
const selectedSlot = document.querySelector("#selectedSlot");
const studentProfileSummary = document.querySelector("#studentProfileSummary");
const studentDetailsFields = document.querySelector("#studentDetailsFields");
const bookingList = document.querySelector("#bookingList");
const schoolForm = document.querySelector("#schoolForm");
const schoolList = document.querySelector("#schoolList");
const instructorApprovalList = document.querySelector("#instructorApprovalList");
const formNote = document.querySelector("#formNote");
const adminNote = document.querySelector("#adminNote");
const journalStatusFilter = document.querySelector("#journalStatusFilter");
const journalPeriodFilter = document.querySelector("#journalPeriodFilter");
const journalSearch = document.querySelector("#journalSearch");
const journalFilterSummary = document.querySelector("#journalFilterSummary");
const schoolNote = document.querySelector("#schoolNote");
const approvalNote = document.querySelector("#approvalNote");
const exportCsv = document.querySelector("#exportCsv");
const clearDemo = document.querySelector("#clearDemo");
const adminView = document.querySelector("#adminView");
const calendarView = document.querySelector("#calendarView");
const analyticsView = document.querySelector("#analyticsView");
const settingsView = document.querySelector("#settingsView");
const notificationList = document.querySelector("#notificationList");
const todayBookingList = document.querySelector("#todayBookingList");
const upcomingBookingList = document.querySelector("#upcomingBookingList");
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

const syncUiState = {
  pending: 0,
  idleTimer: null,
};

function setSyncStatus(status, message, detail = "") {
  if (!syncStatus || !syncStatusText) return;

  window.clearTimeout(syncUiState.idleTimer);
  syncStatus.dataset.status = status;
  syncStatusText.textContent = message;
  syncStatus.title = detail;
}

function describeSyncError(error) {
  return error?.message || error?.details || "Проверьте подключение к интернету и настройки Supabase.";
}

function isSupabaseSchemaError(error) {
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? error?.details ?? "").toLowerCase();

  return (
    code === "42P01"
    || code === "42703"
    || code === "PGRST204"
    || code === "PGRST205"
    || message.includes("does not exist")
    || message.includes("schema cache")
    || message.includes("column")
  );
}

function showSyncIdleStatus() {
  syncUiState.pending = 0;

  if (isSupabaseEnabled) {
    setSyncStatus("online", "Сервер подключен");
    return;
  }

  setSyncStatus("local", "Локальный режим", "Supabase не подключен, данные сохраняются только в этом браузере.");
}

function startSyncStatus(message = "Синхронизация") {
  if (!isSupabaseEnabled) {
    showSyncIdleStatus();
    return false;
  }

  syncUiState.pending += 1;
  setSyncStatus("syncing", message);
  return true;
}

function finishSyncSuccess(message = "Сохранено на сервере") {
  if (!isSupabaseEnabled) return;

  syncUiState.pending = Math.max(0, syncUiState.pending - 1);
  if (syncUiState.pending > 0) return;

  setSyncStatus("saved", message);
  syncUiState.idleTimer = window.setTimeout(() => {
    if (syncUiState.pending === 0) {
      setSyncStatus("online", "Сервер подключен");
    }
  }, 2600);
}

function finishSyncError(error, message = "Ошибка синхронизации") {
  syncUiState.pending = 0;
  setSyncStatus("error", message, describeSyncError(error));
}

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

function loadStudents() {
  try {
    const saved = JSON.parse(localStorage.getItem(STUDENTS_KEY)) ?? [];
    return saved.map(normalizeStudent).filter(Boolean);
  } catch {
    return [];
  }
}

function loadSchools() {
  try {
    const saved = JSON.parse(localStorage.getItem(SCHOOLS_KEY)) ?? [];
    return saved.map(normalizeSchool).filter(Boolean);
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

function saveInstructors(instructorsToSync = null) {
  localStorage.setItem(INSTRUCTORS_KEY, JSON.stringify(state.instructors));
  return syncInstructorsToSupabase(instructorsToSync);
}

function saveStudents(studentsToSync = null) {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(state.students));
  return syncStudentsToSupabase(studentsToSync);
}

function saveSchools(schoolsToSync = null) {
  localStorage.setItem(SCHOOLS_KEY, JSON.stringify(state.schools));
  return syncSchoolsToSupabase(schoolsToSync);
}

function mapSchoolFromRow(row) {
  return normalizeSchool({
    id: row.id,
    name: row.name,
    slug: row.slug,
    inviteKey: row.invite_key,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function mapSchoolDirectoryFromRow(row) {
  return normalizeSchool({
    id: row.id,
    name: row.name,
    slug: row.slug,
    inviteKey: "",
    isActive: row.is_active,
  });
}

function mapSchoolToRow(school) {
  return {
    id: school.id,
    name: school.name,
    slug: school.slug,
    invite_key: school.inviteKey,
    is_active: school.isActive,
    created_by: school.createdBy,
    created_at: school.createdAt,
    updated_at: school.updatedAt,
  };
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
    status: row.status,
    schoolId: row.school_id,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    schedule: row.schedule,
    notifications: row.notifications,
    createdAt: row.created_at,
  });
}

function mapInstructorToRow(instructor) {
  const row = {
    id: instructor.id,
    first_name: instructor.firstName,
    last_name: instructor.lastName,
    patronymic: instructor.patronymic,
    phone: instructor.phone,
    email: instructor.email,
    login: instructor.login,
    password: instructor.password,
    status: instructor.status,
    approved_at: instructor.approvedAt,
    approved_by: instructor.approvedBy,
    schedule: instructor.schedule,
    notifications: instructor.notifications,
    created_at: instructor.createdAt,
  };

  if (state.schoolsSchemaReady) {
    row.school_id = instructor.schoolId || null;
  }

  return row;
}

function mapBookedSlotFromRow(row) {
  return {
    id: row.id,
    date: row.lesson_date,
    time: String(row.lesson_time ?? "").slice(0, 5),
    instructorId: row.instructor_id,
  };
}

function mapStudentFromRow(row) {
  return normalizeStudent({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    patronymic: row.patronymic,
    phone: row.phone,
    email: row.email,
    createdAt: row.created_at,
  });
}

function mapStudentToRow(student) {
  return {
    id: student.id,
    first_name: student.firstName,
    last_name: student.lastName,
    patronymic: student.patronymic,
    phone: student.phone,
    email: student.email,
    created_at: student.createdAt,
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
    studentId: booking.studentId ?? booking.student_id ?? "",
    instructorId: booking.instructorId ?? booking.instructor_id ?? "",
    instructorName: booking.instructorName ?? booking.instructor_name ?? booking.instructor ?? "Инструктор не назначен",
    instructor: booking.instructor ?? booking.instructorName ?? booking.instructor_name ?? "Инструктор не назначен",
    status: normalizeBookingStatus(booking.status),
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
    studentId: row.student_id,
    instructorId: row.instructor_id,
    instructorName: row.instructor_name,
    instructor: row.instructor_name,
    status: row.status,
    comment: row.comment,
    mailing: row.mailing,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function mapBookingToRow(booking) {
  const normalized = normalizeBooking(booking);
  const row = {
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

  if (state.studentsSchemaReady) {
    row.student_id = normalized.studentId || null;
  }

  if (state.bookingStatusSchemaReady) {
    row.status = normalized.status;
  }

  return row;
}

async function loadSupabaseState() {
  if (!isSupabaseEnabled) {
    showSyncIdleStatus();
    return;
  }

  startSyncStatus("Подключаем сервер");

  try {
    const localInstructors = [...state.instructors];
    const localStudents = [...state.students];
    const localSchools = [...state.schools];
    const localBookings = [...state.bookings];
    const shouldLoadStudents = state.isAdmin || Boolean(state.currentStudentId);
    const shouldLoadPrivateBookings = state.isAdmin || Boolean(state.currentInstructorId) || Boolean(state.currentStudentId);
    const schoolsRequest = state.isAdmin
      ? supabaseClient.from("schools").select("*").order("created_at", { ascending: true })
      : supabaseClient.from("school_directory").select("*").order("name", { ascending: true });
    const studentsRequest = shouldLoadStudents
      ? supabaseClient.from("students").select("*").order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null });
    const bookingsRequest = shouldLoadPrivateBookings
      ? supabaseClient.from("bookings").select("*").order("lesson_date", { ascending: true }).order("lesson_time", { ascending: true })
      : Promise.resolve({ data: [], error: null });
    const [schoolsResult, instructorsResult, studentsResult, bookingsResult, slotsResult, statusSchemaResult] = await Promise.all([
      schoolsRequest,
      supabaseClient.from("instructors").select("*").order("created_at", { ascending: true }),
      studentsRequest,
      bookingsRequest,
      supabaseClient.from("booked_slots").select("*"),
      supabaseClient.from("bookings").select("status").limit(1),
    ]);

    if (instructorsResult.error) throw instructorsResult.error;
    if (shouldLoadPrivateBookings && bookingsResult.error) throw bookingsResult.error;

    state.studentsSchemaReady = !isSupabaseSchemaError(studentsResult.error);
    if (studentsResult.error) {
      console.warn("Supabase students table is not ready", studentsResult.error);
    }

    state.schoolsSchemaReady = !isSupabaseSchemaError(schoolsResult.error);
    if (schoolsResult.error) {
      console.warn("Supabase schools table is not ready", schoolsResult.error);
    }
    state.bookingStatusSchemaReady = !isSupabaseSchemaError(statusSchemaResult.error);
    if (statusSchemaResult.error) {
      console.warn("Supabase booking status column is not ready", statusSchemaResult.error);
    }

    const remoteSchools = state.schoolsSchemaReady && !schoolsResult.error
      ? schoolsResult.data.map(state.isAdmin ? mapSchoolFromRow : mapSchoolDirectoryFromRow).filter(Boolean)
      : localSchools;
    const remoteInstructors = instructorsResult.data.map(mapInstructorFromRow).filter(isVisibleInstructor);
    const remoteStudents = state.studentsSchemaReady && shouldLoadStudents && !studentsResult.error
      ? studentsResult.data.map(mapStudentFromRow).filter(Boolean)
      : localStudents;
    const remoteBookings = shouldLoadPrivateBookings
      ? bookingsResult.data
        .map(mapBookingFromRow)
        .filter((booking) => !INTERNAL_TEST_INSTRUCTOR_IDS.has(booking.instructorId))
      : [];
    const remoteSlots = slotsResult.error
      ? remoteBookings.map((booking) => ({
        id: booking.id,
        date: booking.date,
        time: booking.time,
        instructorId: getBookingInstructorId(booking),
      }))
      : slotsResult.data.map(mapBookedSlotFromRow).filter((slot) => (
        slot.date && slot.time && slot.instructorId && !INTERNAL_TEST_INSTRUCTOR_IDS.has(slot.instructorId)
      ));

    const shouldSyncLocalInstructors = state.isAdmin && remoteInstructors.length === 0 && localInstructors.length > 0;
    const shouldSyncLocalStudents = state.isAdmin && state.studentsSchemaReady && remoteStudents.length === 0 && localStudents.length > 0;
    const shouldSyncLocalSchools = state.isAdmin && state.schoolsSchemaReady && remoteSchools.length === 0 && localSchools.length > 0;
    const shouldSyncLocalBookings = state.isAdmin && shouldLoadPrivateBookings && remoteBookings.length === 0 && localBookings.length > 0;

    state.schools = shouldSyncLocalSchools ? localSchools : remoteSchools;
    state.instructors = shouldSyncLocalInstructors ? localInstructors : remoteInstructors;
    state.students = shouldSyncLocalStudents ? localStudents : remoteStudents;
    state.bookings = shouldSyncLocalBookings ? localBookings : remoteBookings;
    state.bookedSlots = shouldSyncLocalBookings
      ? localBookings.map((booking) => ({
        id: booking.id,
        date: booking.date,
        time: booking.time,
        instructorId: getBookingInstructorId(booking),
      }))
      : remoteSlots;

    await Promise.all([
      shouldSyncLocalSchools ? syncSchoolsToSupabase(localSchools) : Promise.resolve(true),
      shouldSyncLocalInstructors ? syncInstructorsToSupabase(localInstructors) : Promise.resolve(true),
      shouldSyncLocalStudents ? syncStudentsToSupabase(localStudents) : Promise.resolve(true),
      shouldSyncLocalBookings ? syncBookingsToSupabase() : Promise.resolve(true),
    ]);

    localStorage.setItem(SCHOOLS_KEY, JSON.stringify(state.schools));
    localStorage.setItem(INSTRUCTORS_KEY, JSON.stringify(state.instructors));
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(state.students));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookings));

    if (state.currentInstructorId && !getCurrentInstructor()) {
      setInstructorSession(null);
    }
    if (state.currentStudentId && !getCurrentStudent()) {
      setStudentSession(null);
    }
    syncUiState.pending = 0;
    setSyncStatus("online", "Сервер подключен");
  } catch (error) {
    console.error("Supabase load failed", error);
    finishSyncError(error, "Ошибка подключения");
  }
}

async function syncInstructorsToSupabase(items = null) {
  const source = Array.isArray(items)
    ? items
    : state.isAdmin
      ? state.instructors
      : state.instructors.filter((instructor) => instructor.id === state.currentInstructorId);
  const instructorsToSync = source.filter(isVisibleInstructor);

  if (!isSupabaseEnabled || instructorsToSync.length === 0) {
    showSyncIdleStatus();
    return true;
  }

  startSyncStatus("Сохраняем инструкторов");

  try {
    const { error } = await supabaseClient
      .from("instructors")
      .upsert(instructorsToSync.map(mapInstructorToRow), { onConflict: "id" });

    if (error) throw error;
    finishSyncSuccess("Инструкторы сохранены");
    return true;
  } catch (error) {
    console.error("Supabase instructors sync failed", error);
    finishSyncError(error);
    return false;
  }
}

async function syncStudentsToSupabase(items = null) {
  const source = Array.isArray(items)
    ? items
    : state.isAdmin
      ? state.students
      : state.students.filter((student) => student.id === state.currentStudentId);
  const studentsToSync = source.filter(Boolean);

  if (!isSupabaseEnabled || studentsToSync.length === 0) {
    showSyncIdleStatus();
    return true;
  }

  if (!state.studentsSchemaReady) {
    finishSyncError(null, "Обновите схему Supabase");
    return false;
  }

  startSyncStatus("Сохраняем учеников");

  try {
    const { error } = await supabaseClient
      .from("students")
      .upsert(studentsToSync.map(mapStudentToRow), { onConflict: "id" });

    if (error) throw error;
    finishSyncSuccess("Ученики сохранены");
    return true;
  } catch (error) {
    console.error("Supabase students sync failed", error);
    finishSyncError(error);
    return false;
  }
}

async function syncSchoolsToSupabase(items = null) {
  const schoolsToSync = Array.isArray(items) ? items : state.schools;

  if (!isSupabaseEnabled || !state.isAdmin || schoolsToSync.length === 0) {
    showSyncIdleStatus();
    return true;
  }

  if (!state.schoolsSchemaReady) {
    finishSyncError(null, "Обновите схему Supabase");
    return false;
  }

  startSyncStatus("Сохраняем автошколы");

  try {
    const { error } = await supabaseClient
      .from("schools")
      .upsert(schoolsToSync.map(mapSchoolToRow), { onConflict: "id" });

    if (error) throw error;
    finishSyncSuccess("Автошколы сохранены");
    return true;
  } catch (error) {
    console.error("Supabase schools sync failed", error);
    finishSyncError(error);
    return false;
  }
}

async function syncBookingsToSupabase() {
  if (!isSupabaseEnabled || state.bookings.length === 0) {
    showSyncIdleStatus();
    return true;
  }

  startSyncStatus("Сохраняем заявки");

  try {
    const { error } = await supabaseClient
      .from("bookings")
      .upsert(state.bookings.map(mapBookingToRow), { onConflict: "id" });

    if (error) throw error;
    finishSyncSuccess("Заявки сохранены");
    return true;
  } catch (error) {
    console.error("Supabase bookings sync failed", error);
    finishSyncError(error);
    return false;
  }
}

async function createBookingInSupabase(booking) {
  if (!isSupabaseEnabled) {
    showSyncIdleStatus();
    return true;
  }

  startSyncStatus("Создаем запись");

  try {
    const { error } = await supabaseClient
      .from("bookings")
      .insert(mapBookingToRow(booking));

    if (error) throw error;
    finishSyncSuccess("Запись создана");
    return true;
  } catch (error) {
    console.error("Supabase booking create failed", error);
    finishSyncError(error, "Не удалось создать запись");
    return false;
  }
}

async function updateBookingStatusInSupabase(booking, status) {
  if (!isSupabaseEnabled) {
    showSyncIdleStatus();
    return true;
  }

  if (!state.bookingStatusSchemaReady) {
    finishSyncError(null, "Обновите схему Supabase");
    return false;
  }

  startSyncStatus("Обновляем статус");

  const { error } = await supabaseClient
    .from("bookings")
    .update({
      status,
      updated_at: booking.updatedAt,
    })
    .eq("id", booking.id);

  if (error) {
    finishSyncError(error, "Не удалось обновить статус");
    return false;
  }

  finishSyncSuccess("Статус обновлен");
  return true;
}

async function deleteBookingFromSupabase(id) {
  if (!isSupabaseEnabled) {
    showSyncIdleStatus();
    return true;
  }

  startSyncStatus("Удаляем заявку");

  try {
    const { error } = await supabaseClient.from("bookings").delete().eq("id", id);
    if (error) throw error;
    finishSyncSuccess("Заявка удалена");
    return true;
  } catch (error) {
    console.error("Supabase booking delete failed", error);
    finishSyncError(error);
    return false;
  }
}

async function deleteInstructorBookingsFromSupabase(instructorId) {
  if (!isSupabaseEnabled) {
    showSyncIdleStatus();
    return true;
  }

  startSyncStatus("Очищаем журнал");

  try {
    const { error } = await supabaseClient.from("bookings").delete().eq("instructor_id", instructorId);
    if (error) throw error;
    finishSyncSuccess("Журнал очищен");
    return true;
  } catch (error) {
    console.error("Supabase instructor bookings clear failed", error);
    finishSyncError(error);
    return false;
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

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isValidEmail(value) {
  const email = normalizeEmail(value);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return false;
  }

  const [name, domain] = email.split("@");
  if (!name || !domain || BLOCKED_EMAIL_DOMAINS.has(domain) || BLOCKED_EMAIL_NAMES.has(name)) {
    return false;
  }

  if (/^([a-z0-9])\1{4,}$/i.test(name)) {
    return false;
  }

  return true;
}

function normalizePhone(value) {
  let digits = String(value ?? "").replace(/\D/g, "");

  if (digits.length === 10 && digits.startsWith("9")) {
    digits = `7${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  }

  if (digits.length !== 11 || !digits.startsWith("79")) {
    return "";
  }

  return `+${digits}`;
}

function isLikelyFakePhone(value) {
  const digits = normalizePhone(value).replace(/\D/g, "");
  const localNumber = digits.slice(1);

  if (!localNumber) {
    return true;
  }

  if (/^(\d)\1{8,}$/.test(localNumber)) {
    return true;
  }

  return [
    "9000000000",
    "9999999999",
    "9876543210",
    "1234567890",
    "9001234567",
    "9123456789",
  ].includes(localNumber);
}

function isValidPhone(value) {
  const phone = normalizePhone(value);
  return Boolean(phone) && !isLikelyFakePhone(phone);
}

function formatPhone(value) {
  const phone = normalizePhone(value);
  if (!phone) {
    return String(value ?? "").trim();
  }

  return phone.replace(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/, "+7 $1 $2-$3-$4");
}

function getRussianPlural(count, forms) {
  const value = Math.abs(Number(count)) % 100;
  const lastDigit = value % 10;

  if (value > 10 && value < 20) return forms[2];
  if (lastDigit > 1 && lastDigit < 5) return forms[1];
  if (lastDigit === 1) return forms[0];
  return forms[2];
}

function getInstructorByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  return state.instructors.find((instructor) => normalizeEmail(instructor.email) === normalizedEmail) ?? null;
}

function getInstructorByPhone(phone) {
  const normalizedPhone = normalizePhone(phone);
  return state.instructors.find((instructor) => normalizePhone(instructor.phone) === normalizedPhone) ?? null;
}

function normalizeInstructorStatus(status) {
  const normalized = String(status ?? "").trim().toLowerCase();
  return INSTRUCTOR_STATUSES.has(normalized) ? normalized : "approved";
}

function normalizeBookingStatus(status) {
  const normalized = String(status ?? "").trim().toLowerCase();
  return BOOKING_STATUSES.has(normalized) ? normalized : "new";
}

function isBookingCancelled(booking) {
  return normalizeBookingStatus(booking?.status) === "cancelled";
}

function isBookingActive(booking) {
  return !isBookingCancelled(booking);
}

function isBookingUpcoming(booking) {
  return isBookingActive(booking) && getBookingStartsAt(booking) >= new Date();
}

function isBookingPast(booking) {
  return getBookingStartsAt(booking) < new Date();
}

function normalizeInviteKey(value) {
  return String(value ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeSchool(school) {
  if (!school || typeof school !== "object") {
    return null;
  }

  const name = String(school.name ?? "").trim();
  const inviteKey = normalizeInviteKey(school.inviteKey ?? school.invite_key);

  if (!school.id || !name) {
    return null;
  }

  return {
    id: String(school.id),
    name,
    slug: String(school.slug ?? `school-${String(school.id).slice(0, 8)}`).trim(),
    inviteKey,
    isActive: school.isActive ?? school.is_active ?? true,
    createdBy: school.createdBy ?? school.created_by ?? null,
    createdAt: school.createdAt ?? school.created_at ?? new Date().toISOString(),
    updatedAt: school.updatedAt ?? school.updated_at ?? new Date().toISOString(),
  };
}

function isInstructorApproved(instructor) {
  return normalizeInstructorStatus(instructor?.status) === "approved";
}

function isInstructorPending(instructor) {
  return normalizeInstructorStatus(instructor?.status) === "pending";
}

function isInstructorBlocked(instructor) {
  return normalizeInstructorStatus(instructor?.status) === "blocked";
}

function getPublicInstructors() {
  return state.instructors.filter((instructor) => isVisibleInstructor(instructor) && isInstructorApproved(instructor));
}

function getActiveSchools() {
  return state.schools.filter((school) => school.isActive);
}

function getStudentVisibleInstructors() {
  const instructors = getPublicInstructors();

  if (state.selectedSchoolId === ALL_SCHOOLS_ID) {
    return instructors;
  }

  return instructors.filter((instructor) => instructor.schoolId === state.selectedSchoolId);
}

function normalizeStudent(student) {
  if (!student || typeof student !== "object") {
    return null;
  }

  const firstName = String(student.firstName ?? "").trim();
  const lastName = String(student.lastName ?? "").trim();
  const email = normalizeEmail(student.email);
  const phone = normalizePhone(student.phone);

  if (!firstName || !lastName || !email || !phone) {
    return null;
  }

  return {
    id: String(student.id ?? createId("student")),
    firstName,
    lastName,
    patronymic: String(student.patronymic ?? "").trim(),
    phone: formatPhone(phone),
    email,
    createdAt: student.createdAt ?? new Date().toISOString(),
  };
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
    phone: normalizePhone(instructor.phone) ? formatPhone(instructor.phone) : String(instructor.phone ?? "").trim(),
    email: normalizeEmail(instructor.email),
    login,
    password: String(instructor.password ?? ""),
    status: normalizeInstructorStatus(instructor.status),
    schoolId: instructor.schoolId ?? instructor.school_id ?? null,
    approvedAt: instructor.approvedAt ?? instructor.approved_at ?? null,
    approvedBy: instructor.approvedBy ?? instructor.approved_by ?? null,
    schedule: normalizeSettings(instructor.schedule),
    notifications: normalizeNotifications(instructor.notifications),
    createdAt: instructor.createdAt ?? new Date().toISOString(),
  };
}

function hasInstructorSession() {
  return Boolean(getCurrentInstructor());
}

function hasStudentSession() {
  return Boolean(getCurrentStudent());
}

function setInstructorSession(instructorId) {
  state.currentInstructorId = instructorId || null;

  if (instructorId) {
    localStorage.setItem(INSTRUCTOR_SESSION_KEY, instructorId);
    return;
  }

  localStorage.removeItem(INSTRUCTOR_SESSION_KEY);
}

function setStudentSession(studentId) {
  state.currentStudentId = studentId || null;

  if (studentId) {
    localStorage.setItem(STUDENT_SESSION_KEY, studentId);
    return;
  }

  localStorage.removeItem(STUDENT_SESSION_KEY);
}

function setAdminSession(adminId) {
  state.currentAdminId = adminId || null;
  state.isAdmin = Boolean(adminId);

  if (adminId) {
    localStorage.setItem(ADMIN_SESSION_KEY, adminId);
    return;
  }

  localStorage.removeItem(ADMIN_SESSION_KEY);
}

function getCurrentInstructor() {
  return state.instructors.find((instructor) => instructor.id === state.currentInstructorId) ?? null;
}

function getCurrentStudent() {
  return state.students.find((student) => student.id === state.currentStudentId) ?? null;
}

function getInstructorById(instructorId) {
  return state.instructors.find((instructor) => instructor.id === instructorId) ?? null;
}

function getStudentById(studentId) {
  return state.students.find((student) => student.id === studentId) ?? null;
}

function getInstructorByLogin(login) {
  const normalizedLogin = normalizeLogin(login);
  return state.instructors.find((instructor) => instructor.login === normalizedLogin) ?? null;
}

function getStudentByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  return state.students.find((student) => student.email === normalizedEmail) ?? null;
}

function getStudentByPhone(phone) {
  const normalizedPhone = normalizePhone(phone);
  return state.students.find((student) => normalizePhone(student.phone) === normalizedPhone) ?? null;
}

function getSchoolById(schoolId) {
  return state.schools.find((school) => school.id === schoolId) ?? null;
}

function getSchoolBySlug(slug) {
  const normalizedSlug = String(slug ?? "").trim();
  return state.schools.find((school) => school.slug === normalizedSlug) ?? null;
}

function getInstructorSchoolName(instructor) {
  return getSchoolById(instructor?.schoolId)?.name ?? "Без автошколы";
}

function getInstructorName(instructor) {
  if (!instructor) {
    return "Инструктор не назначен";
  }

  return [instructor.lastName, instructor.firstName, instructor.patronymic]
    .filter(Boolean)
    .join(" ");
}

function getStudentName(student) {
  if (!student) {
    return "Ученик";
  }

  return [student.lastName, student.firstName, student.patronymic]
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

function getBookingStatusLabel(status) {
  const normalized = normalizeBookingStatus(status);
  if (normalized === "confirmed") return "подтверждена";
  if (normalized === "completed") return "завершена";
  if (normalized === "cancelled") return "отменена";
  return "новая";
}

function getStatusActionLabel(status) {
  const normalized = normalizeBookingStatus(status);
  if (normalized === "confirmed") return "Завершить";
  if (normalized === "completed") return "Вернуть в подтвержденные";
  if (normalized === "cancelled") return "Вернуть в новые";
  return "Подтвердить";
}

function getNextBookingStatus(status) {
  const normalized = normalizeBookingStatus(status);
  if (normalized === "confirmed") return "completed";
  if (normalized === "completed") return "confirmed";
  if (normalized === "cancelled") return "new";
  return "confirmed";
}

function getStudentBookingFilterLabel(filter) {
  if (filter === "history") return "истории";
  if (filter === "cancelled") return "отменённых занятиях";
  return "будущих занятиях";
}

function getInstructorPeriodFilterLabel(filter) {
  if (filter === "today") return "сегодня";
  if (filter === "upcoming") return "будущие";
  if (filter === "past") return "прошедшие";
  return "все даты";
}

function formatPhoneHref(value) {
  const normalized = normalizePhone(value);
  return normalized || String(value ?? "").replace(/[^\d+]/g, "");
}

function getBookingStartsAt(booking) {
  return getBookingStartDate(booking.date, booking.time);
}

function getCurrentInstructorBookings() {
  const currentInstructor = getCurrentInstructor();
  if (!currentInstructor) {
    return [];
  }

  return state.bookings.filter((booking) => getBookingInstructorId(booking) === currentInstructor.id);
}

function getCurrentStudentBookings() {
  const currentStudent = getCurrentStudent();
  if (!currentStudent) {
    return [];
  }

  return state.bookings.filter((booking) => booking.studentId === currentStudent.id);
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
  const instructors = getStudentVisibleInstructors();

  if (state.selectedInstructorId === ANY_INSTRUCTOR_ID) {
    return instructors;
  }

  return [instructors.find((instructor) => instructor.id === state.selectedInstructorId)].filter(Boolean);
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

function getStudentCalendarDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: DAY_COUNT }, (_, index) => addDays(today, index));
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
  const bookingMatches = state.bookings.some((booking) => (
    booking.id !== ignoredId
    && isBookingActive(booking)
    && booking.date === dateKey
    && booking.time === time
    && getBookingInstructorId(booking) === instructorId
  ));
  const slotMatches = state.bookedSlots.some((slot) => (
    slot.id !== ignoredId
    && slot.date === dateKey
    && slot.time === time
    && slot.instructorId === instructorId
  ));

  return bookingMatches || slotMatches;
}

function updateBookedSlotState(booking) {
  const instructorId = getBookingInstructorId(booking);
  state.bookedSlots = state.bookedSlots.filter((slot) => slot.id !== booking.id);

  if (isBookingActive(booking) && booking.date && booking.time && instructorId) {
    state.bookedSlots.push({
      id: booking.id,
      date: booking.date,
      time: booking.time,
      instructorId,
    });
  }
}

function countInstructorBookings(instructorId, dateKey) {
  return state.bookings.filter((booking) => (
    isBookingActive(booking) && booking.date === dateKey && getBookingInstructorId(booking) === instructorId
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
    ? getStudentVisibleInstructors()
    : getStudentVisibleInstructors().filter((instructor) => instructor.id === requestedInstructorId);

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

function getStudentScheduledTimes(dateKey) {
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

function getStudentSlotInfo(dateKey, time) {
  const availableInstructor = findAvailableInstructorForSlot(
    dateKey,
    time,
    state.selectedInstructorId,
    null,
    { respectAdvance: true },
  );

  if (availableInstructor) {
    return {
      state: "available",
      disabled: false,
      instructor: availableInstructor,
      label: `${availableInstructor.schedule.lessonDuration} минут`,
    };
  }

  const availableWithoutAdvance = findAvailableInstructorForSlot(
    dateKey,
    time,
    state.selectedInstructorId,
    null,
    { respectAdvance: false },
  );

  if (availableWithoutAdvance) {
    return {
      state: "closed",
      disabled: true,
      instructor: availableWithoutAdvance,
      label: "слишком поздно",
    };
  }

  return {
    state: "booked",
    disabled: true,
    instructor: null,
    label: "занято",
  };
}

function getStudentDaySlots(dateKey) {
  return getStudentScheduledTimes(dateKey).map((time) => ({
    time,
    ...getStudentSlotInfo(dateKey, time),
  }));
}

function getStudentDayEmptyText(dateKey, slots) {
  if (slots.length > 0) {
    return "Свободных мест нет";
  }

  const candidates = getStudentInstructorCandidates();
  const blockedDate = candidates
    .map((instructor) => getBlockedDate(instructor.schedule, dateKey))
    .find(Boolean);

  if (blockedDate) {
    return blockedDate.reason || "Инструктор недоступен";
  }

  return "Нет занятий";
}

function formatSlot(dateKey, time) {
  const date = getDateFromKey(dateKey);
  return `${fullDateFormatter.format(date)}, ${time}`;
}

function applySchoolFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const schoolSlug = params.get("school");
  if (!schoolSlug) return;

  const school = getSchoolBySlug(schoolSlug);
  if (school) {
    state.selectedSchoolId = school.id;
  }
}

function renderStudentFlowSteps() {
  if (!studentFlowSteps) return;

  const schoolReady = state.selectedSchoolId !== ALL_SCHOOLS_ID || getActiveSchools().length <= 1;
  const instructorReady = state.selectedInstructorId !== ANY_INSTRUCTOR_ID || getStudentVisibleInstructors().length > 0;
  const hasSlots = getStudentCalendarDays().some((date) => (
    getStudentDaySlots(toDateKey(date)).some((slot) => !slot.disabled)
  ));
  const slotReady = Boolean(state.selectedSlot);
  const steps = [
    ["Автошкола", schoolReady],
    ["Время", instructorReady && (slotReady || hasSlots)],
    ["Данные", slotReady],
  ];

  studentFlowSteps.innerHTML = steps.map(([label, isReady], index) => `
    <span class="${isReady ? "complete" : ""}">
      <i>${index + 1}</i>
      ${escapeHtml(label)}
    </span>
  `).join("");
}

function renderStudentSchoolFilter() {
  if (!studentSchoolFilter) return;

  const schools = getActiveSchools();

  if (schools.length === 0) {
    state.selectedSchoolId = ALL_SCHOOLS_ID;
    studentSchoolFilter.disabled = true;
    studentSchoolFilter.innerHTML = `<option value="${ALL_SCHOOLS_ID}">Все автошколы</option>`;
    return;
  }

  const selectedExists = state.selectedSchoolId === ALL_SCHOOLS_ID || schools.some((school) => school.id === state.selectedSchoolId);
  if (!selectedExists) {
    state.selectedSchoolId = ALL_SCHOOLS_ID;
  }

  studentSchoolFilter.disabled = schools.length === 1;
  studentSchoolFilter.innerHTML = [
    schools.length > 1 ? `<option value="${ALL_SCHOOLS_ID}">Все автошколы</option>` : "",
    ...schools.map((school) => (
      `<option value="${escapeHtml(school.id)}">${escapeHtml(school.name)}</option>`
    )),
  ].join("");

  if (schools.length === 1) {
    state.selectedSchoolId = schools[0].id;
  }

  studentSchoolFilter.value = state.selectedSchoolId;
}

function renderStudentInstructorFilter() {
  if (!studentInstructorFilter) return;

  const instructors = getStudentVisibleInstructors();
  const hasInstructors = instructors.length > 0;

  if (!hasInstructors) {
    state.selectedInstructorId = ANY_INSTRUCTOR_ID;
    studentInstructorFilter.disabled = true;
    studentInstructorFilter.innerHTML = `<option value="${ANY_INSTRUCTOR_ID}">Пока нет одобренных инструкторов</option>`;
    return;
  }

  const selectedExists = state.selectedInstructorId === ANY_INSTRUCTOR_ID || instructors.some((instructor) => instructor.id === state.selectedInstructorId);
  if (!selectedExists) {
    state.selectedInstructorId = ANY_INSTRUCTOR_ID;
  }

  studentInstructorFilter.disabled = false;
  studentInstructorFilter.innerHTML = [
    `<option value="${ANY_INSTRUCTOR_ID}">Любой свободный инструктор</option>`,
    ...instructors.map((instructor) => (
      `<option value="${escapeHtml(instructor.id)}">${escapeHtml(getInstructorName(instructor))}</option>`
    )),
  ].join("");
  studentInstructorFilter.value = state.selectedInstructorId;
}

function renderStudentChoiceSummary() {
  if (!studentChoiceSummary) return;

  const school = state.selectedSchoolId === ALL_SCHOOLS_ID ? null : getSchoolById(state.selectedSchoolId);
  const instructor = state.selectedInstructorId === ANY_INSTRUCTOR_ID ? null : getInstructorById(state.selectedInstructorId);
  const selectedTime = state.selectedSlot ? formatSlot(state.selectedSlot.date, state.selectedSlot.time) : "Выберите день и время";

  studentChoiceSummary.innerHTML = `
    <div>
      <span>Автошкола</span>
      <strong>${escapeHtml(school?.name ?? "Все доступные")}</strong>
    </div>
    <div>
      <span>Инструктор</span>
      <strong>${escapeHtml(instructor ? getInstructorName(instructor) : "Любой свободный")}</strong>
    </div>
    <div>
      <span>Занятие</span>
      <strong>${escapeHtml(selectedTime)}</strong>
    </div>
  `;
}

function renderStudentUpcomingBookings() {
  if (!studentUpcomingBookings) return;

  const filter = STUDENT_BOOKING_FILTERS.has(state.studentBookingsFilter)
    ? state.studentBookingsFilter
    : "upcoming";

  state.studentBookingsFilter = filter;
  studentBookingFilterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.studentBookingFilter === filter);
  });

  const bookings = getCurrentStudentBookings()
    .filter((booking) => {
      if (filter === "cancelled") {
        return isBookingCancelled(booking);
      }

      if (filter === "history") {
        return isBookingActive(booking) && isBookingPast(booking);
      }

      return isBookingUpcoming(booking);
    })
    .sort((a, b) => {
      const direction = filter === "history" ? -1 : 1;
      return direction * (getBookingStartsAt(a) - getBookingStartsAt(b));
    });

  if (bookings.length === 0) {
    studentUpcomingBookings.innerHTML = `<p class="empty-state compact-empty">В ${getStudentBookingFilterLabel(filter)} пока пусто.</p>`;
    return;
  }

  studentUpcomingBookings.innerHTML = bookings.map((booking) => `
    <article class="student-booking-card">
      <div>
        <strong>${escapeHtml(formatSlot(booking.date, booking.time))}</strong>
        <span>${escapeHtml(getBookingInstructorName(booking))}</span>
        <small>${escapeHtml(booking.phone)}${booking.email ? ` · ${escapeHtml(booking.email)}` : ""}</small>
      </div>
      <div class="student-booking-actions">
        <span class="status-pill ${escapeHtml(booking.status)}">${escapeHtml(getBookingStatusLabel(booking.status))}</span>
        ${isBookingUpcoming(booking) ? `<button class="danger-action" type="button" data-student-cancel-booking="${escapeHtml(booking.id)}">Отменить</button>` : ""}
      </div>
    </article>
  `).join("");
}

function renderDays() {
  if (!dayTabs) return;

  dayTabs.hidden = true;
  dayTabs.innerHTML = "";
}

function renderSlots() {
  if (!slotGrid) return;
  slotGrid.classList.add("week-schedule");

  if (getPublicInstructors().length === 0) {
    slotGrid.innerHTML = `<p class="empty-state">Пока нет одобренных инструкторов. Администратор должен подтвердить кабинет инструктора.</p>`;
    return;
  }

  if (getStudentVisibleInstructors().length === 0) {
    slotGrid.innerHTML = `<p class="empty-state">В выбранной автошколе пока нет одобренных инструкторов.</p>`;
    return;
  }

  const selectedInstructor = state.selectedInstructorId === ANY_INSTRUCTOR_ID
    ? null
    : getInstructorById(state.selectedInstructorId);

  if (state.selectedInstructorId !== ANY_INSTRUCTOR_ID && !selectedInstructor) {
    slotGrid.innerHTML = `<p class="empty-state">Этот инструктор больше не найден. Выберите другого инструктора.</p>`;
    return;
  }

  const weekDays = getStudentCalendarDays();
  const weekSlots = weekDays.map((date) => {
    const dateKey = toDateKey(date);
    const slots = getStudentDaySlots(dateKey);
    return {
      date,
      dateKey,
      slots,
      freeCount: slots.filter((slot) => !slot.disabled).length,
    };
  });

  if (weekSlots.every((day) => day.slots.length === 0)) {
    slotGrid.innerHTML = `<p class="empty-state">На ближайшую неделю нет доступного расписания. Проверьте другого инструктора или автошколу.</p>`;
    return;
  }

  slotGrid.innerHTML = weekSlots.map(({ date, dateKey, slots, freeCount }) => {
    const emptyText = getStudentDayEmptyText(dateKey, slots);
    return `
      <section class="student-week-day">
        <div class="student-week-day-head">
          <strong>${escapeHtml(dateFormatter.format(date).replace(".", ""))}</strong>
          <span>${escapeHtml(shortDateFormatter.format(date))} · ${freeCount} ${getRussianPlural(freeCount, ["место", "места", "мест"])}</span>
        </div>
        <div class="student-week-slots">
          ${slots.length ? slots.map((slot) => {
            const selected = state.selectedSlot?.date === dateKey && state.selectedSlot?.time === slot.time;
            const instructorHint = state.selectedInstructorId === ANY_INSTRUCTOR_ID && slot.instructor
              ? getInstructorName(slot.instructor)
              : slot.label;

            return `
              <button
                class="slot-button week-slot-button ${escapeHtml(slot.state)} ${selected ? "selected" : ""}"
                type="button"
                data-date="${escapeHtml(dateKey)}"
                data-time="${escapeHtml(slot.time)}"
                ${slot.disabled ? "disabled" : ""}
                aria-pressed="${selected}"
              >
                <strong>${escapeHtml(slot.time)}</strong>
                <span>${escapeHtml(slot.disabled ? slot.label : instructorHint)}</span>
              </button>
            `;
          }).join("") : `<p class="calendar-empty">${escapeHtml(emptyText)}</p>`}
        </div>
      </section>
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

  const allBookings = getCurrentInstructorBookings()
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const todayKey = toDateKey(new Date());
  const query = state.instructorSearchQuery.trim().toLowerCase();
  const bookings = allBookings.filter((booking) => {
    if (state.instructorStatusFilter !== ALL_STATUSES_ID && normalizeBookingStatus(booking.status) !== state.instructorStatusFilter) {
      return false;
    }

    if (state.instructorPeriodFilter === "today" && booking.date !== todayKey) {
      return false;
    }

    if (state.instructorPeriodFilter === "upcoming" && !isBookingUpcoming(booking)) {
      return false;
    }

    if (state.instructorPeriodFilter === "past" && !isBookingPast(booking)) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [
      booking.name,
      booking.phone,
      booking.email,
      booking.comment,
      getBookingInstructorName(booking),
    ].some((value) => String(value ?? "").toLowerCase().includes(query));
  });

  if (journalStatusFilter) {
    journalStatusFilter.value = state.instructorStatusFilter;
  }

  if (journalPeriodFilter) {
    journalPeriodFilter.value = state.instructorPeriodFilter;
  }

  if (journalSearch && document.activeElement !== journalSearch) {
    journalSearch.value = state.instructorSearchQuery;
  }

  if (journalFilterSummary) {
    const statusLabel = state.instructorStatusFilter === ALL_STATUSES_ID
      ? "все статусы"
      : getBookingStatusLabel(state.instructorStatusFilter);
    journalFilterSummary.textContent = `${bookings.length} из ${allBookings.length} · ${statusLabel} · ${getInstructorPeriodFilterLabel(state.instructorPeriodFilter)}`;
  }

  if (allBookings.length === 0) {
    bookingList.innerHTML = `<p class="empty-state">Пока нет заявок. Здесь будут только ученики, записанные к вам.</p>`;
    return;
  }

  if (bookings.length === 0) {
    bookingList.innerHTML = `<p class="empty-state">По выбранным фильтрам заявок нет.</p>`;
    return;
  }

  bookingList.innerHTML = bookings
    .map((booking) => `
      <article class="booking-card ${state.editingId === booking.id ? "editing" : ""} ${escapeHtml(booking.status)}">
        <div>
          <p class="booking-time">${formatSlot(booking.date, booking.time)}</p>
          <p>${escapeHtml(getBookingInstructorName(booking))}</p>
        </div>
        <div>
          <h3>${escapeHtml(booking.name)}</h3>
          <p>${escapeHtml(booking.phone)}${booking.email ? ` · ${escapeHtml(booking.email)}` : ""}</p>
        </div>
        <div>
          <span class="status-pill ${escapeHtml(booking.status)}">${escapeHtml(getBookingStatusLabel(booking.status))}</span>
          <span class="status-pill muted-pill">${booking.mailing ? "email включен" : "только связь"}</span>
          <p>${booking.comment ? escapeHtml(booking.comment) : "Без комментария"}</p>
        </div>
        <div class="card-actions">
          <a href="tel:${escapeHtml(formatPhoneHref(booking.phone))}">Позвонить</a>
          ${booking.email ? `<a href="mailto:${escapeHtml(booking.email)}">Email</a>` : ""}
          <button type="button" data-status-booking="${escapeHtml(booking.id)}" data-booking-status="${escapeHtml(getNextBookingStatus(booking.status))}">
            ${escapeHtml(getStatusActionLabel(booking.status))}
          </button>
          ${normalizeBookingStatus(booking.status) !== "cancelled" ? `<button class="danger-action" type="button" data-status-booking="${escapeHtml(booking.id)}" data-booking-status="cancelled">Отменить</button>` : ""}
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

function renderCurrentStudentProfile() {
  const student = getCurrentStudent();

  if (currentStudentName) {
    currentStudentName.textContent = student ? getStudentName(student) : "";
  }

  if (studentProfileSummary) {
    if (student) {
      studentProfileSummary.hidden = false;
      studentProfileSummary.innerHTML = `
        <strong>Запись для ${escapeHtml(getStudentName(student))}</strong>
        <span>${escapeHtml(student.phone)} · ${escapeHtml(student.email)}</span>
      `;
    } else {
      studentProfileSummary.hidden = true;
      studentProfileSummary.innerHTML = "";
    }
  }

  if (studentDetailsFields) {
    studentDetailsFields.hidden = Boolean(student);
    studentDetailsFields.querySelectorAll("input").forEach((input) => {
      input.disabled = Boolean(student);
    });
  }
}

function getInstructorStatusLabel(status) {
  const normalized = normalizeInstructorStatus(status);
  if (normalized === "approved") return "одобрен";
  if (normalized === "blocked") return "заблокирован";
  return "ожидает";
}

function renderCurrentAdminName() {
  if (!currentAdminName) return;

  currentAdminName.textContent = state.isAdmin ? "Администратор" : "";
}

function renderSchoolList() {
  if (!schoolList) return;

  if (!state.isAdmin) {
    schoolList.innerHTML = `<p class="empty-state">Войдите как администратор, чтобы управлять автошколами.</p>`;
    return;
  }

  if (!state.schoolsSchemaReady) {
    schoolList.innerHTML = `<p class="empty-state">Нужно обновить SQL-схему Supabase: добавить таблицу schools.</p>`;
    return;
  }

  const schools = [...state.schools].sort((a, b) => a.name.localeCompare(b.name, "ru"));

  if (schools.length === 0) {
    schoolList.innerHTML = `<p class="empty-state">Автошкол пока нет. Создайте первую и выдайте ключ инструкторам.</p>`;
    return;
  }

  schoolList.innerHTML = schools.map((school) => {
    const instructorCount = state.instructors.filter((instructor) => instructor.schoolId === school.id).length;
    return `
      <article class="school-card ${school.isActive ? "" : "inactive"}">
        <div>
          <span class="status-pill">${school.isActive ? "активна" : "выключена"}</span>
          <h3>${escapeHtml(school.name)}</h3>
          <p>${instructorCount} ${getRussianPlural(instructorCount, ["инструктор", "инструктора", "инструкторов"])}</p>
          <code>${escapeHtml(school.inviteKey)}</code>
        </div>
        <div class="card-actions">
          <button type="button" data-copy-school-key="${escapeHtml(school.id)}">Скопировать ключ</button>
          <button type="button" data-rotate-school-key="${escapeHtml(school.id)}">Новый ключ</button>
          <button class="${school.isActive ? "danger-action" : "primary-action"}" type="button" data-toggle-school="${escapeHtml(school.id)}">
            ${school.isActive ? "Выключить" : "Активировать"}
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function renderInstructorApprovalList() {
  if (!instructorApprovalList) return;

  if (!state.isAdmin) {
    instructorApprovalList.innerHTML = `<p class="empty-state">Войдите как администратор, чтобы модерировать инструкторов.</p>`;
    return;
  }

  const instructors = state.instructors
    .filter(isVisibleInstructor)
    .sort((a, b) => {
      const order = { pending: 0, approved: 1, blocked: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3)
        || getInstructorName(a).localeCompare(getInstructorName(b), "ru");
    });

  if (instructors.length === 0) {
    instructorApprovalList.innerHTML = `<p class="empty-state">Заявок инструкторов пока нет.</p>`;
    return;
  }

  instructorApprovalList.innerHTML = instructors.map((instructor) => {
    const status = normalizeInstructorStatus(instructor.status);
    const canApprove = status !== "approved";
    const canBlock = status !== "blocked";

    return `
      <article class="moderation-card ${status}">
        <div>
          <span class="status-pill">${escapeHtml(getInstructorStatusLabel(status))}</span>
          <h3>${escapeHtml(getInstructorName(instructor))}</h3>
          <p>${escapeHtml(instructor.phone || "Телефон не указан")} · ${escapeHtml(instructor.email || "Email не указан")}</p>
          <small>Автошкола: ${escapeHtml(getInstructorSchoolName(instructor))} · Логин: ${escapeHtml(instructor.login)}</small>
        </div>
        <div class="card-actions">
          ${canApprove ? `<button class="primary-action" type="button" data-approve-instructor="${escapeHtml(instructor.id)}">Одобрить</button>` : ""}
          ${canBlock ? `<button class="danger-action" type="button" data-block-instructor="${escapeHtml(instructor.id)}">Заблокировать</button>` : ""}
        </div>
      </article>
    `;
  }).join("");
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
    .filter(isBookingActive)
    .filter((booking) => {
      const startsAt = getBookingStartDate(booking.date, booking.time);
      return startsAt >= now && startsAt <= end;
    })
    .sort((a, b) => getBookingStartDate(a.date, a.time) - getBookingStartDate(b.date, b.time));
}

function renderCompactBookingList(target, bookings, emptyText) {
  if (!target) return;

  if (bookings.length === 0) {
    target.innerHTML = `<p class="empty-state compact-empty">${escapeHtml(emptyText)}</p>`;
    return;
  }

  target.innerHTML = bookings.map((booking) => `
    <article class="compact-booking-card ${escapeHtml(booking.status)}">
      <div>
        <strong>${escapeHtml(booking.time)} · ${escapeHtml(booking.name)}</strong>
        <span>${escapeHtml(formatSlot(booking.date, booking.time))}</span>
        <span>${escapeHtml(booking.phone)}${booking.comment ? ` · ${escapeHtml(booking.comment)}` : ""}</span>
      </div>
      <div class="compact-actions">
        <span class="status-pill ${escapeHtml(booking.status)}">${escapeHtml(getBookingStatusLabel(booking.status))}</span>
        <button type="button" data-edit="${escapeHtml(booking.id)}">Открыть</button>
      </div>
    </article>
  `).join("");
}

function renderInstructorTodayPanel() {
  const todayKey = toDateKey(new Date());
  const bookings = getCurrentInstructorBookings()
    .filter(isBookingActive)
    .filter((booking) => booking.date === todayKey)
    .sort((a, b) => a.time.localeCompare(b.time));

  renderCompactBookingList(todayBookingList, bookings, "На сегодня занятий нет.");
}

function renderInstructorUpcomingPanel() {
  renderCompactBookingList(upcomingBookingList, getUpcomingBookings(14).slice(0, 4), "Ближайших занятий пока нет.");
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
              <button class="calendar-booking ${escapeHtml(booking.status)}" type="button" data-edit="${escapeHtml(booking.id)}">
                <strong>${escapeHtml(booking.time)} · ${escapeHtml(booking.name)}</strong>
                <span>${escapeHtml(getBookingStatusLabel(booking.status))} · ${escapeHtml(booking.phone)}${booking.comment ? ` · ${escapeHtml(booking.comment)}` : ""}</span>
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

  const bookings = getCurrentInstructorBookings().filter(isBookingActive);
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

  const currentInstructor = getCurrentInstructor();
  const instructors = state.isAdmin
    ? getPublicInstructors()
    : [currentInstructor].filter(Boolean);

  if (instructors.length === 0) {
    bookingEditForm.editInstructor.innerHTML = `<option value="">Нет зарегистрированных инструкторов</option>`;
    return;
  }

  bookingEditForm.editInstructor.innerHTML = instructors
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
  renderStudentSchoolFilter();
  renderStudentInstructorFilter();
  renderStudentFlowSteps();
  renderStudentChoiceSummary();
  renderStudentUpcomingBookings();
  renderDays();
  renderSlots();
  renderSelectedSlot();
  renderBookings();
  renderCurrentInstructorName();
  renderCurrentStudentProfile();
  renderCurrentAdminName();
  renderSchoolList();
  renderInstructorApprovalList();
  renderSettingsForm();
  renderInstructorTodayPanel();
  renderInstructorUpcomingPanel();
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
    <small>Запись появилась в вашем кабинете ученика и в журнале инструктора.</small>
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
  if (studentLoginView) {
    studentLoginView.hidden = screen !== "student-login";
  }
  if (instructorLoginView) {
    instructorLoginView.hidden = screen !== "login";
  }
  if (adminLoginView) {
    adminLoginView.hidden = screen !== "admin-login";
  }
  if (passwordResetView) {
    passwordResetView.hidden = screen !== "password-reset";
  }
  if (instructorShell) {
    instructorShell.hidden = screen !== "instructor";
  }
  if (adminShell) {
    adminShell.hidden = screen !== "admin";
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

function showStudentLoginMode() {
  if (studentLoginForm) {
    studentLoginForm.hidden = false;
  }
  if (studentRegisterForm) {
    studentRegisterForm.hidden = true;
  }
  showStudentLoginNote("");
  showStudentRegisterNote("");
  studentLoginForm?.studentLoginEmail.focus();
}

function showStudentRegisterMode() {
  if (studentLoginForm) {
    studentLoginForm.hidden = true;
  }
  if (studentRegisterForm) {
    studentRegisterForm.hidden = false;
  }
  showStudentLoginNote("");
  showStudentRegisterNote("");
  studentRegisterForm?.lastName.focus();
}

function showStudentLoginScreen() {
  window.history.replaceState(null, "", `index.html${window.location.search}#student`);
  showAppScreen("student-login");
  showStudentLoginMode();
}

function showStudentBooking() {
  if (isSupabaseEnabled && !hasStudentSession()) {
    showStudentLoginScreen();
    return;
  }

  window.history.replaceState(null, "", `index.html${window.location.search}#student`);
  showAppScreen("student");
  render();
}

function openStudentFlow() {
  if (!isSupabaseEnabled) {
    showStudentBooking();
    return;
  }

  if (hasStudentSession()) {
    showStudentBooking();
    return;
  }

  setStudentSession(null);
  showStudentLoginScreen();
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

function showAdminLogin() {
  window.history.replaceState(null, "", "index.html#admin");
  showAppScreen("admin-login");
  showAdminLoginNote("");
  adminLoginForm?.adminEmail.focus();
}

function showPasswordResetScreen() {
  const url = new URL(window.location.href);
  url.hash = "password-reset";
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  showAppScreen("password-reset");
  showPasswordResetNote("");
  passwordResetForm?.newPassword.focus();
}

function getPasswordResetRedirectUrl() {
  const url = new URL(window.location.href);
  url.hash = "";
  url.search = "";
  return url.href;
}

function isPasswordRecoveryUrl() {
  const hashParams = new URLSearchParams((INITIAL_LOCATION_HASH || window.location.hash).replace(/^#/, ""));
  const searchParams = new URLSearchParams(INITIAL_LOCATION_SEARCH || window.location.search);
  const recoveryType = hashParams.get("type") || searchParams.get("type");

  return recoveryType === "recovery";
}

async function requestPasswordReset(email, showMessage) {
  if (!isSupabaseEnabled) {
    showMessage("Для восстановления пароля нужен подключенный Supabase.", true);
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    showMessage("Введите email аккаунта, чтобы отправить ссылку восстановления.", true);
    return;
  }

  startSyncStatus("Отправляем письмо");

  const { error } = await supabaseClient.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: getPasswordResetRedirectUrl(),
  });

  if (error) {
    showSyncIdleStatus();
    showMessage(getAuthErrorMessage(error), true);
    return;
  }

  finishSyncSuccess("Письмо отправлено");
  showMessage("Письмо для смены пароля отправлено. Откройте ссылку из письма в этом браузере.");
}

async function handlePasswordReset(event) {
  event.preventDefault();

  if (!isSupabaseEnabled) {
    showPasswordResetNote("Для смены пароля нужен подключенный Supabase.", true);
    return;
  }

  const formData = new FormData(passwordResetForm);
  const password = formData.get("newPassword").trim();
  const confirmation = formData.get("newPasswordConfirm").trim();

  if (password.length < MIN_PASSWORD_LENGTH) {
    showPasswordResetNote(getPasswordErrorMessage(), true);
    return;
  }

  if (password !== confirmation) {
    showPasswordResetNote("Пароли не совпадают.", true);
    return;
  }

  const { data: sessionData } = await supabaseClient.auth.getSession();
  if (!sessionData.session) {
    showPasswordResetNote("Ссылка восстановления устарела. Отправьте письмо восстановления еще раз.", true);
    return;
  }

  startSyncStatus("Сохраняем пароль");

  const { error } = await supabaseClient.auth.updateUser({ password });
  if (error) {
    showSyncIdleStatus();
    showPasswordResetNote(getAuthErrorMessage(error), true);
    return;
  }

  passwordResetForm.reset();
  await supabaseClient.auth.signOut();
  setStudentSession(null);
  setInstructorSession(null);
  setAdminSession(null);
  finishSyncSuccess("Пароль обновлен");
  showPasswordResetNote("Пароль обновлен. Теперь войдите заново через нужный кабинет.");
}

function showAdminDashboard() {
  window.history.replaceState(null, "", "index.html#admin");
  showAppScreen("admin");
  render();
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

function openAdminFlow() {
  if (state.isAdmin && state.currentAdminId) {
    showAdminDashboard();
    return;
  }

  setAdminSession(null);
  showAdminLogin();
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

function showAdminLoginNote(message, isError = false) {
  if (!adminLoginNote) return;
  adminLoginNote.textContent = message;
  adminLoginNote.classList.toggle("error", isError);
}

function showRegisterNote(message, isError = false) {
  if (!registerNote) return;
  registerNote.textContent = message;
  registerNote.classList.toggle("error", isError);
}

function showApprovalNote(message, isError = false) {
  if (!approvalNote) return;
  approvalNote.textContent = message;
  approvalNote.classList.toggle("error", isError);
}

function showSchoolNote(message, isError = false) {
  if (!schoolNote) return;
  schoolNote.textContent = message;
  schoolNote.classList.toggle("error", isError);
}

function showStudentLoginNote(message, isError = false) {
  if (!studentLoginNote) return;
  studentLoginNote.textContent = message;
  studentLoginNote.classList.toggle("error", isError);
}

function showStudentRegisterNote(message, isError = false) {
  if (!studentRegisterNote) return;
  studentRegisterNote.textContent = message;
  studentRegisterNote.classList.toggle("error", isError);
}

function showPasswordResetNote(message, isError = false) {
  if (!passwordResetNote) return;
  passwordResetNote.textContent = message;
  passwordResetNote.classList.toggle("error", isError);
}

function validatePhone(value) {
  return isValidPhone(value);
}

function getPhoneErrorMessage() {
  return "Введите реальный российский мобильный номер в формате +7 9XX XXX-XX-XX.";
}

function getEmailErrorMessage() {
  return "Введите рабочий email, не тестовый адрес и не временную почту.";
}

function getPasswordErrorMessage() {
  return `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов.`;
}

function getInstructorByLoginOrEmail(value) {
  return getInstructorByLogin(value) || getInstructorByEmail(value);
}

function getAuthErrorMessage(error) {
  const message = String(error?.message ?? "").toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "Неверный email, логин или пароль.";
  }

  if (message.includes("email not confirmed")) {
    return "Сначала подтвердите email по ссылке из письма.";
  }

  if (message.includes("already registered") || message.includes("already been registered")) {
    return "Этот email уже зарегистрирован. Попробуйте войти.";
  }

  if (message.includes("password")) {
    return getPasswordErrorMessage();
  }

  return "Не удалось выполнить действие. Проверьте данные и попробуйте еще раз.";
}

async function loadAdminStateForCurrentUser() {
  if (!isSupabaseEnabled) {
    setAdminSession(null);
    return false;
  }

  const { data: userData, error: userError } = await supabaseClient.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    setAdminSession(null);
    return false;
  }

  const { data, error } = await supabaseClient
    .from("admins")
    .select("id,email")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    setAdminSession(null);
    return false;
  }

  setAdminSession(data.id);
  return true;
}

function getAuthProfileFromUser(user) {
  const metadata = user?.user_metadata ?? {};

  if (metadata.role && metadata.role !== "instructor") {
    return null;
  }

  const firstName = String(metadata.firstName ?? metadata.first_name ?? "").trim();
  const lastName = String(metadata.lastName ?? metadata.last_name ?? "").trim();
  const email = normalizeEmail(user?.email ?? metadata.email);
  const login = normalizeLogin(metadata.login || email.split("@")[0]);

  if (!user?.id || !firstName || !lastName || !email || !login) {
    return null;
  }

  return normalizeInstructor({
    id: user.id,
    firstName,
    lastName,
    patronymic: metadata.patronymic,
    phone: metadata.phone,
    email,
    login,
    password: "",
    status: "pending",
    schoolId: metadata.school_id ?? null,
    schedule: loadLegacySettings(),
    notifications: { ...DEFAULT_NOTIFICATIONS },
    createdAt: new Date().toISOString(),
  });
}

function getStudentProfileFromUser(user) {
  const metadata = user?.user_metadata ?? {};

  if (metadata.role && metadata.role !== "student") {
    return null;
  }

  const firstName = String(metadata.firstName ?? metadata.first_name ?? "").trim();
  const lastName = String(metadata.lastName ?? metadata.last_name ?? "").trim();
  const email = normalizeEmail(user?.email ?? metadata.email);

  if (!user?.id || !firstName || !lastName || !email) {
    return null;
  }

  return normalizeStudent({
    id: user.id,
    firstName,
    lastName,
    patronymic: metadata.patronymic,
    phone: metadata.phone,
    email,
    createdAt: new Date().toISOString(),
  });
}

function canUseLegacyPassword(instructor, password) {
  return Boolean(instructor?.password) && instructor.password === password;
}

function completeInstructorLogin(instructor) {
  if (isInstructorPending(instructor)) {
    setInstructorSession(null);
    if (isSupabaseEnabled) {
      supabaseClient.auth.signOut();
    }
    showSyncIdleStatus();
    showLoginNote("Заявка инструктора отправлена администратору. После одобрения вы сможете войти в кабинет.", true);
    return false;
  }

  if (isInstructorBlocked(instructor)) {
    setInstructorSession(null);
    if (isSupabaseEnabled) {
      supabaseClient.auth.signOut();
    }
    showSyncIdleStatus();
    showLoginNote("Кабинет инструктора заблокирован. Обратитесь к администратору.", true);
    return false;
  }

  setInstructorSession(instructor.id);
  loginForm.reset();
  showLoginNote("");
  showInstructorDashboard();
  return true;
}

async function handleSubmit(event) {
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
  const currentStudent = getCurrentStudent();
  const name = currentStudent ? getStudentName(currentStudent) : formData.get("studentName").trim();
  const phone = currentStudent ? currentStudent.phone : formData.get("phone").trim();
  const email = currentStudent ? currentStudent.email : normalizeEmail(formData.get("email"));
  const mailing = formData.get("mailing") === "on";

  if (isSupabaseEnabled && !currentStudent) {
    showNote("Войдите в кабинет ученика, чтобы записаться на занятие.", true);
    return;
  }

  if (!validatePhone(phone)) {
    showNote(getPhoneErrorMessage(), true);
    return;
  }

  if (email && !isValidEmail(email)) {
    showNote(getEmailErrorMessage(), true);
    return;
  }

  if (mailing && !email) {
    showNote("Для email-напоминаний укажите email.", true);
    return;
  }

  const instructorName = getInstructorName(assignedInstructor);
  const booking = {
    id: createId("booking"),
    date: state.selectedSlot.date,
    time: state.selectedSlot.time,
    name,
    phone: formatPhone(phone),
    email,
    studentId: currentStudent?.id ?? "",
    instructorId: assignedInstructor.id,
    instructorName,
    instructor: instructorName,
    status: "new",
    comment: formData.get("comment").trim(),
    mailing,
    createdAt: new Date().toISOString(),
  };

  const isSaved = await createBookingInSupabase(booking);

  if (!isSaved) {
    showNote("Не удалось сохранить запись на сервере. Возможно, это время уже заняли. Выберите другой слот.", true);
    render();
    return;
  }

  state.bookings.push(booking);
  updateBookedSlotState(booking);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookings));
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

function createUuid() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) => (
    (Number(char) ^ Math.random() * 16 >> Number(char) / 4).toString(16)
  ));
}

function randomToken(length = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const values = new Uint8Array(length);

  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(values);
  } else {
    values.forEach((_, index) => {
      values[index] = Math.floor(Math.random() * 256);
    });
  }

  return [...values].map((value) => alphabet[value % alphabet.length]).join("");
}

function generateSchoolKey() {
  return `DRIVE-${randomToken(4)}-${randomToken(4)}`;
}

function generateSchoolSlug(name) {
  const base = String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "school"}-${randomToken(5).toLowerCase()}`;
}

async function findSchoolByInviteKey(inviteKey) {
  if (!isSupabaseEnabled) {
    return { school: null, error: new Error("Supabase is disabled") };
  }

  const normalizedKey = normalizeInviteKey(inviteKey);
  if (!normalizedKey) {
    return { school: null, error: null };
  }

  const { data, error } = await supabaseClient.rpc("get_school_by_invite_key", {
    input_key: normalizedKey,
  });

  if (error) {
    state.schoolsSchemaReady = false;
    return { school: null, error };
  }

  state.schoolsSchemaReady = true;
  const school = Array.isArray(data) ? data.map(mapSchoolFromRow).filter(Boolean).at(0) : null;
  return { school: school ?? null, error: null };
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
  const email = normalizeEmail(formData.get("editEmail"));
  const mailing = formData.get("editMailing") === "on";

  if (!instructor) {
    showEditNote("Выберите зарегистрированного инструктора.", true);
    return;
  }

  if (!validatePhone(phone)) {
    showEditNote(getPhoneErrorMessage(), true);
    return;
  }

  if (email && !isValidEmail(email)) {
    showEditNote(getEmailErrorMessage(), true);
    return;
  }

  if (mailing && !email) {
    showEditNote("Для email-напоминаний укажите email.", true);
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
    phone: formatPhone(phone),
    email,
    instructorId: instructor.id,
    instructorName,
    instructor: instructorName,
    comment: formData.get("editComment").trim(),
    mailing,
    updatedAt: new Date().toISOString(),
  });

  updateBookedSlotState(booking);
  saveBookings();
  state.editingId = null;
  showAdminNote("Заявка обновлена.");
  render();
  closeDrawer(editDrawer);
}

async function updateBookingStatus(bookingId, nextStatus) {
  const booking = state.bookings.find((item) => item.id === bookingId);
  const currentInstructor = getCurrentInstructor();

  if (!booking || !currentInstructor || getBookingInstructorId(booking) !== currentInstructor.id) {
    showAdminNote("Эта заявка не относится к текущему инструктору.", true);
    return;
  }

  const normalizedStatus = normalizeBookingStatus(nextStatus);
  const previousStatus = booking.status;
  const previousUpdatedAt = booking.updatedAt;

  if (isSupabaseEnabled && !state.bookingStatusSchemaReady) {
    showAdminNote("Нужно обновить SQL-схему Supabase: добавить статусы заявок.", true);
    return;
  }

  Object.assign(booking, {
    status: normalizedStatus,
    updatedAt: new Date().toISOString(),
  });
  updateBookedSlotState(booking);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookings));
  render();

  if (!isSupabaseEnabled) {
    showAdminNote(`Статус изменен: ${getBookingStatusLabel(normalizedStatus)}.`);
    return;
  }

  const isSaved = await updateBookingStatusInSupabase(booking, normalizedStatus);

  if (!isSaved) {
    booking.status = previousStatus;
    booking.updatedAt = previousUpdatedAt;
    updateBookedSlotState(booking);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookings));
    showAdminNote("Не удалось обновить статус на сервере.", true);
    render();
    return;
  }

  showAdminNote(`Статус изменен: ${getBookingStatusLabel(normalizedStatus)}.`);
  render();
}

async function cancelStudentBooking(bookingId) {
  const booking = state.bookings.find((item) => item.id === bookingId);
  const currentStudent = getCurrentStudent();

  if (!booking || !currentStudent || booking.studentId !== currentStudent.id) {
    showNote("Эта запись не относится к вашему кабинету.", true);
    return;
  }

  if (!isBookingUpcoming(booking)) {
    showNote("Можно отменить только будущую активную запись.", true);
    return;
  }

  const previousStatus = booking.status;
  const previousUpdatedAt = booking.updatedAt;
  Object.assign(booking, {
    status: "cancelled",
    updatedAt: new Date().toISOString(),
  });
  updateBookedSlotState(booking);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookings));
  render();

  const isSaved = await updateBookingStatusInSupabase(booking, "cancelled");

  if (!isSaved) {
    booking.status = previousStatus;
    booking.updatedAt = previousUpdatedAt;
    updateBookedSlotState(booking);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookings));
    showNote("Не удалось отменить запись на сервере. Попробуйте ещё раз.", true);
    render();
    return;
  }

  state.selectedSlot = null;
  showNote("");
  showBookingSuccess({
    ...booking,
    instructorName: getBookingInstructorName(booking),
  });
  if (bookingSuccess) {
    bookingSuccess.innerHTML = `
      <strong>Запись отменена.</strong>
      <span>${escapeHtml(formatSlot(booking.date, booking.time))} · ${escapeHtml(getBookingInstructorName(booking))}</span>
      <small>Это время снова станет доступно для записи.</small>
    `;
  }
  render();
}

function deleteBooking(id) {
  const booking = state.bookings.find((item) => item.id === id);
  const currentInstructor = getCurrentInstructor();

  if (!booking || !currentInstructor || getBookingInstructorId(booking) !== currentInstructor.id) {
    showAdminNote("Эта заявка не относится к текущему инструктору.", true);
    return;
  }

  state.bookings = state.bookings.filter((item) => item.id !== id);
  state.bookedSlots = state.bookedSlots.filter((slot) => slot.id !== id);

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

async function handleStudentLogin(event) {
  event.preventDefault();

  if (!isSupabaseEnabled) {
    showStudentLoginNote("Для кабинета ученика нужен подключенный сервер Supabase.", true);
    return;
  }

  const formData = new FormData(studentLoginForm);
  const email = normalizeEmail(formData.get("studentLoginEmail"));
  const password = formData.get("studentLoginPassword").trim();

  if (!isValidEmail(email)) {
    showStudentLoginNote(getEmailErrorMessage(), true);
    return;
  }

  if (getInstructorByEmail(email) && !getStudentByEmail(email)) {
    showStudentLoginNote("Этот email привязан к кабинету инструктора. Для ученика нужен отдельный кабинет.", true);
    return;
  }

  startSyncStatus("Проверяем вход");

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    showSyncIdleStatus();
    showStudentLoginNote(getAuthErrorMessage(error), true);
    return;
  }

  setStudentSession(data.user.id);
  await loadSupabaseState();

  let student = getStudentById(data.user.id) || getStudentByEmail(email);

  if (!student) {
    student = getStudentProfileFromUser(data.user);
    if (student) {
      state.students.push(student);
      const isSaved = await saveStudents([student]);
      if (!isSaved) {
        setStudentSession(null);
        showStudentLoginNote("Вход выполнен, но профиль ученика не сохранился. Попробуйте еще раз.", true);
        return;
      }
    }
  }

  if (!student) {
    setStudentSession(null);
    showSyncIdleStatus();
    showStudentLoginNote("Это не ученический кабинет или профиль ученика не найден.", true);
    return;
  }

  setStudentSession(student.id);
  studentLoginForm.reset();
  showStudentLoginNote("");
  finishSyncSuccess("Вход выполнен");
  showStudentBooking();
}

async function handleStudentRegister(event) {
  event.preventDefault();

  if (!isSupabaseEnabled) {
    showStudentRegisterNote("Для полноценной регистрации нужен подключенный сервер Supabase.", true);
    return;
  }

  const formData = new FormData(studentRegisterForm);
  const firstName = formData.get("firstName").trim();
  const lastName = formData.get("lastName").trim();
  const patronymic = formData.get("patronymic").trim();
  const phone = formData.get("phone").trim();
  const email = normalizeEmail(formData.get("email"));
  const password = formData.get("studentRegisterPassword").trim();

  if (!firstName || !lastName || !phone || !email || !password) {
    showStudentRegisterNote("Заполните имя, фамилию, телефон, email и пароль.", true);
    return;
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    showStudentRegisterNote(getPasswordErrorMessage(), true);
    return;
  }

  if (!validatePhone(phone)) {
    showStudentRegisterNote(getPhoneErrorMessage(), true);
    return;
  }

  if (!isValidEmail(email)) {
    showStudentRegisterNote(getEmailErrorMessage(), true);
    return;
  }

  if (getStudentByEmail(email)) {
    showStudentRegisterNote("Этот email уже зарегистрирован. Попробуйте войти.", true);
    return;
  }

  if (getStudentByPhone(phone)) {
    showStudentRegisterNote("Этот телефон уже привязан к другому кабинету ученика.", true);
    return;
  }

  if (!state.studentsSchemaReady) {
    showStudentRegisterNote("Нужно обновить SQL-схему Supabase: добавить таблицу students.", true);
    return;
  }

  startSyncStatus("Создаем кабинет ученика");

  const formattedPhone = formatPhone(phone);
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: "student",
        first_name: firstName,
        last_name: lastName,
        patronymic,
        phone: formattedPhone,
      },
    },
  });

  if (error) {
    showSyncIdleStatus();
    showStudentRegisterNote(getAuthErrorMessage(error), true);
    return;
  }

  const student = normalizeStudent({
    id: data.user?.id || createId("student"),
    firstName,
    lastName,
    patronymic,
    phone: formattedPhone,
    email,
    createdAt: new Date().toISOString(),
  });

  if (!data.session) {
    studentRegisterForm.reset();
    showSyncIdleStatus();
    showStudentRegisterNote("Кабинет создан. Подтвердите email, затем войдите - профиль сохранится автоматически.", false);
    return;
  }

  state.students.push(student);
  setStudentSession(student.id);
  const isSaved = await saveStudents([student]);

  if (!isSaved) {
    setStudentSession(null);
    showStudentRegisterNote("Кабинет создан, но профиль не сохранился в таблицу. Попробуйте обновить страницу.", true);
    return;
  }

  studentRegisterForm.reset();
  finishSyncSuccess("Кабинет ученика создан");
  showStudentRegisterNote("");
  showStudentBooking();
}

async function handleLogin(event) {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const login = normalizeLogin(formData.get("loginName"));
  const password = formData.get("loginPassword").trim();
  const instructor = getInstructorByLoginOrEmail(login);

  if (isSupabaseEnabled) {
    const authEmail = normalizeEmail(instructor?.email || login);

    if (!isValidEmail(authEmail)) {
      if (canUseLegacyPassword(instructor, password)) {
        completeInstructorLogin(instructor);
        return;
      }

      showLoginNote("Введите email или логин зарегистрированного инструктора.", true);
      return;
    }

    if (getStudentByEmail(authEmail) && !instructor) {
      showLoginNote("Этот email привязан к кабинету ученика. Для инструктора нужен отдельный кабинет.", true);
      return;
    }

    startSyncStatus("Проверяем вход");

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: authEmail,
      password,
    });

    if (error) {
      showSyncIdleStatus();
      if (canUseLegacyPassword(instructor, password)) {
        completeInstructorLogin(instructor);
        return;
      }

      showLoginNote(getAuthErrorMessage(error), true);
      return;
    }

    setInstructorSession(data.user.id);
    await loadSupabaseState();

    let authInstructor = getInstructorById(data.user.id) || getInstructorByEmail(authEmail) || instructor;

    if (!authInstructor) {
      authInstructor = getAuthProfileFromUser(data.user);
      if (authInstructor) {
        if (authInstructor.schoolId) {
          state.schoolsSchemaReady = true;
        }
        state.instructors.push(authInstructor);
        const isSaved = await saveInstructors([authInstructor]);
        if (!isSaved) {
          setInstructorSession(null);
          showLoginNote("Вход выполнен, но заявка инструктора не сохранилась. Попробуйте еще раз.", true);
          return;
        }
      }
    }

    if (!authInstructor) {
      setInstructorSession(null);
      showSyncIdleStatus();
      showLoginNote("Вход выполнен, но профиль инструктора не найден.", true);
      return;
    }

    if (completeInstructorLogin(authInstructor)) {
      finishSyncSuccess("Вход выполнен");
    }
    return;
  }

  if (!canUseLegacyPassword(instructor, password)) {
    showLoginNote("Неверный логин или пароль.", true);
    return;
  }

  completeInstructorLogin(instructor);
}

async function handleRegister(event) {
  event.preventDefault();

  const formData = new FormData(registerForm);
  const firstName = formData.get("firstName").trim();
  const lastName = formData.get("lastName").trim();
  const patronymic = formData.get("patronymic").trim();
  const phone = formData.get("phone").trim();
  const email = normalizeEmail(formData.get("email"));
  const schoolInviteKey = normalizeInviteKey(formData.get("schoolInviteKey"));
  const login = normalizeLogin(formData.get("registerLogin"));
  const password = formData.get("registerPassword").trim();

  if (!isSupabaseEnabled) {
    showRegisterNote("Для полноценной регистрации нужен подключенный сервер Supabase.", true);
    return;
  }

  if (!firstName || !lastName || !login || !phone || !email || !schoolInviteKey || !password) {
    showRegisterNote("Заполните имя, фамилию, телефон, email, ключ автошколы, логин и пароль.", true);
    return;
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    showRegisterNote(getPasswordErrorMessage(), true);
    return;
  }

  if (!validatePhone(phone)) {
    showRegisterNote(getPhoneErrorMessage(), true);
    return;
  }

  if (!isValidEmail(email)) {
    showRegisterNote(getEmailErrorMessage(), true);
    return;
  }

  if (getInstructorByLogin(login)) {
    showRegisterNote("Такой логин уже занят.", true);
    return;
  }

  if (getInstructorByEmail(email)) {
    showRegisterNote("Этот email уже зарегистрирован. Попробуйте войти.", true);
    return;
  }

  if (getInstructorByPhone(phone)) {
    showRegisterNote("Этот телефон уже привязан к другому кабинету.", true);
    return;
  }

  startSyncStatus("Проверяем ключ автошколы");

  const { school, error: schoolError } = await findSchoolByInviteKey(schoolInviteKey);
  if (schoolError) {
    showSyncIdleStatus();
    showRegisterNote("Нужно обновить SQL-схему Supabase: добавить автошколы и ключи регистрации.", true);
    return;
  }

  if (!school) {
    showSyncIdleStatus();
    showRegisterNote("Ключ автошколы не найден или выключен. Проверьте ключ у администратора.", true);
    return;
  }

  setSyncStatus("syncing", "Создаем кабинет");

  const formattedPhone = formatPhone(phone);
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: "instructor",
        login,
        first_name: firstName,
        last_name: lastName,
        patronymic,
        phone: formattedPhone,
        school_id: school.id,
      },
    },
  });

  if (error) {
    showSyncIdleStatus();
    showRegisterNote(getAuthErrorMessage(error), true);
    return;
  }

  const instructor = {
    id: data.user?.id || createId("instructor"),
    firstName,
    lastName,
    patronymic,
    phone: formattedPhone,
    email,
    login,
    password: "",
    status: "pending",
    schoolId: school.id,
    approvedAt: null,
    approvedBy: null,
    schedule: loadLegacySettings(),
    notifications: { ...DEFAULT_NOTIFICATIONS },
    createdAt: new Date().toISOString(),
  };

  if (!data.session) {
    registerForm.reset();
    showSyncIdleStatus();
    showRegisterNote("Кабинет создан. Подтвердите email, затем войдите - заявка уйдет администратору на одобрение.", false);
    return;
  }

  state.instructors.push(instructor);
  setInstructorSession(instructor.id);
  const isSaved = await saveInstructors([instructor]);
  setInstructorSession(null);

  if (!isSaved) {
    showRegisterNote("Кабинет создан, но профиль не сохранился в таблицу. Попробуйте обновить страницу.", true);
    return;
  }

  registerForm.reset();
  finishSyncSuccess("Заявка отправлена");
  showRegisterNote("Заявка инструктора отправлена администратору. После одобрения вы сможете войти.", false);
}

async function handleAdminLogin(event) {
  event.preventDefault();

  if (!isSupabaseEnabled) {
    showAdminLoginNote("Для админ-панели нужен подключенный Supabase.", true);
    return;
  }

  const formData = new FormData(adminLoginForm);
  const email = normalizeEmail(formData.get("adminEmail"));
  const password = formData.get("adminPassword").trim();

  if (!isValidEmail(email)) {
    showAdminLoginNote(getEmailErrorMessage(), true);
    return;
  }

  startSyncStatus("Проверяем администратора");

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    showSyncIdleStatus();
    showAdminLoginNote(getAuthErrorMessage(error), true);
    return;
  }

  const isAdmin = await loadAdminStateForCurrentUser();
  if (!isAdmin) {
    await supabaseClient.auth.signOut();
    showSyncIdleStatus();
    showAdminLoginNote("Этот аккаунт не добавлен в список администраторов.", true);
    return;
  }

  await loadSupabaseState();
  adminLoginForm.reset();
  finishSyncSuccess("Администратор вошел");
  showAdminDashboard();
}

async function handleSchoolSubmit(event) {
  event.preventDefault();

  if (!state.isAdmin) {
    showSchoolNote("Нужно войти как администратор.", true);
    return;
  }

  if (!state.schoolsSchemaReady) {
    showSchoolNote("Сначала обновите SQL-схему Supabase: добавьте таблицу schools.", true);
    return;
  }

  const formData = new FormData(schoolForm);
  const name = String(formData.get("schoolName") ?? "").trim();

  if (!name) {
    showSchoolNote("Введите название автошколы.", true);
    return;
  }

  const school = normalizeSchool({
    id: createUuid(),
    name,
    slug: generateSchoolSlug(name),
    inviteKey: generateSchoolKey(),
    isActive: true,
    createdBy: state.currentAdminId,
    createdAt: new Date().toISOString(),
  });

  startSyncStatus("Создаем автошколу");

  const { data, error } = await supabaseClient
    .from("schools")
    .insert(mapSchoolToRow(school))
    .select("*")
    .single();

  if (error) {
    finishSyncError(error, "Не удалось создать автошколу");
    showSchoolNote(describeSyncError(error), true);
    return;
  }

  const savedSchool = mapSchoolFromRow(data);
  state.schools.push(savedSchool);
  localStorage.setItem(SCHOOLS_KEY, JSON.stringify(state.schools));
  schoolForm.reset();
  finishSyncSuccess("Автошкола создана");
  showSchoolNote(`Автошкола создана. Ключ: ${savedSchool.inviteKey}`);
  render();
}

async function updateSchool(schoolId, updates, successMessage) {
  if (!state.isAdmin) {
    showSchoolNote("Нужно войти как администратор.", true);
    return false;
  }

  const school = getSchoolById(schoolId);
  if (!school) {
    showSchoolNote("Автошкола не найдена.", true);
    return false;
  }

  startSyncStatus("Обновляем автошколу");

  const { data, error } = await supabaseClient
    .from("schools")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", schoolId)
    .select("*")
    .single();

  if (error) {
    finishSyncError(error, "Не удалось обновить автошколу");
    showSchoolNote(describeSyncError(error), true);
    return false;
  }

  const savedSchool = mapSchoolFromRow(data);
  const index = state.schools.findIndex((item) => item.id === schoolId);
  if (index >= 0) {
    state.schools[index] = savedSchool;
  }
  localStorage.setItem(SCHOOLS_KEY, JSON.stringify(state.schools));
  finishSyncSuccess("Автошкола обновлена");
  showSchoolNote(successMessage(savedSchool));
  render();
  return true;
}

async function copySchoolKey(schoolId) {
  const school = getSchoolById(schoolId);
  if (!school) {
    showSchoolNote("Автошкола не найдена.", true);
    return;
  }

  try {
    await navigator.clipboard.writeText(school.inviteKey);
    showSchoolNote(`Ключ автошколы "${school.name}" скопирован.`);
  } catch {
    showSchoolNote(`Ключ: ${school.inviteKey}`);
  }
}

function rotateSchoolKey(schoolId) {
  const school = getSchoolById(schoolId);
  if (!school) {
    showSchoolNote("Автошкола не найдена.", true);
    return;
  }

  const confirmed = window.confirm(`Выпустить новый ключ для "${school.name}"? Старый ключ перестанет работать.`);
  if (!confirmed) {
    return;
  }

  updateSchool(
    schoolId,
    { invite_key: generateSchoolKey() },
    (savedSchool) => `Новый ключ создан: ${savedSchool.inviteKey}`,
  );
}

function toggleSchoolStatus(schoolId) {
  const school = getSchoolById(schoolId);
  if (!school) {
    showSchoolNote("Автошкола не найдена.", true);
    return;
  }

  updateSchool(
    schoolId,
    { is_active: !school.isActive },
    (savedSchool) => savedSchool.isActive
      ? `"${savedSchool.name}" снова принимает регистрацию инструкторов.`
      : `"${savedSchool.name}" выключена: новые инструкторы по ее ключу не зарегистрируются.`,
  );
}

async function updateInstructorStatus(instructorId, status) {
  if (!state.isAdmin) {
    showApprovalNote("Нужно войти как администратор.", true);
    return;
  }

  const instructor = getInstructorById(instructorId);
  if (!instructor) {
    showApprovalNote("Инструктор не найден.", true);
    return;
  }

  const nextStatus = normalizeInstructorStatus(status);
  const updates = {
    status: nextStatus,
    approved_at: nextStatus === "approved" ? new Date().toISOString() : null,
    approved_by: nextStatus === "approved" ? state.currentAdminId : null,
  };

  startSyncStatus(nextStatus === "approved" ? "Одобряем инструктора" : "Блокируем инструктора");

  const { error } = await supabaseClient
    .from("instructors")
    .update(updates)
    .eq("id", instructor.id);

  if (error) {
    finishSyncError(error, "Не удалось обновить инструктора");
    showApprovalNote(describeSyncError(error), true);
    return;
  }

  Object.assign(instructor, {
    status: nextStatus,
    approvedAt: updates.approved_at,
    approvedBy: updates.approved_by,
  });

  localStorage.setItem(INSTRUCTORS_KEY, JSON.stringify(state.instructors));
  finishSyncSuccess(nextStatus === "approved" ? "Инструктор одобрен" : "Инструктор заблокирован");
  showApprovalNote(nextStatus === "approved"
    ? `${getInstructorName(instructor)} теперь доступен ученикам.`
    : `${getInstructorName(instructor)} скрыт от учеников.`
  );
  render();
}

studentEntry?.addEventListener("click", openStudentFlow);
instructorEntry?.addEventListener("click", openInstructorFlow);
adminEntry?.addEventListener("click", openAdminFlow);
backHomeButtons.forEach((button) => button.addEventListener("click", showRoleChoice));
showStudentRegister?.addEventListener("click", showStudentRegisterMode);
showStudentLogin?.addEventListener("click", showStudentLoginMode);
showRegister?.addEventListener("click", showRegisterMode);
showLogin?.addEventListener("click", showLoginMode);
studentResetPassword?.addEventListener("click", () => {
  requestPasswordReset(studentLoginForm?.studentLoginEmail.value, showStudentLoginNote);
});
instructorResetPassword?.addEventListener("click", () => {
  const loginValue = loginForm?.loginName.value ?? "";
  const instructor = getInstructorByLoginOrEmail(loginValue);
  requestPasswordReset(instructor?.email || loginValue, showLoginNote);
});
adminResetPassword?.addEventListener("click", () => {
  requestPasswordReset(adminLoginForm?.adminEmail.value, showAdminLoginNote);
});
studentLoginForm?.addEventListener("submit", handleStudentLogin);
studentRegisterForm?.addEventListener("submit", handleStudentRegister);
loginForm?.addEventListener("submit", handleLogin);
adminLoginForm?.addEventListener("submit", handleAdminLogin);
registerForm?.addEventListener("submit", handleRegister);
passwordResetForm?.addEventListener("submit", handlePasswordReset);
schoolForm?.addEventListener("submit", handleSchoolSubmit);
logoutInstructor?.addEventListener("click", () => {
  setInstructorSession(null);
  if (isSupabaseEnabled) {
    supabaseClient.auth.signOut();
  }
  showRoleChoice();
});
logoutStudent?.addEventListener("click", () => {
  setStudentSession(null);
  if (isSupabaseEnabled) {
    supabaseClient.auth.signOut();
  }
  showStudentLoginScreen();
});
logoutAdmin?.addEventListener("click", () => {
  setAdminSession(null);
  if (isSupabaseEnabled) {
    supabaseClient.auth.signOut();
  }
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

studentSchoolFilter?.addEventListener("change", () => {
  state.selectedSchoolId = studentSchoolFilter.value;
  state.selectedInstructorId = ANY_INSTRUCTOR_ID;
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
    date: button.dataset.date || state.activeDate,
    time: button.dataset.time,
    requestedInstructorId: state.selectedInstructorId,
  };
  showNote("");
  hideBookingSuccess();
  render();
  openBookingDrawer();
});

studentBookingFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.studentBookingFilter;
    if (!STUDENT_BOOKING_FILTERS.has(filter)) return;

    state.studentBookingsFilter = filter;
    showNote("");
    renderStudentUpcomingBookings();
  });
});

studentUpcomingBookings?.addEventListener("click", (event) => {
  const cancelButton = event.target.closest("[data-student-cancel-booking]");
  if (!cancelButton) return;

  cancelStudentBooking(cancelButton.dataset.studentCancelBooking);
});

journalStatusFilter?.addEventListener("change", () => {
  const status = journalStatusFilter.value;
  state.instructorStatusFilter = status === ALL_STATUSES_ID || BOOKING_STATUSES.has(status)
    ? status
    : ALL_STATUSES_ID;
  renderBookings();
});

journalPeriodFilter?.addEventListener("change", () => {
  const period = journalPeriodFilter.value;
  state.instructorPeriodFilter = INSTRUCTOR_PERIOD_FILTERS.has(period)
    ? period
    : ALL_PERIODS_ID;
  renderBookings();
});

journalSearch?.addEventListener("input", () => {
  state.instructorSearchQuery = journalSearch.value;
  renderBookings();
});

bookingList?.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  const statusButton = event.target.closest("[data-status-booking]");

  if (statusButton) {
    updateBookingStatus(statusButton.dataset.statusBooking, statusButton.dataset.bookingStatus);
    return;
  }

  if (editButton) {
    startEditBooking(editButton.dataset.edit);
    return;
  }

  if (deleteButton) {
    deleteBooking(deleteButton.dataset.delete);
  }
});

[todayBookingList, upcomingBookingList].forEach((list) => {
  list?.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit]");
    if (editButton) {
      startEditBooking(editButton.dataset.edit);
    }
  });
});

instructorApprovalList?.addEventListener("click", (event) => {
  const approveButton = event.target.closest("[data-approve-instructor]");
  const blockButton = event.target.closest("[data-block-instructor]");

  if (approveButton) {
    updateInstructorStatus(approveButton.dataset.approveInstructor, "approved");
    return;
  }

  if (blockButton) {
    updateInstructorStatus(blockButton.dataset.blockInstructor, "blocked");
  }
});

schoolList?.addEventListener("click", (event) => {
  const copyButton = event.target.closest("[data-copy-school-key]");
  const rotateButton = event.target.closest("[data-rotate-school-key]");
  const toggleButton = event.target.closest("[data-toggle-school]");

  if (copyButton) {
    copySchoolKey(copyButton.dataset.copySchoolKey);
    return;
  }

  if (rotateButton) {
    rotateSchoolKey(rotateButton.dataset.rotateSchoolKey);
    return;
  }

  if (toggleButton) {
    toggleSchoolStatus(toggleButton.dataset.toggleSchool);
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
  const shouldShowPasswordReset = isPasswordRecoveryUrl();

  await loadAdminStateForCurrentUser();
  await loadSupabaseState();
  applySchoolFromUrl();
  render();

  if (shouldShowPasswordReset) {
    showPasswordResetScreen();
  } else if (window.location.hash === "#student") {
    openStudentFlow();
  } else if (window.location.hash === "#instructor") {
    openInstructorFlow();
  } else if (window.location.hash === "#admin") {
    openAdminFlow();
  } else {
    showAppScreen("role");
  }
}

initApp();
