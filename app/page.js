"use client";

import { useState, useMemo, useEffect } from "react";

// ─── Date demo ────────────────────────────────────────────────────────────────
const SAMPLE_DATA = [
  { id: 100245309, notice_no: "CAN1065826", procedure_state: "Atribuita", authority: "2843299 - Spitalul Orasenesc Sinaia", title: "Furnizare gaze naturale", contract_type: "Furnizare", procedure_type: "Procedura simplificata proprie", cpv_code: "09123000-7", cpv_name: "Gaze naturale", value_ron: 838435.0, is_online: false, notice_date: null, currency: "RON" },
  { id: 100620676, notice_no: "CAN1165482", procedure_state: "Atribuita", authority: "4597441 - UNIVERSITATEA CONSTANTIN BRANCUSI TIRGU JIU", title: "Furnizarea materialelor consumabile - Pedagogia în lumea digitală", contract_type: "Furnizare", procedure_type: "Licitatie deschisa", cpv_code: "30100000-0", cpv_name: "Masini si echipament de birou", value_ron: 257235.5, is_online: true, notice_date: "2026-04-03T22:33:03+03:00", currency: "RON" },
  { id: 100620109, notice_no: "CAN1127791", procedure_state: "Atribuita", authority: "4267230 - Serviciul de Telecomunicatii Speciale", title: "ACORD-CADRU SERVICII DE COMUNICATII DE CONECTARE", contract_type: "Servicii", procedure_type: "Licitatie deschisa", cpv_code: "72318000-7", cpv_name: "Servicii de transmisie de date", value_ron: 34389073.75, is_online: true, notice_date: "2026-04-03T19:00:14+03:00", currency: "EUR" },
  { id: 100620664, notice_no: "CAN1091574", procedure_state: "Atribuita", authority: "r1890420 - RAJA S.A CONSTANTA", title: "Retele de apa si canalizare zona centrala Constanta", contract_type: "Lucrari", procedure_type: "Licitatie deschisa", cpv_code: "45000000-7", cpv_name: "Lucrari de constructii", value_ron: 21812885.83, is_online: true, notice_date: "2026-04-03T19:00:13+03:00", currency: "RON" },
  { id: 100620665, notice_no: "CAN1116694", procedure_state: "Atribuita", authority: "RO 3503538 - PENITENCIARUL BOTOSANI", title: "Contract de lucrari Complex Corectional Penitenciarul Botosani", contract_type: "Lucrari", procedure_type: "Licitatie deschisa", cpv_code: "45210000-2", cpv_name: "Lucrari de constructii de cladiri", value_ron: 32519987.76, is_online: true, notice_date: "2026-04-03T19:00:11+03:00", currency: "RON" },
  { id: 100620213, notice_no: "CAN1144912", procedure_state: "In desfasurare", authority: "4318075 - Spitalul de Pediatrie Pitesti", title: "LICITATIE MEDICAMENTE 170 LOTURI", contract_type: "Furnizare", procedure_type: "Licitatie deschisa", cpv_code: "33690000-3", cpv_name: "Diverse medicamente", value_ron: 0, is_online: true, notice_date: "2026-04-03T19:00:03+03:00", currency: "RON" },
  { id: 100620590, notice_no: "CAN1105754", procedure_state: "Atribuita", authority: "RO 2684940 - APA CANAL SIBIU SA", title: "CL12 - Extinderea retelelor de alimentare cu apa Miercurea Sibiului", contract_type: "Lucrari", procedure_type: "Licitatie deschisa", cpv_code: "45232400-6", cpv_name: "Lucrari de canalizare ape reziduale", value_ron: 83483856.72, is_online: true, notice_date: "2026-04-03T15:00:05+03:00", currency: "RON" },
  { id: 100620641, notice_no: "CAN1165475", procedure_state: "Atribuita", authority: "16054368 - COMPANIA NATIONALA DE ADMINISTRARE A INFRASTRUCTURII RUTIERE S.A.", title: "Servicii proiectare si executie lucrari consolidare DN1 km 99+100", contract_type: "Lucrari", procedure_type: "Negociere fara publicare prealabila", cpv_code: "45233140-2", cpv_name: "Lucrari de drumuri", value_ron: 9324795.62, is_online: false, notice_date: "2026-04-03T14:47:44+03:00", currency: "RON" },
  { id: 100620646, notice_no: "SCNA1083933", procedure_state: "Atribuita", authority: "14273221 - COMPANIA NATIONALA DE INVESTITII SA", title: "Proiectare, executie si asistenta tehnica - creса mare municipiul Baia Mare", contract_type: "Lucrari", procedure_type: "Procedura simplificata", cpv_code: "45200000-9", cpv_name: "Lucrari de constructii complete", value_ron: 16886587.91, is_online: true, notice_date: "2026-04-03T13:57:38+03:00", currency: "RON" },
  { id: 100620669, notice_no: "SCNA1131947", procedure_state: "Anulata", authority: "2845222 - Comuna Ceptura", title: "Proiectare si executie parc fotovoltaic Comuna Ceptura", contract_type: "Lucrari", procedure_type: "Procedura simplificata", cpv_code: "45251100-2", cpv_name: "Lucrari constructii centrale electrice", value_ron: 0, is_online: true, notice_date: "2026-04-03T15:53:49+03:00", currency: "RON" },
];

