export const DEFAULT_COMPETITION_ID = "matematika-za-vseki";
export interface Competition {
 id: string;
 title: string;
 grade: 4;
 difficulty: "easy" | "medium" | "hard";
 published: boolean;
 contentVersion: string | null;
}
export const competitions: readonly Competition[] = [
 {id: DEFAULT_COMPETITION_ID, title: "Математика за всеки", grade: 4, difficulty: "hard", published: true, contentVersion: "bg4-2024-2026-v2"},
 {id: "olimpiada", title: "Олимпиада (общински кръг)", grade: 4, difficulty: "medium", published: true, contentVersion: "bg4-olimpiada-2022-2025-draft-v1"},
 {id: "nvo", title: "НВО", grade: 4, difficulty: "easy", published: true, contentVersion: "bg4-nvo-2022-2025-draft-v1"},
 {id: "proletno", title: "Пролетни математически състезания", grade: 4, difficulty: "hard", published: true, contentVersion: "bg4-proletno-2023-2026-draft-v1"},
 {id: "olimpiada-oblasten", title: "Олимпиада (областен кръг)", grade: 4, difficulty: "hard", published: true, contentVersion: "bg4-olimpiada-oblasten-2023-2026-draft-v1"},
];
export function publishedCompetitions(): Competition[] {
 return competitions.filter(competition => competition.published);
}

export function competitionDifficultyLabel(difficulty: Competition["difficulty"]) {
 return {easy: "Лесно", medium: "Средно", hard: "Трудно"}[difficulty];
}

export function competitionRewardDifficulty(id: string): Competition["difficulty"] {
 const competition = competitions.find(item => item.id === id);
 if (!competition) throw new Error(`Unknown competition: ${id}`);
 return competition.difficulty;
}
