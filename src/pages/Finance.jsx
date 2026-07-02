import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, TrendingUp, Utensils, Bus, Gamepad2,
  Smartphone, Pill, Package, Plus, X, ChevronRight,
  Calendar, DollarSign, Pencil, Trash2, AlertCircle,
  CheckCircle2, Info, Bot, Lightbulb
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";

// ─── CONFIGURACIÓN DE TARJETAS CONOCIDAS ────────────────────────────────────
const CARD_PRESETS = {
  nu_debito: {
    label: "Nu Débito",
    bank: "Nu",
    card_type: "debito",
    gradient: "linear-gradient(135deg, #820AD1 0%, #4A0082 100%)",
    textColor: "#fff",
    annualRate: null,
    cat: null,
    minPaymentRate: null,
    logo: "NU",
    logoColor: "#fff",
    active: true,
  },
  nu_credito: {
    label: "Nu Crédito",
    bank: "Nu",
    card_type: "credito",
    gradient: "linear-gradient(135deg, #820AD1 0%, #C850FF 100%)",
    textColor: "#fff",
    annualRate: 92.5,
    cat: 145.8,
    minPaymentRate: 1.5,
    logo: "NU",
    logoColor: "#fff",
    active: true,
  },
  bbva_debito: {
    label: "BBVA Débito",
    bank: "BBVA",
    card_type: "debito",
    gradient: "linear-gradient(135deg, #004481 0%, #1464A5 100%)",
    textColor: "#fff",
    annualRate: null,
    cat: null,
    minPaymentRate: null,
    logo: "BBVA",
    logoColor: "#fff",
    active: true,
  },
  bbva_credito: {
    label: "BBVA Crédito",
    bank: "BBVA",
    card_type: "credito",
    gradient: "linear-gradient(135deg, #004481 0%, #0A6ABF 100%)",
    textColor: "#fff",
    annualRate: 83.39,
    cat: 124.8,
    minPaymentRate: 1.5,
    logo: "BBVA",
    logoColor: "#fff",
    active: true,
  },
  plata_card: {
    label: "Plata Card",
    bank: "Plata",
    card_type: "credito",
    gradient: "linear-gradient(135deg, #1C1C2E 0%, #2D2D4E 50%, #3A3A5C 100%)",
    textColor: "#E8E8FF",
    annualRate: 99.9,
    cat: 164.2,
    minPaymentRate: 1.5,
    logo: "PLATA",
    logoColor: "#C0C0FF",
    active: true,
  },
  didi_card: {
    label: "Didi Card",
    bank: "DiDi",
    card_type: "credito",
    gradient: "linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%)",
    textColor: "#fff",
    annualRate: 82.37,
    cat: 124.1,
    minPaymentRate: 1.5,
    logo: "DiDi",
    logoColor: "#fff",
    active: true,
  },
};

const CATEGORIES = [
  { cat: "Comida", color: "#22D3EE", icon: Utensils },
  { cat: "Transporte", color: "#67E8F9", icon: Bus },
  { cat: "Entretenimiento", color: "#C084FC", icon: Gamepad2 },
  { cat: "Suscripciones", color: "#4ADE80", icon: Smartphone },
  { cat: "Salud", color: "#FB923C", icon: Pill },
  { cat: "Otros", color: "#94A3B8", icon: Package },
];

const API = "http://192.168.1.72:8000/api/v1";

// ─── HELPERS ────────────────────────────────────────────────────────────────
function calcMinPayment(balance, annualRate) {
  if (!balance || balance <= 0 || !annualRate) return 0;
  const monthlyRate = annualRate / 100 / 12;
  const interest = balance * monthlyRate;
  const minPct = balance * 0.015;
  return Math.max(interest + minPct, 200);
}

function calcNextMonthBalance(balance, annualRate, payment) {
  if (!balance || balance <= 0 || !annualRate) return 0;
  const monthlyRate = annualRate / 100 / 12;
  const interest = balance * monthlyRate;
  const newBalance = balance + interest - payment;
  return Math.max(newBalance, 0);
}

