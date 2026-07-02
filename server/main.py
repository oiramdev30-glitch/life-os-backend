from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
import datetime
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

# Cargar variables del .env
load_dotenv()

# --- IA DE GOOGLE ---
import google.generativeai as genai
from google.generativeai import types

# --- CONFIGURACIÓN DE GEMINI IA ---
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
client = genai.GenerativeModel('gemini-2.5-flash')

# Importar sincronizador de Garmin
from garmin_sync import GarminService

# --- CONFIGURACIÓN DE BASE DE DATOS ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./habits.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- TASAS REALES 2026 ---
CARD_RATES = {
    "nu_credito":    {"annual_rate": 92.5,  "cat": 145.8},
    "bbva_credito":  {"annual_rate": 83.39, "cat": 124.8},
    "plata_card":    {"annual_rate": 99.9,  "cat": 164.2},
    "didi_card":     {"annual_rate": 82.37, "cat": 124.1},
    "nu_debito":     {"annual_rate": None,  "cat": None},
    "bbva_debito":   {"annual_rate": None,  "cat": None},
}

# --- MODELOS DE BASE DE DATOS ---
class HabitLog(Base):
    __tablename__ = "habit_logs"
    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"))
    date = Column(String)
    habit = relationship("Habit", back_populates="logs")

class Habit(Base):
    __tablename__ = "habits"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    category = Column(String)
    frequency = Column(String, default="diario")
    duration_minutes = Column(Integer, default=30)
    done = Column(Boolean, default=False)
    streak = Column(Integer, default=0)
    logs = relationship("HabitLog", back_populates="habit", cascade="all, delete")

class WorkoutLog(Base):
    __tablename__ = "workout_logs"
    id = Column(Integer, primary_key=True, index=True)
    exercise_id = Column(String, index=True)
    exercise_name = Column(String)
    weight_logged = Column(String)
    date = Column(String, index=True)

class FinanceCard(Base):
    __tablename__ = "finance_cards"
    id = Column(Integer, primary_key=True, index=True)
    preset_key = Column(String, default="")
    bank_name = Column(String)
    card_type = Column(String)
    color_hex = Column(String, default="#000000")
    cutoff_day = Column(Integer, nullable=True)
    payment_day = Column(Integer, nullable=True)
    interest_rate = Column(Float, default=0.0)
    cat = Column(Float, default=0.0)
    balance = Column(Float, default=0.0)
    last_four = Column(String, nullable=True)

class FinanceTransaction(Base):
    __tablename__ = "finance_transactions"
    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("finance_cards.id", ondelete="CASCADE"))
    tx_type = Column(String)
    amount = Column(Float)
    category = Column(String)
    date = Column(String)
    card = relationship("FinanceCard")

class FocusSession(Base):
    __tablename__ = "focus_sessions"
    id = Column(Integer, primary_key=True, index=True)
    tag = Column(String, default="trabajo")
    note = Column(String, default="")
    duration_seconds = Column(Integer, default=0)
    date = Column(String, index=True)

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    column_id = Column(String, default="todo")
    priority = Column(String, default="medium")
    tags = Column(String, default="")
    estimate = Column(String, default="")
    created_at = Column(String)
    updated_at = Column(String)

class MentalLog(Base):
    __tablename__ = "mental_logs"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String)
    time = Column(String)
    mood_value = Column(Integer)
    journal_text = Column(String, nullable=True)

class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    level = Column(Integer)
    target = Column(Integer)
    color = Column(String)

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    platform = Column(String)
    progress = Column(Integer)
    color = Column(String)

class StudyLog(Base):
    __tablename__ = "study_logs"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String)
    day_name = Column(String)
    hours = Column(Float)
    topic = Column(String, nullable=True)

class SocialLog(Base):
    __tablename__ = "social_logs"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True)
    app_name = Column(String)
    minutes = Column(Integer)

class RunningSessionLog(Base):
    __tablename__ = "running_sessions"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True)
    rpe = Column(Integer)
    feeling = Column(String)
    workout_type = Column(String)

class BodyMetrics(Base):
    __tablename__ = "body_metrics"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True)
    weight = Column(Float)
    height = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)
    basal_metabolism = Column(Float, nullable=True)
    body_fat = Column(Float, nullable=True)
    muscle_mass = Column(Float, nullable=True)
    visceral_fat = Column(Float, nullable=True)
    body_water = Column(Float, nullable=True)
    skinfolds = Column(Float, nullable=True)
    chest = Column(Float, nullable=True)
    waist = Column(Float, nullable=True)
    hip = Column(Float, nullable=True)
    bicep = Column(Float, nullable=True)
    thigh = Column(Float, nullable=True)
    calf = Column(Float, nullable=True)

class GymSessionLog(Base):
    __tablename__ = "gym_sessions"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True)
    rpe = Column(Integer)
    feeling = Column(String)
    total_tonnage = Column(Float)

class DescargaLog(Base):
    __tablename__ = "descarga_logs"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True)

Base.metadata.create_all(bind=engine)

# --- APP FASTAPI Y CORS ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# --- SCHEMAS DE ENTRADA ---
class HabitCreate(BaseModel): name: str; category: str; frequency: str = "diario"; duration_minutes: int = 30
class HabitUpdate(BaseModel): done: bool
class HabitEdit(BaseModel): name: str; category: str
class HabitResponse(BaseModel):
    id: int; name: str; category: str; frequency: str; duration_minutes: int; done: bool; streak: int; logs: List[str] = []
    class Config: from_attributes = True

class WorkoutLogCreate(BaseModel): exercise_id: str; exercise_name: str; weight_logged: str

