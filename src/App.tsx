import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  CalendarClock,
  Timer,
  FileChartColumn,
  ShieldCheck,
  AlarmClockCheck,
  FolderTree,
  Target,
  Bell,
  Trash2,
  Upload,
  Download,
  RotateCcw
} from "lucide-react";
import { motion } from "framer-motion";

// --- 主题（白色系、清爽、学生向） ---
const CCT = {
  bg: "#FFFFFF",
  ink: "#0F172A",
  subink: "#334155",
  stroke: "#E6EAF2",
  strokeSoft: "rgba(230,234,242,0.7)",
  capsule: "#F7FAFF",
  sub: "#F9FAFB",
  note: "#FFFFFF",
  primary: "#5CA8FF",
  accent: "#9D8BFF",
  warm: "#F59E0B",
  success: "#22C55E",
  ring: "rgba(99,102,241,0.28)",
  shadow: "0 10px 30px rgba(2,6,23,0.05), 0 1px 0 rgba(2,6,23,0.02)",
  shadowCard: "0 12px 36px rgba(2,6,23,0.07), 0 2px 0 rgba(2,6,23,0.02)",
  glass: "rgba(255,255,255,0.85)",
  tintBlue: "rgba(92,168,255,0.10)",
  tintViolet: "rgba(157,139,255,0.10)",
  tintMint: "rgba(34,197,94,0.10)",
};

// ---- 学习规则常量 ----
const FOCUS_LEN_MIN = 45; // 单次专注目标时长（分钟）
const DEEP_MIN = 25; // 计入“深度块”的最小分钟数
const ONE_SEC = 1000;
const TZ = "Asia/Shanghai"; // 统一按中国时区
function isDeep(minutes: number) { return minutes >= DEEP_MIN; }

// ---------- 中国时区时间工具 ----------
function ymdInTZ(d: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("zh-CN", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  const day = parts.find((p) => p.type === "day")?.value ?? "00";
  return { y, m, d: day };
}
function todayStrTZ(tz: string, d: Date = new Date()) { const { y, m, d: day } = ymdInTZ(d, tz); return `${y}-${m}-${day}`; }
function clockInTZ(d: Date, tz: string) {
  const timeStr = new Intl.DateTimeFormat("zh-CN", { timeZone: tz, hour12: false, hour: "2-digit", minute: "2-digit" }).format(d);
  const { y, m, d: day } = ymdInTZ(d, tz);
  const weekday = new Intl.DateTimeFormat("zh-CN", { timeZone: tz, weekday: "short" }).format(d);
  const dateStrCN = `${y}年${m}月${day}日`;
  return { timeStr, dateStrCN, weekday } as const;
}
function toCNDatetimeLocalValue(d: Date) {
  const { y, m, d: day } = ymdInTZ(d, TZ);
  const hh = new Intl.DateTimeFormat("zh-CN", { timeZone: TZ, hour12: false, hour: "2-digit" }).format(d);
  const mm = new Intl.DateTimeFormat("zh-CN", { timeZone: TZ, hour12: false, minute: "2-digit" }).format(d);
  return `${y}-${m}-${day}T${hh}:${mm}`;
}
function useClockCN() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(t); }, []);
  const { timeStr, dateStrCN, weekday } = clockInTZ(now, TZ);
  return { now, timeStr, dateStrCN, weekday } as const;
}
function useGreetingCNFixed() {
  const { now } = useClockCN();
  const hourStr = new Intl.DateTimeFormat("zh-CN-u-nu-latn", { timeZone: TZ, hour12: false, hour: "2-digit" }).format(now);
  let h = Number.parseInt(hourStr, 10);
  if (Number.isNaN(h)) {
    const fb = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour12: false, hour: "2-digit" }).format(now);
    h = Number.parseInt(fb, 10);
  }
  if (h < 6) return { text: "早点休息", emoji: "🔮" } as const;
  if (h < 11) return { text: "早上好", emoji: "​🥛" } as const;
  if (h < 13) return { text: "中午好", emoji: "☀️" } as const;
  if (h < 18) return { text: "下午好", emoji: "☕️" } as const;
  return { text: "晚上好", emoji: "🌙" } as const;
}

// ---------- 复制/导出（含沙箱回退） ----------
async function safeCopyToClipboard(text: string, opts?: { forceFallback?: boolean }): Promise<{ ok: boolean; mode: "clipboard" | "fallback" }> {
  const useNative = !opts?.forceFallback && !!navigator.clipboard && (window as any).isSecureContext;
  if (useNative) { try { await navigator.clipboard.writeText(text); return { ok: true, mode: "clipboard" }; } catch {}
  }
  try {
    const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"; ta.style.pointerEvents = "none"; document.body.appendChild(ta); ta.focus(); ta.select();
    const ok = (document as any).execCommand && (document as any).execCommand("copy"); document.body.removeChild(ta); return { ok: !!ok, mode: "fallback" };
  } catch { return { ok: false, mode: "fallback" }; }
}
function downloadJSONFile(filename: string, text: string) {
  try {
    const blob = new Blob([text], { type: "application/json" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch { const href = buildDataHref(text); const a = document.createElement("a"); a.href = href; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); }
}
function downloadText(filename: string, text: string) { const blob = new Blob([text], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function buildDataHref(text: string) { return `data:application/json;charset=utf-8,${encodeURIComponent(text)}`; }

// --- UI 小组件 ---
function CapsuleTitle({ icon, title, extra }: { icon?: React.ReactNode; title: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-sm font-medium" style={{ background: CCT.capsule, color: CCT.ink, border: `1.5px solid ${CCT.stroke}` }}>{icon}<span>{title}</span></div>
      <div className="text-xs opacity-70">{extra}</div>
    </div>
  );
}
function WireCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={"rounded-2xl p-4 overflow-hidden transition-all hover:-translate-y-0.5 " + className}
      style={{
        background: `linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.92)),
                    radial-gradient(800px 220px at -10% -20%, ${CCT.tintBlue}, transparent 60%),
                    radial-gradient(700px 220px at 110% -10%, ${CCT.tintViolet}, transparent 55%),
                    radial-gradient(600px 180px at 50% 110%, ${CCT.tintMint}, transparent 60%)`,
        border: `1.5px solid ${CCT.stroke}`,
        boxShadow: CCT.shadowCard,
      }}
    >
      {children}
    </motion.div>
  );
}
function MotionButton(props: React.ComponentProps<typeof Button>) {
  // 避免 button 嵌套 button，用 div 包裹
  // @ts-ignore
  return (<motion.div whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.01 }} className="inline-block"><Button {...props} /></motion.div>);
}
function Dot({ filled }: { filled?: boolean }) { return (<span className={`inline-block w-2.5 h-2.5 rounded-full`} style={{ background: filled ? CCT.primary : "transparent", border: `1.5px solid ${filled ? CCT.primary : CCT.stroke}` }} />); }

// ================= Local‑First 数据层 =================

