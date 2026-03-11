import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Bell,
  CalendarDays,
  Building2,
  Wallet,
  User,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit3,
  Mic,
} from "lucide-react";

const STORAGE_KEY = "priorize-tasks-v1";

const emptyTask = {
  id: "",
  titulo: "",
  descricao: "",
  unidade: "",
  responsavel: "",
  valor: "",
  prazo: "",
  lembrete: "",
  prioridade: "media",
  status: "novo",
  categoria: "operacional",
  recorrencia: "nao",
  observacoes: "",
  proximaAcao: "",
  concluida: false,
};

const priorityColor = {
  baixa: "#64748b",
  media: "#b45309",
  alta: "#b91c1c",
  critica: "#7f1d1d",
};

const statusColor = {
  novo: "#475569",
  andamento: "#1d4ed8",
  aguardando_terceiro: "#a16207",
  travado: "#b91c1c",
  concluido: "#15803d",
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
};

function Badge({ children, color = "#475569", outline = false }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        border: `1px solid ${outline ? "#cbd5e1" : color}`,
        background: outline ? "#fff" : `${color}15`,
        color,
      }}
    >
      {children}
    </span>
  );
}

function SectionCard({ children, style }) {
  return <div style={{ ...cardStyle, ...style }}>{children}</div>;
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}

function InputBase(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        border: "1px solid #cbd5e1",
        borderRadius: 12,
        padding: "10px 12px",
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
        ...(props.style || {}),
      }}
    />
  );
}

function TextareaBase(props) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%",
        minHeight: 96,
        border: "1px solid #cbd5e1",
        borderRadius: 12,
        padding: "10px 12px",
        fontSize: 14,
        outline: "none",
        resize: "vertical",
        boxSizing: "border-box",
        ...(props.style || {}),
      }}
    />
  );
}

function SelectBase(props) {
  return (
    <select
      {...props}
      style={{
        width: "100%",
        border: "1px solid #cbd5e1",
        borderRadius: 12,
        padding: "10px 12px",
        fontSize: 14,
        background: "#fff",
        outline: "none",
        boxSizing: "border-box",
        ...(props.style || {}),
      }}
    />
  );
}

function ButtonBase({ children, variant = "primary", ...props }) {
  const primary = variant === "primary";
  return (
    <button
      {...props}
      style={{
        border: primary ? "none" : "1px solid #cbd5e1",
        background: primary ? "#0f172a" : "#fff",
        color: primary ? "#fff" : "#0f172a",
        borderRadius: 14,
        padding: "10px 14px",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {children}
    </button>
  );
}

function formatMoney(value) {
  if (!value) return "-";
  const number = Number(String(value).replace(/[^\d,.-]/g, "").replace(".", "").replace(",", "."));
  if (Number.isNaN(number)) return value;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(number);
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  const date = new Date(`${dateStr}T00:00:00`);
  return today.toDateString() === date.toDateString();
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${dateStr}T00:00:00`);
  return date < today;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${dateStr}T00:00:00`);
  return Math.ceil((date - today) / (1000 * 60 * 60 * 24));
}

function MetricCard({ title, value, icon: Icon }) {
  return (
    <SectionCard style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ color: "#64748b", fontSize: 14 }}>{title}</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{value}</div>
        </div>
        <Icon size={28} color="#94a3b8" />
      </div>
    </SectionCard>
  );
}

