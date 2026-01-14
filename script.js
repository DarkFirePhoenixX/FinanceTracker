/* ---------------- ТАБОВЕ ---------------- */
function openTab(evt, tabId) {
    document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
    document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));

    evt.target.classList.add("active");
    document.getElementById(tabId).classList.add("active");
    localStorage.setItem("currentTab", tabId);
}

let selectedChartMonth = new Date().getMonth(); // 0–11
let selectedChartYear = new Date().getFullYear();

const now = new Date();
const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // last day

const chartPicker = flatpickr("#chartPeriodPicker", {
    locale: "bg",
    mode: "range",
    dateFormat: "m-Y",
    rangeSeparator: " - ",
    defaultDate: [firstOfMonth, lastOfMonth],
    plugins: [
        new monthSelectPlugin({
            shorthand: false,
            dateFormat: "F Yг.",
            altFormat: "F Y",
            altInput: true,
        }),
    ],
    onChange: function (dates, dateStr, instance) {
        instance.element.value = dateStr.replace('to', '-');

        if (dates.length === 2) {
            periodStart = dates[0];
            periodEnd = dates[1];
            updateAllCharts();

            const value = instance.element.value;

            if (value.includes("-")) {
                document.querySelector(".headTitle").innerText =
                    "Приходи / Разходи за периода ";
                document.querySelector(".headMonth").innerText =
                    value + " 📈📉";
                // document.getElementById("incomeMonthTotal").innerText = "Приходи за текущия период: ";
                // document.getElementById("expenseMonthTotal").innerText = "Разходи за текущия период: ";
            } else {
                document.querySelector(".headTitle").innerText =
                    "Приходи / Разходи през месец ";
                document.querySelector(".headMonth").innerText =
                    value + monthEmojiValueShow();
                // document.getElementById("incomeMonthTotal").innerText = "Приходи за текущия месец: ";
                // document.getElementById("expenseMonthTotal").innerText = "Разходи за текущия период: ";
            }
            updatePeriodIncomeUI();
            updatePeriodExpenseUI();
            updateIncomeTable();
            updateTable();
            autoSortTables();

            localStorage.setItem("period", value);
        }
    }
});

/* ---------------- ДАННИ ---------------- */
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
// let subcategories =
//   JSON.parse(localStorage.getItem("subcategories")) || {};
let incomes = JSON.parse(localStorage.getItem("incomes")) || [];
let forecastPlans = JSON.parse(localStorage.getItem("forecasts")) || [];

let chart;
let compareChart;
let editIndex = null;
let editIncomeIndex = null;

function currentMonth() {
    return new Date().getMonth();
}

function saveAll() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
    // localStorage.setItem("subcategories", JSON.stringify(subcategories));
    localStorage.setItem("incomes", JSON.stringify(incomes));
    localStorage.setItem("forecasts", JSON.stringify(forecastPlans));
    updatePeriodExpenseUI();
}

let originalScroll = 0;
/* ---------------- ДОХОДИ ---------------- */

function addIncome() {
    const name = document.getElementById("incomeName").value;
    const amount = parseFloat(
        document.getElementById("incomeAmount").value
    );
    const date = document.getElementById("incomeDate").value;
    const incomePaymentStyle = document.getElementById("incomePaymentStyle").value;

    if (!name || isNaN(amount) || !date || !incomePaymentStyle) return;

    // Convert DD-MM-YYYY → JS Date
    const [day, monthStr, year] = date.split(".");
    const month = parseInt(monthStr, 10) - 1; // JS months 0–11

    if (editIncomeIndex !== null) {
        incomes[editIncomeIndex] = { date, name, amount, month, incomePaymentStyle };
        editIncomeIndex = null;
    } else {
        incomes.push({ date, name, amount, month, incomePaymentStyle });
    }

    saveAll();

    document.getElementById("incomeName").value = "";
    document.getElementById("incomeAmount").value = "";
    document.getElementById("incomeDate").value = "";
    document.getElementById("incomePaymentStyle").value = "Брой 💶";

    updateIncomeTable();
    updateIncomeTotal();
    updateBalance();
    updateCompareChart();
    incomeHeader.classList.add("asc");
    incomeHeader.click();
    showPopup("Данните бяха запазени успешно!");
}

function updateIncomeTable() {
    const tbody = document.querySelector("#incomeTable tbody");
    tbody.innerHTML = "";

    incomes.forEach((inc, index) => {
        const visible = isDateInPeriod(inc.date);
        const style = visible ? "" : "display:none;";

        tbody.innerHTML += `
      <tr style="${style}">
        <td style="font-weight:400; color: darkblue;">${inc.date}</td>
        <td style="font-weight:400;">${inc.name} 💶</td>
        <td class="income">+${inc.amount.toFixed(2)} EUR</td>
        <td style="font-weight:500;">${inc.incomePaymentStyle}</td>
        <td>
          <button class="edit-btn" onclick="editIncome(${index})">Редактирай ✏️</button>
          <button class="delete-btn" onclick="deleteIncome(${index})">Премахни 🗑️</button>
        </td>
      </tr>`;
    });
}


