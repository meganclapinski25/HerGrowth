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

  function hgSetTextWithColor(id, value, isPercentage = false) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
    
    // Remove existing color classes
    el.classList.remove("text-green-600", "text-red-600", "text-gray-900");
    
    // If value is "—" or empty, use default color
    if (value === "—" || value === "" || value === null || value === undefined) {
      el.classList.add("text-gray-900");
      return;
    }
    
    // Parse the numeric value
    let numValue = null;
    if (isPercentage) {
      // For percentages, extract the number (remove +, %, etc.)
      const match = String(value).match(/([+-]?\d+\.?\d*)/);
      if (match) {
        numValue = parseFloat(match[1]);
      }
    } else {
      // For absolute values, try to parse directly
      numValue = parseFloat(String(value).replace(/,/g, ""));
    }
    
    // Apply color based on sign
    if (numValue !== null && !isNaN(numValue)) {
      if (numValue < 0) {
        el.classList.add("text-red-600");
      } else if (numValue > 0) {
        el.classList.add("text-green-600");
      } else {
        el.classList.add("text-gray-900");
      }
    } else {
      el.classList.add("text-gray-900");
    }
  }

  function hgPctChange(prev, curr) {
    if (prev === null || prev === undefined) return null;
    if (curr === null || curr === undefined) return null;
    if (Number(prev) === 0) return null;
    return ((Number(curr) - Number(prev)) / Number(prev)) * 100;
  }

  // Update chart title based on metric
  function hgUpdateChartTitle(metric) {
    const chartTitleEl = document.getElementById("chartTitle");
    if (chartTitleEl) {
      if (metric === "viewership") {
        chartTitleEl.textContent = "Viewership Over Years";
      } else {
        chartTitleEl.textContent = "Attendance Over Years";
      }
    }
  }

  // Draw attendance chart with all years
  function drawAttendanceChart(data, metric = "attendance") {
    const svg = document.getElementById("attendanceChart");
    if (!svg) {
      console.warn("Chart SVG not found");
      return;
    }
    
    // Update chart title
    hgUpdateChartTitle(metric);

    if (!data || data.length === 0) {
      console.warn("No data to draw chart");
      return;
    }

    // Chart dimensions
    const padding = { top: 50, right: 60, bottom: 50, left: 60 };
    const width = 800;
    const height = 400;
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear existing dynamic elements (keep defs and static elements)
    const existingElements = svg.querySelectorAll("#areaPath, #linePath, .data-point, .year-label, .grid-line");
    existingElements.forEach(el => el.remove());

    // Find min/max values for scaling
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1; // Avoid division by zero

    // Scale functions
    const xScale = (index) => padding.left + (index / (data.length - 1)) * chartWidth;
    const yScale = (value) => padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

    // Create area path
    let areaPath = `M ${xScale(0)} ${yScale(0)} L ${xScale(0)} ${height - padding.bottom}`;
    let linePath = `M ${xScale(0)} ${yScale(data[0].value)}`;

    data.forEach((d, i) => {
      const x = xScale(i);
      const y = yScale(d.value);
      areaPath += ` L ${x} ${y}`;
      linePath += ` L ${x} ${y}`;
    });

    areaPath += ` L ${xScale(data.length - 1)} ${height - padding.bottom} Z`;
    
    // Create area path element with dark theme gradient
    const areaPathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    areaPathEl.setAttribute("id", "areaPath");
    areaPathEl.setAttribute("d", areaPath);
    areaPathEl.setAttribute("fill", "url(#areaGradient)");
    areaPathEl.setAttribute("stroke", "none");
    svg.appendChild(areaPathEl);

    // Create line path element
    const linePathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    linePathEl.setAttribute("id", "linePath");
    linePathEl.setAttribute("d", linePath);
    linePathEl.setAttribute("fill", "none");
    linePathEl.setAttribute("stroke", "#60a5fa");
    linePathEl.setAttribute("stroke-width", "3");
    linePathEl.setAttribute("stroke-linecap", "round");
    linePathEl.setAttribute("stroke-linejoin", "round");
    svg.appendChild(linePathEl);

    // Draw data points and year labels
    data.forEach((d, i) => {
      const x = xScale(i);
      const y = yScale(d.value);

      // Data point circle
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("class", "data-point");
      circle.setAttribute("cx", x);
      circle.setAttribute("cy", y);
      circle.setAttribute("r", "4");
      circle.setAttribute("fill", "#60a5fa");
      svg.appendChild(circle);

      // Year label
      const yearLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      yearLabel.setAttribute("class", "year-label");
      yearLabel.setAttribute("x", x);
      yearLabel.setAttribute("y", height - padding.bottom + 20);
      yearLabel.setAttribute("fill", "#9ca3af");
      yearLabel.setAttribute("font-size", "12");
      yearLabel.setAttribute("font-family", "Poppins");
      yearLabel.setAttribute("text-anchor", "middle");
      yearLabel.textContent = d.year;
      svg.appendChild(yearLabel);
    });

    console.log("Chart drawn with", data.length, "data points");
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
      // If year is specified, show filtered view
      if (year) {
        console.log("Filtering by year:", year);
        // Get all data for comparison (don't filter the API call)
        const allData = await hgFetchAttendance();
        console.log("All data fetched:", allData);
        hgUpdateFilteredKPIs(allData, year);
        
        // Draw chart with all years (chart always shows all data)
        const chartData = allData
          .filter(d => d.total_attendance != null)
          .sort((a, b) => Number(a.season_year) - Number(b.season_year))
          .map(d => ({
            year: Number(d.season_year),
            value: Number(d.total_attendance),
          }));
        
        if (chartData.length >= 2) {
          drawAttendanceChart(chartData, "attendance");
        }
        
        return; // Exit early, we've handled the filtered view
      }
      
      // For all-time view, fetch both series and KPIs
      const [series, kpis] = await Promise.all([
        hgFetchAttendance(),
        hgFetchKpis(),
      ]);

      if (kpis?.error) {
        console.warn("KPI error:", kpis.error);
        return;
      }

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
      const peakYearEl = document.getElementById("kpiGrowthSeason");
      if (peakYearEl) {
        peakYearEl.textContent = kpis.peak_year ?? "—";
        peakYearEl.style.color = "#f9fafb";
      }
      hgSetText("kpiGrowthSeasonYear", "");
      hgSetText("kpiGrowthSeasonPct", "");

      if (kpis.biggest_jump) {
        const biggestJumpEl = document.getElementById("kpiAvgGrowth");
        if (biggestJumpEl) {
          biggestJumpEl.textContent = `${kpis.biggest_jump.from_year}→${kpis.biggest_jump.to_year}`;
          biggestJumpEl.style.color = "#f9fafb";
        }
        const allDataForJump = await hgFetchAttendance();
        const prev = allDataForJump.find(d => Number(d.season_year) === kpis.biggest_jump.from_year);
        const curr = allDataForJump.find(d => Number(d.season_year) === kpis.biggest_jump.to_year);
        if (prev && curr) {
          hgSetTextWithColor("kpiAvgGrowthPct", hgFormatPct(hgPctChange(prev.total_attendance, curr.total_attendance)), true);
        } else {
          hgSetTextWithColor("kpiAvgGrowthPct", "—", true);
        }
      } else {
        const biggestJumpEl2 = document.getElementById("kpiAvgGrowth");
        if (biggestJumpEl2) {
          biggestJumpEl2.textContent = "—";
          biggestJumpEl2.style.color = "#f9fafb";
        }
        hgSetTextWithColor("kpiAvgGrowthPct", "—", true);
      }

      // percent KPIs computed from series
      const totals = series
        .filter((r) => r.total_attendance != null)
        .sort((a, b) => Number(a.season_year) - Number(b.season_year));

      if (totals.length >= 2) {
        // chart data - use ALL years
        const chartData = totals.map((d) => ({
          year: Number(d.season_year),
          value: Number(d.total_attendance),
        }));

        // Draw chart with all data
        drawAttendanceChart(chartData, "attendance");
      }

      console.log("HerGrowth soccer data loaded ✅");
    } catch (err) {
      console.error("HerGrowth API load failed:", err);
    }
  }

  // Fetch viewership data
  async function hgFetchViewership(year = null) {
    const url = year 
      ? `${API_BASE}/metrics/viewership/nwsl?year=${year}`
      : `${API_BASE}/metrics/viewership/nwsl`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  }

  // Update KPI display for filtered viewership
  function hgUpdateFilteredKPIsForViewership(data, year) {
    console.log("Updating filtered viewership KPIs for year:", year, "Data:", data);
    
    if (!data || data.length === 0) {
      console.warn("No viewership data available");
      return;
    }

    const yearNum = Number(year);
    const yearData = data.find(d => Number(d.season_year) === yearNum);
    
    if (!yearData) {
      console.warn("Year viewership data not found for year:", yearNum, "Available years:", data.map(d => d.season_year));
      return;
    }
    
    console.log("Found year viewership data:", yearData);

    // Sort data by year - use total_viewership if available, otherwise avg_viewership
    const sortedData = data
      .map(d => ({
        ...d,
        value: d.total_viewership != null ? d.total_viewership : d.avg_viewership
      }))
      .filter(d => d.value != null)
      .sort((a, b) => Number(a.season_year) - Number(b.season_year));

    // Get the value for the selected year (total_viewership preferred, avg_viewership as fallback)
    const yearValue = yearData.total_viewership != null ? yearData.total_viewership : yearData.avg_viewership;

    // 1. Average per game/match for that season
    hgSetText("kpiAvgPerGame", hgFormatNumber(yearData.avg_viewership || yearData.total_viewership || "—"));
    hgSetText("kpiAvgPerGameYear", `Season ${year}`);
    hgSetText("kpiAvgPerGameLabel", "Average Per Match");

    // 2. Total for that season
    hgSetText("kpiTotalSeason", hgFormatNumber(yearData.total_viewership || yearData.avg_viewership || "—"));
    hgSetText("kpiTotalSeasonYear", `Season ${year}`);
    hgSetText("kpiTotalSeasonLabel", "Total for Season");

    // 3. Total Growth (from first year to selected year)
    if (sortedData.length > 0 && yearValue != null) {
      const firstYear = sortedData[0];
      const totalGrowth = yearValue - firstYear.value;
      const totalGrowthPct = hgPctChange(firstYear.value, yearValue);
      
      hgSetTextWithColor("kpiGrowthSeason", hgFormatNumber(totalGrowth), false);
      hgSetTextWithColor("kpiGrowthSeasonPct", hgFormatPct(totalGrowthPct), true);
      hgSetText("kpiGrowthSeasonYear", `Since ${firstYear.season_year}`);
      hgSetText("kpiGrowthSeasonLabel", "Total Growth");
    } else {
      hgSetTextWithColor("kpiGrowthSeason", "—", false);
      hgSetTextWithColor("kpiGrowthSeasonPct", "—", true);
      hgSetText("kpiGrowthSeasonYear", "No data");
      hgSetText("kpiGrowthSeasonLabel", "Total Growth");
    }

    // 4. YoY Growth (Year-over-Year growth for that specific year)
    const currentIndex = sortedData.findIndex(d => Number(d.season_year) === year);
    if (currentIndex > 0 && yearValue != null) {
      const prevYear = sortedData[currentIndex - 1];
      const yoyGrowth = yearValue - prevYear.value;
      const yoyGrowthPct = hgPctChange(prevYear.value, yearValue);
      
      hgSetTextWithColor("kpiAvgGrowth", hgFormatNumber(yoyGrowth), false);
      hgSetTextWithColor("kpiAvgGrowthPct", hgFormatPct(yoyGrowthPct), true);
      hgSetText("kpiAvgGrowthYear", `vs ${prevYear.season_year}`);
      hgSetText("kpiAvgGrowthLabel", "YoY Growth");
    } else {
      // First year, no previous year to compare
      hgSetTextWithColor("kpiAvgGrowth", "—", false);
      hgSetTextWithColor("kpiAvgGrowthPct", "—", true);
      hgSetText("kpiAvgGrowthYear", "First season");
      hgSetText("kpiAvgGrowthLabel", "YoY Growth");
    }
  }

  // Filter functionality
  function hgRenderFilteredData(year, metric) {
    console.log("Filter applied - Year:", year, "Metric:", metric);
    
    // Default to attendance if no metric specified
    const selectedMetric = metric || "attendance";
    
    // If no year selected, show all data for the selected metric
    if (!year || year === "") {
      console.log("No year selected, showing all data for metric:", selectedMetric);
      
      if (selectedMetric === "viewership") {
        // Fetch all viewership data and show chart
        hgFetchViewership().then(allData => {
          // Update KPIs to show all-time viewership summary (similar to attendance)
          const sortedData = allData
            .map(d => ({
              ...d,
              value: d.total_viewership != null ? d.total_viewership : d.avg_viewership
            }))
            .filter(d => d.value != null)
            .sort((a, b) => Number(a.season_year) - Number(b.season_year));
          
          if (sortedData.length >= 2) {
            const first = sortedData[0];
            const last = sortedData[sortedData.length - 1];
            const totalGrowth = last.value - first.value;
            
            // Calculate YoY growth
            const yoy = [];
            for (let i = 1; i < sortedData.length; i++) {
              yoy.push(sortedData[i].value - sortedData[i - 1].value);
            }
            const avgYoy = yoy.length > 0 ? yoy.reduce((a, b) => a + b, 0) / yoy.length : 0;
            
            const peak = sortedData.reduce((max, d) => d.value > max.value ? d : max, sortedData[0]);
            const biggestJump = sortedData.reduce((max, d, i) => {
              if (i === 0) return max;
              const jump = d.value - sortedData[i - 1].value;
              return jump > max.jump ? { jump, from: sortedData[i - 1].season_year, to: d.season_year } : max;
            }, { jump: -Infinity, from: null, to: null });
            
            // Update KPIs for all-time view
            hgSetText("kpiAvgPerGameLabel", "Total Growth");
            hgSetText("kpiTotalSeasonLabel", "Avg YoY Growth");
            hgSetText("kpiGrowthSeasonLabel", "Peak Year");
            hgSetText("kpiAvgGrowthLabel", "Biggest Jump");
            
            hgSetText("kpiAvgPerGame", hgFormatNumber(totalGrowth));
            hgSetText("kpiAvgPerGameYear", `${first.season_year} - ${last.season_year}`);
            hgSetText("kpiTotalSeason", hgFormatNumber(Math.round(avgYoy)));
            hgSetText("kpiTotalSeasonYear", "Average across all years");
            
            const peakYearEl = document.getElementById("kpiGrowthSeason");
            if (peakYearEl) {
              peakYearEl.textContent = peak.season_year ?? "—";
              peakYearEl.style.color = "#f9fafb";
            }
            hgSetText("kpiGrowthSeasonYear", "");
            hgSetText("kpiGrowthSeasonPct", "");
            
            if (biggestJump.from) {
              const biggestJumpEl = document.getElementById("kpiAvgGrowth");
              if (biggestJumpEl) {
                biggestJumpEl.textContent = `${biggestJump.from}→${biggestJump.to}`;
                biggestJumpEl.style.color = "#f9fafb";
              }
              const prevVal = sortedData.find(d => Number(d.season_year) === biggestJump.from)?.value;
              const currVal = sortedData.find(d => Number(d.season_year) === biggestJump.to)?.value;
              if (prevVal && currVal) {
                hgSetTextWithColor("kpiAvgGrowthPct", hgFormatPct(hgPctChange(prevVal, currVal)), true);
              } else {
                hgSetTextWithColor("kpiAvgGrowthPct", "—", true);
              }
            } else {
              const biggestJumpEl2 = document.getElementById("kpiAvgGrowth");
              if (biggestJumpEl2) {
                biggestJumpEl2.textContent = "—";
                biggestJumpEl2.style.color = "#f9fafb";
              }
              hgSetTextWithColor("kpiAvgGrowthPct", "—", true);
            }
            
            // Draw chart with all viewership data
            const chartData = sortedData.map((d) => ({
              year: Number(d.season_year),
              value: Number(d.value),
            }));
            drawAttendanceChart(chartData, "viewership");
          }
        }).catch(err => {
          console.error("Failed to fetch viewership:", err);
        });
      } else {
        // Default to attendance
        hgRenderSoccerData();
      }
      return;
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum)) {
      console.error("Invalid year:", year);
      return;
    }
    
    console.log("Rendering data for year:", yearNum, "metric:", selectedMetric);
    
    if (selectedMetric === "viewership") {
      // Fetch viewership data and update KPIs
      hgFetchViewership().then(allData => {
        hgUpdateFilteredKPIsForViewership(allData, yearNum);
        
        // Draw chart with all viewership data (chart always shows all years)
        const sortedData = allData
          .map(d => ({
            ...d,
            value: d.total_viewership != null ? d.total_viewership : d.avg_viewership
          }))
          .filter(d => d.value != null)
          .sort((a, b) => Number(a.season_year) - Number(b.season_year));
        
        if (sortedData.length >= 2) {
          const chartData = sortedData.map((d) => ({
            year: Number(d.season_year),
            value: Number(d.value),
          }));
          drawAttendanceChart(chartData, "viewership");
        }
      }).catch(err => {
        console.error("Failed to fetch viewership:", err);
      });
    } else {
      // Default to attendance
      hgRenderSoccerData(yearNum);
    }
  }

  // Update KPI display for filtered view
  function hgUpdateFilteredKPIs(data, year) {
    console.log("Updating filtered KPIs for year:", year, "Data:", data);
    
    if (!data || data.length === 0) {
      console.warn("No data available");
      return;
    }

    const yearNum = Number(year);
    const yearData = data.find(d => Number(d.season_year) === yearNum);
    
    if (!yearData) {
      console.warn("Year data not found for year:", yearNum, "Available years:", data.map(d => d.season_year));
      return;
    }
    
    console.log("Found year data:", yearData);

    // Sort data by year
    const sortedData = data
      .filter(d => d.total_attendance != null)
      .sort((a, b) => Number(a.season_year) - Number(b.season_year));

    // 1. Average per game for that season
    hgSetText("kpiAvgPerGame", hgFormatNumber(yearData.avg_attendance));
    hgSetText("kpiAvgPerGameYear", `Season ${year}`);
    hgSetText("kpiAvgPerGameLabel", "Average Per Game");

    // 2. Total for that season
    hgSetText("kpiTotalSeason", hgFormatNumber(yearData.total_attendance));
    hgSetText("kpiTotalSeasonYear", `Season ${year}`);
    hgSetText("kpiTotalSeasonLabel", "Total for Season");

      // 3. Total Growth (from first year to selected year)
      if (sortedData.length > 0) {
        const firstYear = sortedData[0];
        const totalGrowth = yearData.total_attendance - firstYear.total_attendance;
        const totalGrowthPct = hgPctChange(firstYear.total_attendance, yearData.total_attendance);
        
        hgSetTextWithColor("kpiGrowthSeason", hgFormatNumber(totalGrowth), false);
        hgSetTextWithColor("kpiGrowthSeasonPct", hgFormatPct(totalGrowthPct), true);
        hgSetText("kpiGrowthSeasonYear", `Since ${firstYear.season_year}`);
        hgSetText("kpiGrowthSeasonLabel", "Total Growth");
      } else {
        hgSetTextWithColor("kpiGrowthSeason", "—", false);
        hgSetTextWithColor("kpiGrowthSeasonPct", "—", true);
        hgSetText("kpiGrowthSeasonYear", "No data");
        hgSetText("kpiGrowthSeasonLabel", "Total Growth");
      }

      // 4. YoY Growth (Year-over-Year growth for that specific year)
      const currentIndex = sortedData.findIndex(d => Number(d.season_year) === year);
      if (currentIndex > 0) {
        const prevYear = sortedData[currentIndex - 1];
        const yoyGrowth = yearData.total_attendance - prevYear.total_attendance;
        const yoyGrowthPct = hgPctChange(prevYear.total_attendance, yearData.total_attendance);
        
        hgSetTextWithColor("kpiAvgGrowth", hgFormatNumber(yoyGrowth), false);
        hgSetTextWithColor("kpiAvgGrowthPct", hgFormatPct(yoyGrowthPct), true);
        hgSetText("kpiAvgGrowthYear", `vs ${prevYear.season_year}`);
        hgSetText("kpiAvgGrowthLabel", "YoY Growth");
      } else {
        // First year, no previous year to compare
        hgSetTextWithColor("kpiAvgGrowth", "—", false);
        hgSetTextWithColor("kpiAvgGrowthPct", "—", true);
        hgSetText("kpiAvgGrowthYear", "First season");
        hgSetText("kpiAvgGrowthLabel", "YoY Growth");
      }
  }


  // Populate year dropdown dynamically
  async function hgPopulateYearDropdown() {
    const yearFilter = document.getElementById("yearFilter");
    if (!yearFilter) {
      console.error("Year filter dropdown not found!");
      return;
    }

    try {
      const data = await hgFetchAttendance();
      console.log("Fetched data for year dropdown:", data);
      
      const years = data
        .map(d => Number(d.season_year))
        .filter(y => !isNaN(y))
        .sort((a, b) => b - a); // Descending order

      console.log("Available years:", years);

      // Clear existing options except "Total (All Years)"
      yearFilter.innerHTML = '<option value="">Total (All Years)</option>';
      
      // Add year options
      years.forEach(year => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
      });
      
      console.log("Year dropdown populated with", years.length, "years");
    } catch (err) {
      console.error("Failed to populate year dropdown:", err);
    }
  }

  // Set up metric filter selection
  function hgSetupMetricFilters() {
    const metricFilters = document.querySelectorAll(".metric-filter");
    
    // Auto-select attendance by default
    const attendanceButton = Array.from(metricFilters).find(btn => 
      btn.getAttribute("data-metric") === "attendance"
    );
    if (attendanceButton) {
      attendanceButton.classList.add("selected", "bg-indigo-600", "text-white", "shadow-md");
      attendanceButton.classList.remove("bg-gray-100", "text-gray-700");
    }
    
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
        const selectedYear = yearFilter ? yearFilter.value : "";
        const selectedMetric = document.querySelector(".metric-filter.selected");
        const metric = selectedMetric 
          ? selectedMetric.getAttribute("data-metric") 
          : "attendance";
        
        console.log("Apply button clicked - Year:", selectedYear, "Metric:", metric);
        hgRenderFilteredData(selectedYear, metric);
      });
    } else {
      console.error("Apply button not found!");
    }
  }
});