type Project = { id: string; name: string; goal?: string; createdAt: number; weekMilestones?: { id: string; title: string; done?: boolean }[] };
type Task = { id: string; title: string; projectId?: string; done: boolean; due?: string; difficulty?: number; spentSec?: number; todaySec?: number; spentMin?: number; remindAtCN?: string; remindAt?: string; reminded?: boolean };

type Evidence = { id: string; projectId?: string; title: string; note?: string; fileHint?: string; createdAt: number };

type DeepBlock = { id: string; date: string; minutes: number; note?: string };
type Health = { date: string; sleepHour?: number; mood?: string };

type DBState = { projects: Project[]; tasks: Task[]; blocks: DeepBlock[]; health: Health[]; evidence: Evidence[]; currentFocusId?: string; activeProjectId?: string };

const DEFAULT_STATE: DBState = {
  projects: [{ id: "p1", name: "三相不平衡脚本", goal: "产出 MVD + 图表", createdAt: Date.now(), weekMilestones: [ { id: "m1", title: "v0 骨架", done: false }, { id: "m2", title: "里程碑1 可复现", done: false }, { id: "m3", title: "封版 & README", done: false } ] }],
  tasks: [
    { id: "t1", title: "跑通 main.py 生成 CSV", projectId: "p1", done: false, spentSec: 0, todaySec: 0 },
    { id: "t2", title: "画相电流柱状图", projectId: "p1", done: false, spentSec: 0, todaySec: 0 },
  ],
  blocks: [],
  health: [],
  evidence: [],
  currentFocusId: undefined,
  activeProjectId: "p1",
};

const STORAGE_KEY = "tft_planner_v1"; const LAST_RESET_KEY = `tft_last_reset_${TZ}`;
function loadState(): DBState { try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return DEFAULT_STATE; const parsed = JSON.parse(raw); return { ...DEFAULT_STATE, ...parsed } as DBState; } catch { return DEFAULT_STATE; } }
function saveState(s: DBState) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
function getNextUndone(tasks: Task[], currentId?: string): string | undefined { const idx = currentId ? tasks.findIndex((t) => t.id === currentId) : -1; const ordered = [...tasks.slice(idx + 1), ...tasks.slice(0, Math.max(idx, 0))]; const next = ordered.find((t) => !t.done); return next?.id; }
function isReminderDueCN(remindAtCN?: string, now: Date = new Date(), tz: string = TZ) { if (!remindAtCN) return false; const parts = ymdInTZ(now, tz); const hh = new Intl.DateTimeFormat("zh-CN", { timeZone: tz, hour12: false, hour: "2-digit" }).format(now); const mm = new Intl.DateTimeFormat("zh-CN", { timeZone: tz, hour12: false, minute: "2-digit" }).format(now); const nowCN = `${parts.y}-${parts.m}-${parts.d}T${hh}:${mm}`; return nowCN >= remindAtCN; }
function isReminderDue(remindAt?: string, now: Date = new Date()) { if (!remindAt) return false; const at = new Date(remindAt); return now.getTime() >= at.getTime(); }
function taskTotalMin(t: Task) { const sec = t.spentSec ?? (t.spentMin ?? 0) * 60; return Math.floor(sec / 60); }
function taskTodayMin(t: Task) { const sec = t.todaySec ?? 0; return Math.floor(sec / 60); }

function useLocalDB() {
  const [state, setState] = useState<DBState>(loadState());
  useEffect(() => saveState(state), [state]);
  const actions = {
    addProject(name: string) { const p: Project = { id: crypto.randomUUID(), name, createdAt: Date.now(), weekMilestones: [] }; setState((s) => ({ ...s, projects: [p, ...s.projects] })); return p.id; },
    setProjectGoal(id: string, goal?: string) { setState((s) => ({ ...s, projects: s.projects.map((p) => (p.id === id ? { ...p, goal } : p)) })); },
    renameProject(id: string, name: string) { setState((s) => ({ ...s, projects: s.projects.map((p) => (p.id === id ? { ...p, name } : p)) })); },
    deleteProject(id: string) { setState((s) => ({ ...s, projects: s.projects.filter((p) => p.id !== id), tasks: s.tasks.filter((t) => t.projectId !== id), currentFocusId: s.currentFocusId && s.tasks.find((t) => t.id === s.currentFocusId)?.projectId === id ? undefined : s.currentFocusId, activeProjectId: s.activeProjectId === id ? s.projects.find((p) => p.id !== id)?.id : s.activeProjectId })); },
    setActiveProject(id?: string) { setState((s) => ({ ...s, activeProjectId: id })); },
    addMilestone(projectId: string, title: string) { setState((s) => ({ ...s, projects: s.projects.map((p) => p.id === projectId ? { ...p, weekMilestones: [ ...(p.weekMilestones ?? []), { id: crypto.randomUUID(), title } ] } : p) })); },
    toggleMilestone(projectId: string, mid: string) { setState((s) => ({ ...s, projects: s.projects.map((p) => p.id === projectId ? { ...p, weekMilestones: (p.weekMilestones ?? []).map(m => m.id === mid ? { ...m, done: !m.done } : m) } : p) })); },
    deleteMilestone(projectId: string, mid: string) { setState((s) => ({ ...s, projects: s.projects.map((p) => p.id === projectId ? { ...p, weekMilestones: (p.weekMilestones ?? []).filter(m => m.id !== mid) } : p) })); },

    addTask(title: string, projectId?: string) { const t: Task = { id: crypto.randomUUID(), title, projectId, done: false, spentSec: 0, todaySec: 0 }; setState((s) => ({ ...s, tasks: [t, ...s.tasks] })); },
    toggleTask(id: string) { setState((s) => { const tasks = s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)); const justDone = tasks.find((t) => t.id === id)?.done; const focusCleared = justDone && s.currentFocusId === id ? undefined : s.currentFocusId; return { ...s, tasks, currentFocusId: focusCleared }; }); },
    deleteTask(id: string) { setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id), currentFocusId: s.currentFocusId === id ? undefined : s.currentFocusId })); },
    setFocusTask(id?: string) { setState((s) => ({ ...s, currentFocusId: id })); },
    addTimeSecToTask(id: string, seconds: number) { if (!seconds || seconds <= 0) return; setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, spentSec: (t.spentSec ?? 0) + seconds, todaySec: (t.todaySec ?? 0) + seconds } : t)) })); },

    setReminderCN(id: string, cnLocal?: string) { setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, remindAtCN: cnLocal, reminded: false } : t)) })); },
    setReminder(id: string, iso?: string) { setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, remindAt: iso, reminded: false } : t)) })); },
    markReminded(id: string) { setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, reminded: true } : t)) })); },

    addEvidence(ev: Omit<Evidence, 'id' | 'createdAt'> & { createdAt?: number }) { const e: Evidence = { id: crypto.randomUUID(), createdAt: ev.createdAt ?? Date.now(), ...ev }; setState((s) => ({ ...s, evidence: [e, ...s.evidence] })); return e.id; },
    updateEvidence(id: string, patch: Partial<Evidence>) { setState((s) => ({ ...s, evidence: s.evidence.map((e) => e.id === id ? { ...e, ...patch } : e) })); },
    deleteEvidence(id: string) { setState((s) => ({ ...s, evidence: s.evidence.filter((e) => e.id !== id) })); },

    addBlock(minutes: number, note?: string) { const b: DeepBlock = { id: crypto.randomUUID(), date: todayStrTZ(TZ), minutes, note }; setState((s) => ({ ...s, blocks: [b, ...s.blocks] })); },
    setSleep(hours: number) { const d = todayStrTZ(TZ); setState((s) => { const idx = s.health.findIndex((h) => h.date === d); if (idx >= 0) { const h = [...s.health]; h[idx] = { ...h[idx], sleepHour: hours }; return { ...s, health: h }; } return { ...s, health: [{ date: d, sleepHour: hours }, ...s.health] }; }); },

    resetAll() { setState(DEFAULT_STATE); localStorage.removeItem(LAST_RESET_KEY); },
    importJSON(obj: DBState) { setState({ ...DEFAULT_STATE, ...obj }); },
    exportJSON(): string { return JSON.stringify(state, null, 2); },
  } as const;
  const selectors = {
    todayBlocks: state.blocks.filter((b) => b.date === todayStrTZ(TZ)),
    todayDeepBlocks: state.blocks.filter((b) => b.date === todayStrTZ(TZ) && isDeep(b.minutes)),
    todayShortBlocks: state.blocks.filter((b) => b.date === todayStrTZ(TZ) && !isDeep(b.minutes)),
    tasksByProject(pid?: string) { return state.tasks.filter((t) => (pid ? t.projectId === pid : true)); },
    evidenceByProject(pid?: string) { return state.evidence.filter((e) => (pid ? e.projectId === pid : true)); },
    projectProgress(pid?: string) { const ts = state.tasks.filter(t => (pid ? t.projectId === pid : true)); const all = ts.length; const done = ts.filter(t=>t.done).length; return { done, all, pct: all ? Math.round(done/all*100) : 0 }; },
    sleepToday: state.health.find((h) => h.date === todayStrTZ(TZ))?.sleepHour ?? 0,
    currentFocusTask(): Task | undefined { return state.currentFocusId ? state.tasks.find((t) => t.id === state.currentFocusId) : undefined; },
    todayTotalTaskMin(): number { return Math.floor(state.tasks.reduce((acc, t) => acc + (t.todaySec ?? 0), 0) / 60); },
  } as const;
  return { state, setState, actions, selectors } as const;
}