class BodyMetricsCreate(BaseModel):
    weight: float
    height: Optional[float] = None
    bmi: Optional[float] = None
    basal_metabolism: Optional[float] = None
    body_fat: Optional[float] = None
    muscle_mass: Optional[float] = None
    visceral_fat: Optional[float] = None
    body_water: Optional[float] = None
    skinfolds: Optional[float] = None
    chest: Optional[float] = None
    waist: Optional[float] = None
    hip: Optional[float] = None
    bicep: Optional[float] = None
    thigh: Optional[float] = None
    calf: Optional[float] = None

class GymSessionLogCreate(BaseModel): rpe: int; feeling: str; total_tonnage: float
class CoachRequest(BaseModel): user_message: str; module: str; history: Optional[list] = []
class CardCreate(BaseModel):
    preset_key: str
    bank_name: str
    card_type: str
    color_hex: str = "#000000"
    cutoff_day: Optional[int] = None
    payment_day: Optional[int] = None
    interest_rate: float = 0.0
    cat: float = 0.0
    balance: float = 0.0
    last_four: Optional[str] = None
class CardUpdate(BaseModel):
    cutoff_day: Optional[int] = None
    payment_day: Optional[int] = None
    balance: float = 0.0
    last_four: Optional[str] = None
class TransactionCreate(BaseModel): card_id: int; tx_type: str; amount: float; category: str
class CardResponse(BaseModel):
    id: int
    preset_key: str
    bank_name: str
    card_type: str
    color_hex: str
    cutoff_day: Optional[int]
    payment_day: Optional[int]
    interest_rate: float
    cat: float
    balance: float
    last_four: Optional[str]
    class Config: from_attributes = True
class TransactionResponse(BaseModel):
    id: int; card_id: int; tx_type: str; amount: float; category: str; date: str
    class Config: from_attributes = True
class MinPaymentResponse(BaseModel): card_id: int; balance: float; monthly_interest: float; min_payment: float; payment_total: float; next_balance_if_min: float; next_balance_if_half: float; next_balance_if_total: float
class FocusSessionCreate(BaseModel): tag: str = "trabajo"; note: str = ""; duration_seconds: int
class FocusSessionResponse(BaseModel):
    id: int; tag: str; note: str; duration_seconds: int; date: str
    class Config: from_attributes = True
class TaskCreate(BaseModel): title: str; column_id: str = "todo"; priority: str = "medium"; tags: str = ""; estimate: str = ""
class TaskUpdate(BaseModel): title: str; column_id: str; priority: str = "medium"; tags: str = ""; estimate: str = ""
class TaskResponse(BaseModel):
    id: int; title: str; column_id: str; priority: str; tags: str; estimate: str; created_at: str; updated_at: str
    class Config: from_attributes = True
class MentalLogCreate(BaseModel): mood_value: int; journal_text: Optional[str] = None
class SkillCreate(BaseModel): name: str; level: int; target: int; color: str
class CourseCreate(BaseModel): title: str; platform: str; progress: int; color: str
class StudyLogCreate(BaseModel): hours: float; topic: Optional[str] = None
class SocialLogCreate(BaseModel): app_name: str; minutes: int
class SocialLogResponse(BaseModel):
    id: int; date: str; app_name: str; minutes: int
    class Config: from_attributes = True
class RunningLogCreate(BaseModel): rpe: int; feeling: str; workout_type: str


# ─── ENDPOINTS HÁBITOS ────────────────────────────────────────────────────────

@app.get("/api/v1/habits", response_model=List[HabitResponse])
def get_habits(db: Session = Depends(get_db)):
    habits = db.query(Habit).all()
    result = []
    for h in habits:
        h_dict = h.__dict__.copy()
        h_dict["logs"] = [log.date for log in h.logs]
        result.append(h_dict)
    return result

@app.post("/api/v1/habits", response_model=HabitResponse)
def add_habit(habit: HabitCreate, db: Session = Depends(get_db)):
    db_habit = Habit(**habit.dict())
    db.add(db_habit)
    db.commit()
    db.refresh(db_habit)
    h_dict = db_habit.__dict__.copy()
    h_dict["logs"] = []
    return h_dict

@app.patch("/api/v1/habits/{habit_id}")
def toggle_habit(habit_id: int, update: HabitUpdate, db: Session = Depends(get_db)):
    db_habit = db.query(Habit).filter(Habit.id == habit_id).first()
    db_habit.done = update.done
    today_str = datetime.date.today().isoformat()
    if update.done:
        existing = db.query(HabitLog).filter(HabitLog.habit_id == habit_id, HabitLog.date == today_str).first()
        if not existing: db.add(HabitLog(habit_id=habit_id, date=today_str))
    else:
        db.query(HabitLog).filter(HabitLog.habit_id == habit_id, HabitLog.date == today_str).delete()
    db.commit()
    return {"status": "success"}

@app.put("/api/v1/habits/{habit_id}")
def edit_habit(habit_id: int, habit_edit: HabitEdit, db: Session = Depends(get_db)):
    db_habit = db.query(Habit).filter(Habit.id == habit_id).first()
    db_habit.name = habit_edit.name
    db_habit.category = habit_edit.category
    db.commit()
    return {"status": "success"}

@app.delete("/api/v1/habits/{habit_id}")
def delete_habit(habit_id: int, db: Session = Depends(get_db)):
    db.query(Habit).filter(Habit.id == habit_id).delete()
    db.commit()
    return {"status": "deleted"}


# ─── ENDPOINTS GIMNASIO Y BIOMETRÍA ───────────────────────────────────────────

@app.post("/api/v1/gym/log")
def log_workout_exercise(log_data: WorkoutLogCreate, db: Session = Depends(get_db)):
    today_str = datetime.date.today().isoformat()
    existing = db.query(WorkoutLog).filter(WorkoutLog.exercise_id == log_data.exercise_id, WorkoutLog.date == today_str).first()
    if existing: existing.weight_logged = log_data.weight_logged
    else: db.add(WorkoutLog(exercise_id=log_data.exercise_id, exercise_name=log_data.exercise_name, weight_logged=log_data.weight_logged, date=today_str))
    db.commit()
    return {"status": "logged"}

