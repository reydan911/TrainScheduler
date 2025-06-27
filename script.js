let scheduleData = [];
let originalData = [];
let uploadedDemandData = [];
let algorithmComplexity = {};

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const csvData = e.target.result;
        processCSVData(csvData);
    };
    reader.readAsText(file);
}

function processCSVData(csvData) {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    document.getElementById('loading').style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';

    setTimeout(() => {
        const demandData = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });
            demandData.push(row);
        }

        uploadedDemandData = demandData;
        document.getElementById('loading').style.display = 'none';
        document.getElementById('runtimeText').textContent = '✅ File uploaded successfully. Please choose an algorithm and click "Regenerate Schedule".';
    }, 1000);
}

function regenerateSchedule() {
    if (uploadedDemandData.length === 0) {
        alert("Please upload a demand CSV file first.");
        return;
    }
    generateSchedule(uploadedDemandData);
}

function generateSchedule(demandData) {
    const startTime = performance.now();
    const algorithm = document.getElementById('algorithmSelect').value;

    document.getElementById('loading').style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';

    const demandMap = {};

    demandData.forEach((demand, index) => {
        const passengers = parseInt(demand.passengers || demand.demand || Math.random() * 300 + 50);
        let timeKey;

        if (demand.time) {
            timeKey = demand.time;
        } else {
            const baseHour = 6 + Math.floor(index * 0.5);
            const minutes = (index * 30) % 60;
            timeKey = `${String(baseHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }

        demandMap[timeKey] = (demandMap[timeKey] || 0) + passengers;
    });

    // Calculate complexity parameters
    const n = Object.keys(demandMap).length; // number of time slots
    const m = 30; // max trains
    const p = 5; // total platforms (3 KL + 2 PTPJ)

    setTimeout(() => {
        if (algorithm === 'Greedy') {
            scheduleData = greedyScheduling(demandMap);
            algorithmComplexity = calculateGreedyComplexity(n, m, p);
        } else if (algorithm === 'DP') {
            scheduleData = dpScheduling(demandMap);
            algorithmComplexity = calculateDPComplexity(n, m);
        }

        originalData = [...scheduleData];

        const endTime = performance.now();
        const runtime = (endTime - startTime).toFixed(2);

        document.getElementById('loading').style.display = 'none';
        document.getElementById('runtimeText').textContent = '';
        const statusDiv = document.getElementById('statusMessage');
        statusDiv.textContent = `Schedule generated in ${runtime}ms using ${algorithm} Algorithm`;
        statusDiv.style.display = 'flex';

        updateStats();
        displaySchedule();
        displayComplexityAnalysis(algorithm, n, m, p);
    }, 500);
}

function calculateGreedyComplexity(n, m, p) {
    return {
        sorting: `O(n log n)`,
        scheduling: `O(n × m × p)`,
        overall: `O(n log n + n × m × p)`,
        explanation: `Where n=${n} time slots, m=${m} max trains, p=${p} platforms`,
        details: [
            `1. Sorting demand by priority: O(n log n) = O(${n} × log(${n})) ≈ ${Math.round(n * Math.log2(n))} operations`,
            `2. For each time slot, try to assign trains to platforms: O(n × m × p) = O(${n} × ${m} × ${p}) = ${n * m * p} operations`,
            `3. Total complexity: O(n log n + n × m × p) ≈ ${Math.round(n * Math.log2(n) + n * m * p)} operations`
        ]
    };
}

function calculateDPComplexity(n, m) {
    return {
        sorting: `O(n log n)`,
        dp: `O(n × m)`,
        backtrack: `O(n)`,
        overall: `O(n × m)`,
        explanation: `Where n=${n} time slots, m=${m} max trains`,
        details: [
            `1. Sorting time slots: O(n log n) = O(${n} × log(${n})) ≈ ${Math.round(n * Math.log2(n))} operations`,
            `2. DP table filling: O(n × m) = O(${n} × ${m}) = ${n * m} operations`,
            `3. Backtracking solution: O(n) = ${n} operations`,
            `4. Total complexity: O(n × m) = ${n * m} operations (dominates sorting for large inputs)`
        ]
    };
}

function displayComplexityAnalysis(algorithm, n, m, p) {
    const complexitySection = document.getElementById('complexityAnalysis');
    const complexity = algorithmComplexity;

    complexitySection.innerHTML = `
        <div class="complexity-header">
            <h3>⚡ Time Complexity Analysis - ${algorithm} Algorithm</h3>
        </div>
        <div class="complexity-content">
            <div class="complexity-overview">
                <div class="complexity-card">
                    <div class="complexity-title">Overall Complexity</div>
                    <div class="complexity-formula">${complexity.overall}</div>
                    <div class="complexity-explanation">${complexity.explanation}</div>
                </div>
            </div>

            <div class="complexity-breakdown">
                <h4>Step-by-Step Analysis:</h4>
                <div class="complexity-steps">
                    ${complexity.details.map((detail, index) =>
                        `<div class="complexity-step">
                            <span class="step-number">${index + 1}</span>
                            <span class="step-detail">${detail}</span>
                        </div>`
                    ).join('')}
                </div>
            </div>

            <div class="complexity-comparison">
                <h4>Algorithm Characteristics:</h4>
                <div class="characteristics-grid">
                    ${algorithm === 'Greedy' ? `
                        <div class="char-item">
                            <strong>Approach:</strong> Greedy selection with platform constraints
                        </div>
                        <div class="char-item">
                            <strong>Space Complexity:</strong> O(m + p) for tracking trains and platforms
                        </div>
                        <div class="char-item">
                            <strong>Optimality:</strong> Approximate solution, fast execution
                        </div>
                        <div class="char-item">
                            <strong>Best Case:</strong> When platform conflicts are minimal
                        </div>
                    ` : `
                        <div class="char-item">
                            <strong>Approach:</strong> Dynamic programming with optimal substructure
                        </div>
                        <div class="char-item">
                            <strong>Space Complexity:</strong> O(n × m) for DP table
                        </div>
                        <div class="char-item">
                            <strong>Optimality:</strong> Finds optimal solution within constraints
                        </div>
                        <div class="char-item">
                            <strong>Best Case:</strong> Consistent O(n × m) regardless of input distribution
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;

    complexitySection.style.display = 'block';
}

// --- Greedy Algorithm ---
function greedyScheduling(demandMap) {
    const TRAIN_CAPACITY = 400;
    const MAX_TRAINS = 30;
    const TRIP_DURATION = 90;
    const MIN_INTERVAL = 15;
    const KL_PLATFORMS = 3;
    const PTPJ_PLATFORMS = 2;

    let schedule = [];
    let trainCount = 0;
    let trainId = 1;
    const platformSchedules = {};
    for (let i = 1; i <= KL_PLATFORMS; i++) platformSchedules[`KL${i}`] = [];
    for (let i = 1; i <= PTPJ_PLATFORMS; i++) platformSchedules[`PJ${i}`] = [];

    const sortedDemand = Object.entries(demandMap).sort((a, b) => b[1] - a[1]);

    for (const [timeSlot, demand] of sortedDemand) {
        let remainingDemand = demand;
        let departureTime = parseTime(timeSlot);

        while (remainingDemand > 0 && trainCount < MAX_TRAINS) {
            const passengers = Math.min(remainingDemand, TRAIN_CAPACITY);
            const from = (trainCount % 2 === 0) ? "Putrajaya" : "KL Sentral";
            const to = from === "Putrajaya" ? "KL Sentral" : "Putrajaya";
            const platformPrefix = from === "KL Sentral" ? "KL" : "PJ";
            const platformCount = platformPrefix === "KL" ? KL_PLATFORMS : PTPJ_PLATFORMS;

            let assigned = false;
            for (let p = 1; p <= platformCount && !assigned; p++) {
                const platformKey = `${platformPrefix}${p}`;
                const times = platformSchedules[platformKey];
                const hasConflict = times.some(t => Math.abs(getMinutesDifference(t, departureTime)) < MIN_INTERVAL);

                if (!hasConflict) {
                    const arrival = addMinutes(departureTime, TRIP_DURATION);
                    schedule.push({
                        trainId: `G${String(trainId++).padStart(3, '0')}`,
                        route: `${from} → ${to}`,
                        departure: formatTime(departureTime),
                        arrival: formatTime(arrival),
                        platform: `Platform ${p}`,
                        passengers: passengers
                    });
                    times.push(departureTime);
                    remainingDemand -= passengers;
                    trainCount++;
                    assigned = true;
                }
            }

            if (!assigned) departureTime = addMinutes(departureTime, MIN_INTERVAL);
        }
    }

    return schedule.sort((a, b) => a.departure.localeCompare(b.departure));
}

// --- DP Algorithm ---
function dpScheduling(demandMap) {
    const TRAIN_CAPACITY = 400;
    const MAX_TRAINS = 30;
    const TRIP_DURATION = 90;
    const MIN_INTERVAL = 15;

    let schedule = [];
    let trainId = 1;

    const timeSlots = Object.entries(demandMap).map(([time, demand]) => ({
        time: parseTime(time),
        demand,
        timeStr: time
    })).sort((a, b) => (a.time.hours * 60 + a.time.minutes) - (b.time.hours * 60 + b.time.minutes));

    const n = timeSlots.length;
    const dp = Array(n + 1).fill().map(() => Array(MAX_TRAINS + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        const demand = timeSlots[i - 1].demand;
        const trainsNeeded = Math.ceil(demand / TRAIN_CAPACITY);

        for (let j = 1; j <= MAX_TRAINS; j++) {
            if (j >= trainsNeeded)
                dp[i][j] = Math.max(dp[i - 1][j], dp[i - 1][j - trainsNeeded] + demand);
            else
                dp[i][j] = dp[i - 1][j];
        }
    }

    let trainsLeft = MAX_TRAINS;
    for (let i = n; i >= 1; i--) {
        if (dp[i][trainsLeft] !== dp[i - 1][trainsLeft]) {
            const slot = timeSlots[i - 1];
            let departureTime = slot.time;
            let demand = slot.demand;

            while (demand > 0 && trainsLeft > 0) {
                const passengers = Math.min(TRAIN_CAPACITY, demand);
                const from = (trainId % 2 === 0) ? "Putrajaya" : "KL Sentral";
                const to = from === "Putrajaya" ? "KL Sentral" : "Putrajaya";
                const platform = ((trainId - 1) % 3) + 1;

                schedule.push({
                    trainId: `DP${String(trainId++).padStart(3, '0')}`,
                    route: `${from} → ${to}`,
                    departure: formatTime(departureTime),
                    arrival: formatTime(addMinutes(departureTime, TRIP_DURATION)),
                    platform: `Platform ${platform}`,
                    passengers
                });

                demand -= passengers;
                trainsLeft--;
                departureTime = addMinutes(departureTime, MIN_INTERVAL);
            }
        }
    }

    return schedule.sort((a, b) => a.departure.localeCompare(b.departure));
}

// --- Utilities ---
function parseTime(str) {
    const [h, m] = str.split(':').map(Number);
    return { hours: h, minutes: m };
}

function formatTime(t) {
    return `${String(t.hours).padStart(2, '0')}:${String(t.minutes).padStart(2, '0')}`;
}

function addMinutes(t, mins) {
    const total = t.hours * 60 + t.minutes + mins;
    return { hours: Math.floor(total / 60) % 24, minutes: total % 60 };
}

function getMinutesDifference(a, b) {
    const m1 = a.hours * 60 + a.minutes;
    const m2 = b.hours * 60 + b.minutes;
    return Math.abs(m1 - m2);
}

function updateStats() {
    const totalTrains = scheduleData.length;
    const totalPassengers = scheduleData.reduce((sum, t) => sum + t.passengers, 0);
    const avgOccupancy = totalPassengers > 0 ? Math.round((totalPassengers / (totalTrains * 400)) * 100) : 0;
    const platformUtil = Math.min(Math.round(totalTrains / 4 * 100), 100);

    document.getElementById('totalTrains').textContent = totalTrains;
    document.getElementById('totalPassengers').textContent = totalPassengers.toLocaleString();
    document.getElementById('avgOccupancy').textContent = `${avgOccupancy}%`;
    document.getElementById('platformUtil').textContent = `${platformUtil}%`;
    document.getElementById('statsGrid').style.display = 'grid';
}

function displaySchedule() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    scheduleData.forEach(train => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${train.trainId}</td>
            <td>${train.route}</td>
            <td>${train.departure}</td>
            <td>${train.arrival}</td>
            <td>${train.platform}</td>
            <td>${train.passengers}</td>
        `;
        tableBody.appendChild(row);
    });

    document.getElementById('tableContainer').style.display = 'block';
}

function filterTable() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const route = document.getElementById('routeFilter').value;

    scheduleData = originalData.filter(train =>
        (train.trainId.toLowerCase().includes(search) || train.route.toLowerCase().includes(search) || train.platform.toLowerCase().includes(search)) &&
        (!route || train.route === route)
    );

    displaySchedule();
    updateStats();
}