// =============== 计时器（番茄/专注） ===============
function useFocusTimer(db: ReturnType<typeof useLocalDB>) {
  const [running, setRunning] = useState(false);
  const [remain, setRemain] = useState(FOCUS_LEN_MIN * 60); // 秒
  const tickRef = useRef<number | null>(null);
  const focusRef = useRef<string | undefined>(db.state.currentFocusId);
  const startedAtRef = useRef<number | null>(null);
  const accumSecRef = useRef<number>(0);
  useEffect(() => { focusRef.current = db.state.currentFocusId; }, [db.state.currentFocusId]);

  useEffect(() => {
    if (!running) { if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; } return; }
    tickRef.current = window.setInterval(() => {
      setRemain((r) => Math.max(0, r - 1));
      const id = focusRef.current; if (id) db.actions.addTimeSecToTask(id, 1);
    }, ONE_SEC);
    return () => { if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; } };
  }, [running]);

  function start() { if (startedAtRef.current == null) startedAtRef.current = Date.now(); setRunning(true); }
  function pause() {
    setRunning(false);
    if (startedAtRef.current != null) {
      accumSecRef.current += Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000));
      startedAtRef.current = null;
    }
  }
  function complete() {
    setRunning(false);
    let secs = accumSecRef.current + (startedAtRef.current != null ? Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000)) : 0);
    startedAtRef.current = null; accumSecRef.current = 0;
    if (secs === 0) { const elapsed = Math.max(0, FOCUS_LEN_MIN * 60 - remain); secs = elapsed; }
    const minutes = secs > 0 ? Math.ceil(secs / 60) : 0;
    if (minutes > 1) db.actions.addBlock(minutes, minutes >= DEEP_MIN ? "深度" : "短专注");
    setRemain(FOCUS_LEN_MIN * 60);
  }

  // 自动完成：倒计时归零时自动记录并停止
  useEffect(() => {
    if (running && remain === 0) {
      complete();
    }
  }, [running, remain]);

  const mm = String(Math.floor(remain / 60)).padStart(2, "0");
  const ss = String(remain % 60).padStart(2, "0");
  const pct = Math.round(((FOCUS_LEN_MIN * 60 - remain) / (FOCUS_LEN_MIN * 60)) * 100);
  return { running, mm, ss, pct, start, pause, complete } as const;
}

// =============== 提醒监听（本地轮询） ===============
function useReminderWatcher(db: ReturnType<typeof useLocalDB>) {
  const [alert, setAlert] = useState<{ taskId: string; title: string } | null>(null);
  useEffect(() => {
    const t = window.setInterval(() => {
      const now = new Date();
      for (const task of db.state.tasks) {
        if (task.remindAtCN && !task.reminded && isReminderDueCN(task.remindAtCN, now, TZ)) { setAlert({ taskId: task.id, title: task.title }); db.actions.markReminded(task.id); break; }
        if (!task.remindAtCN && task.remindAt && !task.reminded && isReminderDue(task.remindAt, now)) { setAlert({ taskId: task.id, title: task.title }); db.actions.markReminded(task.id); break; }
      }
    }, 30000);
    return () => window.clearInterval(t);
  }, [db.state.tasks]);
  function clear() { setAlert(null); }
  function startTask(taskId: string) { db.actions.setFocusTask(taskId); clear(); }
  return { alert, clear, startTask } as const;
}

