export function KidsOwl({ rank = "learner", small = false }: { rank?: "learner" | "doctor" | "professor"; small?: boolean }) {
	const professor = rank === "professor";
	return <svg viewBox="0 0 220 210" width={small ? 64 : 180} height={small ? 61 : 172} role="img"
		aria-label={professor ? "Бухал професор" : rank === "doctor" ? "Бухал доктор" : "Бухалът помощник"}>
		<ellipse cx="110" cy="193" rx="65" ry="9" fill="#92b8a7" opacity=".2" />
		<path d="M52 88 48 44 83 61 Q110 49 137 61 L172 44 168 88 Q191 153 154 184 Q110 205 66 184 Q29 153 52 88" fill={professor ? "#859bc4" : "#8fc4ae"} />
		<path d="M56 112Q25 125 42 169Q51 178 66 163M164 112Q195 125 178 169Q169 178 154 163" fill={professor ? "#586f9c" : "#578d78"} />
		<ellipse cx="110" cy="151" rx="40" ry="38" fill="#e6eddb" />
		<circle cx="80" cy="98" r="29" fill="#fff8e8" /><circle cx="140" cy="98" r="29" fill="#fff8e8" />
		<circle cx="83" cy="99" r="12" fill="#24352f" /><circle cx="137" cy="99" r="12" fill="#24352f" />
		<circle cx="87" cy="94" r="4" fill="white" /><circle cx="141" cy="94" r="4" fill="white" />
		<path d="m100 116 20 0-10 17Z" fill="#e9b34f" />
		<path d="M83 186v10m-7 0h14m47-10v10m-7 0h14" stroke="#e9b34f" strokeWidth="6" strokeLinecap="round" />
		{rank !== "learner" && <><path d="M66 42v24Q110 85 154 64V42" fill="#263b38" /><path d="m39 37 71-26 71 26-71 27Z" fill="#3a5650" /><path d="M171 39v37" stroke="#f0ce79" strokeWidth="4" /><circle cx="171" cy="80" r="6" fill="#f0ce79" />
			<path d="m125 149 24-7 7 24-24 7Z" fill="#f3deb0" /><path d="m135 147 5 21" stroke="#be7a68" strokeWidth="4" /></>}
		{professor && <g stroke="#304349" strokeWidth="3" fill="none"><circle cx="80" cy="100" r="22" /><circle cx="140" cy="100" r="22" /><path d="M102 98h16m-60-3H47m115 0h11" /></g>}
	</svg>;
}