// ─── Constante ────────────────────────────────────────────────────────────────
const TYPE_COLOR  = { Furnizare: "#3b82f6", Servicii: "#8b5cf6", Lucrari: "#f59e0b" };
const STATE_COLOR = { Atribuita: "#10b981", "In desfasurare": "#3b82f6", Anulata: "#ef4444" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(val) {
  if (!val || val === 0) return "—";
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M RON`;
  if (val >= 1_000)     return `${(val / 1_000).toFixed(0)}K RON`;
  return `${Number(val).toLocaleString("ro-RO")} RON`;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" });
}

function authorityName(raw) {
  if (!raw) return "";
  return raw.replace(/^[\w\s]+\s-\s/, "").replace(/^[Rr][Oo]\s[\w]+\s-\s/, "");
}

// ─── Componente mici ──────────────────────────────────────────────────────────
function Badge({ text, color = "#6b7280" }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 999,
      fontSize: 11, fontWeight: 700,
      background: color + "22", color, border: `1px solid ${color}44`,
      whiteSpace: "nowrap", letterSpacing: "0.03em"
    }}>{text}</span>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background: "#111827", border: "1px solid #1f2937",
      borderTop: `3px solid ${accent}`, borderRadius: 12,
      padding: "16px 20px"
    }}>
      <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: "#f9fafb" }}>{value}</div>
    </div>
  );
}

function Card({ item, onClick }) {
  const name = authorityName(item.authority || item.contractingAuthorityNameAndFN || "");
  const tc   = TYPE_COLOR[item.contract_type  || item.sysAcquisitionContractType?.text]  || "#6b7280";
  const sc   = STATE_COLOR[item.procedure_state || item.sysProcedureState?.text] || "#6b7280";
  const cpv  = item.cpv_name || (item.cpvCodeAndName?.split(" - ").slice(1).join(" - ").replace(/\s*\(Rev\.2\)/g, "")) || "";
  const val  = item.value_ron ?? item.ronContractValue ?? 0;
  const date = item.notice_date || item.noticeStateDate;
  const pt   = item.procedure_type || item.sysProcedureType?.text || "";
  const ct   = item.contract_type  || item.sysAcquisitionContractType?.text || "";
  const ps   = item.procedure_state || item.sysProcedureState?.text || "";
  const no   = item.notice_no || item.noticeNo || "";
  const online = item.is_online ?? item.isOnline ?? false;

  return (
    <div
      onClick={() => onClick(item)}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#374151"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#1f2937"; e.currentTarget.style.transform = "none"; }}
      style={{
        background: "#0f172a", border: "1px solid #1f2937",
        borderRadius: 12, padding: "18px 20px", cursor: "pointer",
        transition: "border-color .15s, transform .15s",
        display: "flex", flexDirection: "column", gap: 10,
        position: "relative", overflow: "hidden"
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: tc, opacity: .7 }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <span style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b", fontWeight: 700 }}>{no}</span>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Badge text={ct}  color={tc} />
          <Badge text={ps}  color={sc} />
        </div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.45 }}>
        {item.title || item.contractTitle}
      </div>

      <div style={{ fontSize: 11, color: "#475569", fontStyle: "italic" }}>📁 {cpv}</div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>🏛 {name}</span>
        <span style={{ fontSize: 17, fontWeight: 800, color: Number(val) > 0 ? "#f59e0b" : "#334155" }}>
          {fmt(val)}
        </span>
      </div>

      <div style={{ fontSize: 11, color: "#334155" }}>
        📅 {fmtDate(date)} · {pt}
        {online
          ? <span style={{ color: "#10b981", marginLeft: 8 }}>● Online</span>
          : <span style={{ color: "#ef4444", marginLeft: 8 }}>● Offline</span>}
      </div>
    </div>
  );
}

function Modal({ item, onClose }) {
  if (!item) return null;

  const ct  = item.contract_type  || item.sysAcquisitionContractType?.text || "";
  const ps  = item.procedure_state || item.sysProcedureState?.text || "";
  const pt  = item.procedure_type  || item.sysProcedureType?.text  || "";
  const tc  = TYPE_COLOR[ct]  || "#6b7280";
  const sc  = STATE_COLOR[ps] || "#6b7280";
  const val = item.value_ron ?? item.ronContractValue ?? 0;
  const id  = item.id || item.caNoticeId;
  const no  = item.notice_no || item.noticeNo || "";
  const cpv = item.cpv_code
    ? `${item.cpv_code} — ${item.cpv_name}`
    : item.cpvCodeAndName || "";

  const rows = [
    ["Autoritate",     authorityName(item.authority || item.contractingAuthorityNameAndFN || "")],
    ["Nr. anunț",      no],
    ["Tip contract",   ct],
    ["Tip procedură",  pt],
    ["Stare",          ps],
    ["CPV",            cpv],
    ["Valoare",        Number(val) > 0 ? `${Number(val).toLocaleString("ro-RO")} RON` : "Nespecificată"],
    ["Data publicare", fmtDate(item.notice_date || item.noticeStateDate)],
    ["Modalitate",     (item.is_online ?? item.isOnline) ? "Online" : "Offline"],
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.8)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 20, backdropFilter: "blur(6px)"
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#0f172a", border: "1px solid #1e293b",
          borderRadius: 16, width: "100%", maxWidth: 560,
          maxHeight: "88vh", overflowY: "auto", padding: 28, position: "relative"
        }}
      >
        <button onClick={onClose} style={{
          position: "absolute", top: 14, right: 14,
          background: "#1e293b", border: "none", color: "#94a3b8",
          width: 28, height: 28, borderRadius: 8, cursor: "pointer", fontSize: 14
        }}>✕</button>

        <p style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b", margin: "0 0 8px", fontWeight: 700 }}>{no}</p>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9", margin: "0 0 16px", lineHeight: 1.45, paddingRight: 32 }}>
          {item.title || item.contractTitle}
        </h2>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          <Badge text={ct} color={tc} />
          <Badge text={ps} color={sc} />
          <Badge text={pt} color="#6b7280" />
        </div>

        <div style={{ background: "#1e293b", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
          {rows.map(([k, v], i) => v && (
            <div key={k} style={{
              display: "flex", gap: 12, padding: "9px 14px",
              borderBottom: i < rows.length - 1 ? "1px solid #0f172a" : "none"
            }}>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, minWidth: 110, paddingTop: 1, flexShrink: 0 }}>{k}</span>
              <span style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.45, flex: 1, wordBreak: "break-word" }}>{v}</span>
            </div>
          ))}
        </div>

        {Number(val) > 0 && (
          <div style={{ textAlign: "right", fontSize: 24, fontWeight: 900, color: "#f59e0b", marginBottom: 20 }}>
            {Number(val).toLocaleString("ro-RO")} RON
          </div>
        )}
https://www.e-licitatie.ro/pub/notices/c-notices
        <a
      href={
    (item.notice_source === "CN")
      ? `https://www.e-licitatie.ro/pub/notices/c-notices/list/0/0`
      : `https://www.e-licitatie.ro/pub/notices/contract-notices/view/${id}`
  }
  target="_blank" rel="noopener noreferrer"
  style={{
    display: "block", textAlign: "center",
    background: "#1d4ed8", color: "#fff",
    borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 700,
    textDecoration: "none"
  }}
>
  {item.notice_source === "CN"
    ? `Caută ${item.notice_no} pe e-licitatie.ro ↗`
    : "Deschide pe e-licitatie.ro ↗"
  }
</a>
      </div>
    </div>
  );
}