function editIncome(index) {
    originalScroll = window.scrollY;
    const inc = incomes[index];
    document.getElementById("incomeDate").value = inc.date;
    document.getElementById("incomeName").value = inc.name;
    document.getElementById("incomeAmount").value = inc.amount;
    document.getElementById("incomePaymentStyle").value = inc.incomePaymentStyle;
    editIncomeIndex = index;
    incomeHeader.classList.add("asc");
    incomeHeader.click();
    document.getElementById("incomeName").scrollIntoView({
        behavior: "smooth",
        block: "center",
    });
}

function deleteIncome(index) {
    incomes.splice(index, 1);
    saveAll();
    updateIncomeTable();
    updateIncomeTotal();
    updateBalance();
    updateCompareChart();
    incomeHeader.classList.add("asc");
    incomeHeader.click();
}

function updateIncomeTotal() {
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    document.getElementById("incomeTotal").textContent =
        "Общо приходи: " + totalIncome.toFixed(2) + " EUR";
}

/* ---------------- ПОДКАТЕГОРИИ ---------------- */

// document
//   .getElementById("category")
//   .addEventListener("change", loadSubcategories);

// function loadSubcategories() {
//   const category = document.getElementById("category").value;
//   const subSelect = document.getElementById("subcategory");

//   subSelect.innerHTML = `<option value="">Без подкатегория</option>`;

//   if (subcategories[category]) {
//     subcategories[category].forEach((sub) => {
//       subSelect.innerHTML += `<option>${sub}</option>`;
//     });
//   }
// }

// function addSubcategory() {
//   const category = document.getElementById("category").value;
//   const newSub = prompt("Въведете нова подкатегория:");

//   if (!newSub) return;

//   if (!subcategories[category]) {
//     subcategories[category] = [];
//   }

//   subcategories[category].push(newSub);
//   saveAll();
//   loadSubcategories();
// }

/* ---------------- РАЗХОДИ ---------------- */

function updateTable() {
    const tbody = document.querySelector("#expenseTable tbody");
    tbody.innerHTML = "";

    const symbols = {
        Храна: "🍔",
        Транспорт: "🚌",
        Сметки: "💡",
        Забавление: "🎉",
        Наем: "🏠",
        Пазаруване: "🛒",
        Спорт: "⚽",
        Екскурзии: "✈️",
        Гориво: "⛽",
        Други: "📦",
    };

    expenses.forEach((exp, index) => {
        const symbol = symbols[exp.category] || ""; // fallback if name not in list

        // Check if the date is inside the selected period
        const visible = isDateInPeriod(exp.date);
        const style = visible ? "" : "display:none;";

        tbody.innerHTML += `
      <tr style="${style}">
        <td style="font-weight:400; color: darkblue;">${exp.date}</td>
        <td style="font-weight:400;">${exp.name}</td>
        <td style="font-weight:400;">${exp.category} ${symbol}</td>
        <td class="expense">-${exp.amount.toFixed(2)} EUR</td>
        <td style="font-weight:500;">${exp.expensePaymentStyle}</td>
        <td>
          <button class="edit-btn" onclick="editExpense(${index})">Редактирай ✏️</button>
          <button class="delete-btn" onclick="deleteExpense(${index})">Премахни 🗑️</button>
        </td>
      </tr>
    `;
    });
}


function updateTotal() {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById("total").textContent =
        "Общо разходи: " + total.toFixed(2) + " EUR";
}

function updateBalance() {
    const totalExpenses = expenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
    );
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

    const balance = totalIncome - totalExpenses;

    document.getElementById("balance").textContent =
        balance.toFixed(2) + " EUR";

    document.getElementById("balance").style.color =
        balance >= 0 ? "green" : "red";
}

function parseDateParts(dateStr) {
    const [day, month, year] = dateStr.split(".").map(Number);
    return { day, month: month - 1, year };
}

let periodStart = null;
let periodEnd = null;

function isInSelectedChartPeriod(dateStr) {
    const [day, month, year] = dateStr.split(".").map(Number);

    if (periodStart && periodEnd) {
        // If user selected a period, filter by it
        const date = new Date(year, month - 1, 1);
        return date >= periodStart && date <= periodEnd;
    } else {
        // fallback: show current month only
        const now = new Date();
        return year === now.getFullYear() && month - 1 === now.getMonth();
    }
}

