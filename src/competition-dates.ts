export type CompetitionDate = {
 date: string;
 displayDate: string;
 label: string;
 competitionId: string;
 kind: "date" | "deadline";
};

export const competitionCalendar: readonly CompetitionDate[] = [
 {date:"2026-12-12",displayDate:"До 12 декември 2026 г.",label:"Олимпиада по математика - общински кръг",competitionId:"olimpiada",kind:"deadline"},
 {date:"2027-02-07",displayDate:"7 февруари 2027 г.",label:"Олимпиада по математика - областен кръг",competitionId:"olimpiada-oblasten",kind:"date"},
 {date:"2027-03-27",displayDate:"27 март 2027 г.",label:"Пролетно математическо състезание",competitionId:"proletno",kind:"date"},
 {date:"2027-05-15",displayDate:"15 май 2027 г.",label:"Математика за всеки",competitionId:"matematika-za-vseki",kind:"date"},
 {date:"2027-06-04",displayDate:"4 юни 2027 г.",label:"НВО по математика",competitionId:"nvo",kind:"date"},
];

export const competitionHref = (event: CompetitionDate) => `/?competition=${encodeURIComponent(event.competitionId)}`;
