# HealthFin Pro — Healthcare FP&A & Actuarial Workbench

A browser-based financial planning, variance analysis, and actuarial reserving engine tailored for **LUMS Health Service** (and scalable to hospital networks / health-tech platforms). 

Built from scratch using modern web standards (Vanilla JavaScript, CSS3, Chart.js) with zero build steps or heavyweight frameworks — deployable directly on **GitHub Pages**.

---

## 🌟 Executive Overview & Modules

This tool was designed to bridge the gap between traditional corporate FP&A (budgeting, variance analysis, revenue forecasting) and quantitative actuarial science (claims reserving, loss development triangles, statistical confidence intervals).

### 1. 📈 Revenue Forecasting Engine
* **Methodologies**: Exponential Smoothing ($\alpha$ adjustable), OLS Linear Trend, and 3-Month Moving Average.
* **Empirical Seasonality**: Accounts for Pakistan-specific healthcare volume shifts (monsoon dip in Jul–Aug, post-summer semester surge, winter flu inpatient spike in Dec–Jan, and Ramadan outpatient hours).
* **Statistical Uncertainty**: Implements $\pm 1\sigma$ and $\pm 1.96\sigma$ (95%) confidence intervals expanding over the projection horizon based on historical residual variance.
* **Diagnostics**: Backtest accuracy reporting via in-sample Mean Absolute Percentage Error (MAPE).

### 2. 📊 Operating Budget & Variance Analyzer
* **Interactive Budgeting**: Real-time editable departmental expense lines (Staff Costs, Medical Supplies, Equipment Depreciation, Facility, Cloud EMR & Admin, Outreach, Contingency).
* **Root-Cause Variance Waterfall**: Visual bridge showing baseline approved budget stepping through favorable savings and unfavorable cost overruns to arrive at final actual spend.
* **RAG Health Scoring**: Automated Red/Amber/Green status thresholds for rapid executive review.
* **Monthly Drill-Down**: Inspect underlying 12-month seasonality and cost spikes per category.
* **Client-Ready CSV Export**: Instantly exports audited variance figures.

### 3. 🛡️ Claims Development & Actuarial Reserving (IBNR)
* **Chain Ladder / Mack Method**: 5-year cumulative incurred claims development triangle with volume-weighted link ratios ($f_k$) and cumulative development factors ($CDF$).
* **IBNR Projection**: Actuarially projects ultimate claims liability and calculates required Incurred But Not Reported (IBNR) reserves for incomplete accident years.
* **Stress Testing**: Pre-configured macro scenarios (Base Case, Adverse +15% Loss/Development Lag, Favorable -10% Loss).
* **Solvency Meter**: Real-time visual adequacy gauge tracking booked reserves against actuarial indicated requirements relative to regulatory solvency benchmarks.
* **Sensitivity Matrix**: Two-dimensional shock grid evaluating reserve volatility across loss frequency shifts and tail settlement speed.

---

## 🛠️ Architecture & Tech Stack

* **Frontend**: Vanilla JavaScript (ES6+), HTML5 Semantic markup, Custom CSS3 Design System.
* **Visualizations**: Chart.js for responsive line charts, floating waterfall bars, and monthly distributions.
* **State Management**: Reactive in-memory state with dynamic recalculation upon table cell edits.
* **Theming**: Sleek dark mode by default with light mode toggle (persisted via `localStorage`).

---

## 🚀 Live Demo & Deployment

### Run Locally:
Simply open `index.html` in any modern web browser:
```bash
# Windows
start index.html

# Mac/Linux
open index.html
```

### Deploy to GitHub Pages:
1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: complete healthfin pro FP&A workbench"
   git branch -M main
   git remote add origin https://github.com/<your-username>/healthfin-pro.git
   git push -u origin main
   ```
2. In your GitHub repository:
   * Navigate to **Settings** &rarr; **Pages**.
   * Under **Branch**, select `main` and `/ (root)`.
   * Click **Save**.
3. Your live workbench will be accessible at:
   `https://<your-username>.github.io/healthfin-pro/`

---

## 👤 Author

**Syed Abdullah**  
* Economics & Mathematics with Computer Science (LUMS '25)  
* Actuarial Candidate (Passed 2 ASA exams)  
* 1.5+ years experience in risk modelling, claims reserving, and quantitative financial analytics.
