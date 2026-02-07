from flask import Flask, render_template, request, jsonify
from datetime import date

app = Flask(__name__)

# ----------------------------
# GAME RULES
# ----------------------------

POINTS_REFILL = 5
POINTS_RECYCLE = 10
POINTS_EXCESS = 2
SEED_COST = 30

# ----------------------------
# GAME STATE (Demo storage)
# ----------------------------

STATE = {
    "eco_points": 0,
    "owned_seed": False,
    "plant_stage": "none",
    "today": {
        "refills": 0,
        "recycles": 0,
        "excess": 0
    },
    "last_day": str(date.today())
}

# ----------------------------
# DAILY RESET
# ----------------------------

def reset_daily():
    today_str = str(date.today())

    if STATE["last_day"] != today_str:
        STATE["today"] = {
            "refills": 0,
            "recycles": 0,
            "excess": 0
        }
        STATE["last_day"] = today_str

# ----------------------------
# POINT CALCULATION
# ----------------------------

def calculate_points(refills, recycles, excess):
    return (
            refills * POINTS_REFILL +
            recycles * POINTS_RECYCLE +
            excess * POINTS_EXCESS
    )

# ----------------------------
# PLANT GROWTH SYSTEM
# ----------------------------

def update_plant_stage():

    if not STATE["owned_seed"]:
        STATE["plant_stage"] = "none"
        return

    points = STATE["eco_points"]

    if points < 60:
        STATE["plant_stage"] = "seed"
    elif points < 120:
        STATE["plant_stage"] = "sprout"
    else:
        STATE["plant_stage"] = "bloom"

# ----------------------------
# MAIN PAGE
# ----------------------------

@app.route("/")
def home():
    reset_daily()
    update_plant_stage()

    return render_template(
        "index.html",
        state=STATE,
        rules={
            "refill": POINTS_REFILL,
            "recycle": POINTS_RECYCLE,
            "excess": POINTS_EXCESS,
            "seed_cost": SEED_COST
        }
    )

# ----------------------------
# LOG USER HYDRATION
# ----------------------------

@app.route("/api/log", methods=["POST"])
def log_data():

    reset_daily()

    data = request.get_json()

    refills = int(data.get("refills", 0))
    recycles = int(data.get("recycles", 0))
    excess = int(data.get("excess", 0))

    # Update today's counters
    STATE["today"]["refills"] += max(refills, 0)
    STATE["today"]["recycles"] += max(recycles, 0)
    STATE["today"]["excess"] += max(excess, 0)

    # Add points
    gained = calculate_points(refills, recycles, excess)
    STATE["eco_points"] += gained

    if STATE["eco_points"] < 0:
        STATE["eco_points"] = 0

    update_plant_stage()

    return jsonify({
        "eco_points": STATE["eco_points"],
        "gained": gained,
        "today": STATE["today"],
        "owned_seed": STATE["owned_seed"],
        "plant_stage": STATE["plant_stage"]
    })

# ----------------------------
# BUY SEED SYSTEM
# ----------------------------

@app.route("/api/buy_seed", methods=["POST"])
def buy_seed():

    reset_daily()

    if STATE["owned_seed"]:
        return jsonify({
            "success": False,
            "message": "You already own a seed."
        })

    if STATE["eco_points"] < SEED_COST:
        return jsonify({
            "success": False,
            "message": f"You need {SEED_COST} eco coins."
        })

    # Purchase seed
    STATE["eco_points"] -= SEED_COST
    STATE["owned_seed"] = True
    STATE["plant_stage"] = "seed"

    update_plant_stage()

    return jsonify({
        "success": True,
        "eco_points": STATE["eco_points"],
        "owned_seed": True,
        "plant_stage": STATE["plant_stage"],
        "message": "Seed purchased! 🌱"
    })

# ----------------------------
# RUN SERVER
# ----------------------------

if __name__ == "__main__":
    app.run(debug=True)