function updateChart() {
    const filteredExpenses = expenses.filter(exp =>
        isInSelectedChartPeriod(exp.date)
    );

    if (filteredExpenses.length === 0) {
        document.getElementById("expenseChart").style.display = "none";
        return;
    }

    document.getElementById("expenseChart").style.display = "block";

    const categoryTotals = {};

    filteredExpenses.forEach(exp => {
        const category = exp.category.split(" ")[0];
        categoryTotals[category] =
            (categoryTotals[category] || 0) + exp.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    if (chart) chart.destroy();

    chart = new Chart(document.getElementById("expenseChart"), {
        type: "pie",
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: [
                    "#ff6384", "#36a2eb", "#ffcd56", "#4bc0c0",
                    "#1bc244", "#9966ff", "#b042ed", "#ff9f40",
                    "#a02afa", "#cff4ff",
                ],
            }],
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            // animation: true,
            plugins: {
                legend: { position: "bottom" },
                tooltip: {
                    callbacks: {
                        label: ctx =>
                            `${ctx.label}: ${Number(ctx.raw).toFixed(2)} EUR`,
                    },
                },
            },
        },
    });
}



/* ---------------- ХОРИЗОНТАЛНА ДИАГРАМА ---------------- */

function getMonthFromDate(dateStr) {
    const [day, month, year] = dateStr.split(".").map(Number);
    return month - 1; // JS months 0–11
}

function getMaxValue() {
    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    return Math.max(totalIncome, totalExpenses) * 1.2 || 100;
}

function sumByMonth(items) {
    const monthly = Array(12).fill(0);

    items.forEach(item => {
        if (!isInSelectedPeriod(item.date)) return;
        const { month } = parseDateParts(item.date);
        monthly[month] += item.amount;
    });

    return monthly;
}

function sumByMonthForYear(items) {
    const monthly = Array(12).fill(0);

    items.forEach(item => {
        const [d, m, y] = item.date.split(".").map(Number);
        if (y !== selectedChartYear) return;
        monthly[m - 1] += item.amount;
    });

    return monthly;
}


function getVisibleMonthLabels() {
    const now = new Date();
    const mode = document.getElementById("periodSelect")?.value || "month";

    const labels = [
        "Ян", "Фев", "Мар", "Апр", "Май", "Юни",
        "Юли", "Авг", "Сеп", "Окт", "Ное", "Дек"
    ];

    if (mode === "month") {
        return [labels[now.getMonth()]];
    }

    return labels.slice(0, now.getMonth() + 1);
}


// глобално (ако още го нямаш)
let fixedMaxValue = 100;

function updateCompareChart() {
    const canvas = document.getElementById("compareChart");
    canvas.style.display = "block";

    if (!periodStart || !periodEnd) {
        // If no selection, default to current month
        const now = new Date();
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (compareChart) compareChart.destroy();

    const labels = [];
    const incomeData = [];
    const expenseData = [];

    let current = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1);

    while (current <= periodEnd) {
        const month = current.getMonth();   // 0–11
        const year = current.getFullYear();
        const monthNames = ["Ян", "Фев", "Мар", "Апр", "Май", "Юни",
            "Юли", "Авг", "Сеп", "Окт", "Ное", "Дек"];
        labels.push(`${monthNames[month]} ${year}`);

        // sum data
        const incomeSum = incomes
            .filter(i => {
                const [d, m, y] = i.date.split(".").map(Number);
                return m - 1 === month && y === year;
            })
            .reduce((s, i) => s + i.amount, 0);

        const expenseSum = expenses
            .filter(e => {
                const [d, m, y] = e.date.split(".").map(Number);
                return m - 1 === month && y === year;
            })
            .reduce((s, e) => s + e.amount, 0);

        incomeData.push(incomeSum);
        expenseData.push(expenseSum);

        current.setMonth(current.getMonth() + 1);
    }

    compareChart = new Chart(canvas, {
        type: "bar", // or "line"
        data: {
            labels,
            datasets: [
                { label: "Приходи", data: incomeData, backgroundColor: "green" },
                { label: "Разходи", data: expenseData, backgroundColor: "red" }
            ]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom" },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.dataset.label || "";
                            const value = context.parsed.y ?? context.raw;
                            return `Общо ${label.toLowerCase()}: ${value.toFixed(2)} EUR`;
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, ticks: { callback: function (value) { return value + ' €'; } } }
            }
        }
    });
}





function updateAllCharts() {
    updateChart();
    updateCompareChart();
}




/* ---------------- ФОРМА ЗА РАЗХОДИ ---------------- */

