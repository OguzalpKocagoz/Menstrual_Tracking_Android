import type { Messages } from "./tr";

/** English. Yapı `tr.ts` ile birebir aynı olmak zorunda (bkz. `Messages`). */

const plural = (n: number, one: string, other: string) => `${n} ${n === 1 ? one : other}`;

export const en: Messages = {
  common: {
    appName: "Döngüm",
    cancel: "Cancel",
    delete: "Delete",
    save: "Save",
    saved: "Saved.",
    retry: "Try again",
    edit: "Edit",
    days: (n) => plural(n, "day", "days"),
  },

  dates: {
    months: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ],
    weekdaysShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    long: (day, month, year) => `${month} ${day}, ${year}`,
    short: (day, month) => `${month.slice(0, 3)} ${day}`,
    monthYear: (month, year) => `${month} ${year}`,
    time: (hour) => `${hour % 12 || 12}:00 ${hour < 12 ? "AM" : "PM"}`,
    relative: (days) => {
      if (days === 0) return "today";
      if (days === 1) return "tomorrow";
      if (days === -1) return "yesterday";
      if (days > 1) return `in ${plural(days, "day", "days")}`;
      return `${plural(Math.abs(days), "day", "days")} ago`;
    },
  },

  errors: {
    unexpected: "Something went wrong.",
    loadFailed: "Couldn't load your data.",
    saveFailed: "Couldn't save.",
    invalidDate: "Invalid date.",
    cycleNotFound: "Cycle not found.",
    noCycleToEnd: "There's no cycle to end.",
    futureStart: "A period can't start on a future date.",
    endBeforeStart: "The period can't end before it starts.",
    periodTooLong: (max) => `A period can't be longer than ${max} days.`,
    invalidFlow: "Invalid flow intensity.",
    invalidMood: "Invalid mood.",
    temperatureRange: "Temperature must be between 34 and 43 °C.",
    lengthRange: (field, min, max) =>
      `${field === "cycleLength" ? "Cycle length" : "Period length"} must be between ${min} and ${max} days.`,
  },

  labels: {
    flow: {
      spotting: "Spotting",
      light: "Light",
      medium: "Medium",
      heavy: "Heavy",
    },
    mood: {
      great: "Great",
      good: "Good",
      neutral: "Okay",
      low: "Low",
      irritable: "Irritable",
      anxious: "Anxious",
    },
    symptom: {
      cramps: "Cramps",
      headache: "Headache",
      bloating: "Bloating",
      backache: "Back pain",
      tender_breasts: "Tender breasts",
      acne: "Acne",
      fatigue: "Fatigue",
      nausea: "Nausea",
      insomnia: "Insomnia",
      cravings: "Cravings",
    },
    phase: {
      menstrual: "Menstruation",
      follicular: "Follicular phase",
      ovulation: "Ovulation",
      luteal: "Luteal phase",
    },
    phaseAlias: {
      menstrual: "Period",
      follicular: null,
      ovulation: null,
      luteal: null,
    },
    fertility: {
      peak: "Peak",
      high: "High",
      medium: "Medium",
      low: "Low",
      none: "Very low",
    },
    theme: {
      rose: "Rose",
      bloom: "Lavender",
      ocean: "Ocean",
      forest: "Forest",
      aurora: "Aurora",
    },
  },

  tabs: {
    today: "Today",
    calendar: "Calendar",
    fertility: "Fertility",
    stats: "Insights",
    settings: "Settings",
    day: "Day",
  },

  disclaimer:
    "Döngüm is for personal tracking only and is not a substitute for medical advice, diagnosis or " +
    "treatment. Predictions are estimates based on your past entries and must not be used as a method " +
    "of birth control. Talk to a doctor about decisions regarding your health.",

  contraception:
    "This is an estimate; the actual day of ovulation shifts from cycle to cycle. Do not use it for birth control.",

  welcome: {
    tagline: "Track your cycle and see your next period coming.",
    localData:
      "Your entries are stored only on this phone. You don't need an account and your data is never sent to a server.",
    understood: "I have read and understood this.",
    start: "Get started",
  },

  ring: {
    cycleDay: (n) => `Day ${n}`,
  },

  phaseStrip: {
    day: (n) => `Day ${n}`,
    range: (from, to) => `Days ${from}–${to}`,
  },

  today: {
    endedToday: "Your period ended today",
    onPeriod: "You're on your period",
    noData: "No entries yet",
    noDataHint: "Log your first period",
    daysUntil: (n) => `${plural(n, "day", "days")} until your period`,
    dueToday: "Your period is due today",
    late: (n) => `Your period is ${plural(n, "day", "days")} late`,
    endMarkedToday: "You marked today as the last day.",
    undo: "Undo",
    periodEnded: "My period ended",
    periodStarted: "My period started",
    nextPeriod: "Next period",
    estimateNote: "Estimate: accuracy improves as you log more cycles.",
    phases: "Cycle phases",
    todayLog: "Today's log",
    flowLine: (value) => `Flow: ${value}`,
    moodLine: (value) => `Mood: ${value}`,
    symptomsLine: (value) => `Symptoms: ${value}`,
    temperatureLine: (value) => `Basal temperature: ${value} °C`,
    noLog: "Nothing logged today.",
    addLog: "Add entry",
  },

  calendar: {
    previousMonth: "Previous month",
    nextMonth: "Next month",
    legendPeriod: "Period (logged)",
    legendPredicted: "Predicted period",
    legendFertile: "Fertile window",
    legendOvulation: "Predicted ovulation",
    tapHint: "Tap a day to add an entry.",
  },

  fertility: {
    needPeriod: "Log the start of a period first to predict your fertile window.",
    window: "Fertile window",
    opensIn: (days) =>
      days === 1 ? "The window opens tomorrow." : `The window opens in ${plural(days, "day", "days")}.`,
    inWindow: "You're in your fertile window now.",
    passed: "This cycle's window has passed.",
    ovulation: "Predicted ovulation: ",
    estimateNote: "Estimate: not enough entries yet.",
    byDay: "Chance by day",
    ovulationTag: " · ovulation",
    todayTag: " · today",
  },

  stats: {
    cycle: "Cycle",
    average: "Average cycle",
    median: "Median cycle",
    shortest: "Shortest",
    longest: "Longest",
    averagePeriod: "Average period length",
    regularity: "Regularity",
    notYet: "Not known yet",
    regular: (variation) => `Regular (±${plural(variation, "day", "days")})`,
    variable: (variation) => `Irregular (±${plural(variation, "day", "days")})`,
    counted: "Cycles counted",
    estimateNote: "* Estimate: real values appear once you've logged at least two period starts.",
    history: "Cycle history",
    noHistory: "No cycles logged yet.",
    cycleLength: (n) => `${n}-day cycle`,
    ongoing: "Ongoing",
    bleeding: (n) => `${plural(n, "day", "days")} of bleeding`,
    noEnd: "end not marked",
    longPressHint: "Press and hold a cycle to delete it.",
    deleteTitle: "Delete cycle",
    deleteBody: (date) => `Delete the cycle that started on ${date}? This can't be undone.`,
  },

  day: {
    period: "Period",
    futureNote: "A period can't start on a future date.",
    endedThisDay: "Bleeding is marked as ending on this day.",
    endHere: "Set this as the last day",
    startHere: "My period started this day",
    deleteStart: "Delete the period start on this day",
    deleteTitle: "Delete cycle",
    deleteBody: "Delete the period start logged on this day?",
    flow: "Flow",
    mood: "Mood",
    symptoms: "Symptoms",
    temperature: "Basal temperature (°C)",
    temperaturePlaceholder: "36.6",
    note: "Note",
  },

  settings: {
    theme: "Theme",
    themeA11y: (name) => `${name} theme`,
    language: "Language",
    languageAuto: "Automatic",
    languageAutoHint: "When set to automatic, your phone's language is used.",
    lengths: "Default lengths",
    lengthsHint: "Leave empty to calculate them from your entries.",
    cycleLength: "Cycle length (days)",
    periodLength: "Period length (days)",
    privacy: "Privacy",
    appLock: "App lock",
    appLockHint: "Your phone's lock (fingerprint, face or PIN) is required when you open or return to the app.",
    noDeviceLock: "Set up a screen lock (PIN, pattern or fingerprint) in your phone's settings first.",
    lockPromptOn: "Turn on app lock",
    lockPromptOff: "Turn off app lock",
    lockFailed: "Couldn't change the app lock.",
    adPrivacy: "Ad privacy choices",
    reminders: "Reminders",
    beforePeriod: "Before your period starts",
    off: "Off",
    fertileStart: "When the fertile window starts",
    remindersHint:
      "Because reminders can appear on the lock screen, their text is deliberately vague and never mentions periods or fertility.",
    reminderTime: "Reminder time",
    reminderTimeFree: (time) => `Fixed at ${time} in the free version.`,
    pill: "Daily pill reminder",
    pillHint: "A neutral notification arrives every day at the time you choose.",
    pillTime: "Pill time",
    premiumLocked: "This feature is part of Premium.",
    premiumTitle: "Premium",
    premiumActive: "Premium is active. Thank you!",
    premiumHint: "No ads, partner sharing, extra themes and advanced reminders.",
    premiumCta: "Get Premium",
    devPremium: "Developer: try Premium",
    permissionDenied: "Notifications aren't allowed. Allow notifications for Döngüm in your phone's settings.",
    data: "Your data",
    dataHint:
      "Your entries are stored only on this phone and never sent to a server. Uninstalling the app deletes them; if your phone's Google backup is on, they're restored on a new phone.",
    deleteAll: "Delete all entries",
    deleteAllBody: "All cycle and daily entries on this phone will be permanently deleted. This can't be undone.",
  },

  lock: {
    prompt: "Unlock Döngüm",
    locked: "Your entries are locked.",
    unlock: "Unlock",
  },

  notifications: {
    channel: "Reminders",
    period: "There's an upcoming day in your calendar.",
    fertile: "Something new starts in your calendar today.",
    pill: "Time for your daily reminder.",
  },

  premium: {
    title: "Döngüm Premium",
    subtitle: "Track your cycle without ads and share it with your partner.",
    features: [
      { title: "No ads", body: "You won't see ads on any screen." },
      {
        title: "Partner sharing",
        body: "Your partner follows your cycle on their own phone; you decide what's shared. If either of you has Premium, it's unlocked for both. (Coming soon)",
      },
      { title: "Extra themes", body: "Aurora and new themes as they arrive." },
      { title: "Advanced reminders", body: "Choose your reminder time and set a daily pill reminder." },
    ],
    monthly: "Monthly",
    yearly: "Yearly",
    bestValue: "Best value",
    priceFromStore: "Price shown on Google Play",
    trial: "First 7 days free. Cancel before the trial ends and you won't be charged.",
    subscribe: "Try 7 days free",
    comingSoon: "Purchases open once the app is live on Google Play.",
    restore: "Restore purchases",
    terms:
      "Your subscription renews automatically at the end of each period until you cancel. Cancel anytime in Google Play > Subscriptions.",
    active: "Premium is active. Every feature is unlocked.",
  },
};
