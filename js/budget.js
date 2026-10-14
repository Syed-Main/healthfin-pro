// ============================================================
// Module 2: Operating Budget & Variance Analyzer
// Intellia Health Systems — Financial Planning & Reserving
// ============================================================

const BudgetModule = (function () {
  let categoriesData = [];
  let waterfallChart = null;
  let drilldownChart = null;
  let selectedCategory = null;

  function init() {
    resetData();
    setupEventListeners();
    render();
  }

  function resetData() {
    categoriesData = JSON.parse(JSON.stringify(SAMPLE_DATA.budget.categories));
    selectedCategory = categoriesData[0].name;
  }

  function setupEventListeners() {
    const resetBtn = document.getElementById('resetBudgetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        resetData();
        render();
      });
    }

    const exportBtn = document.getElementById('exportBudgetCsvBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportToCsv);
    }
  }

  function render() {
    renderTable();
    updateBudgetMetrics();
    renderWaterfallChart();
    if (selectedCategory) {
      renderDrilldown(selectedCategory);
    }
  }

  function renderTable() {
    const tbody = document.getElementById('budgetTableBody');
    if (!tbody) return;

    let html = '';
    categoriesData.forEach((item, index) => {
      const variance = item.actual - item.budget;
      const variancePct = ((variance / item.budget) * 100);
      const isOver = variance > 0;
      const varColor = isOver ? 'var(--accent-terracotta)' : 'var(--accent-green)';
      const varSign = variance > 0 ? '+' : '';

      html += `
        <tr>
          <td>
            <strong>${item.name}</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${item.note}</div>
          </td>
          <td class="num-col">
            <input type="number" 
                   value="${item.budget}" 
                   step="10" 
                   onchange="BudgetModule.updateBudgetItem(${index}, 'budget', this.value)" />
            <span style="font-size: 0.8rem; color: var(--text-muted);">L</span>
          </td>
          <td class="num-col">
            <input type="number" 
                   value="${item.actual}" 
                   step="10" 
                   onchange="BudgetModule.updateBudgetItem(${index}, 'actual', this.value)" />
            <span style="font-size: 0.8rem; color: var(--text-muted);">L</span>
          </td>
          <td class="num-col" style="font-family: var(--font-mono); color: ${varColor}; font-weight: 500;">
            ${varSign}₨ ${variance.toFixed(1)} L
          </td>
          <td class="num-col" style="font-family: var(--font-mono); color: ${varColor};">
            ${varSign}${variancePct.toFixed(1)}%
          </td>
          <td>
            <button class="chip" style="padding: 3px 8px; font-size: 0.78rem;" onclick="BudgetModule.selectCategory('${item.name}')">
              Drill Down
            </button>
          </td>
        </tr>
      `;
    });

    const totalBudget = categoriesData.reduce((acc, c) => acc + c.budget, 0);
    const totalActual = categoriesData.reduce((acc, c) => acc + c.actual, 0);
    const totalVar = totalActual - totalBudget;
    const totalVarPct = (totalVar / totalBudget) * 100;
    const totalVarColor = totalVar > 0 ? 'var(--accent-terracotta)' : 'var(--accent-green)';

    html += `
      <tr class="total-row">
        <td>Total Operating Spend</td>
        <td class="num-col" style="font-family: var(--font-mono);">₨ ${totalBudget.toLocaleString()} L</td>
        <td class="num-col" style="font-family: var(--font-mono);">₨ ${totalActual.toLocaleString()} L</td>
        <td class="num-col" style="font-family: var(--font-mono); color: ${totalVarColor}; font-weight: 700;">
          ${totalVar > 0 ? '+' : ''}₨ ${totalVar.toFixed(1)} L
        </td>
        <td class="num-col" style="font-family: var(--font-mono); color: ${totalVarColor};">
          ${totalVar > 0 ? '+' : ''}${totalVarPct.toFixed(1)}%
        </td>
        <td></td>
      </tr>
    `;

    tbody.innerHTML = html;
  }

  function updateBudgetItem(index, field, value) {
    const num = parseFloat(value) || 0;
    categoriesData[index][field] = num;
    render();
  }

  function updateBudgetMetrics() {
    const totalBudget = categoriesData.reduce((acc, c) => acc + c.budget, 0);
    const totalActual = categoriesData.reduce((acc, c) => acc + c.actual, 0);
    const netVariance = totalActual - totalBudget;
    const netVariancePct = (netVariance / totalBudget) * 100;

    const elTotalBudget = document.getElementById('metricTotalBudget');
    const elTotalActual = document.getElementById('metricTotalActual');
    const elNetVariance = document.getElementById('metricNetVariance');
    const elNetVarianceSub = document.getElementById('metricNetVarianceSub');
    const elBurn = document.getElementById('metricMonthlyBurn');

    if (elTotalBudget) elTotalBudget.textContent = `₨ ${(totalBudget / 100).toFixed(2)} Cr`;
    if (elTotalActual) elTotalActual.textContent = `₨ ${(totalActual / 100).toFixed(2)} Cr`;
    if (elNetVariance) {
      elNetVariance.textContent = `${netVariance > 0 ? '+' : ''}₨ ${(netVariance / 100).toFixed(2)} Cr`;
      elNetVariance.style.color = netVariance > 0 ? '#C25E2E' : '#2E7D32';
    }
    if (elNetVarianceSub) {
      elNetVarianceSub.textContent = `${netVariance > 0 ? '+' : ''}${netVariancePct.toFixed(1)}% vs approved base`;
    }
    if (elBurn) {
      const burn = (totalActual / 12);
      elBurn.textContent = `₨ ${burn.toFixed(1)} L / month`;
    }
  }

  function renderWaterfallChart() {
    const ctx = document.getElementById('waterfallChart');
    if (!ctx) return;

    if (waterfallChart) {
      waterfallChart.destroy();
    }

    const totalBudget = categoriesData.reduce((acc, c) => acc + c.budget, 0);
    const labels = ['Approved Budget', ...categoriesData.map(c => c.name.split(' ')[0]), 'Actual Spend'];
    
    const dataRanges = [];
    const bgColors = [];
    const borderColors = [];

    let runningTotal = 0;
    
    // Base
    dataRanges.push([0, totalBudget]);
    bgColors.push('#1E3A5F');
    borderColors.push('#1E3A5F');
    runningTotal = totalBudget;

    // Intermediate variances
    categoriesData.forEach(item => {
      const v = item.actual - item.budget;
      const prev = runningTotal;
      runningTotal += v;
      if (v >= 0) {
        dataRanges.push([prev, runningTotal]);
        bgColors.push('#C25E2E');
        borderColors.push('#C25E2E');
      } else {
        dataRanges.push([runningTotal, prev]);
        bgColors.push('#2E7D32');
        borderColors.push('#2E7D32');
      }
    });

    // Final
    dataRanges.push([0, runningTotal]);
    bgColors.push('#141413');
    borderColors.push('#141413');

    waterfallChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Impact (₨ Lakhs)',
          data: dataRanges,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#FFFFFF',
            titleColor: '#141413',
            bodyColor: '#56554F',
            borderColor: '#ECE7DE',
            borderWidth: 1,
            callbacks: {
              label: function(ctx) {
                const range = ctx.raw;
                if (!Array.isArray(range)) return '';
                const diff = Math.round(Math.abs(range[1] - range[0]));
                if (ctx.dataIndex === 0) return ` Approved Allocation: ₨ ${range[1]} L`;
                if (ctx.dataIndex === labels.length - 1) return ` Final Spend: ₨ ${range[1]} L`;
                const sign = range[1] > range[0] ? '+ Overrun' : '- Savings';
                return ` ${sign}: ₨ ${diff} L`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: '#F2EFEB' },
            ticks: {
              color: '#87857E',
              font: { family: 'Plus Jakarta Sans', size: 10 }
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

  function selectCategory(categoryName) {
    selectedCategory = categoryName;
    const card = document.getElementById('drilldownCard');
    if (card) {
      card.style.display = 'block';
      document.getElementById('drilldownCategoryName').textContent = categoryName;
      renderDrilldown(categoryName);
    }
  }

  function renderDrilldown(categoryName) {
    const monthlyData = SAMPLE_DATA.budget.monthly[categoryName];
    const monthLabels = SAMPLE_DATA.budget.monthLabels;
    const ctx = document.getElementById('drilldownChart');
    if (!ctx || !monthlyData) return;

    if (drilldownChart) {
      drilldownChart.destroy();
    }

    drilldownChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthLabels,
        datasets: [
          {
            label: 'Approved Budget',
            data: monthlyData.budget,
            backgroundColor: '#EAE6DC',
            borderColor: '#EAE6DC',
            borderWidth: 1,
            borderRadius: 3
          },
          {
            label: 'Actual Spend',
            data: monthlyData.actual,
            backgroundColor: '#C25E2E',
            borderColor: '#C25E2E',
            borderWidth: 1,
            borderRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#56554F', font: { family: 'Plus Jakarta Sans', size: 11 } }
          }
        },
        scales: {
          x: {
            grid: { color: '#F2EFEB' },
            ticks: { color: '#87857E', font: { family: 'JetBrains Mono', size: 10 } }
          },
          y: {
            grid: { color: '#F2EFEB' },
            ticks: {
              color: '#87857E',
              font: { family: 'JetBrains Mono', size: 10 },
              callback: (val) => `₨ ${val}L`
            }
          }
        }
      }
    });
  }

  function exportToCsv() {
    let csv = "Expense Line,Budget (PKR Lakhs),Actual (PKR Lakhs),Variance (PKR Lakhs),Variance %\n";
    categoriesData.forEach(item => {
      const v = item.actual - item.budget;
      const vPct = ((v / item.budget) * 100).toFixed(1);
      csv += `"${item.name}",${item.budget},${item.actual},${v.toFixed(1)},${vPct}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Intellia_Health_Operating_Budget_FY2025.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return {
    init,
    render,
    updateBudgetItem,
    selectCategory,
    exportToCsv
  };
})();