document
    .getElementById("expenseForm")
    .addEventListener("submit", function (e) {
        e.preventDefault();

        const date = document.getElementById("expenseDate").value;
        const name = document.getElementById("name").value;
        const amount = parseFloat(document.getElementById("amount").value);
        let expensePaymentStyle = document.getElementById("expensePaymentStyle").value;
        let category = document.getElementById("category").value;
        if (
            document.getElementById("emojiButton").innerText !== "Персонализирана иконка"
        ) {
            category =
                document.getElementById("category").value +
                " " +
                document.getElementById("emojiButton").innerText.split(": ")[1];
        }
        // const subcategory = document.getElementById("subcategory").value;

        if (editIndex !== null) {
            expenses[editIndex] = {
                date,
                name,
                amount,
                category,
                expensePaymentStyle
            };
            editIndex = null;
        } else {
            expenses.push({
                date,
                name,
                amount,
                category,
                expensePaymentStyle
            });
        }

        saveAll();
        updateTable();
        updateTotal();
        updateIncomeTotal();
        updateBalance();
        updateChart();
        updateCompareChart();
        expenseHeader.classList.add("asc");
        expenseHeader.click();

        document.getElementById("expenseForm").reset();

        // 🧹 Изчистване на качената касова бележка и OCR съобщението
        document.getElementById("receiptInput").value = "";
        document.getElementById("ocrStatus").innerHTML = "";
        document.getElementById("emojiButton").innerText = "Персонализирана иконка";
        showPopup("Данните бяха запазени успешно!");
    });

function deleteExpense(index) {
    expenses.splice(index, 1);
    saveAll();
    updateTable();
    updateTotal();
    updateIncomeTotal();
    updateBalance();
    updateChart();
    updateCompareChart();
    expenseHeader.classList.add("asc");
    expenseHeader.click();
}

function editExpense(index) {
    originalScroll = window.scrollY;
    const exp = expenses[index];
    document.getElementById("expenseDate").value = exp.date;
    document.getElementById("name").value = exp.name;
    document.getElementById("amount").value = exp.amount;
    document.getElementById("category").value = exp.category.split(" ")[0];
    if (exp.category.split(" ")[1] === undefined) {
        document.getElementById("emojiButton").innerText = "Персонализирана иконка";
    } else {
        document.getElementById("emojiButton").innerText =
            "Текущо избрана икона: " + exp.category.split(" ")[1];
    }
    document.getElementById("expensePaymentStyle").value = exp.expensePaymentStyle;
    // loadSubcategories();
    // document.getElementById("subcategory").value = exp.subcategory;
    editIndex = index;
    expenseHeader.classList.add("asc");
    expenseHeader.click();
    document.getElementById("name").scrollIntoView({
        behavior: "smooth",
        block: "center",
    });
}

/* ---------------- OCR КАСОВА БЕЛЕЖКА ---------------- */

async function processReceipt() {
    const file = document.getElementById("receiptInput").files[0];
    document.getElementById("amount").value = "";

    if (!file) {
        showPopup("Моля, избери снимка на касова бележка.", "error");
        return;
    }

    // Open popup with loading state
    showPopup("Моля изчакайте...", "success", false);

    try {
        const worker = await Tesseract.createWorker({
            logger: (m) => {
                if (m.status === "recognizing text") {
                    updatePopup(`Сканиране: ${Math.round(m.progress * 100)}%`);
                }
            },
        });

        await worker.loadLanguage("eng");
        await worker.initialize("eng");

        const { data } = await worker.recognize(file);
        await worker.terminate();

        const text = data.text || "";
        const amount = extractAmount(text);

        if (amount) {
            const eur = (amount / 1.95583).toFixed(2);
            document.getElementById("amount").value = eur;

            updatePopup(`Разпозната сума: ${eur} EUR`);
            document.getElementById("popupClose").style.display = "inline";
        } else {
            updatePopup("Неуспешно намиране на сума в касовата бележка.");
            document.getElementById("popupClose").style.display = "inline";
        }
    } catch (err) {
        console.error(err);
        updatePopup("Възникна грешка при разпознаването.");
        document.getElementById("popupClose").style.display = "inline";
    }
}

function extractAmount(text) {
    const lines = text.split("\n").map((l) => l.toLowerCase());
    const keywords = [
        "total",
        "общо",
        "сума",
        "сума евро",
        "amount",
        "total due",
        "amount due",
    ];

    for (let line of lines) {
        for (let key of keywords) {
            if (line.includes(key)) {
                const match = line.match(/(\d+[.,]\d{2})/);
                if (match) return match[1].replace(",", ".");
            }
        }
    }

    const allNumbers = text.match(/\d+[.,]\d{2}/g);
    if (!allNumbers) return null;

    const nums = allNumbers.map((n) => parseFloat(n.replace(",", ".")));
    return Math.max(...nums).toFixed(2);
}

