export const DEFAULT_COMPETITION_ID = "matematika-za-vseki";
export interface Competition {
 id: string;
 title: string;
 grade: 4;
 published: boolean;
 contentVersion: string | null;
}
export const competitions: readonly Competition[] = [
 {id: DEFAULT_COMPETITION_ID, title: "Математика за всеки", grade: 4, published: true, contentVersion: "bg4-2024-2026-v2"},
 {id: "olimpiada", title: "Олимпиада", grade: 4, published: false, contentVersion: null},
 {id: "nvo", title: "НВО", grade: 4, published: false, contentVersion: null},
];
export function publishedCompetitions(): Competition[] {
 return competitions.filter(competition => competition.published);
}