// ─── Pagina principală ────────────────────────────────────────────────────────
export default function Page() {
  const [items,       setItems]       = useState(SAMPLE_DATA);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [liveLoaded,  setLiveLoaded]  = useState(false);
  const [dbTotal,     setDbTotal]     = useState(null);
  const [search,      setSearch]      = useState("");
  const [filterType,  setFilterType]  = useState("toate");
  const [filterState, setFilterState] = useState("toate");
  const [sortBy,      setSortBy]      = useState("date");
  const [selected,    setSelected]    = useState(null);
  const [source,      setSource]      = useState("demo"); // "demo" | "db" | "live"
  const [page, setPage] = useState(0);
  const [totalDB, setTotalDB] = useState(0);
  const [filterAn, setFilterAn]       = useState("");
  const [filterValMin, setFilterValMin] = useState("");
  const [filterValMax, setFilterValMax] = useState("");

  // ── Caută în baza de date ─────────────────────────────────────────────────
  async function searchDB(q, type, state, sort, p = 0, an = "", valMin = "", valMax = "") {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q)      params.set("q",     q);
      if (type)   params.set("type",  type);
      if (state)  params.set("state", state);
      if (sort)   params.set("sort",  sort);
      if (page > 0)  params.set("page",  page);
      if (an)     params.set("an",      an);
      if (valMin) params.set("val_min", valMin);
      if (valMax) params.set("val_max", valMax);

      const res = await fetch(`/api/search?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotalDB(data.total || 0);
      setPage(p);
      setDbTotal(data.total);
      setSource("db");
      setLiveLoaded(true);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  // ── Încarcă date live (fără DB) ───────────────────────────────────────────
  async function loadLive() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/licitatii", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sysNoticeTypeIds: [3, 13, 18, 16, 8],
          sortProperties: [],
          pageSize: 50,
          pageIndex: 0,
          sysNoticeStateId: null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items || []);
      setSource("live");
      setLiveLoaded(true);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  // ── Caută automat în DB când se schimbă filtrele ──────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      searchDB(
        search,
        filterType  !== "toate" ? filterType  : "",
        filterState !== "toate" ? filterState : "",
        sortBy,
        0, // resetează la pagina 1 când se schimbă filtrele
        filterAn,
        filterValMin,
        filterValMax
     );
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filterType, filterState, sortBy, filterAn, filterValMin, filterValMax]);

  // ── Statistici ────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    count:     items.length,
    total:     items.reduce((s, i) => s + Number(i.value_ron ?? i.ronContractValue ?? 0), 0),
    atribuite: items.filter(i => (i.procedure_state || i.sysProcedureState?.text) === "Atribuita").length,
    active:    items.filter(i => (i.procedure_state || i.sysProcedureState?.text) === "In desfasurare").length,
  }), [items]);

  const sel = {
    background: "#111827", border: "1px solid #1f2937",
    borderRadius: 8, padding: "8px 12px",
    color: "#f3f4f6", fontSize: 13, outline: "none", cursor: "pointer",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#030712", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#f9fafb" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        background: "#080f1a", borderBottom: "1px solid #0f172a",
        padding: "14px 24px", display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{
          width: 32, height: 32, background: "#1d4ed8",
          borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
        }}>🏛</div>

        <div>
          <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>
            Licitații Publice <span style={{ color: "#3b82f6" }}>România</span>
          </div>
          <div style={{ fontSize: 11, color: "#334155" }}>Interfață alternativă · e-licitatie.ro</div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          {source === "db" && (
            <span style={{ fontSize: 11, color: "#8b5cf6", background: "#8b5cf622", padding: "3px 10px", borderRadius: 6, fontWeight: 700 }}>
              ● Bază de date ({dbTotal?.toLocaleString()} total)
            </span>
          )}
          {source === "live" && (
            <span style={{ fontSize: 11, color: "#10b981", background: "#10b98122", padding: "3px 10px", borderRadius: 6, fontWeight: 700 }}>
              ● LIVE
            </span>
          )}
          <button
            onClick={loadLive}
            disabled={loading}
            style={{
              background: loading ? "#1f2937" : "#1d4ed8",
              border: "none", color: "#fff",
              padding: "8px 18px", borderRadius: 8,
              fontSize: 13, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Se încarcă..." : "⟳ Date live"}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>

        {/* ── Eroare ───────────────────────────────────────────────────────── */}
        {error && (
          <div style={{
            background: "#1f0a0a", border: "1px solid #7f1d1d",
            borderRadius: 10, padding: "12px 16px", marginBottom: 20,
            fontSize: 13, color: "#fca5a5", lineHeight: 1.5
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Statistici ───────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          <StatCard label="Afișate"        value={stats.count}      accent="#3b82f6" />
          <StatCard label="Valoare totală" value={fmt(stats.total)} accent="#f59e0b" />
          <StatCard label="Atribuite"      value={stats.atribuite}  accent="#10b981" />
          <StatCard label="În desfășurare" value={stats.active}     accent="#8b5cf6" />
        </div>

        {/* ── Filtre ───────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="🔍  Caută titlu, autoritate, CPV, număr..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...sel, flex: 1, minWidth: 220, padding: "10px 14px", fontSize: 14 }}
          />
          <select value={filterType}   onChange={e => setFilterType(e.target.value)}  style={sel}>
            <option value="toate">Toate tipurile</option>
            <option value="Furnizare">Furnizare</option>
            <option value="Servicii">Servicii</option>
            <option value="Lucrari">Lucrări</option>
          </select>
          <select value={filterState}  onChange={e => setFilterState(e.target.value)} style={sel}>
            <option value="toate">Toate stările</option>
            <option value="Atribuita">Atribuite</option>
            <option value="In desfasurare">În desfășurare</option>
            <option value="Anulata">Anulate</option>
          </select>
          <select value={sortBy}       onChange={e => setSortBy(e.target.value)}      style={sel}>
            <option value="date">↓ Dată</option>
            <option value="valoare">↓ Valoare</option>
          </select>
          <input
           type="number"
           placeholder="Valoare min (RON)"
           value={filterValMin}
           onChange={e => setFilterValMin(e.target.value)}
           style={{ ...sel, width: 150 }}
          />
          <input
           type="number"
           placeholder="Valoare max (RON)"
           value={filterValMax}
           onChange={e => setFilterValMax(e.target.value)}
           style={{ ...sel, width: 150 }}
          />
          <select value={filterAn} onChange={e => setFilterAn(e.target.value)} style={sel}>
           <option value="">Toți anii</option>
           {[2026,2025,2024,2023,2022,2021,2020,2019,2018,2017,2016,2015].map(an => (
            <option key={an} value={an}>{an}</option>
         ))}
          </select>
        </div>

        <div style={{ fontSize: 12, color: "#334155", marginBottom: 16, fontWeight: 600 }}>
          {source === "demo"
            ? <span style={{ color: "#f59e0b" }}>Date demo — baza de date se încarcă...</span>
            : `${items.length} rezultate afișate${dbTotal ? ` din ${dbTotal.toLocaleString()} în baza de date` : ""}${search ? ` pentru „${search}"` : ""}`
          }
        </div>

        {/* ── Grid carduri ─────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 14 }}>
          {items.map(item => (
            <Card key={item.id || item.caNoticeId} item={item} onClick={setSelected} />
          ))}
        </div>

        {items.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#334155" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div>Niciun rezultat{search ? ` pentru „${search}"` : ""}</div>
            <div style={{ fontSize: 12, marginTop: 8, color: "#1e293b" }}>
              Baza de date conține 200 licitații. Rulează sync pentru mai multe.
            </div>
          </div>
        )}

