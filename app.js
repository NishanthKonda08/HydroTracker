const ecoPointsEl = document.getElementById("ecoPoints");
const ecoPointsCenterEl = document.getElementById("ecoPointsCenter");
const ringEl = document.getElementById("ring");

const plantImg = document.getElementById("plantImg");
const plantStageEl = document.getElementById("plantStage");
const ownedSeedEl = document.getElementById("ownedSeed");

const tRefills = document.getElementById("tRefills");
const tRecycles = document.getElementById("tRecycles");
const tExtra = document.getElementById("tExtra");

const refillsIn = document.getElementById("refills");
const recyclesIn = document.getElementById("recycles");
const extraUnitsIn = document.getElementById("extraUnits");

const logBtn = document.getElementById("logBtn");
const buySeedBtn = document.getElementById("buySeedBtn");

const toast = document.getElementById("toast");
const shopHint = document.getElementById("shopHint");

let ecoPoints = window.INIT.ecoPoints;
let ownedSeed = window.INIT.ownedSeed;
let plantStage = window.INIT.plantStage;
let seedCost = window.INIT.seedCost;

// Map plant stage to files (THIS is where you connect your PNG/GIFs)
function plantAsset(stage){
    // Adjust filenames if yours are different
    if(stage === "seed") return "/static/assets/plant_seed.png";
    if(stage === "sprout") return "/static/assets/plant_sprout.gif";
    if(stage === "bloom") return "/static/assets/plant_bloom.gif";
    return ""; // none
}

function showToast(msg){
    toast.textContent = msg;
}

function setRing(points){
    // 0..100% based on seedCost progress to "buy seed"
    // This ring shows progress toward your next seed purchase by default.
    // If you want ring to show plant growth instead, tell me and I’ll flip it.
    const pct = Math.min(100, Math.round((points / seedCost) * 100));
    ringEl.style.setProperty("--p", pct);
}

function updatePlantUI(){
    ownedSeedEl.textContent = ownedSeed ? "Yes" : "No";
    plantStageEl.textContent = plantStage;

    const src = plantAsset(plantStage);
    if(!src){
        plantImg.style.opacity = 0.25;
        plantImg.src = "";
        plantImg.alt = "No plant yet - buy a seed!";
    } else {
        plantImg.style.opacity = 1;
        plantImg.src = src;
        plantImg.alt = `Plant stage: ${plantStage}`;
    }

    // Button state
    if(ownedSeed){
        buySeedBtn.disabled = true;
        buySeedBtn.textContent = "Seed Owned ✅";
        shopHint.textContent = "Keep earning eco-coins to grow your plant!";
    } else {
        buySeedBtn.disabled = false;
        buySeedBtn.textContent = `Buy Seed (${seedCost})`;
        shopHint.textContent = `Earn ${Math.max(0, seedCost - ecoPoints)} more eco-coins to buy a seed.`;
    }
}

function updatePointsUI(){
    ecoPointsEl.textContent = ecoPoints;
    ecoPointsCenterEl.textContent = ecoPoints;
    setRing(ecoPoints);
    shopHint.textContent = ownedSeed
        ? "Keep earning eco-coins to grow your plant!"
        : `Earn ${Math.max(0, seedCost - ecoPoints)} more eco-coins to buy a seed.`;
}

// Initialize
updatePointsUI();
updatePlantUI();

// Log action
logBtn.addEventListener("click", async () => {
    const payload = {
        refills: Number(refillsIn.value || 0),
        recycles: Number(recyclesIn.value || 0),
        extra_units: Number(extraUnitsIn.value || 0),
    };

    const res = await fetch("/api/log", {
        method:"POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    ecoPoints = data.eco_points;
    ownedSeed = data.owned_seed;
    plantStage = data.plant_stage;

    // Update totals
    tRefills.textContent = data.today.refills;
    tRecycles.textContent = data.today.recycles;
    tExtra.textContent = data.today.extra_units;

    updatePointsUI();
    updatePlantUI();

    showToast(`+${data.delta} eco-coins earned!`);

    ringEl.animate(
        [{transform:"scale(1)"},{transform:"scale(1.04)"},{transform:"scale(1)"}],
        {duration: 220}
    );
});

// Buy seed
buySeedBtn.addEventListener("click", async () => {
    const res = await fetch("/api/buy_seed", { method:"POST" });
    const data = await res.json();

    if(!data.ok){
        showToast(data.message);
        return;
    }

    ecoPoints = data.eco_points;
    ownedSeed = data.owned_seed;
    plantStage = data.plant_stage;

    updatePointsUI();
    updatePlantUI();
    showToast(data.message);

    plantImg.animate(
        [{transform:"translateY(0px)"},{transform:"translateY(-6px)"},{transform:"translateY(0px)"}],
        {duration: 260}
    );
});