// ================= Toast（轻氛围） =================
function useToasts() { const [items, setItems] = useState<{ id: string; text: string }[]>([]); function push(text: string) { const id = crypto.randomUUID(); setItems((s) => [...s, { id, text }]); window.setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 2600); } function remove(id: string) { setItems((s) => s.filter((i) => i.id !== id)); } return { items, push, remove } as const; }
function Toasts({ items, remove }: { items: { id: string; text: string }[]; remove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {items.map((t) => (
        <motion.div key={t.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl px-3 py-2 text-sm flex items-center gap-2" style={{ background: CCT.note, border: `1.5px solid ${CCT.stroke}`, boxShadow: CCT.shadowCard }}>
          <span>🎉</span><span style={{ color: CCT.ink }}>{t.text}</span>
          <button className="ml-2 text-xs opacity-60" onClick={() => remove(t.id)}>关闭</button>
        </motion.div>
      ))}
    </div>
  );
}

// 轻量留言（按日存储到 localStorage）
function DailyMemo() {
  const today = todayStrTZ(TZ);
  const KEY = `tft_daily_memo_${today}`;
  const LIMIT = 500;
  const [val, setVal] = useState<string>("");
  const [saved, setSaved] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [snapshot, setSnapshot] = useState<string>("");
  const saveRef = useRef<number | null>(null);
  useEffect(() => { try { const v = localStorage.getItem(KEY) || ""; setVal(v); } catch {} }, [KEY]);
  useEffect(() => {
    if (editing) return;
    if (saveRef.current) window.clearTimeout(saveRef.current);
    saveRef.current = window.setTimeout(() => {
      try { localStorage.setItem(KEY, val); setSaved("已保存"); setTimeout(()=> setSaved(""), 1200); } catch {}
    }, 400) as any;
    return () => { if (saveRef.current) window.clearTimeout(saveRef.current); };
  }, [val, KEY, editing]);
  function clear() { setVal(""); try { localStorage.setItem(KEY, ""); } catch {} }
  const count = val.length;
  const memoFontClass = count <= 80 ? "text-[14px]" : count >= 220 ? "text-[12px]" : "text-[13px]";
  const memoColor = "rgba(15,23,42,0.88)"; // 轻一点的墨色，避免过黑或过灰
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs" style={{ background: CCT.capsule, border: `1.5px solid ${CCT.stroke}`, color: CCT.ink }}>
          <CalendarClock className="w-3.5 h-3.5" />
          <span>今日留言</span>
        </div>
        <div className="text-[11px] opacity-60 inline-flex items-center gap-2">
          <span>{count}/{LIMIT}</span>
          {saved && <span>{saved}</span>}
          <button className="underline" onClick={clear}>清空</button>
        </div>
      </div>
      {!editing ? (
        <div
          className={`min-h-[72px] rounded-xl p-3 whitespace-pre-wrap leading-6 cursor-text ${memoFontClass}`}
          style={{ background: CCT.capsule, color: memoColor }}
          onClick={() => { setSnapshot(val); setEditing(true); }}
          title="点击编辑"
        >
          {val || <span className="opacity-50">双击编辑，写点寄语、规划草稿或灵感…</span>}
        </div>
      ) : (
        <textarea
          value={val}
          maxLength={LIMIT}
          onChange={(e)=> setVal(e.target.value)}
          onBlur={()=> setEditing(false)}
          onKeyDown={(e)=> { if (e.key === 'Escape') { setVal(snapshot); setEditing(false); } }}
          autoFocus
          className="w-full min-h-[120px] max-h-60 rounded-xl border p-3 text-[13px] resize-vertical focus:outline-none"
          style={{ background: CCT.note, border: `1.5px solid ${CCT.stroke}`, color: memoColor, boxShadow: CCT.shadowCard }}
        />
      )}
    </div>
  );
}

function StatsBar({ deep, done, all, today }: { deep: number; done: number; all: number; today: number }) {
  return (
    <div className="rounded-xl p-2 mt-2 flex flex-wrap items-center gap-3 justify-start" style={{ background: CCT.sub, border: `1.5px solid ${CCT.stroke}` }}>
      <div className="flex items-center gap-2 text-xs" style={{ color: CCT.ink }}>
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>深度块</span>
        <Dot filled={deep >= 1} />
        <Dot filled={deep >= 2} />
        <span className="opacity-60 ml-1">{deep}/2</span>
      </div>
      <div className="flex items-center gap-2 text-xs" style={{ color: CCT.ink }}>
        <Target className="w-3.5 h-3.5" />
        <span>任务完成</span>
        <Badge className="rounded-full">{done}/{Math.max(1, all)}</Badge>
      </div>
      <div className="flex items-center gap-2 text-xs" style={{ color: CCT.ink }}>
        <Timer className="w-3.5 h-3.5" />
        <span>今日用时</span>
        <Badge variant="secondary" className="rounded-full" style={{ border: `1.5px solid ${CCT.stroke}` }}>{today} 分钟</Badge>
      </div>
    </div>
  );
}