{/* Paginare */}
{totalDB > 50 && (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 32 }}>
    <button
      onClick={() => searchDB(search, filterType !== "toate" ? filterType : "", filterState !== "toate" ? filterState : "", sortBy, page - 1)}
      disabled={page === 0}
      style={{
        background: page === 0 ? "#1f2937" : "#1d4ed8",
        border: "none", color: "#fff",
        padding: "8px 20px", borderRadius: 8,
        fontSize: 14, fontWeight: 700,
        cursor: page === 0 ? "not-allowed" : "pointer",
        opacity: page === 0 ? 0.5 : 1
      }}
    >
      ← Anterior
    </button>

    <span style={{ color: "#9ca3af", fontSize: 14 }}>
      Pagina <strong style={{ color: "#f9fafb" }}>{page + 1}</strong> din <strong style={{ color: "#f9fafb" }}>{Math.ceil(totalDB / 50)}</strong>
      <span style={{ color: "#4b5563", marginLeft: 8 }}>({totalDB.toLocaleString()} total)</span>
    </span>

    <button
      onClick={() => searchDB(search, filterType !== "toate" ? filterType : "", filterState !== "toate" ? filterState : "", sortBy, page + 1)}
      disabled={page >= Math.ceil(totalDB / 50) - 1}
      style={{
        background: page >= Math.ceil(totalDB / 50) - 1 ? "#1f2937" : "#1d4ed8",
        border: "none", color: "#fff",
        padding: "8px 20px", borderRadius: 8,
        fontSize: 14, fontWeight: 700,
        cursor: page >= Math.ceil(totalDB / 50) - 1 ? "not-allowed" : "pointer",
        opacity: page >= Math.ceil(totalDB / 50) - 1 ? 0.5 : 1
      }}
    >
      Următor →
    </button>
  </div>
)}

        <footer style={{ marginTop: 48, textAlign: "center", fontSize: 11, color: "#1e293b" }}>
          Date publice preluate din portalul SEAP/e-licitatie.ro · Licența pentru Guvernare Deschisă v1.0
        </footer>
      </main>

      <Modal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
