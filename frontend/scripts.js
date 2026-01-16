// HerGrowth JavaScript
console.log("scripts.js loaded ✅");

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("HerGrowth page loaded successfully!");
  console.log("CSS and JavaScript files are connected.");

  // =========================
  // Landing page logic (safe)
  // =========================
  const goButton = document.getElementById("goButton");
  const sportButtons = document.querySelectorAll(".sport-buttons .pill-button");
  const levelButtons = document.querySelectorAll(".level-buttons .pill-button");

  // Only run landing-page behavior if elements exist
  if (goButton && sportButtons.length && levelButtons.length) {
    function checkSelections() {
      const sportSelected = Array.from(sportButtons).some((btn) =>
        btn.classList.contains("selected")
      );
      const levelSelected = Array.from(levelButtons).some((btn) =>
        btn.classList.contains("selected")
      );

      if (sportSelected && levelSelected) {
        goButton.disabled = false;
        goButton.classList.remove(
          "bg-gray-300",
          "text-gray-500",
          "opacity-50",
          "cursor-not-allowed"
        );
        goButton.classList.add(
          "bg-gradient-to-r",
          "from-green-600",
          "to-emerald-600",
          "text-white",
          "hover:from-green-700",
          "hover:to-emerald-700",
          "hover:shadow-2xl",
          "transform",
          "hover:scale-105",
          "cursor-pointer",
          "opacity-100",
          "shadow-xl"
        );
      } else {
        goButton.disabled = true;
        goButton.classList.remove(
          "bg-gradient-to-r",
          "from-green-600",
          "to-emerald-600",
          "text-white",
          "hover:from-green-700",
          "hover:to-emerald-700",
          "hover:shadow-2xl",
          "transform",
          "hover:scale-105",
          "cursor-pointer",
          "opacity-100",
          "shadow-xl"
        );
        goButton.classList.add(
          "bg-gray-300",
          "text-gray-500",
          "opacity-50",
          "cursor-not-allowed"
        );
      }
    }

    sportButtons.forEach((button) => {
      button.addEventListener("click", function () {
        sportButtons.forEach((btn) => btn.classList.remove("selected"));
        this.classList.add("selected");
        checkSelections();
      });
    });

    levelButtons.forEach((button) => {
      button.addEventListener("click", function () {
        levelButtons.forEach((btn) => btn.classList.remove("selected"));
        this.classList.add("selected");
        checkSelections();
      });
    });

    goButton.addEventListener("click", function () {
      if (goButton.disabled) return;

      const selectedSport = Array.from(sportButtons).find((btn) =>
        btn.classList.contains("selected")
      );
      const selectedLevel = Array.from(levelButtons).find((btn) =>
        btn.classList.contains("selected")
      );

      if (selectedSport && selectedLevel) {
        const sportText = selectedSport.textContent.trim();
        const levelText = selectedLevel.textContent.trim();

        if (sportText === "Soccer" && levelText === "Professional") {
          window.location.href = "soccer-pro.html";
        }
      }
    });
  }

  // =========================
  // API + KPI/Chart logic
  // =========================
  const API_BASE = "http://127.0.0.1:8000";

  // helpers
  function hgFormatNumber(n) {
    if (n === null || n === undefined || Number.isNaN(n)) return "—";
    return Number(n).toLocaleString();
  }

  function hgFormatPct(n) {
    if (n === null || n === undefined || Number.isNaN(n)) return "—";
    const v = Number(n);
    const sign = v > 0 ? "+" : "";
    return `${sign}${v.toFixed(1)}%`;
  }

  function hgSetText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
  }

  function hgPctChange(prev, curr) {
    if (prev === null || prev === undefined) return null;
    if (curr === null || curr === undefined) return null;
    if (Number(prev) === 0) return null;
    return ((Number(curr) - Number(prev)) / Number(prev)) * 100;
  }

  async function hgFetchAttendance() {
    const res = await fetch(`${API_BASE}/attendance/nwsl`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  }

  async function hgFetchKpis() {
    const res = await fetch(`${API_BASE}/attendance/nwsl/kpis`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  }

  async function hgRenderSoccerData() {
    try {
      const [series, kpis] = await Promise.all([
        hgFetchAttendance(),
        hgFetchKpis(),
      ]);

      if (kpis?.error) {
        console.warn("KPI error:", kpis.error);
        return;
      }

      // absolute KPIs
      hgSetText("kpiTotalGrowth", hgFormatNumber(kpis.total_growth));
      hgSetText("kpiAvgYoY", hgFormatNumber(kpis.avg_yoy_growth));
      hgSetText("kpiPeakYear", kpis.peak_year ?? "—");

      if (kpis.biggest_jump) {
        hgSetText(
          "kpiBiggestJumpYear",
          `${kpis.biggest_jump.from_year}→${kpis.biggest_jump.to_year}`
        );
      }

      // percent KPIs computed from series
      const totals = series
        .filter((r) => r.total_attendance != null)
        .sort((a, b) => Number(a.season_year) - Number(b.season_year));

      if (totals.length >= 2) {
        const first = totals[0].total_attendance;
        const last = totals[totals.length - 1].total_attendance;

        hgSetText("kpiTotalGrowthPct", hgFormatPct(hgPctChange(first, last)));

        const yoyPcts = [];
        for (let i = 1; i < totals.length; i++) {
          const p = hgPctChange(
            totals[i - 1].total_attendance,
            totals[i].total_attendance
          );
          if (p !== null) yoyPcts.push(p);
        }

        const avgPct =
          yoyPcts.length > 0
            ? yoyPcts.reduce((a, b) => a + b, 0) / yoyPcts.length
            : null;

        hgSetText("kpiAvgYoYPct", hgFormatPct(avgPct));

        if (kpis.biggest_jump) {
          const prev = totals.find(
            (r) => Number(r.season_year) === Number(kpis.biggest_jump.from_year)
          );
          const curr = totals.find(
            (r) => Number(r.season_year) === Number(kpis.biggest_jump.to_year)
          );
          if (prev && curr) {
            hgSetText(
              "kpiBiggestJumpPct",
              hgFormatPct(
                hgPctChange(prev.total_attendance, curr.total_attendance)
              )
            );
          }
        }

        // chart data last 7
        const chartData = totals.map((d) => ({
          year: Number(d.season_year),
          value: Number(d.total_attendance),
        }));

        const lastSeven = chartData.slice(-7);

        if (typeof drawAttendanceChart === "function") {
          drawAttendanceChart(lastSeven);
        } else {
          console.warn("drawAttendanceChart is not defined yet.");
        }
      }

      console.log("HerGrowth soccer data loaded ✅");
    } catch (err) {
      console.error("HerGrowth API load failed:", err);
    }
  }

  // auto-run only on soccer page (KPI section exists)
  if (document.getElementById("kpiTotalGrowth")) {
    hgRenderSoccerData();
  }
});