/* ---------------- ИНИЦИАЛИЗАЦИЯ ---------------- */

// loadSubcategories();
updateTable();
updateTotal();
updateIncomeTable();
updateIncomeTotal();
updateBalance();
updateChart();
updateCompareChart();

const date = new Date(Date.now());
const month = date.toLocaleString("bg-BG", {
    month: "long",
    year: "numeric",
});

// let monthEmoji =
//   date.getMonth() < 3 ? "🌨️" :      // Jan–Mar
//     date.getMonth() < 6 ? "🌱" :      // Apr–Jun
//       date.getMonth() < 9 ? "☀️" :      // Jul–Sep
//         "🍁";       // Oct–Dec

function monthEmojiValueShow() {
    let monthEmojiValue = document.getElementById("chartPeriodPicker").value

    const bgMonths = {
        "декември": 0,
        "януари": 1,
        "февруари": 2,
        "март": 3,
        "април": 4,
        "май": 5,
        "юни": 6,
        "юли": 7,
        "август": 8,
        "септември": 9,
        "октомври": 10,
        "ноември": 11
    };

    let monthName = monthEmojiValue.split(" ")[0].toLowerCase();
    let monthIndex = bgMonths[monthName];

    let monthEmoji =
        monthIndex < 3 ? "🌨️" :
            monthIndex < 6 ? "🌷" :
                monthIndex < 9 ? "☀️" :
                    "🍁";

    return monthEmoji;
}

document.querySelector(".headMonth").innerText = document.getElementById("chartPeriodPicker").value + monthEmojiValueShow();
// month[0].toUpperCase() + month.slice(1)
//  + monthEmoji;

// document.querySelectorAll(".expense").forEach(e=>{e.innerText = (parseFloat(e.innerText) / 1.95583).toFixed(2) + " EUR"})

function exportData() {
    const expenses = JSON.parse(localStorage.getItem("expenses")) || [];
    const incomes = JSON.parse(localStorage.getItem("incomes")) || [];
    const forecasts = JSON.parse(localStorage.getItem("forecasts")) || [];
    const period = localStorage.getItem("period") || "";
    // const subcategories =
    //   JSON.parse(localStorage.getItem("subcategories")) || [];

    const data = { expenses, incomes, forecasts, period };

    const json = JSON.stringify(data, null, 2); // pretty format
    const blob = new Blob([json], { type: "application/json" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "приходи-разходи.json";
    a.click();

    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);

            if (data.expenses) {
                localStorage.setItem("expenses", JSON.stringify(data.expenses));
            }
            if (data.incomes) {
                localStorage.setItem("incomes", JSON.stringify(data.incomes));
            }
            if (data.forecasts) {
                localStorage.setItem("forecasts", JSON.stringify(data.forecasts));
            }
            if (data.period) {
                localStorage.setItem("period", data.period);
            }
            // if (data.subcategories) {
            //   localStorage.setItem(
            //     "subcategories",
            //     JSON.stringify(data.subcategories)
            //   );
            // }

            showPopup("Данните са успешно заредени!", "success", () => { });
        } catch (err) {
            showPopup("Грешен JSON файл", "error");
        }
    };

    reader.readAsText(file);
}

function showPopup(message, type = "success", allowClose = true) {
    const overlay = document.getElementById("popupOverlay");
    const box = document.getElementById("popupBox");
    const msg = document.getElementById("popupMessage");
    const closeBtn = document.getElementById("popupClose");

    msg.textContent = message;

    box.classList.remove("success", "error");
    box.classList.add(type);

    overlay.style.display = "flex";

    closeBtn.style.display = allowClose ? "inline" : "none";

    closeBtn.onclick = () => {
        overlay.style.display = "none";
        if (
            document.getElementById("balance").innerText == "0.00 EUR" || document.getElementById("forecastResult").innerText == document.getElementById("balance").innerText && document.getElementById("tab4").classList.contains("active")
        ) {
            location.reload();
        }
        window.scrollTo({ top: originalScroll, behavior: "smooth", block: "center" });
    };
}

function updatePopup(message) {
    const msg = document.getElementById("popupMessage");
    if (msg) msg.textContent = message;
}

document.getElementById("importBtn").addEventListener("click", () => {
    document.getElementById("importFile").click();
});

// document.getElementById("receiptBtn").addEventListener("click", () => {
//     document.getElementById("receiptInput").click();
// });

// When a file is selected, run your OCR function
// document.getElementById("receiptInput").addEventListener("change", () => {
//     processReceipt();
// });

const button = document.getElementById("emojiButton");
const pickerContainer = document.getElementById("pickerContainer");

