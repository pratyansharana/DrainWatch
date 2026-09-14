document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const rainSlider = document.getElementById('rain-slider');
    const rainVal = document.getElementById('rain-val');
    const presetBtns = document.querySelectorAll('.btn-preset');
    const reportInput = document.getElementById('citizen-report-input');
    const btnSubmitReport = document.getElementById('btn-submit-report');
    const sampleReportBtns = document.querySelectorAll('.btn-report-sample');
    const genaiBox = document.getElementById('genai-output-box');
    const genaiPayload = document.getElementById('genai-payload');

    const statMaxDepth = document.getElementById('stat-max-depth');
    const statMeanDepth = document.getElementById('stat-mean-depth');

    const rlRoutePath = document.getElementById('rl-route-path');
    const rlTime = document.getElementById('rl-time');
    const rlDepth = document.getElementById('rl-depth');
    
    const naiveRoutePath = document.getElementById('naive-route-path');
    const naiveTime = document.getElementById('naive-time');
    const naiveDepth = document.getElementById('naive-depth');
    const rlReasonText = document.getElementById('rl-reason-text');

    const landmarksList = document.getElementById('landmarks-list');
    const canvas = document.getElementById('flood-canvas');
    const ctx = canvas.getContext('2d');

    // Canvas Setup
    let canvasWidth = canvas.clientWidth || 800;
    let canvasHeight = canvas.clientHeight || 500;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Landmark Map Coordinates (Canvas X, Y)
    const landmarkMapCoords = {
        "Mandi House": { x: canvasWidth * 0.85, y: canvasHeight * 0.75 },
        "Barakhamba Rd Metro": { x: canvasWidth * 0.60, y: canvasHeight * 0.50 },
        "KG Marg Junction": { x: canvasWidth * 0.50, y: canvasHeight * 0.75 },
        "Tolstoy Marg Junction": { x: canvasWidth * 0.35, y: canvasHeight * 0.65 },
        "Janpath Junction": { x: canvasWidth * 0.25, y: canvasHeight * 0.55 },
        "Rajiv Chowk Outer Circle": { x: canvasWidth * 0.25, y: canvasHeight * 0.25 },
        "Connaught Place Inner Circle": { x: canvasWidth * 0.22, y: canvasHeight * 0.32 }
    };

    let currentFloodData = null;
    let currentRouteData = null;

    // Initialize Data Fetching
    updateDashboard(60);

    // Event Listeners for Rainfall Slider
    rainSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        rainVal.textContent = `${val} mm/hr`;
        updatePresetActiveState(val);
        updateDashboard(val);
    });

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.dataset.rain;
            rainSlider.value = val;
            rainVal.textContent = `${val} mm/hr`;
            updatePresetActiveState(val);
            updateDashboard(val);
        });
    });

    sampleReportBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            reportInput.value = btn.dataset.report;
        });
    });

    btnSubmitReport.addEventListener('click', async () => {
        const text = reportInput.value.trim();
        if (!text) return;

        btnSubmitReport.disabled = true;
        btnSubmitReport.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Extracting...`;

        try {
            const resp = await fetch('/api/v1/process-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ report_text: text })
            });
            const data = await resp.json();

            // Render GenAI Output
            genaiBox.classList.remove('hidden');
            genaiPayload.textContent = JSON.stringify(data.extracted_event, null, 2);

            // Update UI with new predictions and rerouting
            renderLandmarkList(data.updated_predictions);
            renderRouteComparison(data.new_safe_route);

            currentRouteData = data.new_safe_route;
            drawMapCanvas();
        } catch (err) {
            console.error("GenAI Report error:", err);
        } finally {
            btnSubmitReport.disabled = false;
            btnSubmitReport.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Process Report`;
        }
    });

    function updatePresetActiveState(val) {
        presetBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.rain === val.toString());
        });
    }

    async function updateDashboard(rainfall) {
        try {
            // 1. Fetch Flood Predictions
            const floodResp = await fetch('/api/v1/predict-flood', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rainfall_mm_hr: parseFloat(rainfall), duration_min: 15.0 })
            });
            currentFloodData = await floodResp.json();

            // 2. Fetch RL Safe Route
            const routeResp = await fetch('/api/v1/safe-route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ origin: "Mandi House", destination: "Rajiv Chowk Outer Circle" })
            });
            currentRouteData = await routeResp.json();

            // 3. Render UI Components
            renderStats(currentFloodData);
            renderLandmarkList(currentFloodData.landmarks);
            renderRouteComparison(currentRouteData);
            drawMapCanvas();

        } catch (err) {
            console.error("API error:", err);
        }
    }

    function renderStats(data) {
        statMaxDepth.textContent = `${data.max_surface_depth_cm} cm`;
        statMeanDepth.textContent = `${data.mean_surface_depth_cm} cm`;

        if (data.max_surface_depth_cm > 30) {
            statMaxDepth.className = 'stat-value text-danger';
        } else if (data.max_surface_depth_cm > 15) {
            statMaxDepth.className = 'stat-value text-warning';
        } else {
            statMaxDepth.className = 'stat-value text-success';
        }
    }

    function renderLandmarkList(landmarks) {
        landmarksList.innerHTML = '';
        landmarks.forEach(lm => {
            const item = document.createElement('div');
            item.className = 'lm-item';
            item.innerHTML = `
                <div>
                    <div class="lm-name">${lm.landmark}</div>
                    <div style="font-size:0.7rem; color:#9ca3af;">Depth: ${lm.predicted_depth_cm} cm | TTF: ${lm.time_to_flood_min}m</div>
                </div>
                <span class="lm-badge ${lm.risk_level}">${lm.risk_level}</span>
            `;
            landmarksList.appendChild(item);
        });
    }

    function renderRouteComparison(routeData) {
        rlRoutePath.textContent = routeData.rl_safe_route.join(' ➔ ');
        rlTime.textContent = `${routeData.rl_travel_time_min} min`;
        rlDepth.textContent = `${routeData.rl_max_flood_depth_cm} cm`;

        naiveRoutePath.textContent = routeData.naive_route.join(' ➔ ');
        naiveTime.textContent = `${routeData.naive_travel_time_min} min`;
        naiveDepth.textContent = `${routeData.naive_max_flood_depth_cm} cm`;

        rlReasonText.textContent = routeData.recommendation_reason;
    }

    // Canvas Drawing Function
    function drawMapCanvas() {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Draw Dark Map Grid Background
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 1;
        const gridStep = 40;
        for (let x = 0; x < canvasWidth; x += gridStep) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasHeight);
            ctx.stroke();
        }
        for (let y = 0; y < canvasHeight; y += gridStep) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvasWidth, y);
            ctx.stroke();
        }

        // Draw Road Network Connections
        const edges = [
            ["Mandi House", "Barakhamba Rd Metro"],
            ["Mandi House", "KG Marg Junction"],
            ["Barakhamba Rd Metro", "Rajiv Chowk Outer Circle"],
            ["KG Marg Junction", "Tolstoy Marg Junction"],
            ["Tolstoy Marg Junction", "Janpath Junction"],
            ["Janpath Junction", "Rajiv Chowk Outer Circle"],
            ["Barakhamba Rd Metro", "Tolstoy Marg Junction"],
            ["Rajiv Chowk Outer Circle", "Connaught Place Inner Circle"]
        ];

        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 4;
        edges.forEach(([u, v]) => {
            const p1 = landmarkMapCoords[u];
            const p2 = landmarkMapCoords[v];
            if (p1 && p2) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        });

        if (!currentRouteData) return;

        // Draw Naive Shortest Path (Red dotted line)
        const naivePath = currentRouteData.naive_route;
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        for (let i = 0; i < naivePath.length - 1; i++) {
            const p1 = landmarkMapCoords[naivePath[i]];
            const p2 = landmarkMapCoords[naivePath[i+1]];
            if (p1 && p2) {
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            }
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw RL Safe Route (Cyan Glowing Line)
        const rlPath = currentRouteData.rl_safe_route;
        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 6;
        ctx.shadowColor = "#06b6d4";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        for (let i = 0; i < rlPath.length - 1; i++) {
            const p1 = landmarkMapCoords[rlPath[i]];
            const p2 = landmarkMapCoords[rlPath[i+1]];
            if (p1 && p2) {
                if (i === 0) ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            }
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow

        // Draw Landmark Nodes & Risk Halo
        const depthMap = {};
        if (currentFloodData && currentFloodData.landmarks) {
            currentFloodData.landmarks.forEach(lm => { depthMap[lm.landmark] = lm.predicted_depth_cm; });
        }

        Object.entries(landmarkMapCoords).forEach(([name, coords]) => {
            const depth = depthMap[name] || 0;

            // Halo color by flood depth
            let haloColor = "rgba(16, 185, 129, 0.4)";
            let nodeColor = "#10b981";
            if (depth > 30) {
                haloColor = "rgba(220, 38, 38, 0.6)";
                nodeColor = "#dc2626";
            } else if (depth > 15) {
                haloColor = "rgba(239, 68, 68, 0.5)";
                nodeColor = "#ef4444";
            } else if (depth > 5) {
                haloColor = "rgba(245, 158, 11, 0.4)";
                nodeColor = "#f59e0b";
            }

            // Outer Pulse Halo
            ctx.fillStyle = haloColor;
            ctx.beginPath();
            ctx.arc(coords.x, coords.y, 14, 0, Math.PI * 2);
            ctx.fill();

            // Inner Core Circle
            ctx.fillStyle = nodeColor;
            ctx.beginPath();
            ctx.arc(coords.x, coords.y, 7, 0, Math.PI * 2);
            ctx.fill();

            // Landmark Text Label
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 11px Inter";
            ctx.fillText(name, coords.x + 12, coords.y - 4);
            ctx.fillStyle = "#9ca3af";
            ctx.font = "10px Inter";
            ctx.fillText(`${depth.toFixed(1)} cm`, coords.x + 12, coords.y + 9);
        });
    }

    window.addEventListener('resize', () => {
        canvasWidth = canvas.clientWidth || 800;
        canvasHeight = canvas.clientHeight || 500;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        drawMapCanvas();
    });
});
