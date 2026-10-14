// ============================================================
// Module 3: Claims Reserving & Actuarial Risk Engine
// Intellia Health Systems — Financial Planning & Reserving
// Chain Ladder / Mack Reserving Framework
// ============================================================

const ReservesModule = (function () {
  let activeScenario = 'base'; // 'base', 'adverse', 'favorable'
  let triangleData = [];
  let years = [];
  let periods = [];
  let devFactors = [];
  let cumulativeDevFactors = [];
  let projectedTriangle = [];
  let resultsPerYear = [];

  function init() {
    years = [...SAMPLE_DATA.claims.accidentYears];
    periods = [...SAMPLE_DATA.claims.developmentPeriods];
    resetTriangle();
    setupEventListeners();
    calculateAndRender();
  }

  function resetTriangle() {
    triangleData = JSON.parse(JSON.stringify(SAMPLE_DATA.claims.triangle));
  }

  function setupEventListeners() {
    document.querySelectorAll('.scenario-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.scenario-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        activeScenario = e.target.dataset.scenario;
        updateScenarioDescription();
        calculateAndRender();
      });
    });

    const resetBtn = document.getElementById('resetTriangleBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        resetTriangle();
        calculateAndRender();
      });
    }
  }

  function updateScenarioDescription() {
    const sc = SAMPLE_DATA.claims.scenarios[activeScenario];
    const descEl = document.getElementById('scenarioDescription');
    if (descEl && sc) {
      descEl.textContent = `${sc.label}: ${sc.description}`;
    }
  }

  function calculateChainLadder() {
    const n = triangleData.length;
    devFactors = [];
    const scenario = SAMPLE_DATA.claims.scenarios[activeScenario];

    // Volume-Weighted Link Ratios (Development Factors)
    for (let j = 0; j < n - 1; j++) {
      let sumNumerator = 0;
      let sumDenominator = 0;

      for (let i = 0; i < n - j - 1; i++) {
        const current = triangleData[i][j];
        const next = triangleData[i][j + 1];
        if (current !== null && next !== null) {
          sumDenominator += current;
          sumNumerator += next;
        }
      }

      let factor = sumDenominator > 0 ? (sumNumerator / sumDenominator) : 1.0;
      factor = 1.0 + (factor - 1.0) * scenario.devSpeedAdj;
      devFactors.push(factor);
    }

    // Cumulative Development Factors to Ultimate
    cumulativeDevFactors = new Array(n).fill(1.0);
    for (let k = n - 2; k >= 0; k--) {
      cumulativeDevFactors[k] = cumulativeDevFactors[k + 1] * devFactors[k];
    }

    // Complete Lower Triangle and Project Ultimates
    projectedTriangle = JSON.parse(JSON.stringify(triangleData));
    resultsPerYear = [];

    for (let i = 0; i < n; i++) {
      const latestKnownCol = n - 1 - i;
      const latestKnownVal = triangleData[i][latestKnownCol];

      let runningVal = latestKnownVal;
      for (let j = latestKnownCol + 1; j < n; j++) {
        runningVal = runningVal * devFactors[j - 1];
        projectedTriangle[i][j] = Math.round(runningVal);
      }

      const rawUltimate = projectedTriangle[i][n - 1];
      const ultimate = Math.round(rawUltimate * (1 + (scenario.lossRatioAdj - 1.0) * ((i + 1) / n)));
      const latest = latestKnownVal;
      const ibnr = Math.max(0, ultimate - latest);

      resultsPerYear.push({
        year: years[i],
        latest: latest,
        devFactor: cumulativeDevFactors[latestKnownCol],
        ultimate: ultimate,
        ibnr: ibnr
      });
    }
  }

  function calculateAndRender() {
    calculateChainLadder();
    renderTriangleTable();
    renderResultsTable();
    updateMetricsAndGauge();
    renderSensitivityTable();
  }

  function renderTriangleTable() {
    const tableEl = document.getElementById('triangleTable');
    if (!tableEl) return;

    const n = triangleData.length;
    let html = `
      <thead>
        <tr>
          <th>Accident Year</th>
          ${periods.map(p => `<th class="num-col">${p}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
    `;

    for (let i = 0; i < n; i++) {
      html += `<tr><td><strong>AY ${years[i]}</strong></td>`;
      for (let j = 0; j < n; j++) {
        const isObserved = j <= (n - 1 - i);
        if (isObserved) {
          const val = triangleData[i][j];
          html += `
            <td class="num-col">
              <input type="number" 
                     value="${val}" 
                     step="5" 
                     onchange="ReservesModule.updateCell(${i}, ${j}, this.value)" />
            </td>
          `;
        } else {
          const projectedVal = projectedTriangle[i][j];
          html += `
            <td class="num-col" style="color: var(--accent-terracotta); font-family: var(--font-mono); font-size: 0.85rem;" title="Projected by Chain Ladder">
              ₨ ${projectedVal}L *
            </td>
          `;
        }
      }
      html += `</tr>`;
    }

    // Link ratios summary row
    html += `
      <tr class="total-row">
        <td>Selected Link Ratio (f<sub>k</sub>)</td>
        ${devFactors.map(f => `<td class="num-col" style="font-family: var(--font-mono);">${f.toFixed(3)}</td>`).join('')}
        <td class="num-col" style="font-family: var(--font-mono); color: var(--text-muted);">1.000</td>
      </tr>
      <tr style="background: var(--bg-card-subtle); font-weight: 600;">
        <td>CDF to Ultimate (CDF<sub>k</sub>)</td>
        ${cumulativeDevFactors.map(cdf => `<td class="num-col" style="font-family: var(--font-mono); color: var(--accent-navy);">${cdf.toFixed(3)}</td>`).join('')}
      </tr>
    </tbody>`;

    tableEl.innerHTML = html;
  }

  function updateCell(row, col, value) {
    const num = parseFloat(value) || 0;
    triangleData[row][col] = num;
    calculateAndRender();
  }

  function renderResultsTable() {
    const tbody = document.getElementById('reservesResultsBody');
    if (!tbody) return;

    let html = '';
    let totalLatest = 0;
    let totalUltimate = 0;
    let totalIbnr = 0;

    resultsPerYear.forEach(row => {
      totalLatest += row.latest;
      totalUltimate += row.ultimate;
      totalIbnr += row.ibnr;

      html += `
        <tr>
          <td><strong>AY ${row.year}</strong></td>
          <td class="num-col" style="font-family: var(--font-mono);">₨ ${row.latest} L</td>
          <td class="num-col" style="font-family: var(--font-mono);">${row.devFactor.toFixed(3)}x</td>
          <td class="num-col" style="font-family: var(--font-mono); font-weight: 600;">₨ ${row.ultimate} L</td>
          <td class="num-col" style="font-family: var(--font-mono); color: var(--accent-terracotta); font-weight: 600;">₨ ${row.ibnr} L</td>
          <td class="num-col">${((row.ibnr / (row.ultimate || 1)) * 100).toFixed(0)}%</td>
        </tr>
      `;
    });

    html += `
      <tr class="total-row">
        <td>Total Indicated Reserves</td>
        <td class="num-col" style="font-family: var(--font-mono);">₨ ${totalLatest} L</td>
        <td class="num-col">—</td>
        <td class="num-col" style="font-family: var(--font-mono);">₨ ${totalUltimate} L</td>
        <td class="num-col" style="font-family: var(--font-mono); color: var(--accent-terracotta); font-weight: 700;">₨ ${totalIbnr} L</td>
        <td class="num-col">${((totalIbnr / totalUltimate) * 100).toFixed(0)}%</td>
      </tr>
    `;

    tbody.innerHTML = html;
  }

  function updateMetricsAndGauge() {
    const totalIbnr = resultsPerYear.reduce((acc, r) => acc + r.ibnr, 0);
    const bookedReserve = 425; // PKR Lakhs booked on balance sheet
    const adequacyRatio = (bookedReserve / (totalIbnr || 1)) * 100;

    const elTotalIbnr = document.getElementById('metricTotalIbnr');
    const elAdequacy = document.getElementById('metricReserveAdequacy');
    const elStatus = document.getElementById('reserveStatusBadge');
    const elGaugeVal = document.getElementById('gaugeValueText');
    const needle = document.getElementById('gaugeNeedle');

    if (elTotalIbnr) {
      elTotalIbnr.textContent = `₨ ${(totalIbnr / 100).toFixed(2)} Cr`;
    }

    if (elAdequacy) {
      elAdequacy.textContent = `${adequacyRatio.toFixed(0)}%`;
      elAdequacy.style.color = adequacyRatio >= 105 ? '#2E7D32' : adequacyRatio >= 95 ? '#D19C45' : '#C25E2E';
    }

    if (elGaugeVal) {
      elGaugeVal.textContent = `${adequacyRatio.toFixed(0)}%`;
    }

    if (elStatus) {
      if (adequacyRatio >= 105) {
        elStatus.textContent = 'Adequate (Solvent)';
        elStatus.style.color = '#2E7D32';
      } else if (adequacyRatio >= 95) {
        elStatus.textContent = 'Watchlist';
        elStatus.style.color = '#D19C45';
      } else {
        elStatus.textContent = 'Deficient (Under-reserved)';
        elStatus.style.color = '#C25E2E';
      }
    }

    if (needle) {
      const clamped = Math.min(150, Math.max(50, adequacyRatio));
      const deg = -75 + ((clamped - 50) / 100) * 150;
      needle.setAttribute('transform', `rotate(${deg} 90 90)`);
    }
  }

  function renderSensitivityTable() {
    const container = document.getElementById('reservesSensitivityBody');
    if (!container) return;

    const lossShocks = [-0.10, -0.05, 0.00, 0.05, 0.10, 0.15];
    const tailShocks = [-0.05, 0.00, 0.05];
    const baseIbnr = resultsPerYear.reduce((acc, r) => acc + r.ibnr, 0);

    let html = '';
    lossShocks.forEach(ls => {
      const isBaseRow = ls === 0;
      html += `<tr><td><strong>${ls >= 0 ? '+' : ''}${(ls * 100).toFixed(0)}%</strong></td>`;
      tailShocks.forEach(ts => {
        const isBaseCell = isBaseRow && ts === 0;
        const shockedIbnr = Math.round(baseIbnr * (1 + ls * 1.2) * (1 + ts * 1.5));
        const style = isBaseCell ? 'font-weight: 700; background: var(--bg-chip-highlight);' : '';
        html += `<td class="num-col" style="font-family: var(--font-mono); ${style}">₨ ${(shockedIbnr / 100).toFixed(2)} Cr</td>`;
      });
      html += `</tr>`;
    });

    container.innerHTML = html;
  }

  return {
    init,
    updateCell,
    calculateAndRender
  };
})();