let pickerVisible = false;
let picker = null;

button.addEventListener("click", () => {
    pickerVisible = !pickerVisible;

    if (pickerVisible) {
        // Reset picker by recreating it
        pickerContainer.innerHTML = "";

        picker = new EmojiMart.Picker({
            theme: "light",
            onEmojiSelect: (emoji) => {
                button.textContent = "Текущо избрана икона: " + emoji.native;
                pickerContainer.style.display = "none";
                pickerVisible = false;
            },
        });

        pickerContainer.appendChild(picker);

        // Position dropdown under button
        const rect = button.getBoundingClientRect();
        pickerContainer.style.left = rect.left + "px";
        pickerContainer.style.top = rect.bottom + window.scrollY + "px";
        pickerContainer.style.display = "block";
    } else {
        pickerContainer.style.display = "none";
    }
});

// Close when clicking outside
document.addEventListener("click", (e) => {
    if (!pickerContainer.contains(e.target) && e.target !== button) {
        pickerContainer.style.display = "none";
        pickerVisible = false;
    }
});

document.addEventListener("click", (e) => {
    if (pickerVisible == true) {
        document.getElementById("emojiButton").innerText = "Персонализирана иконка";
    }
});

document.querySelectorAll("th[data-sort]").forEach((header) => {
    header.addEventListener("click", () => {
        const table = header.closest("table");
        const tbody = table.querySelector("tbody");
        const index = Array.from(header.parentNode.children).indexOf(header);
        const rows = Array.from(tbody.querySelectorAll("tr"));
        const isAscending = header.classList.toggle("asc");
        const type = header.dataset.type || "text";

        rows.sort((a, b) => {
            const cellA = a.children[index].innerText.trim();
            const cellB = b.children[index].innerText.trim();

            if (type === "date") {
                const dateA = parseDate(cellA);
                const dateB = parseDate(cellB);
                return isAscending ? dateA - dateB : dateB - dateA;
            }

            const numA = parseFloat(cellA.replace(",", "."));
            const numB = parseFloat(cellB.replace(",", "."));

            if (!isNaN(numA) && !isNaN(numB)) {
                return isAscending ? numA - numB : numB - numA;
            }

            return isAscending
                ? cellA.localeCompare(cellB)
                : cellB.localeCompare(cellA);
        });

        rows.forEach((row) => tbody.appendChild(row));
    });
});

function parseDate(str) {
    const [day, month, year] = str.split(".").map(Number);
    return new Date(year, month - 1, day);
}

flatpickr("#incomeDate", {
    dateFormat: "d.m.Y",
    allowInput: true,
    locale: "bg",
});

flatpickr("#expenseDate", {
    dateFormat: "d.m.Y",
    allowInput: true,
    locale: "bg",
});

flatpickr("#forecastDate", {
    dateFormat: "d.m.Y",
    allowInput: true,
    locale: "bg",
});

function autoSortTables() {
    const incomeHeader = document.getElementById("incomeHeader");
    const expenseHeader = document.getElementById("expenseHeader");
    const futureHeader = document.getElementById("futureHeader");

    // Auto‑sort headers if they exist
    [expenseHeader, incomeHeader, futureHeader].forEach(header => {
        if (header) {
            header.classList.add("asc");
            header.click();
        }
    });
}

window.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".tab");
    const savedTab = localStorage.getItem("currentTab");
    const savedPeriod = localStorage.getItem("period");
    if (!savedPeriod) return;

    let dates;

    if (savedPeriod.includes("-")) {
        // Range: "Януари 2026 г. - Февруари 2026 г."
        const [startStr, endStr] = savedPeriod.split(" - ");
        dates = [
            parseBgMonthYear(startStr),
            parseBgMonthYear(endStr)
        ];
    } else {
        // Single month: "Януари 2026 г."
        const d = parseBgMonthYear(savedPeriod);
        dates = [d, d];
    }

    // ✅ This updates UI + fires onChange
    chartPicker.setDate(dates, true);

    // Restore tab or set default
    if (!savedTab) {
        localStorage.setItem("currentTab", "tab1");
    } else {
        const index = Number(savedTab.replace("tab", "")) - 1;
        tabs[index]?.click();
    }

    // autoSortTables();

});

let forecastChart = null;

const currentBalanceText = document.getElementById("balance").innerText;
const currentBalance = parseFloat(currentBalanceText.replace(/[^\d.-]/g, ""));

function updateForecastBalance() {
    let projected = currentBalance;

    forecastPlans.forEach(p => {
        if (p.type === "income") projected += p.amount;
        else projected -= p.amount;
    });

    document.getElementById("forecastResult").innerText =
        projected.toFixed(2) + " EUR";

    // Color the result
    const resultEl = document.getElementById("forecastResult");
    resultEl.style.color = projected < 0 ? "red" : "green";

    updateForecastChart(currentBalance);
}