function getMonthName() {
  return new Date().toLocaleString("es-MX", { month: "long", year: "numeric" });
}

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-2xl border backdrop-blur-xl bg-white/10 border-white/20 px-4 py-3 text-sm">
        <p className="font-semibold" style={{ color: payload[0].payload.color }}>
          {payload[0].name}
        </p>
        <p className="text-white font-bold">${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

// ─── COMPONENTE TARJETA BANCARIA ─────────────────────────────────────────────
function BankCardVisual({ card, preset, isActive, onClick }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      className="min-w-[290px] h-[175px] rounded-3xl p-5 flex-shrink-0 cursor-pointer relative overflow-hidden select-none"
      style={{
        background: preset.gradient,
        border: isActive
          ? "2px solid rgba(255,255,255,0.4)"
          : "1px solid rgba(255,255,255,0.12)",
        boxShadow: isActive
          ? "0 12px 40px rgba(0,0,0,0.4)"
          : "0 4px 20px rgba(0,0,0,0.2)",
      }}
    >
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
        style={{ background: "rgba(255,255,255,0.3)" }}
      />
      <div
        className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10"
        style={{ background: "rgba(255,255,255,0.3)" }}
      />

      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs opacity-60" style={{ color: preset.textColor }}>
            {preset.bank}
          </p>
          <p
            className="font-bold text-base mt-0.5 tracking-tight"
            style={{ color: preset.textColor }}
          >
            {preset.label}
          </p>
        </div>
        <span
          className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-xl font-semibold"
          style={{
            background: "rgba(255,255,255,0.18)",
            color: preset.textColor,
          }}
        >
          {card.card_type === "credito" ? "Crédito" : "Débito"}
        </span>
      </div>

      <div className="mt-4">
        <p
          className="text-2xl font-bold tracking-tighter"
          style={{ color: preset.textColor }}
        >
          ${(card.balance || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs opacity-55" style={{ color: preset.textColor }}>
            {card.card_type === "credito" ? "Saldo deudor" : "Saldo disponible"}
          </p>
          {card.last_four && (
            <p className="text-xs opacity-55" style={{ color: preset.textColor }}>
              **** **** **** {card.last_four}
            </p>
          )}
        </div>
      </div>

      <div
        className="absolute bottom-4 right-5 font-black text-sm tracking-wider opacity-70"
        style={{ color: preset.logoColor }}
      >
        {preset.logo}
      </div>
    </motion.div>
  );
}

// ─── MODAL AGREGAR/EDITAR TARJETA (WIZARD 2 PASOS) ────────────────────────
function CardModal({ cards, onClose, onSave, editCard }) {
  const initialStep = editCard ? 2 : 1;
  const [step, setStep] = useState(initialStep);
  const [presetKey, setPresetKey] = useState(editCard?.preset_key || "");
  const [balance, setBalance] = useState(editCard?.balance || "");
  const [lastFour, setLastFour] = useState(editCard?.last_four || "");
  const [cutoffDay, setCutoffDay] = useState(editCard?.cutoff_day || "");
  const [paymentDay, setPaymentDay] = useState(editCard?.payment_day || "");

  const preset = presetKey ? CARD_PRESETS[presetKey] : null;

  const isStep1Valid = presetKey !== "";
  const isStep2Valid = () => {
    if (lastFour && !/^\d{4}$/.test(lastFour)) return false;
    if (cutoffDay && (cutoffDay < 1 || cutoffDay > 31)) return false;
    if (paymentDay && (paymentDay < 1 || paymentDay > 31)) return false;
    return true;
  };

  const handleNext = () => {
    if (isStep1Valid) setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSave = () => {
    if (!isStep2Valid()) {
      alert("Revisa los campos (últimos 4 dígitos, días de corte/pago)");
      return;
    }

    if (!editCard) {
      const exists = cards.some(
        (card) => card.preset_key === presetKey
      );
      if (exists) {
        alert("Ya tienes agregada esta tarjeta");
        return;
      }
    }

    const cardData = {
      preset_key: presetKey,
      bank_name: preset.bank,
      card_type: preset.card_type,
      color_hex: "#000",
      cutoff_day: cutoffDay ? parseInt(cutoffDay) : null,
      payment_day: paymentDay ? parseInt(paymentDay) : null,
      interest_rate: preset.annualRate || 0,
      balance: parseFloat(balance) || 0,
      last_four: lastFour || null,
    };

    onSave(cardData);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md rounded-3xl p-6 z-10 max-h-[90vh] overflow-y-auto"
        style={{ background: "#141728", border: "1px solid rgba(255,255,255,0.1)" }}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-white font-bold text-lg">
              {editCard ? "Editar Tarjeta" : "Agregar Tarjeta"}
            </h3>
            {!editCard && (
              <p className="text-[#8B8E9E] text-xs uppercase tracking-wide mt-1">
                {step === 1 ? "Selecciona tu tarjeta" : "Datos de la tarjeta"}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!editCard && step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-2 gap-3 mb-6">
                {Object.entries(CARD_PRESETS)
                  .filter(([_, card]) => card.active)
                  .map(([key, p]) => {
                    const isSelected = presetKey === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setPresetKey(key)}
                        className="rounded-2xl p-4 text-left transition-all relative overflow-hidden"
                        style={{
                          background: p.gradient,
                          border: isSelected
                            ? "2px solid rgba(255,255,255,0.5)"
                            : "1px solid rgba(255,255,255,0.1)",
                          boxShadow: isSelected
                            ? "0 8px 30px rgba(0,0,0,0.4)"
                            : "none",
                        }}
                      >
                        <p className="text-white/60 text-[10px] uppercase tracking-wider">
                          {p.bank}
                        </p>
                        <p className="text-white font-bold text-sm">{p.label}</p>
                        <span className="text-[10px] text-white/70 bg-white/20 px-2 py-0.5 rounded-full mt-1 inline-block">
                          {p.card_type === "credito" ? "Crédito" : "Débito"}
                        </span>
                        {p.annualRate && (
                          <p className="text-white/40 text-[10px] mt-1">
                            {p.annualRate}% anual
                          </p>
                        )}
                      </button>
                    );
                  })}
              </div>

              <button
                onClick={handleNext}
                disabled={!isStep1Valid}
                className="w-full py-3 rounded-2xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
              >
                Siguiente
              </button>
            </motion.div>
          )}

          {(editCard || step === 2) && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {preset && (
                <div
                  className="rounded-2xl p-4 mb-5 flex items-center gap-3"
                  style={{ background: preset.gradient }}
                >
                  <div>
                    <p className="text-white/70 text-xs">{preset.bank}</p>
                    <p className="text-white font-bold">{preset.label}</p>
                  </div>
                  {preset.annualRate && (
                    <div className="ml-auto text-right">
                      <p className="text-white/60 text-[10px]">Tasa anual</p>
                      <p className="text-white font-bold text-sm">{preset.annualRate}%</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-4">
                <label className="text-[#8B8E9E] text-xs uppercase tracking-wide mb-2 block">
                  {preset?.card_type === "credito" ? "Saldo deudor actual ($)" : "Saldo disponible ($)"}
                </label>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </div>

              <div className="mb-4">
                <label className="text-[#8B8E9E] text-xs uppercase tracking-wide mb-2 block">
                  Últimos 4 dígitos (opcional)
                </label>
                <input
                  type="text"
                  value={lastFour}
                  onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0,4))}
                  placeholder="2546"
                  maxLength={4}
                  className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </div>

              {preset?.card_type === "credito" && (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div>
                    <label className="text-[#8B8E9E] text-xs uppercase tracking-wide mb-2 block">
                      Día de corte
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={cutoffDay}
                      onChange={(e) => setCutoffDay(e.target.value)}
                      placeholder="Ej: 15"
                      className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
                      style={{
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[#8B8E9E] text-xs uppercase tracking-wide mb-2 block">
                      Día de pago
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={paymentDay}
                      onChange={(e) => setPaymentDay(e.target.value)}
                      placeholder="Ej: 5"
                      className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
                      style={{
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {!editCard && (
                  <button
                    onClick={handleBack}
                    className="flex-1 py-3 rounded-2xl font-semibold text-[#8B8E9E] transition-colors hover:text-white"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    Atrás
                  </button>
                )}
                <button
                  onClick={handleSave}
                  className={`${!editCard ? 'flex-1' : 'w-full'} py-3 rounded-2xl font-semibold text-white transition-opacity hover:opacity-90`}
                  style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
                >
                  {editCard ? "Guardar cambios" : "Guardar"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ─── MODAL REGISTRAR TRANSACCIÓN ─────────────────────────────────────────────
function TransactionModal({ cards, cardPresets, onClose, onSave }) {
  const creditCards = cards.filter((c) => c.card_type === "credito");
  const [txType, setTxType] = useState("gasto");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Comida");
  const [cardId, setCardId] = useState(creditCards[0]?.id || "");

  const handleSave = () => {
    if (!amount || !cardId) return;
    onSave({ card_id: parseInt(cardId), tx_type: txType, amount: parseFloat(amount), category });
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md rounded-3xl p-6 z-10 max-h-[90vh] overflow-y-auto"
        style={{ background: "#141728", border: "1px solid rgba(255,255,255,0.1)" }}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-bold text-lg">Registrar movimiento</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 mb-5">
          {["gasto", "pago"].map((t) => (
            <button
              key={t}
              onClick={() => setTxType(t)}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold capitalize transition-all"
              style={{
                background:
                  txType === t
                    ? t === "gasto"
                      ? "rgba(239,68,68,0.25)"
                      : "rgba(34,197,94,0.25)"
                    : "rgba(255,255,255,0.06)",
                border:
                  txType === t
                    ? t === "gasto"
                      ? "1px solid rgba(239,68,68,0.5)"
                      : "1px solid rgba(34,197,94,0.5)"
                    : "1px solid rgba(255,255,255,0.1)",
                color: txType === t ? (t === "gasto" ? "#F87171" : "#4ADE80") : "#8B8E9E",
              }}
            >
              {t === "gasto" ? "Gasto" : "Pago"}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="text-[#8B8E9E] text-xs uppercase tracking-wide mb-2 block">
            Tarjeta
          </label>
          <select
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {creditCards.map((c) => (
              <option key={c.id} value={c.id} style={{ background: "#141728" }}>
                {cardPresets[c.preset_key]?.label || c.bank_name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="text-[#8B8E9E] text-xs uppercase tracking-wide mb-2 block">
            Monto ($)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
        </div>

        {txType === "gasto" && (
          <div className="mb-5">
            <label className="text-[#8B8E9E] text-xs uppercase tracking-wide mb-2 block">
              Categoría
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(({ cat, color, icon: Icon }) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="flex flex-col items-center gap-1 py-2 rounded-2xl text-xs font-medium transition-all"
                  style={{
                    background:
                      category === cat ? `${color}22` : "rgba(255,255,255,0.05)",
                    border:
                      category === cat
                        ? `1px solid ${color}55`
                        : "1px solid rgba(255,255,255,0.08)",
                    color: category === cat ? color : "#8B8E9E",
                  }}
                >
                  <Icon size={16} />
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          className="w-full py-3 rounded-2xl font-semibold text-white transition-opacity hover:opacity-90"
          style={{
            background:
              txType === "gasto"
                ? "linear-gradient(135deg, #EF4444, #DC2626)"
                : "linear-gradient(135deg, #22C55E, #16A34A)",
          }}
        >
          Registrar {txType === "gasto" ? "gasto" : "pago"}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── PANEL DE DETALLES / PAGOS ───────────────────────────────────────────────
function CardDetailPanel({ card, preset, onClose }) {
  const [paymentScenario, setPaymentScenario] = useState("minimo");

  if (!card || !preset) return null;

  const isCredit = card.card_type === "credito";
  const balance = card.balance || 0;
  const monthlyRate = preset.annualRate ? preset.annualRate / 100 / 12 : 0;
  const interest = balance * monthlyRate;
  const minPayment = calcMinPayment(balance, preset.annualRate);
  const totalPayment = balance;

  const scenarios = {
    minimo: {
      label: "Pago Mínimo",
      amount: minPayment,
      nextBalance: calcNextMonthBalance(balance, preset.annualRate, minPayment),
      color: "#F87171",
      warn: true,
    },
    mitad: {
      label: "Pago a la Mitad",
      amount: balance / 2,
      nextBalance: calcNextMonthBalance(balance, preset.annualRate, balance / 2),
      color: "#FBBF24",
      warn: false,
    },
    total: {
      label: "Pago Total",
      amount: totalPayment,
      nextBalance: 0,
      color: "#4ADE80",
      warn: false,
    },
  };

  const chosen = scenarios[paymentScenario];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md rounded-3xl p-6 z-10 max-h-[90vh] overflow-y-auto"
        style={{ background: "#141728", border: "1px solid rgba(255,255,255,0.1)" }}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
      >
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-white font-bold text-lg">{preset.label}</h3>
            <p className="text-[#8B8E9E] text-xs mt-0.5">{preset.bank}</p>
            {card.last_four && (
              <p className="text-[#8B8E9E] text-xs mt-1">**** **** **** {card.last_four}</p>
            )}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div
          className="rounded-2xl p-4 mb-5"
          style={{ background: preset.gradient }}
        >
          <p className="text-white/60 text-xs">Saldo {isCredit ? "deudor" : "disponible"}</p>
          <p className="text-white text-3xl font-bold mt-1">
            ${balance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex gap-4 mt-2">
            {card.cutoff_day && (
              <div>
                <p className="text-white/50 text-[10px]">Corte</p>
                <p className="text-white text-xs font-semibold">Día {card.cutoff_day}</p>
              </div>
            )}
            {card.payment_day && (
              <div>
                <p className="text-white/50 text-[10px]">Límite de pago</p>
                <p className="text-white text-xs font-semibold">Día {card.payment_day}</p>
              </div>
            )}
            {preset.annualRate && (
              <div className="ml-auto">
                <p className="text-white/50 text-[10px]">Tasa anual</p>
                <p className="text-white text-xs font-semibold">{preset.annualRate}%</p>
              </div>
            )}
          </div>
        </div>

        {isCredit && balance > 0 && (
          <>
            <div
              className="rounded-2xl p-4 mb-4 flex items-center gap-3"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-300 text-xs">Interés generado este mes</p>
                <p className="text-red-400 font-bold">
                  ${interest.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <p className="text-[#8B8E9E] text-xs uppercase tracking-wide mb-3">
              Escenario de pago
            </p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {Object.entries(scenarios).map(([key, s]) => (
                <button
                  key={key}
                  onClick={() => setPaymentScenario(key)}
                  className="py-2 rounded-2xl text-xs font-semibold transition-all"
                  style={{
                    background:
                      paymentScenario === key ? `${s.color}22` : "rgba(255,255,255,0.05)",
                    border:
                      paymentScenario === key
                        ? `1px solid ${s.color}55`
                        : "1px solid rgba(255,255,255,0.08)",
                    color: paymentScenario === key ? s.color : "#8B8E9E",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div
              className="rounded-2xl p-4"
              style={{
                background: `${chosen.color}11`,
                border: `1px solid ${chosen.color}33`,
              }}
            >
              <div className="flex justify-between items-center mb-3">
                <p className="text-white/60 text-xs">Pagarías este mes</p>
                <p className="font-bold text-lg" style={{ color: chosen.color }}>
                  ${chosen.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-white/60 text-xs">Saldo siguiente mes</p>
                <p
                  className="font-bold"
                  style={{ color: chosen.nextBalance === 0 ? "#4ADE80" : "#F87171" }}
                >
                  ${chosen.nextBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
              {chosen.warn && chosen.nextBalance > balance && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                  <AlertCircle size={14} className="text-red-400" />
                  <p className="text-red-400 text-xs">
                    ¡Tu deuda crecerá ${(chosen.nextBalance - balance).toFixed(2)} con solo el pago mínimo!
                  </p>
                </div>
              )}
              {paymentScenario === "total" && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                  <CheckCircle2 size={14} className="text-green-400" />
                  <p className="text-green-400 text-xs">
                    Pagas todo — sin intereses el próximo mes
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {(!isCredit || balance <= 0) && (
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
          >
            <CheckCircle2 size={18} className="text-green-400" />
            <p className="text-green-300 text-sm">
              {!isCredit ? "Tarjeta de débito — sin deuda ni intereses." : "¡Sin saldo deudor!"}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function Finance() {
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [detailCard, setDetailCard] = useState(null);
  const [editCard, setEditCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [financeAdvice, setFinanceAdvice] = useState('');
  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem('finance_budgets');
    return saved ? JSON.parse(saved) : { Comida: 3500, Transporte: 800, Entretenimiento: 1000, Suscripciones: 900, Salud: 500, Otros: 600 };
  });
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [resCards, resTxs] = await Promise.all([
        axios.get(`${API}/finance/cards`),
        axios.get(`${API}/finance/transactions`),
      ]);
      setCards(resCards.data);
      setTransactions(resTxs.data);
      setApiError(false);
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMonthlySummary = useCallback(async (ym) => {
    try {
      const res = await axios.get(`${API}/finance/monthly-summary?year_month=${ym}`);
      setMonthlySummary(res.data);
    } catch {
      setApiError(true);
    }
  }, []);

  const fetchFinanceAdvice = useCallback(async () => {
    try {
      const res = await axios.post(`${API}/finance/advice`);
      setFinanceAdvice(res.data.advice);
    } catch {
      setApiError(true);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!loading) {
      fetchMonthlySummary(selectedMonth);
    }
  }, [selectedMonth, loading, fetchMonthlySummary]);

  const handleAddCard = async (cardData) => {
    try {
      await axios.post(`${API}/finance/cards`, cardData);
      fetchData();
    } catch { setApiError(true); }
  };

  const handleEditCard = async (cardData) => {
    try {
      await axios.put(`${API}/finance/cards/${editCard.id}`, cardData);
      setEditCard(null);
      fetchData();
    } catch { setApiError(true); }
  };

  const handleDeleteCard = async (id) => {
    try {
      await axios.delete(`${API}/finance/cards/${id}`);
      setActiveCardIdx(0);
      fetchData();
    } catch { setApiError(true); }
  };

  const handleAddTx = async (txData) => {
    try {
      await axios.post(`${API}/finance/transaction`, txData);
      fetchData();
    } catch { setApiError(true); }
  };

  const filteredTxs = transactions.filter(tx => tx.date && tx.date.startsWith(selectedMonth));

  const spending = CATEGORIES.map((cat) => ({
    ...cat,
    amount: filteredTxs
      .filter((t) => t.tx_type === "gasto" && t.category === cat.cat)
      .reduce((a, t) => a + t.amount, 0),
    budget: budgets[cat.cat] || 0,
  })).filter((s) => s.amount > 0 || true);

  const totalSpent = spending.reduce((a, s) => a + s.amount, 0);
  const activeCard = cards[activeCardIdx];
  const activePreset = activeCard ? CARD_PRESETS[activeCard.preset_key] : null;

  const debitBalance = cards
    .filter((c) => c.card_type === "debito")
    .reduce((a, c) => a + (c.balance || 0), 0);
  const creditDebt = cards
    .filter((c) => c.card_type === "credito")
    .reduce((a, c) => a + (c.balance || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E1A] pb-36 px-4 pt-6 md:px-6 font-sans">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Finanzas</h1>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => {
                      const [y, m] = selectedMonth.split('-').map(Number);
                      const prev = new Date(y, m-2, 1);
                      setSelectedMonth(`${prev.getFullYear()}-${String(prev.getMonth()+1).padStart(2,'0')}`);
                    }}
                    className="text-[#8B8E9E] hover:text-white transition-colors text-sm"
                  >
                    ←
                  </button>
                  <p className="text-[#8B8E9E] text-sm font-medium uppercase tracking-wide capitalize">
                    {new Date(selectedMonth + '-01').toLocaleString('es-MX', { month: 'long', year: 'numeric' })}
                  </p>
                  <button
                    onClick={() => {
                      const [y, m] = selectedMonth.split('-').map(Number);
                      const next = new Date(y, m, 1);
                      setSelectedMonth(`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}`);
                    }}
                    className="text-[#8B8E9E] hover:text-white transition-colors text-sm"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 self-end">
              <button
                onClick={() => setShowAddTx(true)}
                disabled={cards.filter((c) => c.card_type === "credito").length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all disabled:opacity-30"
                style={{
                  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  color: "#fff",
                }}
              >
                <Plus size={16} />
                Movimiento
              </button>
            </div>
          </div>
        </motion.div>

        {apiError && (
          <div className="rounded-2xl px-4 py-3 flex items-center gap-2 text-sm"
            style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
            <AlertCircle size={15} className="text-rose-400 shrink-0" />
            <p className="text-rose-400">Sin conexión con el backend — los datos pueden no estar actualizados.</p>
          </div>
        )}

        {cards.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-2xl p-4"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <p className="text-green-400/70 text-xs uppercase tracking-wide">Disponible</p>
              <p className="text-green-400 font-bold text-xl mt-1">
                ${debitBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-green-400/50 text-[10px] mt-0.5">Débito total</p>
            </div>
            <div
              className="rounded-2xl p-4"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <p className="text-red-400/70 text-xs uppercase tracking-wide">Deuda total</p>
              <p className="text-red-400 font-bold text-xl mt-1">
                ${creditDebt.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-red-400/50 text-[10px] mt-0.5">Crédito usado</p>
            </div>
          </div>
        )}

        {monthlySummary && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 border" style={{ background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.2)' }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[#8B8E9E] text-xs uppercase tracking-wide">Gastos del mes</p>
                <p className="text-white text-2xl font-bold">${monthlySummary.total_spent.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs ${monthlySummary.change_percent > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {monthlySummary.change_percent > 0 ? '↑' : '↓'} {Math.abs(monthlySummary.change_percent)}% vs mes anterior
                  </span>
                  {monthlySummary.top_category && (
                    <span className="text-xs text-[#8B8E9E]">• Mayor: {monthlySummary.top_category}</span>
                  )}
                </div>
              </div>
              <button onClick={fetchFinanceAdvice} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors flex items-center gap-1.5">
                <Lightbulb size={14} />
                Consejo IA
              </button>
            </div>
            {financeAdvice && (
              <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80">
                <p className="flex items-start gap-2">
                  <Bot size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                  {financeAdvice}
                </p>
              </div>
            )}
          </motion.div>
        )}

        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-white font-semibold text-base">Mis tarjetas</h2>
            <button
              onClick={() => setShowAddCard(true)}
              className="flex items-center gap-1.5 text-[#6366F1] text-sm font-medium hover:opacity-80 transition-opacity"
            >
              <Plus size={16} />
              Agregar
            </button>
          </div>

          {cards.length === 0 ? (
            <motion.button
              onClick={() => setShowAddCard(true)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full rounded-3xl p-8 flex flex-col items-center gap-3 cursor-pointer"
              style={{ border: "2px dashed rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.05)" }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(99,102,241,0.15)" }}
              >
                <CreditCard size={24} className="text-indigo-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">Agrega tu primera tarjeta</p>
                <p className="text-[#8B8E9E] text-sm mt-1">
                  Nu, BBVA, Plata Card, Didi Card y más
                </p>
              </div>
            </motion.button>
          ) : (
            <div className="flex gap-4 overflow-x-auto py-2 -mx-1 px-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {cards.map((card, i) => {
                const preset = CARD_PRESETS[card.preset_key];
                if (!preset) return null;
                return (
                  <div key={card.id} className="relative flex-shrink-0">
                    <BankCardVisual
                      card={card}
                      preset={preset}
                      isActive={activeCardIdx === i}
                      onClick={() => {
                        setActiveCardIdx(i);
                        setDetailCard(card);
                      }}
                    />
                    <div className="flex gap-2 mt-2 justify-end pr-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditCard(card); }}
                        className="flex items-center gap-1 text-[#8B8E9E] text-xs hover:text-white transition-colors"
                      >
                        <Pencil size={12} /> Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('¿Eliminar esta tarjeta y todos sus movimientos?')) {
                            handleDeleteCard(card.id);
                          }
                        }}
                        className="flex items-center gap-1 text-red-400/60 text-xs hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} /> Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cards.some((c) => c.card_type === "credito") && (
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-yellow-400" />
              <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wide">Tasas reales 2026</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {cards
                .filter((c) => c.card_type === "credito")
                .map((c) => {
                  const p = CARD_PRESETS[c.preset_key];
                  if (!p?.annualRate) return null;
                  return (
                    <span
                      key={c.id}
                      className="text-[10px] px-2.5 py-1 rounded-xl"
                      style={{ background: "rgba(251,191,36,0.1)", color: "#FCD34D" }}
                    >
                      {p.label}: {p.annualRate}% anual • CAT {p.cat}%
                    </span>
                  );
                })}
            </div>
          </div>
        )}

        {filteredTxs.length > 0 ? (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="rounded-3xl border backdrop-blur-xl bg-white/5 border-white/10 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-semibold text-lg text-white">Gastos por categoría</h2>
                  <div className="flex items-center gap-3">
                    <p className="text-emerald-400 font-medium text-sm">
                      Total: <span className="text-white">${totalSpent.toLocaleString()}</span>
                    </p>
                    <button onClick={() => setShowBudgetModal(true)} className="text-xs text-[#8B8E9E] hover:text-white transition-colors">
                      Editar presupuestos
                    </button>
                  </div>
                </div>
                {spending.filter(s => s.amount > 0).length === 0 ? (
                  <p className="text-[#8B8E9E] text-sm text-center py-8">Sin gastos este mes</p>
                ) : (
                  <div className="space-y-5">
                    {spending.filter((s) => s.amount > 0).map((item, i) => {
                      const budget = budgets[item.cat] || 0;
                      const percentage = budget ? Math.min((item.amount / budget) * 100, 100) : 0;
                      const over = budget > 0 && item.amount > budget;
                      return (
                        <div key={i}>
                          <div className="flex justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                                style={{ background: `${item.color}15` }}
                              >
                                <item.icon size={20} style={{ color: item.color }} />
                              </div>
                              <span className="font-medium text-white">{item.cat}</span>
                            </div>
                            <div className="text-right">
                              <span className={`font-bold ${over ? "text-red-400" : "text-white"}`}>
                                ${item.amount.toLocaleString()}
                              </span>
                              <p className="text-xs text-[#8B8E9E]">/ ${budget}</p>
                            </div>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: over ? "#F87171" : item.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ delay: 0.1 + i * 0.05 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="rounded-3xl border backdrop-blur-xl bg-white/5 border-white/10 p-6">
                <h2 className="font-semibold text-lg text-white mb-6">Distribución de Gastos</h2>
                {spending.filter(s => s.amount > 0).length === 0 ? (
                  <p className="text-[#8B8E9E] text-sm text-center py-8">Sin gastos para mostrar</p>
                ) : (
                  <>
                    <div className="w-full" style={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={spending.filter((s) => s.amount > 0)}
                            dataKey="amount"
                            nameKey="cat"
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={110}
                          >
                            {spending.filter((s) => s.amount > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {spending.filter((s) => s.amount > 0).map((s) => (
                        <div key={s.cat} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{s.cat}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        ) : (
          <div className="rounded-3xl border backdrop-blur-xl bg-white/5 border-white/10 p-6 text-center text-[#8B8E9E]">
            <p>No hay transacciones este mes. Registra tus gastos para ver estadísticas.</p>
          </div>
        )}

        {filteredTxs.length > 0 && (
          <div className="rounded-3xl border backdrop-blur-xl bg-white/5 border-white/10 p-5">
            <h2 className="font-semibold text-base text-white mb-4">Movimientos recientes</h2>
            <div className="space-y-2">
              {filteredTxs.slice(0, 8).map((tx) => {
                const card = cards.find((c) => c.id === tx.card_id);
                const preset = card ? CARD_PRESETS[card.preset_key] : null;
                const catInfo = CATEGORIES.find((c) => c.cat === tx.category);
                const Icon = catInfo?.icon || Package;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: tx.tx_type === "pago" ? "rgba(34,197,94,0.15)" : `${catInfo?.color || "#94A3B8"}15`,
                      }}
                    >
                      {tx.tx_type === "pago"
                        ? <CheckCircle2 size={16} className="text-green-400" />
                        : <Icon size={16} style={{ color: catInfo?.color || "#94A3B8" }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">
                        {tx.tx_type === "pago" ? "Pago realizado" : tx.category}
                      </p>
                      <p className="text-[#8B8E9E] text-xs truncate">
                        {preset?.label || "Tarjeta"} · {new Date(tx.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <p
                      className="font-bold text-sm flex-shrink-0"
                      style={{ color: tx.tx_type === "pago" ? "#4ADE80" : "#F87171" }}
                    >
                      {tx.tx_type === "pago" ? "-" : "+"}${tx.amount.toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      <AnimatePresence>
        {showAddCard && (
          <CardModal
            cards={cards}
            onClose={() => setShowAddCard(false)}
            onSave={handleAddCard}
          />
        )}
        {editCard && (
          <CardModal
            cards={cards}
            onClose={() => setEditCard(null)}
            onSave={handleEditCard}
            editCard={editCard}
          />
        )}
        {showAddTx && (
          <TransactionModal
            cards={cards}
            cardPresets={CARD_PRESETS}
            onClose={() => setShowAddTx(false)}
            onSave={handleAddTx}
          />
        )}
        {detailCard && (
          <CardDetailPanel
            card={detailCard}
            preset={CARD_PRESETS[detailCard.preset_key]}
            onClose={() => setDetailCard(null)}
          />
        )}
        {showBudgetModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowBudgetModal(false)} />
            <motion.div className="relative w-full max-w-sm rounded-3xl p-6 z-10 max-h-[90vh] overflow-y-auto" style={{ background: '#141728', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="text-white font-bold text-lg mb-4">Editar presupuestos</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {Object.entries(budgets).map(([cat, amount]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="text-white text-sm w-24 flex-shrink-0">{cat}</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setBudgets(prev => ({ ...prev, [cat]: parseFloat(e.target.value) || 0 }))}
                      className="flex-1 rounded-xl px-3 py-2 text-white text-sm outline-none bg-white/5 border border-white/10"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => { localStorage.setItem('finance_budgets', JSON.stringify(budgets)); setShowBudgetModal(false); }} className="flex-1 py-2 rounded-xl font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors">Guardar</button>
                <button onClick={() => setShowBudgetModal(false)} className="flex-1 py-2 rounded-xl font-semibold text-[#8B8E9E] bg-white/5 hover:bg-white/10 transition-colors">Cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}