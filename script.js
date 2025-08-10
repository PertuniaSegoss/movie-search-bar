const amountInput = document.getElementById("amount");
const fromCurrency = document.getElementById("from");
const toCurrency = document.getElementById("to");
const convertBtn = document.getElementById("convertBtn");
const resultDiv = document.getElementById("result");
const loadingSpinner = document.getElementById("loadingSpinner");
const converterCard = document.getElementById("converter-card");
const ctx = document.getElementById("historyChart").getContext("2d");
let chart; // Chart.js instance

// Populate currencies dropdown from Frankfurter API
async function loadCurrencies() {
  try {
    const res = await fetch("https://api.frankfurter.app/currencies");
    const data = await res.json();

    for (const code in data) {
      const optionFrom = document.createElement("option");
      optionFrom.value = code;
      optionFrom.textContent = `${code} - ${data[code]}`;
      fromCurrency.appendChild(optionFrom);

      const optionTo = optionFrom.cloneNode(true);
      toCurrency.appendChild(optionTo);
    }

    // Set defaults
    fromCurrency.value = "USD";
    toCurrency.value = "EUR";
    updateBackground();
  } catch (err) {
    resultDiv.textContent = "Failed to load currencies.";
  }
}

// Show/hide spinner
function showSpinner() {
  loadingSpinner.style.display = "block";
}
function hideSpinner() {
  loadingSpinner.style.display = "none";
}

// Update dynamic background color by fromCurrency
function updateBackground() {
  const from = fromCurrency.value;
  converterCard.className = ""; // reset
  converterCard.classList.add("bg-" + from);
}

// Convert currency using Frankfurter API
async function convertCurrency() {
  const amount = parseFloat(amountInput.value);
  const from = fromCurrency.value;
  const to = toCurrency.value;

  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }
  if (from === to) {
    alert("Please select two different currencies.");
    return;
  }

  showSpinner();
  resultDiv.textContent = "";

  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`
    );
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    const converted = data.rates[to];

    resultDiv.textContent = `${amount} ${from} = ${converted.toFixed(4)} ${to}`;
    fetchHistory(from, to);
  } catch (err) {
    resultDiv.textContent = "Conversion failed, please try again.";
    clearChart();
  } finally {
    hideSpinner();
  }
}

// Fetch 7-day historical exchange rates and display chart
async function fetchHistory(from, to) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);

  const formatDate = (d) => d.toISOString().split("T")[0];

  showSpinner();

  try {
    const res = await fetch(
      `https://api.frankfurter.app/${formatDate(startDate)}..${formatDate(
        endDate
      )}?from=${from}&to=${to}`
    );
    if (!res.ok) throw new Error("History API error");
    const data = await res.json();

    const labels = [];
    const rates = [];

    // Sort dates to be chronological
    const sortedDates = Object.keys(data.rates).sort();

    sortedDates.forEach((date) => {
      labels.push(date);
      rates.push(data.rates[date][to]);
    });

    renderChart(labels, rates, from, to);
  } catch (err) {
    clearChart();
  } finally {
    hideSpinner();
  }
}

// Render Chart.js line chart
function renderChart(labels, dataPoints, from, to) {
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Exchange Rate: 1 ${from} to ${to}`,
          data: dataPoints,
          fill: true,
          backgroundColor: "rgba(255,77,136,0.2)",
          borderColor: "#ff4d88",
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      animation: { duration: 600 },
      scales: {
        y: {
          beginAtZero: false,
          ticks: { color: "#ff4d88" },
          grid: { color: "#ffd0de" },
        },
        x: {
          ticks: { color: "#ff4d88" },
          grid: { color: "#ffd0de" },
        },
      },
      plugins: {
        legend: { labels: { color: "#ff4d88", font: { weight: "bold" } } },
      },
    },
  });
}

// Clear chart
function clearChart() {
  if (chart) {
    chart.destroy();
    chart = null;
  }
}

// Event listeners
fromCurrency.addEventListener("change", () => {
  updateBackground();
});

convertBtn.addEventListener("click", convertCurrency);

// Initialize
loadCurrencies();
