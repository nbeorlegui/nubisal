export type ReportKpi = {
  label: string;
  value: string;
  detail: string;
};

export type ChartDatum = {
  name: string;
  value: number;
};

export type LatestQuery = {
  id: string;
  text: string;
  userName: string;
  branchName: string;
  healthInsuranceName: string;
  resultFound: boolean;
  topScore: number;
  createdAt: string;
};

export type ReportsData = {
  kpis: ReportKpi[];
  queriesByDay: ChartDatum[];
  queriesByBranch: ChartDatum[];
  queriesByHealthInsurance: ChartDatum[];
  responseStatus: ChartDatum[];
  latestQueries: LatestQuery[];
};

export function formatReportDate(date: Date) {
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