@app.delete("/api/v1/gym/log/{exercise_id}")
def remove_workout_log(exercise_id: str, db: Session = Depends(get_db)):
    today_str = datetime.date.today().isoformat()
    db.query(WorkoutLog).filter(WorkoutLog.exercise_id == exercise_id, WorkoutLog.date == today_str).delete()
    db.commit()
    return {"status": "removed"}

@app.get("/api/v1/gym/history")
def get_gym_history(db: Session = Depends(get_db)):
    logs = db.query(WorkoutLog).order_by(WorkoutLog.date.desc()).all()
    return [{"date": l.date, "exercise_id": l.exercise_id, "name": l.exercise_name, "weight": l.weight_logged} for l in logs]

@app.get("/api/v1/gym/session-history")
def get_gym_session_history(db: Session = Depends(get_db)):
    logs = db.query(GymSessionLog).order_by(GymSessionLog.date.desc()).all()
    return [{"date": l.date, "rpe": l.rpe, "feeling": l.feeling, "tonnage": l.total_tonnage} for l in logs]

@app.get("/api/v1/gym/check-metrics")
def check_metrics_status(db: Session = Depends(get_db)):
    last_log = db.query(BodyMetrics).order_by(BodyMetrics.date.desc()).first()
    if not last_log: return {"should_log": True, "days_passed": 999}
    try:
        last_date = datetime.datetime.strptime(last_log.date, "%Y-%m-%d").date()
        passed = (datetime.date.today() - last_date).days
    except Exception: passed = 999
    return {"should_log": passed >= 28, "days_passed": passed}

@app.post("/api/v1/gym/metrics")
def log_body_metrics(metrics: BodyMetricsCreate, db: Session = Depends(get_db)):
    today_str = datetime.date.today().isoformat()
    db.add(BodyMetrics(
        date=today_str,
        weight=metrics.weight,
        height=metrics.height,
        bmi=metrics.bmi,
        basal_metabolism=metrics.basal_metabolism,
        body_fat=metrics.body_fat,
        muscle_mass=metrics.muscle_mass,
        visceral_fat=metrics.visceral_fat,
        body_water=metrics.body_water,
        skinfolds=metrics.skinfolds,
        chest=metrics.chest,
        waist=metrics.waist,
        hip=metrics.hip,
        bicep=metrics.bicep,
        thigh=metrics.thigh,
        calf=metrics.calf
    ))
    db.commit()
    return {"status": "success"}

@app.post("/api/v1/gym/session-log")
def log_gym_session(log: GymSessionLogCreate, db: Session = Depends(get_db)):
    today_str = datetime.date.today().isoformat()
    existing = db.query(GymSessionLog).filter(GymSessionLog.date == today_str).first()
    if existing:
        existing.rpe = log.rpe
        existing.feeling = log.feeling
        existing.total_tonnage = log.total_tonnage
    else: db.add(GymSessionLog(date=today_str, rpe=log.rpe, feeling=log.feeling, total_tonnage=log.total_tonnage))
    db.commit()
    return {"status": "success"}

@app.get("/api/v1/gym/check-descarga")
def check_descarga(db: Session = Depends(get_db)):
    last_descarga = db.query(DescargaLog).order_by(DescargaLog.date.desc()).first()
    start_date = last_descarga.date if last_descarga else "2000-01-01"
    run_count = db.query(RunningSessionLog).filter(RunningSessionLog.date > start_date).count()
    gym_count = db.query(GymSessionLog).filter(GymSessionLog.date > start_date).count()
    total_workouts = run_count + gym_count
    return {"should_alert": total_workouts >= 15, "workouts_since_last": total_workouts}

@app.post("/api/v1/gym/log-descarga")
def log_descarga(db: Session = Depends(get_db)):
    today_str = datetime.date.today().isoformat()
    db.add(DescargaLog(date=today_str))
    db.commit()
    return {"status": "success"}


# ─── ENDPOINTS FINANZAS ───────────────────────────────────────────────────────

@app.get("/api/v1/finance/cards", response_model=List[CardResponse])
def get_cards(db: Session = Depends(get_db)):
    return db.query(FinanceCard).all()

@app.post("/api/v1/finance/cards", response_model=CardResponse)
def add_card(card: CardCreate, db: Session = Depends(get_db)):
    rates = CARD_RATES.get(card.preset_key, {})
    data = card.dict()
    data["interest_rate"] = rates.get("annual_rate") or 0.0
    data["cat"] = rates.get("cat") or 0.0
    new_card = FinanceCard(**data)
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    return new_card

@app.put("/api/v1/finance/cards/{card_id}")
def update_card(card_id: int, update: CardUpdate, db: Session = Depends(get_db)):
    card = db.query(FinanceCard).filter(FinanceCard.id == card_id).first()
    if update.cutoff_day is not None:
        card.cutoff_day = update.cutoff_day
    if update.payment_day is not None:
        card.payment_day = update.payment_day
    if update.balance is not None:
        card.balance = update.balance
    if update.last_four is not None:
        card.last_four = update.last_four
    db.commit()
    return {"status": "updated"}

@app.delete("/api/v1/finance/cards/{card_id}")
def delete_card(card_id: int, db: Session = Depends(get_db)):
    db.query(FinanceCard).filter(FinanceCard.id == card_id).delete()
    db.query(FinanceTransaction).filter(FinanceTransaction.card_id == card_id).delete()
    db.commit()
    return {"status": "deleted"}

