#!/usr/bin/env node
// Generate questions for papers that have none.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(process.env.HOME || "/home/shimba", "food", "pro", "data");

const subjects = JSON.parse(fs.readFileSync(path.join(DATA, "subjects.json"), "utf8"));
const papers = JSON.parse(fs.readFileSync(path.join(DATA, "papers.json"), "utf8"));
const questions = JSON.parse(fs.readFileSync(path.join(DATA, "questions.json"), "utf8"));

const subById = new Map(subjects.map((s) => [s.id, s]));

function genMath(grade, count) {
  const out = [];
  for (let i = 1; i <= count; i++) {
    const a = 2 + Math.floor(Math.random() * 20);
    const b = 2 + Math.floor(Math.random() * 20);
    const op = ["+", "-", "x"][i % 3];
    const ans = op === "+" ? a + b : op === "-" ? a - b : a * b;
    const wrong = [ans + 1, ans - 1, ans + 2];
    out.push({ text: `Calculate: ${a} ${op} ${b} = ?`, answer: String(ans), marks: 2, type: "mcq", options: [String(ans), ...wrong.map(String)] });
  }
  return out;
}

function genScience(grade, count) {
  const facts = [
    ["What is the chemical symbol for water?", "H2O", ["CO2", "O2", "NaCl"]],
    ["What planet is closest to the sun?", "Mercury", ["Venus", "Earth", "Mars"]],
    ["What gas do plants absorb?", "Carbon dioxide", ["Oxygen", "Nitrogen", "Hydrogen"]],
    ["What is the boiling point of water?", "100 degrees C", ["90 degrees C", "110 degrees C", "212 degrees C"]],
    ["Largest organ in human body?", "Skin", ["Heart", "Liver", "Brain"]],
    ["What force keeps planets in orbit?", "Gravity", ["Magnetism", "Friction", "Wind"]],
  ];
  return facts.slice(0, count).map(([t, a, w]) => ({ text: t, answer: a, marks: 3, type: "mcq", options: [a, ...w] }));
}

function genEnglish(grade, count) {
  const items = [
    ["Plural of 'child'?", "children", ["childs", "childes", "childrens"]],
    ["She ___ to school daily. (go/goes)", "goes", ["go", "going", "gone"]],
    ["Opposite of 'big'?", "small", ["large", "huge", "tall"]],
    ["Who writes books?", "author", ["painter", "driver", "farmer"]],
  ];
  return items.slice(0, count).map(([t, a, w]) => ({ text: t, answer: a, marks: 2, type: "mcq", options: [a, ...w] }));
}

function genGeneric(sub, grade, count) {
  const out = [];
  for (let i = 1; i <= count; i++) {
    out.push({ text: `Question ${i}: Name one key concept in ${sub}.`, answer: "Fundamental principles", marks: 3, type: "mcq", options: ["Fundamental principles", "Random guessing", "Memorization only", "None"] });
  }
  return out;
}

function genFor(subName, grade, count) {
  const s = subName.toLowerCase();
  if (s.includes("math")) return genMath(grade, count);
  if (s.includes("science") || s.includes("physics") || s.includes("chemistry") || s.includes("biology")) return genScience(grade, count);
  if (s.includes("english")) return genEnglish(grade, count);
  return genGeneric(subName, grade, count);
}

const qByPaper = new Map();
for (const q of questions) {
  if (!qByPaper.has(q.paperId)) qByPaper.set(q.paperId, []);
  qByPaper.get(q.paperId).push(q);
}

let added = 0;
const allQs = [...questions];
let qIdx = questions.length;
let papersFixed = 0;

for (const p of papers) {
  const existing = qByPaper.get(p.id) || [];
  if (existing.length >= 5) continue;
  const sub = subById.get(p.subjectId);
  if (!sub) continue;
  const needed = 10 - existing.length;
  const gens = genFor(sub.name, p.grade, needed);
  for (let i = 0; i < gens.length; i++) {
    qIdx++;
    const g = gens[i];
    allQs.push({
      id: `q-${String(qIdx).padStart(4, "0")}`,
      paperId: p.id,
      questionNumber: existing.length + i + 1,
      text: g.text,
      marks: g.marks,
      modelAnswer: g.answer,
      type: g.type,
      options: g.options || [],
    });
    added++;
  }
  papersFixed++;
}

fs.writeFileSync(path.join(DATA, "questions.json"), JSON.stringify(allQs, null, 2));
console.log(`Generated ${added} questions for ${papersFixed} papers. Total: ${allQs.length} (was ${questions.length})`);