// ================= 顶部全局状态栏 =================
function GlobalStatusBar({ db, timer, reminder }: { db: ReturnType<typeof useLocalDB>; timer: { running: boolean; mm: string; ss: string; pct: number; start: () => void; pause: () => void; complete: () => void; }; reminder: { alert: { taskId: string; title: string } | null; clear: () => void; startTask: (taskId: string) => void; }; }) {
  const { timeStr, dateStrCN, weekday } = useClockCN();
  const greet = useGreetingCNFixed();
  const pid = db.state.activeProjectId ?? db.state.projects[0]?.id;
  const tasks = db.state.tasks.filter((t) => (pid ? t.projectId === pid : true));
  const doneCount = tasks.filter((t) => t.done).length;
  const deepCount = db.selectors.todayDeepBlocks.length;
  const focus = db.selectors.currentFocusTask();
  const todayTotalMin = db.selectors.todayTotalTaskMin();

  function buildDailySummary() {
    const totalMin = db.selectors.todayBlocks.reduce((acc, b) => acc + b.minutes, 0);
    const short = db.selectors.todayShortBlocks.length; const deep = deepCount; const date = todayStrTZ(TZ);
    const cur = focus ? `当前任务：${focus.title}` : '当前任务：未选择'; const spent = focus ? `（累计 ${taskTotalMin(focus)} 分钟｜今日 ${taskTodayMin(focus)} 分钟）` : '';
    return [`【${date} 学习日结】`, `专注：深度块 ${deep} 个（≥25min），短专注 ${short} 个，共 ${totalMin} 分钟`, `任务：完成 ${doneCount}/${Math.max(1, tasks.length)} 个`, `今日任务用时合计：${todayTotalMin} 分钟`, `${cur}${spent}`, `计时器：${timer.running ? '专注中' : '未开始'}（剩余 ${timer.mm}:${timer.ss}）`].join("\n");
  }
  const [st, setSt] = useState<string>("");
  async function handleSummary() { const text = buildDailySummary(); const r = await safeCopyToClipboard(text); if (r.ok) setSt("已复制日结"); else { downloadText(`学习日结_${todayStrTZ(TZ)}.txt`, text); setSt("已下载日结"); } setTimeout(() => setSt(""), 2000); }
  function handleNext() { const nextId = getNextUndone(tasks, focus?.id); if (nextId) db.actions.setFocusTask(nextId); }

  return (
    <div className="sticky z-20" style={{ top: 56, background: CCT.glass, backdropFilter: "saturate(180%) blur(8px)", borderBottom: `1.5px solid ${CCT.stroke}` }}>
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4">
        {reminder.alert && (
          <div className="mb-3 rounded-xl px-3 py-2 flex items-center gap-3" style={{ background: CCT.capsule, border: `1.5px solid ${CCT.stroke}` }}>
            <AlarmClockCheck className="w-4 h-4" />
            <div className="text-sm" style={{ color: CCT.ink }}>到点提醒：<b>{reminder.alert.title}</b></div>
            <div className="ml-auto flex gap-2">
              <Button className="rounded-full h-7 w-[96px]" onClick={() => reminder.startTask(reminder.alert!.taskId)}>开始专注</Button>
              <Button variant="secondary" className="rounded-full h-7 w-[96px]" style={{ border: `1.5px solid ${CCT.stroke}` }} onClick={reminder.clear}>忽略</Button>
            </div>
            
            <div className="rounded-xl p-3 mt-2" style={{ background: CCT.capsule, border: `1.5px solid ${CCT.stroke}` }}>
              <DailyMemo />
            </div>
            <StatsBar deep={deepCount} done={doneCount} all={tasks.length} today={db.selectors.todayTotalTaskMin()} />

          </div>
        )}

        <div className="rounded-2xl p-4" style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.92)),
                      radial-gradient(1200px 320px at -10% -20%, ${CCT.tintBlue}, transparent 60%),
                      radial-gradient(1000px 280px at 110% 0%, ${CCT.tintViolet}, transparent 55%),
                      radial-gradient(700px 240px at 50% 120%, ${CCT.tintMint}, transparent 60%)`, border: `1.5px solid ${CCT.stroke}`, boxShadow: CCT.shadow }}>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm" style={{ background: CCT.capsule, border: `1.5px solid ${CCT.stroke}` }}>
              <span>{greet.emoji}</span><span style={{ color: CCT.ink }}>{greet.text}，同学</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <MotionButton /* @ts-ignore */ size="sm" variant="secondary" className="h-8 rounded-full w-[96px]" style={{ background: CCT.note, color: CCT.ink, border: `1.5px solid ${CCT.stroke}` }} onClick={handleSummary}>汇总今天</MotionButton>
              {st && <span className="text-xs opacity-60">{st}</span>}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-3">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-5xl font-semibold tracking-widest" style={{ color: CCT.ink }}>{timeStr}</span>
              <span className="text-sm opacity-70">{dateStrCN} · {weekday}</span>
            </div>

            {/* 当前任务 */}
            <div className="rounded-xl p-3 flex items-center gap-2 min-w-0" style={{ background: CCT.capsule, border: `1.5px solid ${CCT.stroke}` }}>
              <div className="text-xs opacity-70 shrink-0">当前任务</div>
              {focus ? (
                <>
                  <input type="checkbox" checked={focus.done} onChange={()=> db.actions.toggleTask(focus.id)} />
                  <div className="truncate font-medium" style={{ color: CCT.ink }}>{focus.title}</div>
                  <div className="hidden sm:block text-xs opacity-60 shrink-0">累计 {taskTotalMin(focus)}m / 今日 {taskTodayMin(focus)}m</div>
                </>
              ) : (
                <div className="text-sm opacity-60">未选择任务</div>
              )}
              <div className="ml-auto grid grid-cols-2 gap-2 justify-items-end items-center shrink-0 min-w-[224px]" data-has-focus={focus ? 'true' : 'false'}>
                <style>{`[data-has-focus] > button { white-space: nowrap; } [data-has-focus="false"] > button + button { display: none; }`}</style>
                {!focus && <div />}
                <Button size="sm" variant="secondary" className="h-7 rounded-full w-[96px]" style={{ border: `1.5px solid ${CCT.stroke}` }} onClick={() => focus ? db.actions.setFocusTask(undefined) : handleNext()}>{focus ? '清除' : '选择下一项'}</Button>
                <Button size="sm" className={`h-7 rounded-full w-[96px] ${focus ? '' : 'opacity-0 pointer-events-none'}`} onClick={handleNext}>下一项</Button>
              </div>
            </div>
            

            {/* 目标 & 今日用时 */}
            <div className="rounded-xl p-3 flex flex-wrap items-center gap-3 hidden" style={{ background: CCT.capsule, border: `1.5px solid ${CCT.stroke}` }}>
              <div className="flex items-center gap-2"><span className="text-sm" style={{ color: CCT.ink }}>深度块</span><Dot filled={db.selectors.todayDeepBlocks.length >= 1} /><Dot filled={db.selectors.todayDeepBlocks.length >= 2} /><span className="text-xs opacity-60 ml-1">{db.selectors.todayDeepBlocks.length}/2</span></div>
              <div className="w-px h-4" style={{ background: CCT.stroke }} />
              <div className="flex items-center gap-2"><span className="text-sm" style={{ color: CCT.ink }}>任务完成</span><Badge className="rounded-full">{doneCount}/{Math.max(1, tasks.length)}</Badge></div>
              <div className="w-px h-4" style={{ background: CCT.stroke }} />
              <div className="flex items-center gap-2"><span className="text-sm" style={{ color: CCT.ink }}>今日用时</span><Badge variant="secondary" className="rounded-full" style={{ border: `1.5px solid ${CCT.stroke}` }}>{todayTotalMin} 分钟</Badge></div>
            </div>

            {/* 计时区 */}
            <div className="rounded-xl p-3" style={{ background: CCT.capsule, border: `1.5px solid ${CCT.stroke}` }}>
              <div className="flex items-center gap-3">
                <span className="relative inline-flex items-center justify-center w-8 h-8 rounded-full" style={{ background: CCT.note, border: `1.5px solid ${CCT.stroke}` }}>
                  <span className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${CCT.primary} ${Math.max(0, Math.min(100, timer.pct))}%, transparent 0)` }} />
                  <span className="relative w-4 h-4 rounded-full" style={{ background: timer.running ? CCT.primary : CCT.stroke }} />
                </span>
                <Timer className="w-4 h-4" />
                <span className="text-xl font-semibold tracking-widest" style={{ color: CCT.ink }}>{timer.mm}:{timer.ss}</span>
                <span className="text-xs opacity-60">{timer.running ? '专注中 · 喝口水～' : '未开始 · 选个任务试试'}</span>
                <div className="ml-auto flex items-center gap-2">
                  {!timer.running ? (
                    <MotionButton /* @ts-ignore */ className="rounded-full h-9 w-[96px]" onClick={timer.start}>开始</MotionButton>
                  ) : (
                    <>
                      <MotionButton /* @ts-ignore */ className="rounded-full h-9 w-[96px]" onClick={timer.pause}>取消</MotionButton>
                      <MotionButton /* @ts-ignore */ variant="secondary" className="rounded-full h-9 w-[96px]" style={{ border: `1.5px solid ${CCT.stroke}` }} onClick={timer.complete}>完成</MotionButton>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: CCT.note, border: `1.5px solid ${CCT.stroke}`, boxShadow: "inset 0 1px 0 rgba(2,6,23,0.04)" }}>
                <div className="h-full" style={{ width: `${Math.min(100, Math.max(0, timer.pct))}%`, background: CCT.primary, transition: 'width 300ms ease' }} />
              </div>
            </div>
            <div className="rounded-xl p-3 mt-2" style={{ background: CCT.capsule, border: `1.5px solid ${CCT.stroke}` }}>
              <DailyMemo />
            </div>
            <StatsBar deep={deepCount} done={doneCount} all={tasks.length} today={db.selectors.todayTotalTaskMin()} />
            
          </div>
        </div>
      </div>
    </div>
  );
}