function TaskCard({ task, onEdit, onDelete, onToggleDone, compact = false }) {
  const due = daysUntil(task.prazo);
  return (
    <SectionCard style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 12, flex: 1, minWidth: 260 }}>
          {!compact && (
            <input
              type="checkbox"
              checked={task.concluida || task.status === "concluido"}
              onChange={() => onToggleDone(task)}
              style={{ width: 18, height: 18, marginTop: 4 }}
            />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: task.concluida ? "#94a3b8" : "#0f172a", textDecoration: task.concluida ? "line-through" : "none" }}>
                {task.titulo}
              </div>
              <Badge color={priorityColor[task.prioridade]}>{task.prioridade}</Badge>
              <Badge color={statusColor[task.status]}>{task.status}</Badge>
              {task.categoria ? <Badge outline>{task.categoria}</Badge> : null}
            </div>
            {!compact && task.descricao ? <div style={{ color: "#475569", fontSize: 14, marginTop: 10 }}>{task.descricao}</div> : null}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", color: "#64748b", fontSize: 13, marginTop: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Building2 size={14} />{task.unidade || "Sem unidade"}</span>
              {!compact && <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><User size={14} />{task.responsavel || "Sem responsável"}</span>}
              {!compact && <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Wallet size={14} />{formatMoney(task.valor)}</span>}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CalendarDays size={14} />Prazo: {task.prazo || "-"}</span>
              {!compact && <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Bell size={14} />Lembrete: {task.lembrete || "-"}</span>}
            </div>
            {task.proximaAcao ? <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600, color: "#334155" }}>Próxima ação: {task.proximaAcao}</div> : null}
            {!compact && task.observacoes ? <div style={{ marginTop: 8, fontSize: 13, color: "#64748b", fontStyle: "italic" }}>{task.observacoes}</div> : null}
          </div>
        </div>
        <div style={{ minWidth: 170, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
          {task.prazo ? (
            <div style={{ fontSize: 13, fontWeight: 600, color: isOverdue(task.prazo) && !task.concluida && task.status !== "concluido" ? "#dc2626" : due === 0 ? "#d97706" : "#475569" }}>
              {isOverdue(task.prazo) && !task.concluida && task.status !== "concluido"
                ? "Prazo vencido"
                : due === 0
                ? "Vence hoje"
                : due !== null
                ? `Faltam ${due} dias`
                : ""}
            </div>
          ) : null}
          {!compact && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <ButtonBase variant="secondary" onClick={() => onEdit(task)}><Edit3 size={14} />Editar</ButtonBase>
              <ButtonBase variant="secondary" onClick={() => onDelete(task.id)}><Trash2 size={14} />Excluir</ButtonBase>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filterUnit, setFilterUnit] = useState("todas");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [activeTab, setActiveTab] = useState("hoje");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyTask);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch {
        setTasks([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const units = useMemo(() => [...new Set(tasks.map((t) => t.unidade).filter(Boolean))].sort(), [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const text = `${task.titulo} ${task.descricao} ${task.responsavel} ${task.unidade} ${task.categoria}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesUnit = filterUnit === "todas" || task.unidade === filterUnit;
      const matchesStatus = filterStatus === "todos" || task.status === filterStatus;
      return matchesSearch && matchesUnit && matchesStatus;
    });
  }, [tasks, search, filterUnit, filterStatus]);

  const metrics = useMemo(() => {
    const total = tasks.length;
    const concluidas = tasks.filter((t) => t.status === "concluido" || t.concluida).length;
    const vencidas = tasks.filter((t) => !t.concluida && t.status !== "concluido" && isOverdue(t.prazo)).length;
    return {
      total,
      concluidas,
      vencidas,
      progresso: total ? Math.round((concluidas / total) * 100) : 0,
    };
  }, [tasks]);

  const lembretes = useMemo(() => {
    return tasks
      .filter((t) => !t.concluida && t.status !== "concluido" && (t.lembrete || t.prazo))
      .sort((a, b) => (a.lembrete || a.prazo || "").localeCompare(b.lembrete || b.prazo || ""))
      .slice(0, 8);
  }, [tasks]);

  function resetForm() {
    setForm(emptyTask);
    setEditingId(null);
  }

  function openNewTask() {
    resetForm();
    setIsOpen(true);
  }

  function saveTask(e) {
    e?.preventDefault();
    if (!form.titulo.trim()) return;

    const payload = {
      ...form,
      id: editingId || crypto.randomUUID(),
      concluida: form.status === "concluido",
    };

    if (editingId) {
      setTasks((prev) => prev.map((t) => (t.id === editingId ? payload : t)));
    } else {
      setTasks((prev) => [payload, ...prev]);
    }

    setIsOpen(false);
    resetForm();
  }

  function editTask(task) {
    setEditingId(task.id);
    setForm(task);
    setIsOpen(true);
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function toggleDone(task) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, concluida: !t.concluida, status: !t.concluida ? "concluido" : "novo" }
          : t
      )
    );
  }

  function seedDemo() {
    setTasks([
      {
        id: crypto.randomUUID(),
        titulo: "Renovar contrato do fornecedor de gases",
        descricao: "Checar reajuste, prazo e cláusulas de SLA.",
        unidade: "Hospital A",
        responsavel: "Compras",
        valor: "18500",
        prazo: "2026-03-14",
        lembrete: "2026-03-12",
        prioridade: "alta",
        status: "andamento",
        categoria: "contratos",
        recorrencia: "nao",
        observacoes: "Levar para validação jurídica.",
        concluida: false,
        proximaAcao: "Enviar para análise jurídica",
      },
      {
        id: crypto.randomUUID(),
        titulo: "Fechar escala médica da semana",
        descricao: "Cobrir plantões descobertos e validar pediatria.",
        unidade: "Hospital B",
        responsavel: "Coordenação médica",
        valor: "42000",
        prazo: "2026-03-11",
        lembrete: "2026-03-10",
        prioridade: "critica",
        status: "novo",
        categoria: "assistencial",
        recorrencia: "semanal",
        observacoes: "Prioridade máxima.",
        concluida: false,
        proximaAcao: "Confirmar anestesista",
      },
      {
        id: crypto.randomUUID(),
        titulo: "Cobrar repasse em atraso do convênio",
        descricao: "Ligar para financeiro e formalizar e-mail.",
        unidade: "Clínica 1",
        responsavel: "Financeiro",
        valor: "98000",
        prazo: "2026-03-18",
        lembrete: "2026-03-17",
        prioridade: "media",
        status: "aguardando_terceiro",
        categoria: "financeiro",
        recorrencia: "nao",
        observacoes: "Acompanhar retorno da operadora.",
        concluida: false,
        proximaAcao: "Cobrar retorno da operadora",
      },
    ]);
  }

  const todayTasks = filteredTasks.filter((t) => !t.concluida && t.status !== "concluido" && (isToday(t.prazo) || isOverdue(t.prazo) || t.prioridade === "critica"));
  const criticalTasks = filteredTasks.filter((t) => !t.concluida && t.status !== "concluido" && (t.prioridade === "alta" || t.prioridade === "critica" || t.status === "travado" || isOverdue(t.prazo)));

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 16, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", color: "#0f172a" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gap: 24, paddingBottom: 100 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 34, lineHeight: 1.1, margin: 0, fontWeight: 800 }}>Priorize</h1>
            <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 14 }}>Organize demandas, prioridades, unidades e lembretes em um app simples para iPhone.</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <ButtonBase variant="secondary" onClick={seedDemo}>Carregar exemplo</ButtonBase>
            <ButtonBase variant="secondary"><Mic size={14} />Falar</ButtonBase>
            <ButtonBase onClick={openNewTask}><Plus size={14} />Nova tarefa</ButtonBase>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <MetricCard title="Total de tarefas" value={metrics.total} icon={ClipboardList} />
          <MetricCard title="Concluídas" value={metrics.concluidas} icon={CheckCircle2} />
          <MetricCard title="Vencidas" value={metrics.vencidas} icon={AlertTriangle} />
          <SectionCard style={{ padding: 18 }}>
            <div style={{ color: "#64748b", fontSize: 14 }}>Progresso geral</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{metrics.progresso}%</div>
            <div style={{ marginTop: 10, width: "100%", height: 10, background: "#e2e8f0", borderRadius: 999 }}>
              <div style={{ width: `${metrics.progresso}%`, height: "100%", background: "#0f172a", borderRadius: 999 }} />
            </div>
          </SectionCard>
        </div>

        <SectionCard style={{ padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: 13 }} />
              <InputBase value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por tarefa, responsável, unidade..." style={{ paddingLeft: 36 }} />
            </div>
            <SelectBase value={filterUnit} onChange={(e) => setFilterUnit(e.target.value)}>
              <option value="todas">Todas as unidades</option>
              {units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
            </SelectBase>
            <SelectBase value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="todos">Todos os status</option>
              <option value="novo">Novo</option>
              <option value="andamento">Em andamento</option>
              <option value="aguardando_terceiro">Aguardando terceiro</option>
              <option value="travado">Travado</option>
              <option value="concluido">Concluído</option>
            </SelectBase>
          </div>
        </SectionCard>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            ["hoje", "Hoje"],
            ["lista", "Todas"],
            ["criticas", "Críticas"],
            ["unidades", "Por unidade"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                border: activeTab === key ? "none" : "1px solid #cbd5e1",
                background: activeTab === key ? "#0f172a" : "#fff",
                color: activeTab === key ? "#fff" : "#0f172a",
                borderRadius: 14,
                padding: "10px 14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          {activeTab === "hoje" && (
            todayTasks.length ? todayTasks.map((task) => <TaskCard key={task.id} task={task} onEdit={editTask} onDelete={deleteTask} onToggleDone={toggleDone} compact />) : <SectionCard style={{ padding: 24, color: "#64748b" }}>Nada relevante para hoje.</SectionCard>
          )}

          {activeTab === "lista" && (
            filteredTasks.length ? filteredTasks.map((task) => <TaskCard key={task.id} task={task} onEdit={editTask} onDelete={deleteTask} onToggleDone={toggleDone} />) : <SectionCard style={{ padding: 24, color: "#64748b" }}>Nenhuma tarefa encontrada.</SectionCard>
          )}

          {activeTab === "criticas" && (
            criticalTasks.length ? criticalTasks.map((task) => <TaskCard key={task.id} task={task} onEdit={editTask} onDelete={deleteTask} onToggleDone={toggleDone} compact />) : <SectionCard style={{ padding: 24, color: "#64748b" }}>Nenhuma tarefa crítica.</SectionCard>
          )}

          {activeTab === "unidades" && (
            units.length ? units.map((unit) => {
              const unitTasks = filteredTasks.filter((t) => t.unidade === unit);
              const abertas = unitTasks.filter((t) => !t.concluida && t.status !== "concluido").length;
              const criticas = unitTasks.filter((t) => !t.concluida && t.status !== "concluido" && (t.prioridade === "alta" || t.prioridade === "critica" || t.status === "travado" || isOverdue(t.prazo))).length;
              const vencidas = unitTasks.filter((t) => !t.concluida && t.status !== "concluido" && isOverdue(t.prazo)).length;
              const concluidas = unitTasks.filter((t) => t.concluida || t.status === "concluido").length;
              return (
                <SectionCard key={unit} style={{ padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{unit}</div>
                    <Badge outline>{unitTasks.length} item(ns)</Badge>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginTop: 14 }}>
                    <div style={{ padding: 12, borderRadius: 14, background: "#f8fafc" }}><div style={{ fontSize: 12, color: "#64748b" }}>Abertas</div><div style={{ fontWeight: 800, fontSize: 18 }}>{abertas}</div></div>
                    <div style={{ padding: 12, borderRadius: 14, background: "#fef2f2" }}><div style={{ fontSize: 12, color: "#64748b" }}>Críticas</div><div style={{ fontWeight: 800, fontSize: 18 }}>{criticas}</div></div>
                    <div style={{ padding: 12, borderRadius: 14, background: "#fffbeb" }}><div style={{ fontSize: 12, color: "#64748b" }}>Vencidas</div><div style={{ fontWeight: 800, fontSize: 18 }}>{vencidas}</div></div>
                    <div style={{ padding: 12, borderRadius: 14, background: "#f0fdf4" }}><div style={{ fontSize: 12, color: "#64748b" }}>Concluídas</div><div style={{ fontWeight: 800, fontSize: 18 }}>{concluidas}</div></div>
                  </div>
                  <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                    {unitTasks.map((task) => (
                      <div key={task.id} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{task.titulo}</div>
                            <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>Prazo: {task.prazo || "-"}</div>
                            {task.proximaAcao ? <div style={{ marginTop: 6, fontSize: 13, color: "#334155" }}>Próxima ação: {task.proximaAcao}</div> : null}
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <Badge color={priorityColor[task.prioridade]}>{task.prioridade}</Badge>
                            <Badge color={statusColor[task.status]}>{task.status}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              );
            }) : <SectionCard style={{ padding: 24, color: "#64748b" }}>Nenhuma unidade cadastrada ainda.</SectionCard>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
          <SectionCard style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 800 }}><Bell size={16} />Próximos lembretes</div>
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              {lembretes.length ? lembretes.map((task) => (
                <div key={task.id} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 12 }}>
                  <div style={{ fontWeight: 700 }}>{task.titulo}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{task.unidade || "Sem unidade"}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 10 }}>
                    <span style={{ color: "#475569", fontSize: 13 }}>{task.lembrete || task.prazo || "-"}</span>
                    <Badge color={priorityColor[task.prioridade]}>{task.prioridade}</Badge>
                  </div>
                </div>
              )) : <div style={{ color: "#64748b", fontSize: 14 }}>Sem lembretes cadastrados.</div>}
            </div>
          </SectionCard>

          <SectionCard style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 800 }}><Mic size={16} />Captura rápida e voz</div>
            <div style={{ color: "#475569", fontSize: 14, marginTop: 14 }}>Estrutura oficial da V1: Hoje, Todas, Críticas, Lembretes e cadastro de nova demanda.</div>
            <div style={{ borderRadius: 14, background: "#f8fafc", padding: 12, fontSize: 12, lineHeight: 1.5, marginTop: 12 }}>
              Ex.: Cobrar fornecedor de gases do Hospital A, responsável Compras, até sexta, R$ 18 mil, prioridade alta.
            </div>
            <div style={{ color: "#475569", fontSize: 14, marginTop: 12 }}>V1: cadastro manual e ditado do iPhone. Sem backup nesta versão para manter o app mais leve.</div>
          </SectionCard>
        </div>
      </div>

      {isOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 60 }}>
          <div style={{ width: "min(920px, 100%)", maxHeight: "90vh", overflow: "auto", background: "#fff", borderRadius: 24, padding: 20, boxShadow: "0 20px 60px rgba(15,23,42,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{editingId ? "Editar tarefa" : "Nova tarefa"}</div>
              <ButtonBase variant="secondary" onClick={() => { setIsOpen(false); resetForm(); }}>Fechar</ButtonBase>
            </div>
            <form onSubmit={saveTask} style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 14 }}>
              <div style={{ gridColumn: "1 / -1" }}><Field label="Título"><InputBase value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex.: Renovar contrato de laboratório" /></Field></div>
              <div style={{ gridColumn: "1 / -1" }}><Field label="Descrição"><TextareaBase value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="O que precisa acontecer, qual contexto e próximos passos" /></Field></div>
              <Field label="Unidade"><InputBase value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} placeholder="Hospital A / Clínica X" /></Field>
              <Field label="Responsável"><InputBase value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} placeholder="Quem vai tocar" /></Field>
              <Field label="Valor"><InputBase value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="Quanto envolve" /></Field>
              <Field label="Categoria"><SelectBase value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}><option value="operacional">Operacional</option><option value="financeiro">Financeiro</option><option value="contratos">Contratos</option><option value="assistencial">Assistencial</option><option value="pessoal">Pessoal</option><option value="estrategico">Estratégico</option></SelectBase></Field>
              <Field label="Prazo"><InputBase type="date" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} /></Field>
              <Field label="Lembrete"><InputBase type="date" value={form.lembrete} onChange={(e) => setForm({ ...form, lembrete: e.target.value })} /></Field>
              <Field label="Prioridade"><SelectBase value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value })}><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="critica">Crítica</option></SelectBase></Field>
              <Field label="Status"><SelectBase value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="novo">Novo</option><option value="andamento">Em andamento</option><option value="aguardando_terceiro">Aguardando terceiro</option><option value="concluido">Concluído</option><option value="travado">Travado</option></SelectBase></Field>
              <Field label="Recorrência"><SelectBase value={form.recorrencia} onChange={(e) => setForm({ ...form, recorrencia: e.target.value })}><option value="nao">Não</option><option value="diaria">Diária</option><option value="semanal">Semanal</option><option value="mensal">Mensal</option></SelectBase></Field>
              <div style={{ gridColumn: "1 / -1" }}><Field label="Próxima ação"><InputBase value={form.proximaAcao} onChange={(e) => setForm({ ...form, proximaAcao: e.target.value })} placeholder="Qual é o próximo passo objetivo?" /></Field></div>
              <div style={{ gridColumn: "1 / -1" }}><Field label="Observações"><TextareaBase value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Informações extras, dependências, riscos, contexto" /></Field></div>
              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <ButtonBase variant="secondary" type="button" onClick={() => { setIsOpen(false); resetForm(); }}>Cancelar</ButtonBase>
                <ButtonBase type="submit">Salvar</ButtonBase>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ position: "fixed", left: "50%", bottom: 16, transform: "translateX(-50%)", width: "min(420px, calc(100% - 24px))", background: "rgba(255,255,255,0.96)", border: "1px solid #e2e8f0", borderRadius: 22, boxShadow: "0 10px 25px rgba(15,23,42,0.08)", padding: 10, zIndex: 50 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <ButtonBase onClick={openNewTask}><Plus size={14} />Nova</ButtonBase>
          <ButtonBase variant="secondary"><Mic size={14} />Falar</ButtonBase>
        </div>
      </div>
    </div>
  );
}