@app.post("/api/v1/finance/transaction")
def add_transaction(tx: TransactionCreate, db: Session = Depends(get_db)):
    today_str = datetime.date.today().isoformat()
    db.add(FinanceTransaction(**tx.dict(), date=today_str))
    card = db.query(FinanceCard).filter(FinanceCard.id == tx.card_id).first()
    if tx.tx_type == "gasto":
        card.balance += tx.amount
    elif tx.tx_type == "pago":
        card.balance = max(0.0, card.balance - tx.amount)
    db.commit()
    return {"status": "success"}

@app.get("/api/v1/finance/transactions", response_model=List[TransactionResponse])
def get_transactions(card_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(FinanceTransaction)
    if card_id:
        q = q.filter(FinanceTransaction.card_id == card_id)
    return q.order_by(FinanceTransaction.date.desc()).all()

@app.get("/api/v1/finance/summary")
def get_finance_summary(db: Session = Depends(get_db)):
    cards = db.query(FinanceCard).all()
    today = datetime.date.today()
    month_str = today.strftime("%Y-%m")
    txs_month = db.query(FinanceTransaction).filter(
        FinanceTransaction.date.startswith(month_str),
        FinanceTransaction.tx_type == "gasto"
    ).all()
    credit_debt = sum(c.balance for c in cards if c.card_type == "credito")
    debit_balance = sum(c.balance for c in cards if c.card_type == "debito")
    total_spent = sum(t.amount for t in txs_month)
    by_category = {}
    for t in txs_month:
        by_category[t.category] = by_category.get(t.category, 0) + t.amount
    return {
        "credit_debt": round(credit_debt, 2),
        "debit_balance": round(debit_balance, 2),
        "total_spent_this_month": round(total_spent, 2),
        "spending_by_category": by_category
    }

@app.get("/api/v1/finance/monthly-summary")
def get_monthly_summary(year_month: Optional[str] = None, db: Session = Depends(get_db)):
    if not year_month:
        year_month = datetime.date.today().strftime("%Y-%m")
    try:
        y, m = map(int, year_month.split('-'))
        prev_date = datetime.date(y, m, 1) - datetime.timedelta(days=1)
        prev_month = prev_date.strftime("%Y-%m")
    except:
        prev_month = ""

    def get_spending(ym):
        txs = db.query(FinanceTransaction).filter(
            FinanceTransaction.date.startswith(ym),
            FinanceTransaction.tx_type == "gasto"
        ).all()
        total = sum(t.amount for t in txs)
        by_cat = {}
        for t in txs:
            by_cat[t.category] = by_cat.get(t.category, 0) + t.amount
        return total, by_cat

    current_total, current_cat = get_spending(year_month)
    prev_total, _ = get_spending(prev_month) if prev_month else (0, {})

    change = 0
    if prev_total > 0:
        change = round((current_total - prev_total) / prev_total * 100, 1)

    top_cat = max(current_cat, key=current_cat.get) if current_cat else None

    return {
        "month": year_month,
        "total_spent": round(current_total, 2),
        "by_category": current_cat,
        "previous_total": round(prev_total, 2),
        "change_percent": change,
        "top_category": top_cat,
    }

@app.post("/api/v1/finance/advice")
def get_finance_advice(db: Session = Depends(get_db)):
    today = datetime.date.today()
    month_str = today.strftime("%Y-%m")
    txs = db.query(FinanceTransaction).filter(
        FinanceTransaction.date.startswith(month_str),
        FinanceTransaction.tx_type == "gasto"
    ).all()
    if not txs:
        return {"status": "success", "advice": "No has registrado gastos este mes."}

    by_cat = {}
    for t in txs:
        by_cat[t.category] = by_cat.get(t.category, 0) + t.amount
    total = sum(by_cat.values())
    categories_str = ", ".join([f"{cat}: ${round(amt,2)}" for cat, amt in by_cat.items()])

    prompt = f"""
    Eres un asesor financiero personal. Hoy es {today}. 
    Mis gastos de este mes ({month_str}) son:
    - Total: ${round(total,2)}
    - Desglose: {categories_str}

    Dame un consejo breve y accionable (máximo 3 oraciones) sobre cómo mejorar mis finanzas. 
    Señala si estoy gastando demasiado en alguna categoría y sugiere un ajuste.
    Responde de forma directa, sin Markdown.
    """

    try:
        response = client.generate_content(
            contents=[{"role": "user", "parts": [{"text": prompt}]}],
            generation_config=types.GenerationConfig(temperature=0.7)
        )
        advice = response.text
    except Exception as e:
        advice = f"No pude generar consejo: {str(e)}"

    return {"status": "success", "advice": advice}

@app.get("/api/v1/finance/cards/{card_id}/min-payment", response_model=MinPaymentResponse)
def get_min_payment(card_id: int, db: Session = Depends(get_db)):
    card = db.query(FinanceCard).filter(FinanceCard.id == card_id).first()
    if card.card_type != "credito":
        raise HTTPException(status_code=400, detail="Solo aplica para tarjetas de crédito")
    balance = card.balance or 0.0
    annual_rate = card.interest_rate or 0.0
    monthly_rate = annual_rate / 100 / 12
    monthly_interest = balance * monthly_rate
    min_payment_calc = monthly_interest + (balance * 0.015)
    min_payment = max(min_payment_calc, 200.0) if balance > 0 else 0.0
    def next_bal(payment):
        return max(0.0, balance + monthly_interest - payment)
    return MinPaymentResponse(
        card_id=card_id,
        balance=round(balance, 2),
        monthly_interest=round(monthly_interest, 2),
        min_payment=round(min_payment, 2),
        payment_total=round(balance, 2),
        next_balance_if_min=round(next_bal(min_payment), 2),
        next_balance_if_half=round(next_bal(balance / 2), 2),
        next_balance_if_total=0.0
    )


# ─── ENDPOINTS FOCUS ─────────────────────────────────────────────────────────

@app.get("/api/v1/focus/summary")
def get_focus_summary(db: Session = Depends(get_db)):
    today_str = datetime.date.today().isoformat()
    all_sessions = db.query(FocusSession).order_by(FocusSession.date.desc()).all()
    today_secs = sum(s.duration_seconds for s in all_sessions if s.date == today_str)
    dates_with_sessions = sorted({s.date for s in all_sessions}, reverse=True)
    streak = 0
    check = datetime.date.today()
    for d in dates_with_sessions:
        if d == check.isoformat():
            streak += 1
            check -= datetime.timedelta(days=1)
        else: break
    return {
        "today_minutes": today_secs // 60,
        "today_sessions": sum(1 for s in all_sessions if s.date == today_str),
        "streak_days": streak,
        "total_sessions": len(all_sessions),
        "total_hours": round(sum(s.duration_seconds for s in all_sessions) / 3600, 1),
    }

@app.get("/api/v1/focus/sessions", response_model=List[FocusSessionResponse])
def get_focus_sessions(db: Session = Depends(get_db)):
    return db.query(FocusSession).order_by(FocusSession.date.desc()).all()

@app.post("/api/v1/focus/sessions", response_model=FocusSessionResponse)
def create_focus_session(session: FocusSessionCreate, db: Session = Depends(get_db)):
    new_session = FocusSession(
        tag=session.tag,
        note=session.note,
        duration_seconds=session.duration_seconds,
        date=datetime.date.today().isoformat()
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@app.delete("/api/v1/focus/sessions/{session_id}")
def delete_focus_session(session_id: int, db: Session = Depends(get_db)):
    db.query(FocusSession).filter(FocusSession.id == session_id).delete()
    db.commit()
    return {"status": "deleted"}


# ─── ENDPOINTS KANBAN (TASKS) ────────────────────────────────────────────────

@app.get("/api/v1/tasks/summary")
def get_tasks_summary(db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    summary = {"backlog": 0, "todo": 0, "doing": 0, "done": 0, "total": len(tasks)}
    for t in tasks:
        if t.column_id in summary:
            summary[t.column_id] += 1
    summary["progress_pct"] = round(summary["done"] / summary["total"] * 100) if summary["total"] > 0 else 0
    return summary

@app.get("/api/v1/tasks", response_model=List[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(Task).order_by(Task.created_at.asc()).all()

@app.post("/api/v1/tasks", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    now = datetime.datetime.now().isoformat()
    new_task = Task(
        title=task.title,
        column_id=task.column_id,
        priority=task.priority,
        tags=task.tags,
        estimate=task.estimate,
        created_at=now,
        updated_at=now
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@app.put("/api/v1/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task: TaskUpdate, db: Session = Depends(get_db)):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    db_task.title = task.title
    db_task.column_id = task.column_id
    db_task.priority = task.priority
    db_task.tags = task.tags
    db_task.estimate = task.estimate
    db_task.updated_at = datetime.datetime.now().isoformat()
    db.commit()
    db.refresh(db_task)
    return db_task

@app.patch("/api/v1/tasks/{task_id}/move")
def move_task(task_id: int, column_id: str, db: Session = Depends(get_db)):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    db_task.column_id = column_id
    db_task.updated_at = datetime.datetime.now().isoformat()
    db.commit()
    return {"status": "moved"}

@app.delete("/api/v1/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db.query(Task).filter(Task.id == task_id).delete()
    db.commit()
    return {"status": "deleted"}


# ─── ENDPOINTS RESTANTES (Mental, Estudio, Social) ──────────────────────────

@app.get("/api/v1/mental")
def get_mental_logs(db: Session = Depends(get_db)):
    return db.query(MentalLog).order_by(MentalLog.id.desc()).all()

@app.post("/api/v1/mental")
def add_mental_log(log: MentalLogCreate, db: Session = Depends(get_db)):
    now = datetime.datetime.now()
    db.add(MentalLog(
        date=now.strftime("%Y-%m-%d"),
        time=now.strftime("%H:%M"),
        mood_value=log.mood_value,
        journal_text=log.journal_text
    ))
    db.commit()
    return {"status": "success"}

@app.get("/api/v1/study/skills")
def get_skills(db: Session = Depends(get_db)):
    return db.query(Skill).all()

@app.post("/api/v1/study/skills")
def add_skill(skill: SkillCreate, db: Session = Depends(get_db)):
    db.add(Skill(**skill.dict()))
    db.commit()
    return {"status": "success"}

@app.put("/api/v1/study/skills/{item_id}")
def update_skill(item_id: int, skill: SkillCreate, db: Session = Depends(get_db)):
    db.query(Skill).filter(Skill.id == item_id).update(skill.dict())
    db.commit()
    return {"status": "success"}

@app.delete("/api/v1/study/skills/{item_id}")
def delete_skill(item_id: int, db: Session = Depends(get_db)):
    db.query(Skill).filter(Skill.id == item_id).delete()
    db.commit()
    return {"status": "deleted"}

@app.get("/api/v1/study/courses")
def get_courses(db: Session = Depends(get_db)):
    return db.query(Course).all()

@app.post("/api/v1/study/courses")
def add_course(course: CourseCreate, db: Session = Depends(get_db)):
    db.add(Course(**course.dict()))
    db.commit()
    return {"status": "success"}

@app.put("/api/v1/study/courses/{item_id}")
def update_course(item_id: int, course: CourseCreate, db: Session = Depends(get_db)):
    db.query(Course).filter(Course.id == item_id).update(course.dict())
    db.commit()
    return {"status": "success"}

@app.delete("/api/v1/study/courses/{item_id}")
def delete_course(item_id: int, db: Session = Depends(get_db)):
    db.query(Course).filter(Course.id == item_id).delete()
    db.commit()
    return {"status": "deleted"}

@app.get("/api/v1/study/logs")
def get_study_logs(db: Session = Depends(get_db)):
    return db.query(StudyLog).all()

@app.post("/api/v1/study/logs")
def add_study_log(log: StudyLogCreate, db: Session = Depends(get_db)):
    days = ["L", "M", "X", "J", "V", "S", "D"]
    today_name = days[datetime.datetime.today().weekday()]
    today_str = datetime.date.today().isoformat()
    existing = db.query(StudyLog).filter(StudyLog.date == today_str).first()
    if existing:
        existing.hours += log.hours
    else:
        db.add(StudyLog(date=today_str, day_name=today_name, hours=log.hours, topic=log.topic))
    db.commit()
    return {"status": "success"}

@app.get("/api/v1/social/logs", response_model=List[SocialLogResponse])
def get_social_logs(db: Session = Depends(get_db)):
    return db.query(SocialLog).all()

@app.post("/api/v1/social/logs")
def add_social_log(log: SocialLogCreate, db: Session = Depends(get_db)):
    today_str = datetime.date.today().isoformat()
    existing = db.query(SocialLog).filter(SocialLog.date == today_str, SocialLog.app_name == log.app_name).first()
    if existing:
        existing.minutes = log.minutes
    else:
        db.add(SocialLog(date=today_str, app_name=log.app_name, minutes=log.minutes))
    db.commit()
    return {"status": "success"}


# ─── ENDPOINTS RUNNING DINÁMICO ──────────────────────────────────────────────

RUNNING_PLAN_JSON = {
  "goal_time": "3:20:00",
  "goal_pace_per_km": "4:44",
  "race_date": "2026-11-30",
  "phases": [
    {
      "phase_number": 1, "name": "Base Aeróbica", "month": 6, "weekly_km_range": "30-35",
      "weekly_structure": {
        "monday":    { "type": "easy", "distance_km": 8, "pace_zone": "z2", "description": "Rodaje suave" },
        "tuesday":   { "type": "easy", "distance_km": 8, "pace_zone": "z2", "description": "Rodaje suave con técnica" },
        "wednesday": { "type": "intervals", "distance_km": 8, "pace_zone": "z5", "description": "5x400m VO2max" },
        "thursday":  { "type": "tempo", "distance_km": 8, "pace_zone": "z3", "description": "4-5 km tempo" },
        "friday":    { "type": "gym", "distance_km": 0, "pace_zone": None, "description": "Fuerza pierna" },
        "saturday":  { "type": "gym", "distance_km": 0, "pace_zone": None, "description": "Fuerza superior" },
        "sunday":    { "type": "long_run", "distance_km": 14, "pace_zone": "z2", "description": "Long run aeróbico" }
      }
    },
    {
      "phase_number": 2, "name": "Resistencia Aeróbica", "month": 7, "weekly_km_range": "35-45",
      "weekly_structure": {
        "monday":    { "type": "easy", "distance_km": 8, "pace_zone": "z2", "description": "Rodaje suave" },
        "tuesday":   { "type": "easy", "distance_km": 8, "pace_zone": "z2", "description": "Rodaje controlado" },
        "wednesday": { "type": "intervals", "distance_km": 10, "pace_zone": "z5", "description": "5x1000m" },
        "thursday":  { "type": "tempo", "distance_km": 10, "pace_zone": "z3", "description": "6 km tempo" },
        "friday":    { "type": "gym", "distance_km": 0, "pace_zone": None, "description": "Fuerza pierna" },
        "saturday":  { "type": "gym", "distance_km": 0, "pace_zone": None, "description": "Fuerza superior" },
        "sunday":    { "type": "long_run", "distance_km": 18, "pace_zone": "z2", "description": "Long run progresivo" }
      }
    },
    {
      "phase_number": 3, "name": "Construcción de Volumen", "month": 8, "weekly_km_range": "45-50",
      "weekly_structure": {
        "monday":    { "type": "easy", "distance_km": 10, "pace_zone": "z2", "description": "Rodaje recuperación" },
        "tuesday":   { "type": "easy", "distance_km": 8, "pace_zone": "z2", "description": "Rodaje base" },
        "wednesday": { "type": "intervals", "distance_km": 11, "pace_zone": "z5", "description": "6x1000m" },
        "thursday":  { "type": "tempo", "distance_km": 11, "pace_zone": "z3", "description": "7 km tempo" },
        "friday":    { "type": "gym", "distance_km": 0, "pace_zone": None, "description": "Fuerza ligera pierna" },
        "saturday":  { "type": "gym", "distance_km": 0, "pace_zone": None, "description": "Fuerza superior" },
        "sunday":    { "type": "long_run", "distance_km": 20, "pace_zone": "z2", "description": "Long run constante" }
      }
    },
    {
      "phase_number": 4, "name": "Bloque Específico", "month": 9, "weekly_km_range": "50-60",
      "weekly_structure": {
        "monday":    { "type": "easy", "distance_km": 10, "pace_zone": "z2", "description": "Rodaje recuperación" },
        "tuesday":   { "type": "easy", "distance_km": 8, "pace_zone": "z2", "description": "Rodaje base" },
        "wednesday": { "type": "intervals", "distance_km": 12, "pace_zone": "z5", "description": "6x1000m" },
        "thursday":  { "type": "tempo", "distance_km": 12, "pace_zone": "z4", "description": "8 km tempo o ritmo maratón" },
        "friday":    { "type": "gym", "distance_km": 0, "pace_zone": None, "description": "Mantenimiento pierna" },
        "saturday":  { "type": "gym", "distance_km": 0, "pace_zone": None, "description": "Fuerza superior" },
        "sunday":    { "type": "long_run", "distance_km": 26, "pace_zone": "z2", "description": "Long run con bloques MP" }
      }
    },
    {
      "phase_number": 5, "name": "Pico de Entrenamiento", "month": 10, "weekly_km_range": "60-65",
      "weekly_structure": {
        "monday":    { "type": "easy", "distance_km": 10, "pace_zone": "z2", "description": "Rodaje suave" },
        "tuesday":   { "type": "easy", "distance_km": 10, "pace_zone": "z2", "description": "Rodaje base" },
        "wednesday": { "type": "intervals", "distance_km": 12, "pace_zone": "z5", "description": "6x1000m o 4x2000m" },
        "thursday":  { "type": "tempo", "distance_km": 14, "pace_zone": "z4", "description": "14 km a ritmo maratón" },
        "friday":    { "type": "gym", "distance_km": 0, "pace_zone": None, "description": "Mantenimiento ligero" },
        "saturday":  { "type": "gym", "distance_km": 0, "pace_zone": None, "description": "Fuerza superior" },
        "sunday":    { "type": "long_run", "distance_km": 32, "pace_zone": "z2", "description": "Long run principal del ciclo" }
      }
    },
    {
      "phase_number": 6, "name": "Taper", "month": 11, "weekly_km_range": "20-50",
      "weekly_structure": {
        "monday":    { "type": "easy", "distance_km": 8, "pace_zone": "z2", "description": "Rodaje suave" },
        "tuesday":   { "type": "easy", "distance_km": 8, "pace_zone": "z2", "description": "Rodaje corto" },
        "wednesday": { "type": "intervals", "distance_km": 8, "pace_zone": "z4", "description": "Activación (8km total)" },
        "thursday":  { "type": "tempo", "distance_km": 8, "pace_zone": "z3", "description": "Ritmo controlado" },
        "friday":    { "type": "gym", "distance_km": 0, "pace_zone": None, "description": "Movilidad y activación" },
        "saturday":  { "type": "gym", "distance_km": 0, "pace_zone": None, "description": "Movilidad" },
        "sunday":    { "type": "long_run", "distance_km": 12, "pace_zone": "z2", "description": "Reducción progresiva hasta carrera" }
      }
    }
  ]
}

@app.get("/api/v1/running/plan")
def get_running_plan(vo2max: int = 50, max_hr: int = 190, rest_hr: int = 50, db: Session = Depends(get_db)):
    today = datetime.date.today()
    month = today.month
    phase = next((p for p in RUNNING_PLAN_JSON["phases"] if p["month"] == month), RUNNING_PLAN_JSON["phases"][0])
    day_map = {0: "monday", 1: "tuesday", 2: "wednesday", 3: "thursday", 4: "friday", 5: "saturday", 6: "sunday"}
    workout = phase["weekly_structure"][day_map[today.weekday()]]
    hrr = max_hr - rest_hr
    vo2_offset = (50 - vo2max) * 2
    def format_pace(base_sec):
        total = base_sec + vo2_offset
        return f"{int(total//60)}:{int(total%60):02d}"
    dynamic_zones = {
        "z1": {"hr": f"{int(rest_hr + hrr*0.60)}-{int(rest_hr + hrr*0.70)}", "pace": f"{format_pace(330)}-{format_pace(360)}"},
        "z2": {"hr": f"{int(rest_hr + hrr*0.70)}-{int(rest_hr + hrr*0.80)}", "pace": f"{format_pace(300)}-{format_pace(330)}"},
        "z3": {"hr": f"{int(rest_hr + hrr*0.80)}-{int(rest_hr + hrr*0.88)}", "pace": f"{format_pace(285)}-{format_pace(300)}"},
        "z4": {"hr": f"{int(rest_hr + hrr*0.88)}-{int(rest_hr + hrr*0.92)}", "pace": f"{format_pace(270)}-{format_pace(285)}"},
        "z5": {"hr": f"{int(rest_hr + hrr*0.92)}-{max_hr}", "pace": f"<{format_pace(270)}"}
    }
    today_str = today.isoformat()
    session_done = db.query(RunningSessionLog).filter(RunningSessionLog.date == today_str).first() is not None
    return {
        "status": "success",
        "phase_name": phase["name"],
        "weekly_km": phase["weekly_km_range"],
        "workout": workout,
        "zones": dynamic_zones,
        "is_done": session_done
    }

@app.post("/api/v1/running/log")
def log_running_session(log: RunningLogCreate, db: Session = Depends(get_db)):
    today_str = datetime.date.today().isoformat()
    existing = db.query(RunningSessionLog).filter(RunningSessionLog.date == today_str).first()
    if existing:
        existing.rpe = log.rpe
        existing.feeling = log.feeling
    else:
        db.add(RunningSessionLog(date=today_str, rpe=log.rpe, feeling=log.feeling, workout_type=log.workout_type))
    db.commit()
    return {"status": "success"}

@app.get("/api/v1/running/history")
def get_running_history(db: Session = Depends(get_db)):
    logs = db.query(RunningSessionLog).order_by(RunningSessionLog.date.desc()).all()
    return [
        {
            "date": l.date,
            "rpe": l.rpe,
            "feeling": l.feeling,
            "workout_type": l.workout_type
        }
        for l in logs
    ]

# ─── ENDPOINT DEL ENTRENADOR IA ──────────────────────────────────────────────

GARMIN_EMAIL = os.getenv("GARMIN_EMAIL", "")
GARMIN_PASSWORD = os.getenv("GARMIN_PASSWORD", "")

@app.get("/api/v1/garmin/sync")
def sync_garmin():
    service = GarminService(GARMIN_EMAIL, GARMIN_PASSWORD)
    metrics = service.get_today_metrics()
    if not metrics:
        raise HTTPException(status_code=500, detail="Error de sincronización con Garmin")
    return {"status": "success", "data": metrics}

@app.post("/api/v1/coach/ask")
def ask_ai_coach(req: CoachRequest, db: Session = Depends(get_db)):
    today_str = datetime.date.today().isoformat()
    system_prompt = ""

    if req.module == "deporte":
        running_logs = db.query(RunningSessionLog).order_by(RunningSessionLog.date.desc()).limit(5).all()
        running_text = ""
        if running_logs:
            running_text = "Últimas sesiones de running:\n" + "\n".join(
                f"  {l.date}: {l.workout_type} (RPE {l.rpe}, sensación: {l.feeling})" for l in running_logs
            )
        else:
            running_text = "No hay sesiones de running registradas."

        gym_logs = db.query(WorkoutLog).order_by(WorkoutLog.date.desc()).limit(5).all()
        gym_text = ""
        if gym_logs:
            gym_text = "Últimos ejercicios de gym:\n" + "\n".join(
                f"  {l.date}: {l.exercise_name} ({l.weight_logged})" for l in gym_logs
            )
        else:
            gym_text = "No hay registros de ejercicios de gym."

        gym_sessions = db.query(GymSessionLog).order_by(GymSessionLog.date.desc()).limit(5).all()
        session_text = ""
        if gym_sessions:
            session_text = "Últimas sesiones de gym:\n" + "\n".join(
                f"  {s.date}: RPE {s.rpe}, sensación: {s.feeling}, tonelaje: {s.total_tonnage}kg" for s in gym_sessions
            )
        else:
            session_text = "No hay sesiones de gym registradas."

        system_prompt = f"""
        Eres el Coach Deportivo de Mario. Hoy es {today_str}.
        Objetivos:
        - Maratón GDL en 3:20 hrs.
        - Ganar 1-2 kg de músculo magro en tren superior sin afectar running.

        Datos reales de entrenamiento:
        {running_text}

        {gym_text}

        {session_text}

        IMPORTANTE: Responde usando SOLO estos datos reales. No inventes marcas, pesos ni fechas.
        Sé breve y directo (máximo 3 oraciones). Sin Markdown.
        """

    elif req.module == "habitos":
        habits = db.query(Habit).all()
        if habits:
            habit_lines = []
            for h in habits:
                done_today = db.query(HabitLog).filter(
                    HabitLog.habit_id == h.id,
                    HabitLog.date == today_str
                ).first() is not None
                status = "hecho hoy" if done_today else "pendiente hoy"
                habit_lines.append(f"{h.name} (categoría: {h.category}) - racha: {h.streak} días - {status}")
            habits_text = "\n".join(habit_lines)
        else:
            habits_text = "No tienes hábitos registrados."

        system_prompt = f"""
        Eres el Asistente de Hábitos de Mario. Hoy es {today_str}.
        Tus hábitos registrados son:
        {habits_text}

        IMPORTANTE: Responde usando SOLO estos datos reales. No inventes hábitos ni rachas.
        Sé breve y directo (máximo 3 oraciones). Sin Markdown.
        """

    elif req.module == "finanzas":
        cards = db.query(FinanceCard).all()
        cards_info = []
        for c in cards:
            last_four = c.last_four or "****"
            cards_info.append(
                f"{c.bank_name} {c.card_type} (terminada en {last_four}) - Saldo: ${c.balance:.2f}"
            )
        cards_text = "\n".join(cards_info) if cards_info else "No tienes tarjetas registradas."

        month_str = today_str[:7]
        txs_month = db.query(FinanceTransaction).filter(
            FinanceTransaction.date.startswith(month_str),
            FinanceTransaction.tx_type == "gasto"
        ).all()
        total_gastos = sum(t.amount for t in txs_month)
        gastos_por_categoria = {}
        for t in txs_month:
            gastos_por_categoria[t.category] = gastos_por_categoria.get(t.category, 0) + t.amount
        gastos_text = f"Total gastos este mes: ${total_gastos:.2f}\n"
        for cat, monto in gastos_por_categoria.items():
            gastos_text += f"  {cat}: ${monto:.2f}\n"
        if not txs_month:
            gastos_text = "No hay gastos registrados este mes."

        system_prompt = f"""
        Eres el Asistente Financiero de Mario. Hoy es {today_str}.
        Tus tarjetas registradas:
        {cards_text}

        Gastos del mes ({month_str}):
        {gastos_text}

        IMPORTANTE: Responde usando SOLO estos datos reales. NO inventes tarjetas ni gastos.
        Sé breve y directo (máximo 3 oraciones). Sin Markdown.
        """

    else:
        system_prompt = f"""
        Eres el asistente central del Life OS de Mario. Hoy es {today_str}.
        Puedes responder preguntas generales sobre hábitos, deporte y finanzas.
        Si no tienes la información, dilo claramente.
        Sé breve, directo y útil. Sin Markdown. Máximo 2 oraciones.
        """

    try:
        contents = []
        if req.history:
            for turn in req.history:
                role = "model" if turn.get("role") == "assistant" else "user"
                contents.append({"role": role, "parts": [{"text": turn.get("content", "")}]})
        if not contents or contents[-1]["role"] != "user":
            contents.append({"role": "user", "parts": [{"text": req.user_message}]})

        response = client.generate_content(
            contents=contents,
            generation_config=types.GenerationConfig(temperature=0.5),
            system_instruction=system_prompt
        )
        respuesta_ia = response.text
    except Exception as e:
        respuesta_ia = f"Error en el núcleo de IA: {str(e)}"

    return {"status": "success", "response": respuesta_ia}