// ================== 周总结 & 自检（补回备份模块） ==================
function ReviewBoard({ db }: { db: ReturnType<typeof useLocalDB> }) {
  const [copied, setCopied] = useState("");
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return todayStrTZ(TZ, d); });
  const minutesByDay = days.map(d => db.state.blocks.filter(b => b.date === d).reduce((acc, b) => acc + b.minutes, 0));
  const deepByDay = days.map(d => db.state.blocks.filter(b => b.date === d && isDeep(b.minutes)).length);
  const totalMin = minutesByDay.reduce((a, b) => a + b, 0);
  const deepCount = deepByDay.reduce((a, b) => a + b, 0);
  const weekEvidence = db.state.evidence.filter(e => { const edge = new Date(); edge.setDate(edge.getDate() - 7); return e.createdAt >= edge.getTime(); });
  async function copyWeekly() {
    const lines = [
      `# 周总结（近 7 天）`,
      `专注：深度块 ${deepCount} 个，共 ${totalMin} 分钟`,
      `成果：${weekEvidence.length} 条`,
      ``,
      `## 成果清单`,
      ...weekEvidence.map(e => `${new Date(e.createdAt).toLocaleString('zh-CN',{hour12:false})} · ${db.state.projects.find(p=>p.id===e.projectId)?.name ?? '未关联'} · ${e.title}${e.fileHint?`（${e.fileHint}）`:''}${e.note?` — ${e.note}`:''}`)
    ].join(String.fromCharCode(10));
    const r = await safeCopyToClipboard(lines);
    setCopied(r.ok ? '已复制' : '复制受限，已触发下载');
    if(!r.ok) downloadText(`周总结_${todayStrTZ(TZ)}.md`, lines);
    setTimeout(()=> setCopied(''), 2000);
  }
  return (
    <div className="space-y-4">
      <WireCard>
        <CapsuleTitle icon={<CalendarClock className="w-4 h-4" />} title="周总结" extra={<Button className="rounded-full" onClick={copyWeekly}>一键周报</Button>} />
        <div className="mt-4 grid grid-cols-7 gap-2">
          {minutesByDay.map((m,i)=> (
            <div key={i} className="rounded-xl p-3 text-center" style={{ border:`1.5px solid ${CCT.stroke}`, background:CCT.capsule }}>
              <div className="text-xs opacity-60">{days[i].slice(5)}</div>
              <div className="text-base font-semibold" style={{ color: CCT.ink }}>{m}m</div>
              <div className="text-[11px] opacity-60">深度 {deepByDay[i]}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs opacity-70">近 7 天合计 {totalMin} 分钟 · 深度块 {deepCount}</div>
        {copied && <div className="mt-2 text-xs opacity-60">{copied}</div>}
      </WireCard>

      <WireCard>
        <CapsuleTitle icon={<FileChartColumn className="w-4 h-4" />} title="成果（近 7 日）" />
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {weekEvidence.length === 0 && <div className="text-xs opacity-60">暂无成果，去「学习成果」页添加吧～</div>}
          {weekEvidence.map(e => (
            <div key={e.id} className="rounded-2xl p-4" style={{ background: CCT.note, border:`1.5px solid ${CCT.stroke}` }}>
              <div className="text-sm font-medium truncate" style={{ color: CCT.ink }}>{e.title}</div>
              <div className="text-xs opacity-60 mt-1">{new Date(e.createdAt).toLocaleString('zh-CN',{hour12:false})} · {db.state.projects.find(p=>p.id===e.projectId)?.name ?? '未关联'}</div>
              {e.fileHint && <a className="mt-2 inline-block text-xs underline" href={e.fileHint} target="_blank" rel="noreferrer">打开链接/路径</a>}
              {e.note && <div className="mt-1 text-xs opacity-80">{e.note}</div>}
            </div>
          ))}
        </div>
      </WireCard>
    </div>
  );
}

function SmokeTests({ db }: { db: ReturnType<typeof useLocalDB> }) {
  const [log, setLog] = useState<string[]>([]);
  function add(line: string) { setLog((s)=>[...s, line]); }
  function run() {
    setLog([]);
    try {
      const tstr = todayStrTZ(TZ); if(/[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(tstr)) add('✅ todayStrTZ 格式 OK'); else add('❌ todayStrTZ 异常');
      const before = db.state.tasks.length; db.actions.addTask('测试任务'); const after = db.state.tasks.length; add(after===before+1 ? '✅ addTask OK' : '❌ addTask 未增长');
      const tid = db.state.tasks[0]?.id; if(tid){ db.actions.setFocusTask(tid); db.actions.addTimeSecToTask(tid, 1); add((db.state.tasks.find(t=>t.id===tid)?.todaySec ?? 0) >= 1 ? '✅ 计时累计 OK' : '❌ 计时累计未发生'); }
      const eBefore = db.state.evidence.length; db.actions.addEvidence({ title:'测试成果' }); const eAfter = db.state.evidence.length; add(eAfter===eBefore+1 ? '✅ addEvidence OK' : '❌ addEvidence 未增长');
      const pid = db.state.projects[0]?.id; if(pid){ db.actions.setActiveProject(pid); add('✅ setActiveProject OK'); }
      // 额外测试：提醒到点（CN）
      const past = toCNDatetimeLocalValue(new Date(Date.now() - 60*1000));
      const future = toCNDatetimeLocalValue(new Date(Date.now() + 24*60*60*1000));
      add(isReminderDueCN(past) ? '✅ isReminderDueCN 过去时间触发 OK' : '❌ isReminderDueCN 过去时间未触发');
      add(!isReminderDueCN(future) ? '✅ isReminderDueCN 未来时间未触发 OK' : '❌ isReminderDueCN 未来时间误触发');
    } catch (e:any) { add('❌ 运行错误：' + e.message); }
  }
  return (
    <WireCard>
      <CapsuleTitle icon={<ShieldCheck className="w-4 h-4" />} title="自检（本地）" extra={<Button className="rounded-full" onClick={run}>Run</Button>} />
      <div className="mt-3 text-xs whitespace-pre-wrap">{log.join(String.fromCharCode(10)) || '点击 Run 运行一组轻量检查，不会外发任何数据。'}</div>
    </WireCard>
  );
}

// ================= 今天（任务/时间） =================
function TaskInput({ onAdd }: { onAdd: (title: string) => void }) {
  const [val, setVal] = useState("");
  function submit() {
    const v = val.trim(); if(!v) return; onAdd(v); setVal("");
  }
  return (
    <div className="flex items-center gap-2">
      <Input placeholder="输入待办，如：完成作业" value={val} onChange={(e)=> setVal(e.target.value)} onKeyDown={(e)=> { if(e.key==='Enter') submit(); }} />
      <Button className="rounded-full h-9 px-4 whitespace-nowrap" onClick={submit}>添加</Button>
    </div>
  );
}

function TodayBoard({ db, timer }: { db: ReturnType<typeof useLocalDB>; timer: { running: boolean; mm: string; ss: string; start: () => void; pause: () => void; complete: () => void; }; }) {
  const pid = db.state.activeProjectId ?? db.state.projects[0]?.id;
  const tasks = db.state.tasks.filter((t) => (pid ? t.projectId === pid : true));
  const doneCount = tasks.filter((t) => t.done).length;
  const deepCount = db.selectors.todayDeepBlocks.length; const shortCount = db.selectors.todayShortBlocks.length;
  const focusId = db.state.currentFocusId;
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [tempReminder, setTempReminder] = useState<string>("");
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState<string>("");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
      {/* 计时器 */}
      <WireCard className="lg:col-span-2">
        <CapsuleTitle title={`专注 ${FOCUS_LEN_MIN} 分钟`} icon={<AlarmClockCheck className="w-4 h-4" />} extra={timer.running ? "计时中" : "未开始"} />
        <div className="mt-4 text-center">
          <div className="text-4xl font-semibold tracking-wider" style={{ color: CCT.ink }}>{timer.mm}:{timer.ss}</div>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {!timer.running && (
              <Button className="rounded-full w-[96px]" onClick={timer.start}>
                <Timer className="w-4 h-4 mr-1" />
                开始
              </Button>
            )}
            {timer.running && (
              <>
                <Button className="rounded-full w-[96px]" onClick={timer.pause}>暂停</Button>
                <Button variant="secondary" className="rounded-full w-[96px]" style={{ border: `1.5px solid ${CCT.stroke}` }} onClick={timer.complete}>完成</Button>
              </>
            )}
          </div>          <div className="mt-3 text-xs opacity-70">深度块 {deepCount} · 短专注 {shortCount}</div>
        </div>
      </WireCard>

      {/* 任务 */}
      <WireCard className="lg:col-span-2">
        <CapsuleTitle title="今天的任务" icon={<Target className="w-4 h-4" />} />
        <div className="mt-3 space-y-2 text-sm">
          <TaskInput onAdd={(title) => db.actions.addTask(title, pid)} />
          <div className="max-h-72 overflow-auto pr-1">
            {tasks.length === 0 && (<div className="text-xs opacity-70">还没有任务，先加一个吧～</div>)}
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <input aria-label="完成" type="checkbox" checked={t.done} onChange={() => db.actions.toggleTask(t.id)} />
                  {editingTitleId === t.id ? (
                    <input
                      autoFocus
                      value={tempTitle}
                      onChange={(e)=> setTempTitle(e.target.value)}
                      onKeyDown={(e)=>{
                        if(e.key==='Enter') {
                          const nv = tempTitle.trim();
                          if(nv){ db.setState((s)=>({...s, tasks:s.tasks.map(tt=>tt.id===t.id?{...tt, title:nv}:tt)})); }
                          setEditingTitleId(null);
                        }
                        if(e.key==='Escape'){
                          setEditingTitleId(null);
                          setTempTitle("");
                        }
                      }}
                      onBlur={()=>{ const nv = tempTitle.trim(); if(nv){ db.setState((s)=>({ ...s, tasks: s.tasks.map(tt=> tt.id===t.id ? { ...tt, title: nv } : tt) })); } setEditingTitleId(null); setTempTitle(""); }}
                      className="flex-1 min-w-0 text-sm font-medium px-2 py-1 rounded-md outline-none"
                      style={{ background: CCT.note, border: `1.5px solid ${CCT.stroke}`, color: CCT.ink, lineHeight: "1.25rem" }}
                    />
                  ) : (
                    <span
                      className={"truncate " + (t.done ? "line-through opacity-60" : "")}
                      style={{ color: CCT.ink }}
                      onClick={()=>{ setEditingTitleId(t.id); setTempTitle(t.title); }}
                    >
                      {t.title}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden sm:block text-xs opacity-60 shrink-0">{`累计 ${taskTotalMin(t)}m / 今日 ${taskTodayMin(t)}m`}</div>
                  <Button
                    variant="secondary"
                    className="rounded-full h-7 px-3 w-[84px]"
                    style={{ border: `1.5px solid ${CCT.stroke}`, boxShadow: focusId === t.id ? `0 0 0 3px ${CCT.ring}` : undefined }}
                    onClick={() => db.actions.setFocusTask(focusId === t.id ? undefined : t.id)}
                  >
                    <span className="flex items-center gap-1.5 justify-center">
                      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: focusId === t.id ? CCT.primary : CCT.stroke }} />
                      专注
                    </span>
                  </Button>
                  <Button variant="secondary" size="icon" className="rounded-full h-7 w-7" style={{ border: `1.5px solid ${CCT.stroke}` }} onClick={() => { setEditingReminderId(t.id); setTempReminder(toCNDatetimeLocalValue(new Date())); }}><Bell className="w-3.5 h-3.5" /></Button>
                  <Button variant="secondary" size="icon" className="rounded-full h-7 w-7" style={{ border: `1.5px solid ${CCT.stroke}` }} onClick={() => db.actions.deleteTask(t.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs opacity-70">已完成 {doneCount}/{Math.max(1, tasks.length)}</div>
        </div>

        {editingReminderId && (
          <div className="mt-3 rounded-xl p-3" style={{ background: CCT.capsule, border: `1.5px solid ${CCT.stroke}` }}>
            <div className="text-xs opacity-70 mb-2">设置提醒时间（按中国时区）</div>
            <div className="flex items-center gap-2">
              <input type="datetime-local" className="rounded-xl px-3 py-2 border" style={{ borderColor: CCT.stroke }} value={tempReminder} onChange={(e)=> setTempReminder(e.target.value)} />
              <Button className="rounded-full" onClick={()=> { db.actions.setReminderCN(editingReminderId, tempReminder); setEditingReminderId(null); }}>保存</Button>
              <Button variant="secondary" className="rounded-full" style={{ border: `1.5px solid ${CCT.stroke}` }} onClick={()=> setEditingReminderId(null)}>取消</Button>
            </div>
            <div className="rounded-xl p-3 mt-2" style={{ background: CCT.capsule, border: `1.5px solid ${CCT.stroke}` }}>
              <DailyMemo />
            </div>
            <StatsBar deep={deepCount} done={doneCount} all={tasks.length} today={db.selectors.todayTotalTaskMin()} />
          </div>
        )}
      </WireCard>
    </div>
  );
}

// ================= 项目页（ProjectBoard） =================
function ProjectBoard({ db }: { db: ReturnType<typeof useLocalDB> }) {
  const [name, setName] = useState("");
  const pid = db.state.activeProjectId ?? db.state.projects[0]?.id;
  const progress = db.selectors.projectProgress(pid);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <WireCard className="lg:col-span-2">
        <CapsuleTitle title="项目列表" icon={<FolderTree className="w-4 h-4" />} />
        <div className="mt-3 flex items-center gap-2">
          <Input placeholder="新增项目名" value={name} onChange={(e)=> setName(e.target.value)} onKeyDown={(e)=> { if(e.key==='Enter' && name.trim()){ const id = db.actions.addProject(name.trim()); db.actions.setActiveProject(id); setName(''); } }} />
          <Button className="rounded-full h-9 px-4 whitespace-nowrap" onClick={()=>{ if(name.trim()){ const id = db.actions.addProject(name.trim()); db.actions.setActiveProject(id); setName(''); } }}>添加</Button>
        </div>
        <div className="mt-3 divide-y" style={{ borderColor: CCT.stroke }}>
          {db.state.projects.map(p => (
            <div key={p.id} className="py-2 flex items-center gap-2">
              <input type="radio" name="activeProject" checked={pid===p.id} onChange={()=> db.actions.setActiveProject(p.id)} />
              <span className="font-medium" style={{ color: CCT.ink }}>{p.name}</span>
              <span className="text-xs opacity-60">{new Date(p.createdAt).toLocaleDateString('zh-CN')}</span>
              <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="secondary" className="rounded-full h-7" style={{ border: `1.5px solid ${CCT.stroke}` }} onClick={()=> db.actions.deleteProject(p.id)}>删除</Button>
              </div>
            </div>
          ))}
        </div>
      </WireCard>

      <WireCard>
        <CapsuleTitle title="当前项目进度" icon={<Target className="w-4 h-4" />} />
        <div className="mt-3 text-sm">
          <div className="font-medium" style={{ color: CCT.ink }}>{db.state.projects.find(p=>p.id===pid)?.name ?? '未选择'}</div>
          <div className="mt-2">
            <Progress value={progress.pct} />
            <div className="mt-2 text-xs opacity-70">任务进度：已完成 {progress.done}/{progress.all}</div>
          </div>
        </div>
      </WireCard>
    </div>
  );
}

// ================= 学习成果（EvidenceBoard） =================
function EvidenceBoard({ db }: { db: ReturnType<typeof useLocalDB> }) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [fileHint, setFileHint] = useState("");
  const pid = db.state.activeProjectId ?? db.state.projects[0]?.id;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <WireCard className="lg:col-span-2">
        <CapsuleTitle title="新增学习成果" icon={<FileChartColumn className="w-4 h-4" />} />
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input placeholder="成果标题（必填）" value={title} onChange={(e)=> setTitle(e.target.value)} />
          <Input placeholder="备注/说明（可选）" value={note} onChange={(e)=> setNote(e.target.value)} />
          <Input placeholder="链接或文件路径（可选）" value={fileHint} onChange={(e)=> setFileHint(e.target.value)} />
          <Button className="rounded-full" onClick={()=> { const t = title.trim(); if(!t) return; db.actions.addEvidence({ title: t, note: note.trim() || undefined, fileHint: fileHint.trim() || undefined, projectId: pid }); setTitle(""); setNote(""); setFileHint(""); }}>保存</Button>
        </div>
      </WireCard>

      <WireCard>
        <CapsuleTitle title="最近成果" />
        <div className="mt-2 space-y-2 text-sm">
          {db.state.evidence.slice(0,8).map(e => (
            <div key={e.id} className="rounded-xl p-2" style={{ background: CCT.capsule, border: `1.5px solid ${CCT.stroke}` }}>
              <div className="font-medium" style={{ color: CCT.ink }}>{e.title}</div>
              <div className="text-xs opacity-60">{new Date(e.createdAt).toLocaleString('zh-CN',{hour12:false})} · {db.state.projects.find(p=>p.id===e.projectId)?.name ?? '未关联'}</div>
              {e.fileHint && <a className="text-xs underline" href={e.fileHint} target="_blank" rel="noreferrer">打开</a>}
              {e.note && <div className="text-xs opacity-80">{e.note}</div>}
            </div>
          ))}
          {db.state.evidence.length===0 && <div className="text-xs opacity-60">暂无数据，先添加一条吧。</div>}
        </div>
      </WireCard>
    </div>
  );
}

// ================= 导入/导出（JSON） =================
function ExportControls({ db }: { db: ReturnType<typeof useLocalDB> }) {
  function handleExport() { const json = db.actions.exportJSON(); downloadJSONFile(`tft_data_${todayStrTZ(TZ)}.json`, json); }
  function handleCopy() { safeCopyToClipboard(db.actions.exportJSON()); }
  function handleImport(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]; if(!file) return; const reader = new FileReader(); reader.onload = () => { try { const obj = JSON.parse(String(reader.result)); db.actions.importJSON(obj); } catch { alert('导入失败：JSON 无法解析'); } }; reader.readAsText(file);
  }
  return (
    <div className="flex items-center gap-2">
      <input id="import-json" type="file" accept="application/json" className="hidden" onChange={handleImport} />
      <label htmlFor="import-json"><Button variant="secondary" className="rounded-full h-8" style={{ border: `1.5px solid ${CCT.stroke}` }}><Upload className="w-4 h-4 mr-1" />导入</Button></label>
      <Button variant="secondary" className="rounded-full h-8" style={{ border: `1.5px solid ${CCT.stroke}` }} onClick={handleCopy}><Download className="w-4 h-4 mr-1" />复制</Button>
      <Button variant="secondary" className="rounded-full h-8" style={{ background: CCT.note, color: CCT.ink, border: `1.5px solid ${CCT.stroke}` }} onClick={handleExport}><Download className="w-4 h-4 mr-1" />导出</Button>
    </div>
  );
}

