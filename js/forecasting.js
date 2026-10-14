// ============================================================
// Module 1: Revenue Forecasting Engine
// Intellia Health Systems — Financial Planning & Reserving
// ============================================================

const ForecastingModule = (function () {
  let chartInstance = null;
  let currentMethod = 'exp'; // 'exp', 'trend', 'ma'
  let currentStream = 'total'; // 'total', 'inpatient', 'outpatient', 'diagnostics'
  let alphaParam = 0.45;
  let forecastMonths = 6;

  function init() {
    setupEventListeners();
    render();
  }

  function setupEventListeners() {
    // Method selector chips
    document.querySelectorAll('.forecast-method-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.forecast-method-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentMethod = e.target.dataset.method;
        
        const methodChip = document.getElementById('activeMethodChip');
        if (methodChip) {
          if (currentMethod === 'exp') methodChip.textContent = `Exponential Smoothing (α=${alphaParam.toFixed(2)})`;
          else if (currentMethod === 'trend') methodChip.textContent = 'Ordinary Least Squares Trend';
          else methodChip.textContent = '3-Month Moving Average';
        }
        render();
      });
    });

    // Stream selector
    const streamSelect = document.getElementById('forecastStreamSelect');
    if (streamSelect) {
      streamSelect.addEventListener('change', (e) => {
        currentStream = e.target.value;
        render();
      });
    }
  }

  function getActiveHistoricalSeries() {
    const rev = SAMPLE_DATA.revenue;
    if (currentStream === 'inpatient') return [...rev.inpatient];
    if (currentStream === 'outpatient') return [...rev.outpatient];
    if (currentStream === 'diagnostics') return [...rev.diagnostics];

    return rev.inpatient.map((val, idx) => val + rev.outpatient[idx] + rev.diagnostics[idx]);
  }

  function calculateLinearTrend(data, horizon) {
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i];
      sumXY += i * data[i];
      sumX2 += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const forecast = [];
    for (let h = 0; h < horizon; h++) {
      const x = n + h;
      forecast.push(slope * x + intercept);
    }
    return { forecast, slope, intercept };
  }

  function calculateExpSmoothing(data, alpha, horizon) {
    let s = data[0];
    const smoothed = [s];
    for (let i = 1; i < data.length; i++) {
      s = alpha * data[i] + (1 - alpha) * s;
      smoothed.push(s);
    }
    const n = smoothed.length;
    const localSlope = (smoothed[n - 1] - smoothed[n - 4]) / 3;

    const forecast = [];
    for (let h = 1; h <= horizon; h++) {
      forecast.push(smoothed[n - 1] + localSlope * h);
    }
    return { forecast, lastLevel: smoothed[n - 1] };
  }

  function calculateMovingAverage(data, windowSize, horizon) {
    const n = data.length;
    const recent = data.slice(n - windowSize);
    const avg = recent.reduce((a, b) => a + b, 0) / windowSize;
    const momentum = (data[n - 1] - data[n - windowSize]) / windowSize;

    const forecast = [];
    for (let h = 1; h <= horizon; h++) {
      forecast.push(avg + momentum * 0.4 * h);
    }
    return { forecast };
  }

  function calculateResidualStdDev(actuals, fitted) {
    let sumSq = 0;
    const n = Math.min(actuals.length, fitted.length);
    for (let i = 0; i < n; i++) {
      const err = actuals[i] - fitted[i];
      sumSq += err * err;
    }
    return Math.sqrt(sumSq / (n - 2 || 1));
  }

  function calculateMAPE(actuals, fitted) {
    let sumAbsPct = 0;
    const n = Math.min(actuals.length, fitted.length);
    for (let i = 0; i < n; i++) {
      if (actuals[i] !== 0) {
        sumAbsPct += Math.abs((actuals[i] - fitted[i]) / actuals[i]);
      }
    }
    return (sumAbsPct / n) * 100;
  }

  function generateForecastLabels(horizon) {
    const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    let startMonth = 0; // Jul
    let startYear = 25;
    const labels = [];
    for (let i = 0; i < horizon; i++) {
      const mIdx = (startMonth + i) % 12;
      const yOffset = Math.floor((startMonth + i) / 12);
      const yr = startYear + yOffset;
      labels.push(`${months[mIdx]}-${yr}`);
    }
    return labels;
  }

  function render() {
    const historical = getActiveHistoricalSeries();
    const histLabels = SAMPLE_DATA.revenue.labels;
    const n = historical.length;

    const inSampleFitted = [];
    if (currentMethod === 'trend') {
      const { slope, intercept } = calculateLinearTrend(historical, 0);
      for (let i = 0; i < n; i++) inSampleFitted.push(slope * i + intercept);
    } else if (currentMethod === 'exp') {
      let s = historical[0];
      inSampleFitted.push(s);
      for (let i = 1; i < n; i++) {
        s = alphaParam * historical[i] + (1 - alphaParam) * s;
        inSampleFitted.push(s);
      }
    } else {
      for (let i = 0; i < n; i++) {
        if (i < 3) inSampleFitted.push(historical[i]);
        else inSampleFitted.push((historical[i-1] + historical[i-2] + historical[i-3]) / 3);
      }
    }

    let rawForecast = [];
    if (currentMethod === 'trend') {
      rawForecast = calculateLinearTrend(historical, forecastMonths).forecast;
    } else if (currentMethod === 'exp') {
      rawForecast = calculateExpSmoothing(historical, alphaParam, forecastMonths).forecast;
    } else {
      rawForecast = calculateMovingAverage(historical, 3, forecastMonths).forecast;
    }

    // Seasonality adjustment
    const seasonalFactors = SAMPLE_DATA.revenue.seasonalFactors;
    const adjustedForecast = rawForecast.map((val, idx) => {
      const seasonFactor = seasonalFactors[idx % 12];
      return val * seasonFactor;
    });

    const sigma = calculateResidualStdDev(historical, inSampleFitted);
    const mape = calculateMAPE(historical, inSampleFitted);

    const upper1 = [];
    const lower1 = [];
    const upper2 = [];
    const lower2 = [];
    adjustedForecast.forEach((pt, h) => {
      const uncertainty = sigma * Math.sqrt(h + 1);
      upper1.push(Math.round(pt + uncertainty));
      lower1.push(Math.max(0, Math.round(pt - uncertainty)));
      upper2.push(Math.round(pt + 1.96 * uncertainty));
      lower2.push(Math.max(0, Math.round(pt - 1.96 * uncertainty)));
    });

    const forecastLabels = generateForecastLabels(forecastMonths);

    updateMetrics(historical, adjustedForecast, mape);
    renderChart(histLabels, historical, forecastLabels, adjustedForecast, upper1, lower1, upper2, lower2);
    populateForecastTable(forecastLabels, adjustedForecast, upper2, lower2);
  }

  function updateMetrics(historical, forecast, mape) {
    const last12Hist = historical.slice(-12).reduce((a, b) => a + b, 0);
    const annualizedForecast = (forecast.reduce((a, b) => a + b, 0) / forecast.length) * 12;
    const yoyGrowth = ((annualizedForecast - last12Hist) / last12Hist) * 100;

    const elProjected = document.getElementById('metricProjectedRevenue');
    const elGrowth = document.getElementById('metricYoYGrowth');
    const elMape = document.getElementById('metricMape');

    if (elProjected) {
      elProjected.textContent = `₨ ${(annualizedForecast / 100).toFixed(2)} Cr`;
    }
    if (elGrowth) {
      elGrowth.textContent = `${yoyGrowth >= 0 ? '+' : ''}${yoyGrowth.toFixed(1)}%`;
      elGrowth.style.color = yoyGrowth >= 0 ? '#2E7D32' : '#C25E2E';
    }
    if (elMape) {
      elMape.textContent = `${mape.toFixed(1)}%`;
    }
  }

  function renderChart(histLabels, histData, foreLabels, foreData, up1, low1, up2, low2) {
    const ctx = document.getElementById('forecastChart');
    if (!ctx) return;

    if (chartInstance) {
      chartInstance.destroy();
    }

    const allLabels = [...histLabels, ...foreLabels];
    const historySeries = [...histData, ...Array(foreLabels.length).fill(null)];
    const forecastSeries = [...Array(histLabels.length - 1).fill(null), histData[histData.length - 1], ...foreData];
    const up2Series = [...Array(histLabels.length - 1).fill(null), histData[histData.length - 1], ...up2];
    const low2Series = [...Array(histLabels.length - 1).fill(null), histData[histData.length - 1], ...low2];

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [
          {
            label: 'Historical Actuals (₨ Lakhs)',
            data: historySeries,
            borderColor: '#141413',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 4,
            pointBackgroundColor: '#141413',
            tension: 0.15,
            fill: false
          },
          {
            label: 'Model Projection',
            data: forecastSeries,
            borderColor: '#C25E2E',
            borderWidth: 2,
            borderDash: [4, 4],
            pointRadius: 3,
            pointBackgroundColor: '#C25E2E',
            tension: 0.15,
            fill: false
          },
          {
            label: 'Upper 95% Band',
            data: up2Series,
            borderColor: 'transparent',
            backgroundColor: 'rgba(194, 94, 46, 0.08)',
            pointRadius: 0,
            fill: '+1',
            tension: 0.15
          },
          {
            label: 'Lower 95% Band',
            data: low2Series,
            borderColor: 'transparent',
            backgroundColor: 'transparent',
            pointRadius: 0,
            fill: false,
            tension: 0.15
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#56554F',
              font: { family: 'Plus Jakarta Sans', size: 12 },
              filter: (item) => !item.text.includes('Band') || item.text.includes('Upper')
            }
          },
          tooltip: {
            backgroundColor: '#FFFFFF',
            titleColor: '#141413',
            bodyColor: '#56554F',
            borderColor: '#ECE7DE',
            borderWidth: 1,
            padding: 10,
            boxPadding: 4,
            callbacks: {
              label: function (ctx) {
                if (ctx.raw === null || ctx.raw === undefined) return null;
                return ` ${ctx.dataset.label}: ₨ ${Math.round(ctx.raw)} Lakhs`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: '#F2EFEB' },
            ticks: {
              color: '#87857E',
              font: { family: 'Plus Jakarta Sans', size: 11 },
              maxRotation: 45
            }
          },
          y: {
            grid: { color: '#F2EFEB' },
            ticks: {
              color: '#87857E',
              font: { family: 'JetBrains Mono', size: 11 },
              callback: (val) => `₨ ${val}L`
            }
          }
        }
      }
    });
  }

  function populateForecastTable(labels, forecast, up, low) {
    const tbody = document.getElementById('forecastTableBody');
    if (!tbody) return;

    let html = '';
    let totalProj = 0;

    labels.forEach((lbl, i) => {
      const val = Math.round(forecast[i]);
      totalProj += val;
      const u = up[i];
      const l = low[i];
      const weight = (SAMPLE_DATA.revenue.seasonalFactors[i % 12] * 100).toFixed(0);

      html += `
        <tr>
          <td><strong>${lbl}</strong></td>
          <td class="num-col" style="font-family: var(--font-mono);">₨ ${val.toLocaleString()} L</td>
          <td class="num-col" style="font-family: var(--font-mono); color: var(--text-muted);">₨ ${l}L &ndash; ₨ ${u}L</td>
          <td class="num-col">${weight}%</td>
          <td><span style="font-size: 0.8rem; color: var(--accent-terracotta); font-weight: 500;">Projected</span></td>
        </tr>
      `;
    });

    // Total row
    html += `
      <tr class="total-row">
        <td>Total (6-Month Horizon)</td>
        <td class="num-col" style="font-family: var(--font-mono);">₨ ${totalProj.toLocaleString()} L</td>
        <td class="num-col">—</td>
        <td class="num-col">100%</td>
        <td></td>
      </tr>
    `;

    tbody.innerHTML = html;
  }

  return { init, render };
})();
