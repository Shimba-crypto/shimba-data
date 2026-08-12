import { useEffect, useMemo, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

type Paper = { id: string; title: string; subjectId: string; grade: string | number; year: number; questionsCount?: number };
type Subject = { id: string; name: string };
type Question = { id: string; questionNumber: number; text: string; marks?: number; options?: string[]; modelAnswer?: string };
type PaperDetail = {
  id: string; subjectId: string; title: string; year: number; grade: string | number;
  examType?: string; description?: string; createdAt?: string; source?: string; questions?: Question[];
};

export default function Papers() {
  usePageTitle("Past Papers");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [grade, setGrade] = useState("");
  const [year, setYear] = useState("");
  const [selected, setSelected] = useState<PaperDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/sd/subjects").then((r) => r.json()),
      fetch("/api/sd/papers").then((r) => r.json()),
    ])
      .then(([sub, pap]) => { setSubjects(sub || []); setPapers(pap || []); })
      .catch(() => setErr("Failed to load papers. Try again shortly."))
      .finally(() => setLoading(false));
  }, []);

  const subjectName = useMemo(() => {
    const m: Record<string, string> = {};
    subjects.forEach((s) => (m[s.id] = s.name));
    return m;
  }, [subjects]);

  const grades = useMemo(() => {
    const set = new Set<string>();
    papers.forEach((p) => set.add(String(p.grade)));
    return [...set].sort((a, b) => Number(a) - Number(b));
  }, [papers]);

  const years = useMemo(() => {
    const set = new Set<number>();
    papers.forEach((p) => set.add(p.year));
    return [...set].sort((a, b) => b - a);
  }, [papers]);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return papers.filter((p) => {
      if (subjectId && p.subjectId !== subjectId) return false;
      if (grade && String(p.grade) !== grade) return false;
      if (year && String(p.year) !== year) return false;
      if (text && !p.title.toLowerCase().includes(text)) return false;
      return true;
    });
  }, [papers, q, subjectId, grade, year]);

  async function openPaper(id: string) {
    setDetailLoading(true);
    setShowAnswers(false);
    setSelected(null);
    try {
      const r = await fetch(`/api/sd/papers/${id}`);
      const d = await r.json();
      setSelected(d);
    } catch { setSelected({ id, title: "Failed to load", year: 0, grade: "", subjectId: "" } as PaperDetail); }
    setDetailLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() { setQ(""); setSubjectId(""); setGrade(""); setYear(""); }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 min-h-screen">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">ECZ Past Papers</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? "Loading…" : `${filtered.length} of ${papers.length} papers`}</p>
        </div>
        {selected && (
          <button onClick={() => { setSelected(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="text-sm text-gray-500 hover:text-gray-900">← Back to papers</button>
        )}
      </div>

      {err && <p className="text-sm text-red-600 bg-red-50 rounded-md p-3 mb-4">{err}</p>}

      {!selected && (
        <div className="mb-6 space-y-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search papers (e.g. Mathematics 2022)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
          <div className="flex flex-wrap gap-2">
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-gray-900 bg-white">
              <option value="">All subjects</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={grade} onChange={(e) => setGrade(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-gray-900 bg-white">
              <option value="">All grades</option>
              {grades.map((g) => <option key={g} value={g}>Grade {g}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-gray-900 bg-white">
              <option value="">All years</option>
              {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
            </select>
            {(q || subjectId || grade || year) && (
              <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-900 px-2">Clear</button>
            )}
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-gray-400 py-10 text-center">Loading papers…</p>}

      {!loading && !selected && filtered.length === 0 && (
        <p className="text-sm text-gray-500 py-10 text-center">No papers match. Try clearing filters.</p>
      )}

      {!selected && filtered.map((p) => (
        <button key={p.id} onClick={() => openPaper(p.id)}
          className="w-full text-left border border-gray-200 rounded-lg p-4 mb-2 hover:border-gray-900 transition flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-900">{p.title}</p>
            <p className="text-xs text-gray-500 mt-1">{subjectName[p.subjectId] || "ECZ"} · Grade {p.grade} · {p.year}</p>
          </div>
          {typeof p.questionsCount === "number" && (
            <span className="text-xs text-gray-400 whitespace-nowrap">{p.questionsCount} questions</span>
          )}
        </button>
      ))}

      {selected && (
        <div className="border border-gray-200 rounded-lg p-5">
          {detailLoading ? (
            <p className="text-sm text-gray-400 py-8 text-center">Loading paper…</p>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900">{selected.title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {subjectName[selected.subjectId] || "ECZ"} · Grade {selected.grade} · {selected.year}
                {selected.examType ? ` · ${selected.examType}` : ""}
                {selected.questions ? ` · ${selected.questions.length} questions` : ""}
              </p>
              {selected.description && <p className="text-sm text-gray-600 mt-2">{selected.description}</p>}

              {selected.questions && selected.questions.length > 0 && (
                <>
                  <div className="flex justify-end mt-4">
                    <button onClick={() => setShowAnswers(!showAnswers)}
                      className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 font-medium">
                      {showAnswers ? "Hide answers" : "Show answers"}
                    </button>
                  </div>
                  <div className="space-y-4 mt-4">
                    {selected.questions.map((qn) => (
                      <div key={qn.id} className="border border-gray-100 rounded-lg p-4">
                        <p className="text-sm text-gray-900">
                          <span className="text-gray-400 mr-2">Q{qn.questionNumber}{qn.marks ? ` (${qn.marks} mrks)` : ""}</span>
                          {qn.text}
                        </p>
                        {qn.options && qn.options.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {qn.options.map((opt, i) => (
                              <li key={i} className="text-sm text-gray-600 pl-6">• {opt}</li>
                            ))}
                          </ul>
                        )}
                        {showAnswers && qn.modelAnswer && (
                          <p className="text-sm text-emerald-700 mt-2"><span className="font-medium">Answer:</span> {qn.modelAnswer}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}