// ================= 根组件 =================
export default function App() {
  const db = useLocalDB();
  const timer = useFocusTimer(db);
  const reminder = useReminderWatcher(db);
  const toasts = useToasts();
  const [tab, setTab] = useState<string>("today");

  return (
    <div className="min-h-screen" style={{ background: CCT.bg }}>
      {/* 顶部导航 */}
      <div className="sticky top-0 z-30 border-b" style={{ background: CCT.note, borderColor: CCT.stroke }}>
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="inline-flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg" style={{ background: CCT.primary }} />
            <div className="font-semibold" style={{ color: CCT.ink }}>LiuBei‑TFT 学习与管理</div>
          </div>
          <div className="ml-auto">
            <ExportControls db={db} />
          </div>
        </div>
      </div>

      {/* 全局状态栏 */}
      <GlobalStatusBar db={db} timer={timer} reminder={reminder} />

      {/* 主体 */}
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="rounded-full" style={{ background: CCT.capsule, border: `1.5px solid ${CCT.stroke}` }}>
            <TabsTrigger value="today">今天</TabsTrigger>
            <TabsTrigger value="project">项目</TabsTrigger>
            <TabsTrigger value="evidence">学习成果</TabsTrigger>
            <TabsTrigger value="review">周总结</TabsTrigger>
            <TabsTrigger value="dev">自检</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6 pt-4"><TodayBoard db={db} timer={timer} /></TabsContent>
          <TabsContent value="project" className="space-y-6 pt-4"><ProjectBoard db={db} /></TabsContent>
          <TabsContent value="evidence" className="space-y-6 pt-4"><EvidenceBoard db={db} /></TabsContent>
          <TabsContent value="review" className="space-y-6 pt-4"><ReviewBoard db={db} /></TabsContent>
          <TabsContent value="dev" className="space-y-6 pt-4"><SmokeTests db={db} /></TabsContent>
        </Tabs>
      </div>

      <Toasts items={toasts.items} remove={toasts.remove} />
    </div>
  );
}












