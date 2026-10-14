// ============================================================
// Intellia Health Systems — Operating & Actuarial Dataset
// FY runs Jul–Jun (Pakistani fiscal year)
// Currency: PKR (Lakhs & Crores)
// ============================================================

const SAMPLE_DATA = {
  company: {
    name: "Intellia Health",
    tagline: "Clinical Intelligence & Hospital Operations",
    fyStart: "July",
    currency: "PKR",
    unit: "Lakhs",
    fiscalYear: "FY2025"
  },

  // ── Revenue Data (24 months: Jul-23 → Jun-25) ──────────────
  revenue: {
    labels: [
      "Jul-23","Aug-23","Sep-23","Oct-23","Nov-23","Dec-23",
      "Jan-24","Feb-24","Mar-24","Apr-24","May-24","Jun-24",
      "Jul-24","Aug-24","Sep-24","Oct-24","Nov-24","Dec-24",
      "Jan-25","Feb-25","Mar-25","Apr-25","May-25","Jun-25"
    ],

    // Inpatient (IPD)
    inpatient: [
      195, 185, 210, 228, 238, 245,
      250, 235, 208, 195, 218, 230,
      212, 198, 228, 248, 258, 265,
      272, 255, 225, 210, 238, 252
    ],

    // Outpatient (OPD)
    outpatient: [
      82, 76, 88, 95, 100, 105,
      108, 102, 90, 84, 92, 98,
      90, 83, 96, 105, 110, 115,
      118, 112, 98, 91, 101, 108
    ],

    // Diagnostics & Radiology (MRI/CT)
    diagnostics: [
      42, 38, 45, 50, 52, 55,
      58, 54, 48, 44, 49, 52,
      55, 50, 58, 72, 78, 82,
      85, 80, 68, 62, 72, 78
    ],

    // Seasonal adjustment factors (12 months Jul-Jun)
    seasonalFactors: [
      0.92, 0.88, 0.98, 1.05, 1.08, 1.12,
      1.14, 1.06, 0.95, 0.90, 0.97, 1.02
    ],

    driverNotes: [
      { name: "Winter Flu Surge", weight: "+14%", period: "Dec - Jan" },
      { name: "Post-Summer Volume", weight: "+8%", period: "Oct - Nov" },
      { name: "Monsoon Footfall Dip", weight: "-12%", period: "Jul - Aug" },
      { name: "Ramadan Hours", weight: "-10%", period: "Mar - Apr" }
    ]
  },

  // ── Operating Budget (FY2025: Jul-24 → Jun-25) ──────────────
  budget: {
    fiscalYear: "FY2025",
    categories: [
      {
        name: "Staff & Nursing Costs",
        code: "6100",
        budget: 1850,
        actual: 1920,
        note: "Includes mid-year nurse wage adjustment"
      },
      {
        name: "Medical & Surgical Supplies",
        code: "6200",
        budget: 800,
        actual: 762,
        note: "Consortium bulk procurement savings"
      },
      {
        name: "Equipment & Depreciation",
        code: "6300",
        budget: 450,
        actual: 512,
        note: "Unplanned MRI coil replacement in Q2"
      },
      {
        name: "Facility & Utility Operations",
        code: "6400",
        budget: 320,
        actual: 305,
        note: "Energy audit efficiency gains"
      },
      {
        name: "Cloud EMR & Clinical IT",
        code: "6500",
        budget: 280,
        actual: 332,
        note: "Clinical platform migration upgrade"
      },
      {
        name: "Community Outreach",
        code: "6600",
        budget: 100,
        actual: 72,
        note: "Deferred awareness drive to Q4"
      },
      {
        name: "Contingency Operating Reserve",
        code: "6900",
        budget: 150,
        actual: 88,
        note: "Flood relief clinical outreach deploy"
      }
    ],

    monthly: {
      "Staff & Nursing Costs": {
        budget: [154, 154, 154, 154, 154, 154, 154, 154, 154, 154, 156, 158],
        actual: [155, 156, 155, 158, 160, 162, 160, 161, 160, 163, 165, 165]
      },
      "Medical & Surgical Supplies": {
        budget: [67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 65, 65],
        actual: [70, 68, 65, 62, 60, 58, 62, 64, 66, 63, 62, 62]
      },
      "Equipment & Depreciation": {
        budget: [38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 35, 35],
        actual: [38, 38, 38, 38, 65, 62, 40, 40, 40, 38, 38, 37]
      },
      "Facility & Utility Operations": {
        budget: [27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 25, 25],
        actual: [28, 27, 26, 25, 24, 24, 25, 25, 26, 26, 25, 24]
      },
      "Cloud EMR & Clinical IT": {
        budget: [23, 23, 23, 23, 23, 23, 23, 23, 25, 25, 25, 21],
        actual: [24, 24, 25, 25, 32, 35, 30, 28, 28, 28, 27, 26]
      },
      "Community Outreach": {
        budget: [8, 8, 8, 8, 8, 8, 8, 8, 10, 10, 8, 8],
        actual: [5, 4, 5, 6, 6, 5, 5, 6, 6, 8, 8, 8]
      },
      "Contingency Operating Reserve": {
        budget: [12, 12, 12, 12, 12, 12, 12, 12, 14, 14, 12, 14],
        actual: [0, 0, 0, 25, 18, 10, 8, 8, 5, 5, 5, 4]
      }
    },

    monthLabels: [
      "07/2024","08/2024","09/2024","10/2024","11/2024","12/2024",
      "01/2025","02/2025","03/2025","04/2025","05/2025","06/2025"
    ]
  },

  // ── Claims Development Triangle ────────────────────────────
  claims: {
    accidentYears: [2020, 2021, 2022, 2023, 2024],
    developmentPeriods: ["Dev 0", "Dev 1", "Dev 2", "Dev 3", "Dev 4"],

    triangle: [
      [320, 485, 538, 556, 562],
      [345, 510, 568, 588, null],
      [380, 565, 628, null, null],
      [410, 615, null, null, null],
      [435, null, null, null, null]
    ],

    benchmarks: {
      targetReserveRatio: 1.10,
      industryAvgLossRatio: 0.68,
      regulatoryMinimum: 1.00
    },

    scenarios: {
      base: {
        label: "Base Case",
        lossRatioAdj: 1.0,
        devSpeedAdj: 1.0,
        description: "Empirical historical volume-weighted development factors"
      },
      adverse: {
        label: "Adverse",
        lossRatioAdj: 1.15,
        devSpeedAdj: 1.10,
        description: "+15% severity inflation and prolonged settlement tail"
      },
      favorable: {
        label: "Favorable",
        lossRatioAdj: 0.90,
        devSpeedAdj: 0.95,
        description: "-10% severity reduction and accelerated claims adjudication"
      }
    }
  }
};
