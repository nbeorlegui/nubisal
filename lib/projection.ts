export type ProjectionSettings = {
  totalBranches: number;
  branches24h: number;
  queriesPerBranchPerDay: number;
  manualMinutesPerQuery: number;
  workingDaysPerWeek: number;
  humanStartHour: number;
  humanEndHour: number;
};

export const defaultProjectionSettings: ProjectionSettings = {
  totalBranches: 27,
  branches24h: 8,
  queriesPerBranchPerDay: 1,
  manualMinutesPerQuery: 8,
  workingDaysPerWeek: 5,
  humanStartHour: 8,
  humanEndHour: 17,
};

export function calculateProjection(settings: ProjectionSettings) {
  const normalBranches = Math.max(settings.totalBranches - settings.branches24h, 0);
  const humanHoursPerDay = Math.max(settings.humanEndHour - settings.humanStartHour, 0);
  const humanWeeklyAvailability = humanHoursPerDay * settings.workingDaysPerWeek;
  const botWeeklyAvailability = 24 * 7;
  const additionalWeeklyAvailability = Math.max(botWeeklyAvailability - humanWeeklyAvailability, 0);
  const weeklyQueries = settings.totalBranches * settings.queriesPerBranchPerDay * settings.workingDaysPerWeek;
  const monthlyQueries = weeklyQueries * 4.33;
  const annualQueries = monthlyQueries * 12;
  const weeklyHoursSaved = (weeklyQueries * settings.manualMinutesPerQuery) / 60;
  const monthlyHoursSaved = weeklyHoursSaved * 4.33;
  const annualHoursSaved = monthlyHoursSaved * 12;
  const additional24hBranchCoverage = additionalWeeklyAvailability * settings.branches24h;

  const scenarios = [1, 2, 3].map((queriesPerBranchPerDay) => {
    const scenarioWeeklyQueries = settings.totalBranches * queriesPerBranchPerDay * settings.workingDaysPerWeek;
    const scenarioWeeklyHours = (scenarioWeeklyQueries * settings.manualMinutesPerQuery) / 60;

    return {
      name: `${queriesPerBranchPerDay} consulta${queriesPerBranchPerDay === 1 ? "" : "s"}/día`,
      consultasSemanales: Math.round(scenarioWeeklyQueries),
      horasSemanales: Number(scenarioWeeklyHours.toFixed(1)),
      horasMensuales: Number((scenarioWeeklyHours * 4.33).toFixed(1)),
    };
  });

  const availabilityComparison = [
    { name: "Atención humana", horas: humanWeeklyAvailability },
    { name: "Nubisal Bot", horas: botWeeklyAvailability },
  ];

  return {
    normalBranches,
    humanHoursPerDay,
    humanWeeklyAvailability,
    botWeeklyAvailability,
    additionalWeeklyAvailability,
    weeklyQueries,
    monthlyQueries,
    annualQueries,
    weeklyHoursSaved,
    monthlyHoursSaved,
    annualHoursSaved,
    additional24hBranchCoverage,
    scenarios,
    availabilityComparison,
    weeklyCurve: buildWeeklyAvailabilityCurve(settings),
  };
}

function buildWeeklyAvailabilityCurve(settings: ProjectionSettings) {
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const points: { label: string; humano: number; bot: number }[] = [];

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    for (let hour = 0; hour < 24; hour += 2) {
      const isWorkingDay = dayIndex < settings.workingDaysPerWeek;
      const isHumanAvailable = isWorkingDay && hour >= settings.humanStartHour && hour < settings.humanEndHour;

      points.push({
        label: `${days[dayIndex]} ${String(hour).padStart(2, "0")}h`,
        humano: isHumanAvailable ? 1 : 0,
        bot: 1,
      });
    }
  }

  return points;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(value);
}

export function formatDecimal(value: number) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(value);
}
