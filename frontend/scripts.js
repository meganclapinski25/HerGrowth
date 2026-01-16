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

  async function hgFetchAttendance(year = null) {
    const url = year 
      ? `${API_BASE}/attendance/nwsl?year=${year}`
      : `${API_BASE}/attendance/nwsl`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  }

  async function hgFetchKpis(year = null) {
    const url = year 
      ? `${API_BASE}/attendance/nwsl/kpis?year=${year}`
      : `${API_BASE}/attendance/nwsl/kpis`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  }


  // Main render function - supports filtering by year
  async function hgRenderSoccerData(year = null) {
    try {
      const [series, kpis] = await Promise.all([
        hgFetchAttendance(year),
        hgFetchKpis(year),
      ]);

      if (kpis?.error) {
        console.warn("KPI error:", kpis.error);
        return;
      }

      // If year is specified, show filtered view
      if (year) {
        // Get all data for comparison
        const allData = await hgFetchAttendance();
        hgUpdateFilteredKPIs(allData, year);
      } else {
        // Show all-time view (original behavior)
        hgSetText("kpiAvgPerGameLabel", "Total Growth");
        hgSetText("kpiTotalSeasonLabel", "Avg YoY Growth");
        hgSetText("kpiGrowthSeasonLabel", "Peak Year");
        hgSetText("kpiAvgGrowthLabel", "Biggest Jump");

        // absolute KPIs
        hgSetText("kpiAvgPerGame", hgFormatNumber(kpis.total_growth));
        hgSetText("kpiAvgPerGameYear", `${kpis.range.start_year} - ${kpis.range.end_year}`);
        hgSetText("kpiTotalSeason", hgFormatNumber(kpis.avg_yoy_growth));
        hgSetText("kpiTotalSeasonYear", "Average across all years");
        hgSetText("kpiGrowthSeason", kpis.peak_year ?? "—");
        hgSetText("kpiGrowthSeasonYear", "");
        hgSetText("kpiGrowthSeasonPct", "");

        if (kpis.biggest_jump) {
          hgSetText("kpiAvgGrowth", `${kpis.biggest_jump.from_year}→${kpis.biggest_jump.to_year}`);
          const allDataForJump = await hgFetchAttendance();
          const prev = allDataForJump.find(d => Number(d.season_year) === kpis.biggest_jump.from_year);
          const curr = allDataForJump.find(d => Number(d.season_year) === kpis.biggest_jump.to_year);
          if (prev && curr) {
            hgSetText("kpiAvgGrowthPct", hgFormatPct(hgPctChange(prev.total_attendance, curr.total_attendance)));
          } else {
            hgSetText("kpiAvgGrowthPct", "—");
          }
        } else {
          hgSetText("kpiAvgGrowth", "—");
          hgSetText("kpiAvgGrowthPct", "—");
        }

        // percent KPIs computed from series
        const totals = series
          .filter((r) => r.total_attendance != null)
          .sort((a, b) => Number(a.season_year) - Number(b.season_year));

        if (totals.length >= 2) {
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
      }

      console.log("HerGrowth soccer data loaded ✅");
    } catch (err) {
      console.error("HerGrowth API load failed:", err);
    }
  }

  // Filter functionality
  function hgRenderFilteredData(year, metric) {
    if (!year || metric !== "attendance") {
      // If no year selected or metric is not attendance, show all data
      hgRenderSoccerData();
      return;
    }

    const yearNum = parseInt(year);
    hgRenderSoccerData(yearNum);
  }

  // Update KPI display for filtered view
  function hgUpdateFilteredKPIs(data, year) {
    if (!data || data.length === 0) {
      console.warn("No data for year:", year);
      return;
    }

    const yearData = data.find(d => Number(d.season_year) === year);
    if (!yearData) {
      console.warn("Year data not found:", year);
      return;
    }

    // Average per game
    hgSetText("kpiAvgPerGame", hgFormatNumber(yearData.avg_attendance));
    hgSetText("kpiAvgPerGameYear", `Season ${year}`);
    hgSetText("kpiAvgPerGameLabel", "Average Per Game");

    // Total for season
    hgSetText("kpiTotalSeason", hgFormatNumber(yearData.total_attendance));
    hgSetText("kpiTotalSeasonYear", `Season ${year}`);
    hgSetText("kpiTotalSeasonLabel", "Total for Season");

    // Growth this season (compared to previous year)
    const sortedData = data
      .filter(d => d.total_attendance != null)
      .sort((a, b) => Number(a.season_year) - Number(b.season_year));
    
    const currentIndex = sortedData.findIndex(d => Number(d.season_year) === year);
    if (currentIndex > 0) {
      const prevYear = sortedData[currentIndex - 1];
      const growth = yearData.total_attendance - prevYear.total_attendance;
      const growthPct = hgPctChange(prevYear.total_attendance, yearData.total_attendance);
      
      hgSetText("kpiGrowthSeason", hgFormatNumber(growth));
      hgSetText("kpiGrowthSeasonPct", hgFormatPct(growthPct));
      hgSetText("kpiGrowthSeasonYear", `vs ${prevYear.season_year}`);
      hgSetText("kpiGrowthSeasonLabel", "Growth This Season");
    } else {
      hgSetText("kpiGrowthSeason", "—");
      hgSetText("kpiGrowthSeasonPct", "—");
      hgSetText("kpiGrowthSeasonYear", "First season");
      hgSetText("kpiGrowthSeasonLabel", "Growth This Season");
    }

    // Average growth (calculate from all data)
    if (sortedData.length >= 2) {
      const yoyPcts = [];
      for (let i = 1; i < sortedData.length; i++) {
        const p = hgPctChange(
          sortedData[i - 1].total_attendance,
          sortedData[i].total_attendance
        );
        if (p !== null) yoyPcts.push(p);
      }
      const avgPct = yoyPcts.length > 0
        ? yoyPcts.reduce((a, b) => a + b, 0) / yoyPcts.length
        : null;
      
      const avgGrowth = sortedData.length > 1
        ? (sortedData[sortedData.length - 1].total_attendance - sortedData[0].total_attendance) / (sortedData.length - 1)
        : null;

      hgSetText("kpiAvgGrowth", hgFormatNumber(avgGrowth));
      hgSetText("kpiAvgGrowthPct", hgFormatPct(avgPct));
      hgSetText("kpiAvgGrowthLabel", "Average Growth");
    }
  }


  // Populate year dropdown dynamically
  async function hgPopulateYearDropdown() {
    const yearFilter = document.getElementById("yearFilter");
    if (!yearFilter) return;

    try {
      const data = await hgFetchAttendance();
      const years = data
        .map(d => Number(d.season_year))
        .filter(y => !isNaN(y))
        .sort((a, b) => b - a); // Descending order

      // Clear existing options except "Total (All Years)"
      yearFilter.innerHTML = '<option value="">Total (All Years)</option>';
      
      // Add year options
      years.forEach(year => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
      });
    } catch (err) {
      console.error("Failed to populate year dropdown:", err);
    }
  }

  // Set up metric filter selection
  function hgSetupMetricFilters() {
    const metricFilters = document.querySelectorAll(".metric-filter");
    metricFilters.forEach(button => {
      button.addEventListener("click", function() {
        // Only allow one metric selected at a time
        metricFilters.forEach(btn => {
          btn.classList.remove("selected", "bg-indigo-600", "text-white", "shadow-md");
          btn.classList.add("bg-gray-100", "text-gray-700");
        });
        
        // Select clicked button
        this.classList.add("selected", "bg-indigo-600", "text-white", "shadow-md");
        this.classList.remove("bg-gray-100", "text-gray-700");
      });
    });
  }

  // auto-run only on soccer page (KPI section exists)
  if (document.getElementById("kpiAvgPerGame")) {
    hgRenderSoccerData();
    hgPopulateYearDropdown();
    hgSetupMetricFilters();
    
    // Set up filter button handler
    const applyButton = document.getElementById("applyFilter");
    const yearFilter = document.getElementById("yearFilter");
    
    if (applyButton) {
      applyButton.addEventListener("click", function() {
        const selectedYear = yearFilter.value;
        const selectedMetric = document.querySelector(".metric-filter.selected");
        const metric = selectedMetric 
          ? selectedMetric.getAttribute("data-metric") 
          : "attendance";
        
        hgRenderFilteredData(selectedYear, metric);
      });
    }
  }
});
