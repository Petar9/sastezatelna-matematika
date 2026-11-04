export const DEFAULT_COMPETITION_ID = "matematika-za-vseki";
export interface Competition {
 id: string;
 title: string;
 grade: 4;
 difficulty: "easy" | "hard";
 published: boolean;
 contentVersion: string | null;
}
export const competitions: readonly Competition[] = [
 {id: DEFAULT_COMPETITION_ID, title: "Математика за всеки", grade: 4, difficulty: "hard", published: true, contentVersion: "bg4-2024-2026-v2"},
 {id: "olimpiada", title: "Олимпиада", grade: 4, difficulty: "hard", published: false, contentVersion: "bg4-olimpiada-2022-2025-draft-v1"},
 {id: "nvo", title: "НВО", grade: 4, difficulty: "easy", published: false, contentVersion: "bg4-nvo-2022-2025-draft-v1"},
];
export function publishedCompetitions(): Competition[] {
 return competitions.filter(competition => competition.published);
}