function addForecast() {
    const type = document.getElementById("forecastType").value;
    const name = document.getElementById("forecastName").value;
    const amount = parseFloat(document.getElementById("forecastAmount").value);
    const date = document.getElementById("forecastDate").value;

    if (!name || !amount || !date) return;

    forecastPlans.push({ date, type, name, amount });

    saveAll()
    renderForecastTable();
    updateForecastBalance();
    updateForecastChart(currentBalance);
}

function removeForecast(index) {
    forecastPlans.splice(index, 1);
    saveAll();
    renderForecastTable();
    updateForecastBalance();
    futureHeader.classList.add("asc");
    futureHeader.click();
}

function renderForecastTable() {
    const tbody = document.querySelector("#forecastTable tbody");
    tbody.innerHTML = "";

    forecastPlans.forEach((p, i) => {
        const row = document.createElement("tr");

        row.innerHTML = `
  <td style="font-weight:400; color: darkblue;">${p.date}</td>
  <td style="font-weight:400;">${p.type === "income" ? "Приход 📈" : "Разход 📉"}</td>
  <td style="font-weight:400;">${p.name}</td>
  <td class="${p.type === "income" ? "income" : "expense"}">
      ${p.type === "income" ? "+" : "-"}${p.amount.toFixed(2)} EUR
  </td>
  <td>
    <button class="delete-btn" onclick="removeForecast(${i})">Премахни 🗑️</button>
  </td>
`;

        tbody.appendChild(row);
    });
}

function updateForecastChart(startBalance) {
    if (forecastPlans.length === 0) {
        document.getElementById("forecastChart").style.display = "none";
        return;
    }

    document.getElementById("forecastChart").style.display = "block";

    // Sort by date
    const sortedPlans = [...forecastPlans].sort((a, b) => new Date(a.date) - new Date(b.date));

    const labels = [];
    const values = [];

    let running = startBalance;

    const now = new Date();
    const formattedDate =
        String(now.getDate()).padStart(2, "0") + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
        now.getFullYear();


    labels.push(formattedDate);

    values.push(running);

    sortedPlans.forEach(p => {
        running += p.type === "income" ? p.amount : -p.amount;
        labels.push(p.date);
        values.push(running);
    });

    // Destroy old chart safely
    if (forecastChart instanceof Chart) {
        forecastChart.destroy();
    }

    const ctx = document.getElementById("forecastChart").getContext("2d");

    forecastChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Баланс във времето",
                data: values,

                // Line style
                borderColor: "#0078ff",
                backgroundColor: "rgba(0, 120, 255, 0.15)",
                borderWidth: 3,
                tension: 0.3,

                // Point style
                pointStyle: "circle",
                pointRadius: 7,
                pointHoverRadius: 10,
                pointHitRadius: 15,

                pointBorderWidth: 2,
                pointBorderColor: "#ffffff",

                // Dynamic point colors (green for up, red for down)
                pointBackgroundColor: values.map((v, i) => {
                    if (i === 0) return "#0078ff"; // starting point
                    return v >= values[i - 1] ? "#4caf50" : "#ff4d4d";
                }),

                pointHoverBorderColor: "#000",
                pointHoverBorderWidth: 3
            }]

        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { color: "#dce3ef" }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function resetForecast() {

    // 1. Clear all forecast items
    forecastPlans = [];

    // 2. Clear the table
    renderForecastTable();

    // 3. Reset projected balance text
    const resultEl = document.getElementById("forecastResult");
    resultEl.innerText = document.getElementById("balance").innerText;
    // resultEl.style.color = "#333"; // neutral color
    document.getElementById("forecastName").value = "";
    document.getElementById("forecastAmount").value = "";
    document.getElementById("forecastDate").value = "";
    localStorage.removeItem("forecasts");

    // 4. Remove the chart safely
    if (forecastChart instanceof Chart) {
        forecastChart.destroy();
        forecastChart = null;
    }
}

renderForecastTable();
updateForecastBalance();


const bgMonths = {
    "Януари": 0,
    "Февруари": 1,
    "Март": 2,
    "Април": 3,
    "Май": 4,
    "Юни": 5,
    "Юли": 6,
    "Август": 7,
    "Септември": 8,
    "Октомври": 9,
    "Ноември": 10,
    "Декември": 11
};


function parseBgMonthYear(str) {
    // "Януари 2026 г."
    const cleaned = str.replace("г.", "").trim();
    const [monthName, year] = cleaned.split(" ");

    return new Date(
        Number(year),
        bgMonths[monthName],
        1
    );
}

