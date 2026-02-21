import { useMemo, useState } from "react";

const TREND_PERIODS = ["7d", "30d", "90d"];
const CONFIDENCE_OPTIONS = ["verified", "partial", "estimated"];
const SCENARIOS = [
  { id: "base", label: "Base", growthDelta: 0, churnDelta: 0, burnMultiplier: 1 },
  { id: "best", label: "Best", growthDelta: 5, churnDelta: -0.8, burnMultiplier: 0.9 },
  { id: "worst", label: "Worst", growthDelta: -6, churnDelta: 1.3, burnMultiplier: 1.15 },
];
const DASHBOARD_TABS = ["overview", "risk", "modeling", "controls"];

function formatCurrency(value) {
  return `$${Math.round(Number(value) || 0).toLocaleString()}`;
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function miniSparklinePoints(values) {
  const safeValues = values.length ? values : [0];
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = Math.max(1, max - min);
  return safeValues
    .map((value, index) => {
      const x = (index / Math.max(1, safeValues.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");
}

function statusTone(value, target, direction = "high") {
  if (direction === "low") {
    if (value <= target) return "po-status-ok";
    if (value <= target * 1.15) return "po-status-warn";
    return "po-status-risk";
  }
  if (value >= target) return "po-status-ok";
  if (value >= target * 0.9) return "po-status-warn";
  return "po-status-risk";
}

function trendSeries(currentValue, growthFactor, period) {
  const lengthByPeriod = { "7d": 7, "30d": 10, "90d": 12 };
  const points = lengthByPeriod[period] ?? 10;
  const series = [];
  const base = Number(currentValue) || 0;
  const drift = (Number(growthFactor) || 0) / 100;

  for (let index = points - 1; index >= 0; index -= 1) {
    const multiplier = 1 - drift * (index / Math.max(4, points));
    const wave = 1 + Math.sin(index * 1.4) * 0.03;
    series.push(Math.max(0, base * multiplier * wave));
  }

  return series;
}

function simulateRunwayMonths({ cash, revenue, growthPct, churnPct, burn }) {
  let remainingCash = Math.max(0, Number(cash) || 0);
  let monthlyRevenue = Math.max(0, Number(revenue) || 0);
  const monthlyGrowth = (Number(growthPct) || 0) / 100;
  const monthlyChurn = (Number(churnPct) || 0) / 100;
  const monthlyBurn = Math.max(1, Number(burn) || 1);
  let months = 0;

  while (remainingCash > 0 && months < 72) {
    const effectiveGrowth = clamp(monthlyGrowth - monthlyChurn, -0.4, 0.45);
    monthlyRevenue = Math.max(0, monthlyRevenue * (1 + effectiveGrowth));
    const netBurn = Math.max(1000, monthlyBurn - monthlyRevenue);
    remainingCash -= netBurn;
    months += 1;
  }

  return months;
}

export function KPIDashboard({
  company = "Startup",
  monthlyRevenue = 48000,
  monthlyGrowthPercent = 12,
  activeUsers = 8200,
  churnRate = 3.2,
  burnRate = 36000,
  runwayMonths = 14,
  showSliders = true,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
  const [metrics, setMetrics] = useState({
    monthlyRevenue,
    monthlyGrowthPercent,
    activeUsers,
    churnRate,
    burnRate,
    runwayMonths,
    cashOnHand: burnRate * runwayMonths,
    topCustomerRevenuePct: 34,
    cac: 900,
    grossMarginPct: 78,
    salesMarketingSpend: 16000,
    activationRate: 37,
    expansionRevenuePct: 21,
    pipelineCoverage: 2.6,
    netDollarRetention: 112,
  });

  const [targets, setTargets] = useState({
    monthlyRevenue: 60000,
    monthlyGrowthPercent: 15,
    activeUsers: 10000,
    churnRate: 3,
    burnRate: 40000,
    runwayMonths: 16,
    activationRate: 40,
    netDollarRetention: 115,
  });

  const [confidence, setConfidence] = useState({
    monthlyRevenue: "verified",
    monthlyGrowthPercent: "partial",
    activeUsers: "verified",
    churnRate: "partial",
    burnRate: "verified",
    runwayMonths: "estimated",
  });

  const [alertRules, setAlertRules] = useState({
    maxChurnRate: 5,
    minRunwayMonths: 9,
    minNdr: 105,
    minPipelineCoverage: 2,
    maxTopCustomerPct: 40,
  });

  const updateMetric = (key, value) => {
    setMetrics((prev) => ({ ...prev, [key]: Number(value) }));
    setLastUpdated(new Date().toISOString());
  };

  const updateTarget = (key, value) => {
    setTargets((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const updateAlertRule = (key, value) => {
    setAlertRules((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const derived = useMemo(() => {
    const arpu = metrics.activeUsers ? metrics.monthlyRevenue / metrics.activeUsers : 0;
    const churnDecimal = Math.max(0.001, metrics.churnRate / 100);
    const ltv = arpu / churnDecimal;
    const ltvToCac = metrics.cac ? ltv / metrics.cac : 0;
    const paybackMonths = arpu > 0 ? metrics.cac / (arpu * (metrics.grossMarginPct / 100)) : 0;
    const magicNumber =
      metrics.salesMarketingSpend > 0
        ? ((metrics.monthlyRevenue * (metrics.monthlyGrowthPercent / 100)) * 4) /
          metrics.salesMarketingSpend
        : 0;

    return { arpu, ltv, ltvToCac, paybackMonths, magicNumber };
  }, [metrics]);

  const trendData = useMemo(
    () => ({
      monthlyRevenue: trendSeries(metrics.monthlyRevenue, metrics.monthlyGrowthPercent, selectedPeriod),
      activeUsers: trendSeries(metrics.activeUsers, metrics.monthlyGrowthPercent * 0.6, selectedPeriod),
      churnRate: trendSeries(metrics.churnRate, -metrics.monthlyGrowthPercent * 0.15, selectedPeriod),
      burnRate: trendSeries(metrics.burnRate, metrics.monthlyGrowthPercent * 0.3, selectedPeriod),
    }),
    [metrics, selectedPeriod],
  );

  const scenarioRunway = useMemo(() => {
    return SCENARIOS.map((scenario) => {
      const months = simulateRunwayMonths({
        cash: metrics.cashOnHand,
        revenue: metrics.monthlyRevenue,
        growthPct: metrics.monthlyGrowthPercent + scenario.growthDelta,
        churnPct: Math.max(0, metrics.churnRate + scenario.churnDelta),
        burn: metrics.burnRate * scenario.burnMultiplier,
      });

      return { label: scenario.label, months };
    });
  }, [metrics]);

  const concentrationRisk = useMemo(() => {
    if (metrics.topCustomerRevenuePct >= alertRules.maxTopCustomerPct) return "High";
    if (metrics.topCustomerRevenuePct >= alertRules.maxTopCustomerPct * 0.75) return "Medium";
    return "Low";
  }, [metrics.topCustomerRevenuePct, alertRules.maxTopCustomerPct]);

  const singlePointFailures = useMemo(() => {
    const risks = [];
    if (metrics.topCustomerRevenuePct >= 45) risks.push("Revenue dependency on top account");
    if (metrics.pipelineCoverage < 1.7) risks.push("Pipeline coverage below safe level");
    if (metrics.netDollarRetention < 100) risks.push("Negative net revenue expansion");
    return risks;
  }, [metrics.topCustomerRevenuePct, metrics.pipelineCoverage, metrics.netDollarRetention]);

  const alerts = useMemo(() => {
    const watchlist = [];

    if (metrics.churnRate > alertRules.maxChurnRate) {
      watchlist.push({ label: "Churn above threshold", severity: "at risk" });
    }
    if (metrics.runwayMonths < alertRules.minRunwayMonths) {
      watchlist.push({ label: "Runway below minimum", severity: "at risk" });
    }
    if (metrics.netDollarRetention < alertRules.minNdr) {
      watchlist.push({ label: "Net dollar retention below target", severity: "warning" });
    }
    if (metrics.pipelineCoverage < alertRules.minPipelineCoverage) {
      watchlist.push({ label: "Pipeline coverage too low", severity: "warning" });
    }
    if (metrics.topCustomerRevenuePct > alertRules.maxTopCustomerPct) {
      watchlist.push({ label: "Customer concentration too high", severity: "at risk" });
    }

    if (!watchlist.length) {
      watchlist.push({ label: "No triggered alerts", severity: "healthy" });
    }

    return watchlist;
  }, [metrics, alertRules]);

  const cards = [
    {
      label: "Monthly Revenue",
      value: formatCurrency(metrics.monthlyRevenue),
      target: formatCurrency(targets.monthlyRevenue),
      variance: metrics.monthlyRevenue - targets.monthlyRevenue,
      direction: "high",
      key: "monthlyRevenue",
    },
    {
      label: "Monthly Growth %",
      value: formatPercent(metrics.monthlyGrowthPercent),
      target: formatPercent(targets.monthlyGrowthPercent),
      variance: metrics.monthlyGrowthPercent - targets.monthlyGrowthPercent,
      direction: "high",
      key: "monthlyGrowthPercent",
    },
    {
      label: "Active Users",
      value: Number(metrics.activeUsers).toLocaleString(),
      target: Number(targets.activeUsers).toLocaleString(),
      variance: metrics.activeUsers - targets.activeUsers,
      direction: "high",
      key: "activeUsers",
    },
    {
      label: "Churn Rate",
      value: formatPercent(metrics.churnRate),
      target: formatPercent(targets.churnRate),
      variance: metrics.churnRate - targets.churnRate,
      direction: "low",
      key: "churnRate",
    },
    {
      label: "Burn Rate",
      value: formatCurrency(metrics.burnRate),
      target: formatCurrency(targets.burnRate),
      variance: metrics.burnRate - targets.burnRate,
      direction: "low",
      key: "burnRate",
    },
    {
      label: "Runway",
      value: `${metrics.runwayMonths} months`,
      target: `${targets.runwayMonths} months`,
      variance: metrics.runwayMonths - targets.runwayMonths,
      direction: "high",
      key: "runwayMonths",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{company}</p>
          <h3 className="mt-1 text-lg font-semibold text-card-foreground">Investor KPI Dashboard</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Trend period</span>
          <select
            value={selectedPeriod}
            onChange={(event) => setSelectedPeriod(event.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
          >
            {TREND_PERIODS.map((period) => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setLastUpdated(new Date().toISOString())}
            className="po-primary-btn h-8 px-3"
          >
            Refresh timestamp
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Last updated: {new Date(lastUpdated).toLocaleString()}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {DASHBOARD_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? "po-primary-btn capitalize" : "po-secondary-btn capitalize"}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {cards.map((card) => {
          const tone = statusTone(metrics[card.key], targets[card.key], card.direction);
          return (
            <div key={card.label} className="rounded-lg border border-border/70 bg-background p-3">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-base font-semibold">{card.value}</p>
              <p className="text-xs text-muted-foreground">Target {card.target}</p>
              <p className={`text-xs font-medium ${tone}`}>
                Variance {card.variance >= 0 ? "+" : ""}
                {card.key.includes("Rate") || card.key.includes("Percent")
                  ? Number(card.variance).toFixed(1)
                  : Math.round(card.variance)}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Data quality</span>
                <select
                  value={confidence[card.key]}
                  onChange={(event) =>
                    setConfidence((prev) => ({ ...prev, [card.key]: event.target.value }))
                  }
                  className="h-7 rounded-md border border-border bg-background px-2 text-[11px] text-foreground"
                >
                  {CONFIDENCE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {activeTab === "overview" && (
        <div className="mt-4 rounded-lg border border-border/60 bg-background p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Historical Trends and Delta
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {Object.entries(trendData).map(([key, series]) => {
            const first = series[0] || 0;
            const last = series[series.length - 1] || 0;
            const deltaPct = first ? ((last - first) / first) * 100 : 0;
            return (
              <div key={key} className="rounded-md border border-border/60 p-2">
                <p className="text-xs text-muted-foreground">{key}</p>
                <svg viewBox="0 0 100 100" className="mt-2 h-16 w-full">
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    points={miniSparklinePoints(series)}
                    className="text-primary"
                  />
                </svg>
                <p className="text-xs text-muted-foreground">
                  {selectedPeriod} delta: {deltaPct >= 0 ? "+" : ""}
                  {deltaPct.toFixed(1)}%
                </p>
              </div>
            );
          })}
        </div>
        </div>
      )}

      {activeTab === "overview" && (
        <div className="mt-4 rounded-lg border border-border/60 bg-background p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Unit Economics
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
          <p>ARPU: {formatCurrency(derived.arpu)}</p>
          <p>LTV: {formatCurrency(derived.ltv)}</p>
          <p>LTV:CAC: {derived.ltvToCac.toFixed(2)}x</p>
          <p>Payback: {derived.paybackMonths.toFixed(1)} mo</p>
          <p>Magic #: {derived.magicNumber.toFixed(2)}</p>
        </div>
        </div>
      )}

      {activeTab === "modeling" && (
        <div className="mt-4 rounded-lg border border-border/60 bg-background p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Runway Scenario Modeling
        </p>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          {scenarioRunway.map((scenario) => (
            <div key={scenario.label} className="rounded-md border border-border/60 p-2">
              <p className="text-xs text-muted-foreground">{scenario.label} case</p>
              <p className="text-base font-semibold text-foreground">{scenario.months} months</p>
            </div>
          ))}
        </div>
        </div>
      )}

      {activeTab === "risk" && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-background p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Concentration and Risk Indicators
          </p>
          <p className="mt-2 text-sm text-foreground">
            Top customer concentration: {metrics.topCustomerRevenuePct.toFixed(1)}%
          </p>
          <p className="text-sm text-foreground">Risk tier: {concentrationRisk}</p>
          <p className="mt-2 text-xs text-muted-foreground">Single-point failure watch</p>
          {singlePointFailures.length ? (
            singlePointFailures.map((risk) => (
              <p key={risk} className="text-xs po-status-warn">
                {risk}
              </p>
            ))
          ) : (
            <p className="text-xs po-status-ok">No critical concentration risk triggered.</p>
          )}
        </div>

        <div className="rounded-lg border border-border/60 bg-background p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Leading Indicators
          </p>
          <div className="mt-2 space-y-1 text-sm">
            <p className={statusTone(metrics.activationRate, targets.activationRate, "high")}>
              Activation: {metrics.activationRate.toFixed(1)}%
            </p>
            <p>Expansion revenue: {metrics.expansionRevenuePct.toFixed(1)}%</p>
            <p className={statusTone(metrics.pipelineCoverage, alertRules.minPipelineCoverage, "high")}>
              Pipeline coverage: {metrics.pipelineCoverage.toFixed(2)}x
            </p>
            <p className={statusTone(metrics.netDollarRetention, targets.netDollarRetention, "high")}>
              Net dollar retention: {metrics.netDollarRetention.toFixed(1)}%
            </p>
          </div>
        </div>
        </div>
      )}

      {activeTab === "risk" && (
        <div className="mt-4 rounded-lg border border-border/60 bg-background p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Alert Rules and Watchlist
        </p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {alerts.map((alert) => (
            <p
              key={alert.label}
              className={`rounded-md border border-border/60 px-2 py-1 text-xs ${
                alert.severity === "at risk"
                  ? "po-status-risk"
                  : alert.severity === "warning"
                    ? "po-status-warn"
                    : "po-status-ok"
              }`}
            >
              {alert.severity.toUpperCase()}: {alert.label}
            </p>
          ))}
        </div>
        </div>
      )}

      {activeTab === "controls" && showSliders && (
        <div className="mt-4 space-y-3 rounded-lg border border-border/60 bg-background p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Adjust Mock Data, Targets, and Rules
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-xs text-muted-foreground">
              Monthly Revenue ({formatCurrency(metrics.monthlyRevenue)})
              <input
                type="range"
                min="5000"
                max="250000"
                step="1000"
                value={metrics.monthlyRevenue}
                onChange={(event) => updateMetric("monthlyRevenue", event.target.value)}
                className="mt-1 w-full"
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              Revenue Target ({formatCurrency(targets.monthlyRevenue)})
              <input
                type="range"
                min="5000"
                max="300000"
                step="1000"
                value={targets.monthlyRevenue}
                onChange={(event) => updateTarget("monthlyRevenue", event.target.value)}
                className="mt-1 w-full"
              />
            </label>

            <label className="block text-xs text-muted-foreground">
              Monthly Growth % ({metrics.monthlyGrowthPercent}%)
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={metrics.monthlyGrowthPercent}
                onChange={(event) => updateMetric("monthlyGrowthPercent", event.target.value)}
                className="mt-1 w-full"
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              Growth Target ({targets.monthlyGrowthPercent}%)
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={targets.monthlyGrowthPercent}
                onChange={(event) => updateTarget("monthlyGrowthPercent", event.target.value)}
                className="mt-1 w-full"
              />
            </label>

            <label className="block text-xs text-muted-foreground">
              Active Users ({Number(metrics.activeUsers).toLocaleString()})
              <input
                type="range"
                min="100"
                max="100000"
                step="100"
                value={metrics.activeUsers}
                onChange={(event) => updateMetric("activeUsers", event.target.value)}
                className="mt-1 w-full"
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              User Target ({Number(targets.activeUsers).toLocaleString()})
              <input
                type="range"
                min="100"
                max="120000"
                step="100"
                value={targets.activeUsers}
                onChange={(event) => updateTarget("activeUsers", event.target.value)}
                className="mt-1 w-full"
              />
            </label>

            <label className="block text-xs text-muted-foreground">
              Churn Rate ({metrics.churnRate.toFixed(1)}%)
              <input
                type="range"
                min="0"
                max="25"
                step="0.1"
                value={metrics.churnRate}
                onChange={(event) => updateMetric("churnRate", event.target.value)}
                className="mt-1 w-full"
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              Churn Target ({targets.churnRate.toFixed(1)}%)
              <input
                type="range"
                min="0"
                max="15"
                step="0.1"
                value={targets.churnRate}
                onChange={(event) => updateTarget("churnRate", event.target.value)}
                className="mt-1 w-full"
              />
            </label>

            <label className="block text-xs text-muted-foreground">
              Burn Rate ({formatCurrency(metrics.burnRate)})
              <input
                type="range"
                min="5000"
                max="250000"
                step="1000"
                value={metrics.burnRate}
                onChange={(event) => updateMetric("burnRate", event.target.value)}
                className="mt-1 w-full"
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              Runway Months ({metrics.runwayMonths})
              <input
                type="range"
                min="1"
                max="36"
                step="1"
                value={metrics.runwayMonths}
                onChange={(event) => updateMetric("runwayMonths", event.target.value)}
                className="mt-1 w-full"
              />
            </label>

            <label className="block text-xs text-muted-foreground">
              Top Customer Revenue % ({metrics.topCustomerRevenuePct.toFixed(1)}%)
              <input
                type="range"
                min="5"
                max="70"
                step="1"
                value={metrics.topCustomerRevenuePct}
                onChange={(event) => updateMetric("topCustomerRevenuePct", event.target.value)}
                className="mt-1 w-full"
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              CAC ({formatCurrency(metrics.cac)})
              <input
                type="range"
                min="100"
                max="5000"
                step="25"
                value={metrics.cac}
                onChange={(event) => updateMetric("cac", event.target.value)}
                className="mt-1 w-full"
              />
            </label>

            <label className="block text-xs text-muted-foreground">
              Gross Margin % ({metrics.grossMarginPct.toFixed(1)}%)
              <input
                type="range"
                min="30"
                max="95"
                step="1"
                value={metrics.grossMarginPct}
                onChange={(event) => updateMetric("grossMarginPct", event.target.value)}
                className="mt-1 w-full"
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              Sales and Marketing Spend ({formatCurrency(metrics.salesMarketingSpend)})
              <input
                type="range"
                min="1000"
                max="100000"
                step="500"
                value={metrics.salesMarketingSpend}
                onChange={(event) => updateMetric("salesMarketingSpend", event.target.value)}
                className="mt-1 w-full"
              />
            </label>

            <label className="block text-xs text-muted-foreground">
              Activation Rate ({metrics.activationRate.toFixed(1)}%)
              <input
                type="range"
                min="5"
                max="90"
                step="1"
                value={metrics.activationRate}
                onChange={(event) => updateMetric("activationRate", event.target.value)}
                className="mt-1 w-full"
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              Expansion Revenue % ({metrics.expansionRevenuePct.toFixed(1)}%)
              <input
                type="range"
                min="0"
                max="70"
                step="1"
                value={metrics.expansionRevenuePct}
                onChange={(event) => updateMetric("expansionRevenuePct", event.target.value)}
                className="mt-1 w-full"
              />
            </label>

            <label className="block text-xs text-muted-foreground">
              Pipeline Coverage ({metrics.pipelineCoverage.toFixed(2)}x)
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={metrics.pipelineCoverage}
                onChange={(event) => updateMetric("pipelineCoverage", event.target.value)}
                className="mt-1 w-full"
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              Net Dollar Retention ({metrics.netDollarRetention.toFixed(1)}%)
              <input
                type="range"
                min="70"
                max="150"
                step="1"
                value={metrics.netDollarRetention}
                onChange={(event) => updateMetric("netDollarRetention", event.target.value)}
                className="mt-1 w-full"
              />
            </label>
          </div>

          <div className="grid gap-2 rounded-md border border-border/60 p-2 md:grid-cols-5">
            <label className="text-xs text-muted-foreground">
              Max churn alert ({alertRules.maxChurnRate.toFixed(1)}%)
              <input
                type="range"
                min="1"
                max="15"
                step="0.1"
                value={alertRules.maxChurnRate}
                onChange={(event) => updateAlertRule("maxChurnRate", event.target.value)}
                className="mt-1 w-full"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Min runway alert ({alertRules.minRunwayMonths} months)
              <input
                type="range"
                min="3"
                max="24"
                step="1"
                value={alertRules.minRunwayMonths}
                onChange={(event) => updateAlertRule("minRunwayMonths", event.target.value)}
                className="mt-1 w-full"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Min NDR alert ({alertRules.minNdr}%)
              <input
                type="range"
                min="80"
                max="130"
                step="1"
                value={alertRules.minNdr}
                onChange={(event) => updateAlertRule("minNdr", event.target.value)}
                className="mt-1 w-full"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Min pipeline alert ({alertRules.minPipelineCoverage.toFixed(1)}x)
              <input
                type="range"
                min="1"
                max="4"
                step="0.1"
                value={alertRules.minPipelineCoverage}
                onChange={(event) => updateAlertRule("minPipelineCoverage", event.target.value)}
                className="mt-1 w-full"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Max concentration alert ({alertRules.maxTopCustomerPct.toFixed(0)}%)
              <input
                type="range"
                min="20"
                max="60"
                step="1"
                value={alertRules.maxTopCustomerPct}
                onChange={(event) => updateAlertRule("maxTopCustomerPct", event.target.value)}
                className="mt-1 w-full"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