window.addEventListener("DOMContentLoaded", () => {
    const savedPeriod = localStorage.getItem("period");
    if (!savedPeriod) return;

    let dates;

    if (savedPeriod.includes("-")) {
        // Range: "Януари 2026 г. - Февруари 2026 г."
        const [startStr, endStr] = savedPeriod.split(" - ");
        dates = [
            parseBgMonthYear(startStr),
            parseBgMonthYear(endStr)
        ];
    } else {
        // Single month: "Януари 2026 г."
        const d = parseBgMonthYear(savedPeriod);
        dates = [d, d];
    }

    // ✅ This updates UI + fires onChange
    chartPicker.setDate(dates, true);
});

function endOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}

function parseDMY(dateStr) {
    const [d, m, y] = dateStr.split(".").map(Number);
    return new Date(y, m - 1, d);
}

function calculateIncomeForPeriod() {
    if (!periodStart || !periodEnd) return 0;

    const start = new Date(
        periodStart.getFullYear(),
        periodStart.getMonth(),
        1
    );

    const end = endOfMonth(periodEnd);

    return incomes
        .filter(inc => {
            const d = parseDMY(inc.date);
            return d >= start && d <= end;
        })
        .reduce((sum, inc) => sum + inc.amount, 0);
}

function calculateExpenseForPeriod() {
    if (!periodStart || !periodEnd) return 0;

    const start = new Date(
        periodStart.getFullYear(),
        periodStart.getMonth(),
        1
    );

    const end = endOfMonth(periodEnd);

    return expenses
        .filter(exp => {
            const d = parseDMY(exp.date);
            return d >= start && d <= end;
        })
        .reduce((sum, exp) => sum + exp.amount, 0);
}

function updatePeriodIncomeUI() {
    const total = calculateIncomeForPeriod();

    const sameMonth =
        periodStart.getMonth() === periodEnd.getMonth() &&
        periodStart.getFullYear() === periodEnd.getFullYear();

    const label = sameMonth
        ? "Приходи за текущия месец:"
        : "Приходи за текущия период:";

    document.getElementById("incomeMonthTotal").textContent =
        `${label} ${total.toFixed(2)} EUR`;
}

function updatePeriodExpenseUI() {
    const total = calculateExpenseForPeriod();

    const sameMonth =
        periodStart.getMonth() === periodEnd.getMonth() &&
        periodStart.getFullYear() === periodEnd.getFullYear();

    const label = sameMonth
        ? "Разходи за текущия месец:"
        : "Разходи за текущия период:";

    document.getElementById("expenseMonthTotal").textContent =
        `${label} ${total.toFixed(2)} EUR`;
}

function isDateInPeriod(dateStr) {
    if (!periodStart || !periodEnd) return true; // show all if no period set

    const d = parseDMY(dateStr);
    const start = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1);
    const end = endOfMonth(periodEnd);

    return d >= start && d <= end;
}

// const balance = document.querySelector(".balance-wrapper");
// const details = document.getElementById("details");

// balance.addEventListener("mouseenter", () => {
//   document.getElementById("details").style.display = "block";
// });

// balance.addEventListener("mouseleave", () => {
//   document.getElementById("details").style.display = "none";
// });

document.addEventListener("keydown", function (e) {
    // Block F12
    if (e.key === "F12") { // F12 key
        e.preventDefault();
        return false;
    }

    // Block Ctrl + Shift + I (Developer Tools)
    if (e.ctrlKey && e.shiftKey && e.key === "I") { // Ctrl + Shift + I
        e.preventDefault();
        return false;
    }

    // Block Ctrl + Shift + C (Inspect Element)
    if (e.ctrlKey && e.shiftKey && e.key === "C") { // Ctrl + Shift + C
        e.preventDefault();
        return false;
    }

    // Block Ctrl + U (View Page Source)
    if (e.ctrlKey && e.key === "u") { // Ctrl + U
        e.preventDefault();
        return false;
    }

    // Block Ctrl + Shift + J (Developer Tools Console tab)
    if (e.ctrlKey && e.shiftKey && e.key === "J") { // Ctrl + Shift + J
        e.preventDefault();
        return false;
    }

    // Block Ctrl + Shift + F (Search in DevTools)
    if (e.ctrlKey && e.shiftKey && e.key === "F") { // Ctrl + Shift + F
        e.preventDefault();
        return false;
    }

    // Block Ctrl + Alt + I (Developer Tools)
    if (e.ctrlKey && e.altKey && e.key === "I") { // Ctrl + Alt + I
        e.preventDefault();
        return false;
    }

    // Block right-click (optional)
    if (e.button === 2) { // Right-click
        e.preventDefault();
        return false;
    }

});

