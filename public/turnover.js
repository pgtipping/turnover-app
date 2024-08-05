// Functions for calculating turnover rates...
function calculateTurnoverRate(leavers, beginningCount, endCount) {
  const averageCount = (beginningCount + endCount) / 2;
  return averageCount > 0 ? (leavers / averageCount) * 100 : 0; // Return as a percentage
}

document.addEventListener("DOMContentLoaded", function () {
  // Set the current year in the footer
  document.getElementById("currentYear").textContent = new Date().getFullYear();

  // Theme toggle functionality
  const themeToggleBtn = document.getElementById("theme-toggle");
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
  const currentTheme = localStorage.getItem("theme");

  if (currentTheme) {
    if (currentTheme === "dark") {
      switchToDarkTheme();
    } else if (currentTheme === "light") {
      switchToLightTheme();
    }
  } else {
    if (prefersDarkScheme.matches) {
      switchToDarkTheme();
    } else {
      switchToLightTheme();
    }
  }

  themeToggleBtn.addEventListener("click", function () {
    if (prefersDarkScheme.matches) {
      if (document.body.classList.contains("light-theme")) {
        switchToDarkTheme();
        localStorage.setItem("theme", "dark");
      } else {
        switchToLightTheme();
        localStorage.setItem("theme", "light");
      }
    } else {
      if (document.body.classList.contains("dark-theme")) {
        switchToLightTheme();
        localStorage.setItem("theme", "light");
      } else {
        switchToDarkTheme();
        localStorage.setItem("theme", "dark");
      }
    }
  });

  function switchToDarkTheme() {
    document
      .getElementById("bootstrap-css")
      .setAttribute(
        "href",
        "https://stackpath.bootstrapcdn.com/bootswatch/4.5.2/darkly/bootstrap.min.css"
      );
    document.body.classList.add("dark-theme");
    document.body.classList.remove("light-theme");
  }

  function switchToLightTheme() {
    document
      .getElementById("bootstrap-css")
      .setAttribute(
        "href",
        "https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"
      );
    document.body.classList.add("light-theme");
    document.body.classList.remove("dark-theme");
  }

  $("#dataEntryMethod").change(function () {
    var method = $(this).val();
    $("#manualEntryFields").hide();
    $("#fileUploadFields").hide();
    $("#turnoverForm").hide(); // Hide the form initially

    if (method === "manual") {
      $("#manualEntryFields").show();
    } else if (method === "upload") {
      $("#fileUploadFields").show();
    }
  });
  // Function to populate month dropdowns
  function populateMonthDropdowns() {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    monthNames.forEach((month, index) => {
      $("#startMonth, #endMonth").append(
        `<option value="${index}">${month}</option>`
      );
    });
  }

  populateMonthDropdowns();

  // Dynamically generate form fields based on selected months
  $("#generateFormBtn").click(function () {
    const startMonthIndex = parseInt($("#startMonth").val());
    const endMonthIndex = parseInt($("#endMonth").val());
    console.log(
      "Start Month Index:",
      startMonthIndex,
      "End Month Index:",
      endMonthIndex
    );
    $("#turnoverForm").show();
    generateFormFields(startMonthIndex, endMonthIndex); //Call the updated function to generate form fields

    setTimeout(function () {
      // Timeout to ensure dynamic elements are loaded
      $('[data-toggle="tooltip"]').tooltip(); // Reinitialize tooltips for dynamic elements
    }, 100);
  });

  function generateFormFields(startMonthIndex, endMonthIndex, data = []) {
    let formHtml = "";

    // Fixed header row
    formHtml += `
<div class="form-row mb-3 font-weight-bold">
    <div class="col-4">Month</div>
    <div class="col">Beginning</div>
    <div class="col">Voluntary Exits</div>
    <div class="col">End</div>
</div>
`;

    let previousEndCount = parseInt($("#initialHeadcount").val(), 10); // Use the initial headcount specified by the user and parse it as a number

    for (let i = startMonthIndex; i <= endMonthIndex; i++) {
      const monthName = new Date(0, i % 12).toLocaleString("en", {
        month: "long",
      });

      // Extract data for this month from the uploaded data, if available
      const monthData = data[i - startMonthIndex]; // Adjust index based on the data order
      const leavers = monthData ? parseInt(monthData.leavers, 10) : 0; // Parse leavers as integer
      const endCount = monthData ? parseInt(monthData.endCount, 10) : 0; // Parse endCount as integer

      // For the first month, use the initial headcount; for subsequent months, use the ending headcount of the previous month or the uploaded data
      const beginningCount =
        i === startMonthIndex ? previousEndCount : previousEndCount;

      formHtml += `
<div class="form-row mb-3 align-items-end">
    <div class="col-4">
        <label class="form-control-plaintext">${monthName}</label>
    </div>
    <div class="col">
        <input type="number" class="form-control" placeholder="Beginning Headcount" value="${beginningCount}" id="employeesBeginning${i}" readonly>
    </div>
    <div class="col">
        <input type="number" class="form-control" placeholder="Leavers" id="employeesLeft${i}" value="${leavers}">
    </div>
    <div class="col">
        <input type="number" class="form-control" placeholder="Ending Headcount" id="employeesEnd${i}" value="${endCount}">
    </div>
</div>`;

      // Update previousEndCount for the next iteration
      previousEndCount =
        endCount ||
        parseInt($(`#employeesEnd${i}`).val(), 10) ||
        previousEndCount;
    }

    $("#dynamicFormContainer").html(formHtml);
    console.log(
      "Start Month Index:",
      startMonthIndex,
      "End Month Index:",
      endMonthIndex
    );
    // Add event listener to update the beginning headcount of the next month when the ending headcount of the current month changes
    $(".form-control").change(function () {
      const id = $(this).attr("id");
      const index = parseInt(id.match(/\d+/), 10); // Extract the month index from the id

      if (id.startsWith("employeesEnd")) {
        const nextBeginningInput = $(`#employeesBeginning${index + 1}`);
        if (nextBeginningInput.length) {
          nextBeginningInput.val($(this).val()); // Update the next month's beginning headcount with this month's ending headcount
        }
      }
    });
  }

  // Handle form submission for turnover calculation
  $("#turnoverForm").on("submit", function (event) {
    event.preventDefault();

    const startMonthIndex = parseInt($("#startMonth").val());
    const endMonthIndex = parseInt($("#endMonth").val());
    let tableRows = "";
    let quarterlyRates = [];
    let monthlyRates = [];
    let ytdRates = []; // Initialize Year-To-Date Rate
    let annualizedRates = [];
    let totalLeaversYTD = 0; // Total leavers Year-To-Date
    let totalBeginningYTD =
      parseInt($(`#employeesBeginning${startMonthIndex}`).val()) || 0; // Constant beginning headcount for the period
    let totalLeaversForQuarter = 0;
    let beginningHeadcountForQuarter = parseInt($("#initialHeadcount").val()); // Start with the initial headcount

    for (let i = startMonthIndex; i <= endMonthIndex; i++) {
      const employeesBeginning =
        parseInt($(`#employeesBeginning${i}`).val()) || 0;
      const employeesLeft = parseInt($(`#employeesLeft${i}`).val()) || 0;
      const employeesEnd = parseInt($(`#employeesEnd${i}`).val()) || 0;

      const monthlyRate = calculateTurnoverRate(
        employeesLeft,
        employeesBeginning,
        employeesEnd
      );
      monthlyRates.push(monthlyRate);

      // Update YTD calculations
      totalLeaversYTD += employeesLeft;
      const avgEmployeesYTD = (totalBeginningYTD + employeesEnd) / 2;
      let ytdRate = calculateTurnoverRate(
        totalLeaversYTD,
        totalBeginningYTD,
        employeesEnd
      );
      ytdRates.push(ytdRate);

      // Accumulate leavers for the quarter
      totalLeaversForQuarter += employeesLeft;

      // Quarterly rate calculation every 3 months or at the end of the period
      if ((i - startMonthIndex + 1) % 3 === 0 || i === endMonthIndex) {
        const quarterRate = calculateTurnoverRate(
          totalLeaversForQuarter,
          beginningHeadcountForQuarter,
          employeesEnd
        );
        quarterlyRates.push(quarterRate);

        // Reset for next quarter
        totalLeaversForQuarter = 0;
        beginningHeadcountForQuarter = employeesEnd; // Set the beginning headcount for the next quarter
      }
      // Annualized rate calculation (only if the selected range is at least one month)
      const monthsCount = i - startMonthIndex + 1;
      let annualizedRate = (ytdRate * 12) / monthsCount;
      annualizedRates.push(annualizedRate);

      tableRows += `
                <tr>
                    <td>${new Date(0, i % 12).toLocaleString("en", {
                      month: "long",
                    })}</td>
                    <td>${monthlyRate.toFixed(2)}%</td>
                    <td>${
                      (i - startMonthIndex + 1) % 3 === 0
                        ? quarterlyRates[quarterlyRates.length - 1].toFixed(2)
                        : ""
                    }%</td>
                    <td>${ytdRate.toFixed(2)}%</td>
                    <td>${annualizedRate.toFixed(2)}%</td>
                </tr>`;
    }

    function displayRates(
      monthlyRates,
      quarterlyRates,
      ytdRates,
      annualizedRates,
      startMonthIndex,
      endMonthIndex
    ) {
      let tableRows = "";
      let quarterlyRateIndex = 0; // Keep track of which quarterly rate to display

      for (let i = startMonthIndex; i <= endMonthIndex; i++) {
        const monthName = new Date(0, i % 12).toLocaleString("en", {
          month: "long",
        });
        const monthlyRate = monthlyRates[i - startMonthIndex].toFixed(2);
        // Annualized rate calculation for every month
        const ytdRate = ytdRates[i - startMonthIndex].toFixed(2);
        const monthsElapsed = i - startMonthIndex + 1; // Number of months from the startMonth to the current month
        const annualizedRate = (parseFloat(ytdRate) * 12) / monthsElapsed;

        // Display quarterly rate every 3rd month from the start month
        let quarterlyRate = "";
        if (
          (i - startMonthIndex + 1) % 3 === 0 &&
          quarterlyRateIndex < quarterlyRates.length
        ) {
          quarterlyRate = quarterlyRates[quarterlyRateIndex++].toFixed(2);
        }

        // Creating a row for the table
        tableRows += `
                    <tr>
                        <td>${monthName}</td>
                        <td>${monthlyRate}%</td>
                        <td>${quarterlyRate}%</td>
                        <td>${ytdRate}%</td>
                        <td>${annualizedRate.toFixed(2)}%</td>
                    </tr>`;
      }

      // Insert the rows into the rates table body
      $("#ratesTableBody").html(tableRows);

      // Make sure the table is visible
      $("#turnoverRatesTable").show();
    }
    // Display the calculated rates in the table
    displayRates(
      monthlyRates,
      quarterlyRates,
      ytdRates,
      annualizedRates,
      startMonthIndex,
      endMonthIndex
    );

    // Gather chart options based on user selections (this assumes you have a way for users to select chart options)
    let chartOptions = {
      monthlyRates: $("#checkMonthlyRates").is(":checked"),
      quarterlyRates: $("#checkQuarterlyRates").is(":checked"),
      ytdRates: $("#checkYtdRates").is(":checked"),
      annualizedRates: $("#checkAnnualizedRates").is(":checked"),
    };

    // Create the chart based on the selected options and calculated rates
    createChart(
      chartOptions,
      monthlyRates,
      quarterlyRates,
      ytdRates,
      annualizedRates,
      startMonthIndex,
      endMonthIndex
    );

    // Show the "Generate PDF" button
    $("#generatePdfBtn").show();

    document
      .getElementById("generatePdfBtn")
      .addEventListener("click", function () {
        try {
          // Use html2canvas to take a screenshot of the page
          html2canvas(document.body).then(function (canvas) {
            // Initialize jsPDF
            const pdf = new jsPDF("p", "mm", "a4");

            // Calculate the number of pages needed for the canvas height
            const imgHeight = (canvas.height * 210) / canvas.width;
            let heightLeft = imgHeight;

            // The first page
            const imgData = canvas.toDataURL("image/png");
            let position = 0;
            console.log(window.jsPDF);

            // Add image to PDF
            pdf.addImage(imgData, "PNG", 0, position, 210, imgHeight);
            heightLeft -= pdf.internal.pageSize.height;

            // Add new pages and images if the canvas height exceeds the page height
            while (heightLeft >= 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, "PNG", 0, position, 210, imgHeight);
              heightLeft -= pdf.internal.pageSize.height;
            }

            // Download the PDF
            pdf.save("pageContent.pdf");
          });
        } catch (error) {
          console.error("Error generating PDF", error);
        }
      });
  });

  // Tooltip initialization for dynamic and static elements
  $('[data-toggle="tooltip"]').tooltip(); // Initialize tooltips for static elements

  // Update the label text with the name of the uploaded file
  $(".custom-file-input").on("change", function () {
    const fileName = $(this).val().split("\\").pop();
    $(this).next(".custom-file-label").addClass("selected").html(fileName);
  });

  function updateMonthDropdowns(data) {
    if (!data || !data.length) return;

    // Assume the first data point corresponds to the start month and the last to the end month
    let startMonthIndex = 0; // Start from the first month in the data
    let endMonthIndex = data.length - 1; // End with the last month in the data

    // Debug logging
    console.log("Start Month from Uploaded Data:", startMonthIndex);
    console.log("End Month from Uploaded Data:", endMonthIndex);

    // Update dropdowns
    $("#startMonth").val(startMonthIndex.toString());
    $("#endMonth").val(endMonthIndex.toString());
  }

  $("#uploadForm").submit(function (event) {
    event.preventDefault();

    var formData = new FormData(this);

    $.ajax({
      url: "/upload",
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: function (data) {
        console.log("Upload successful");
        // Assuming 'data' is an array of objects with 'leavers' and 'endCount' properties
        // Update the start and end month indexes based on the data length
        const startMonthIndex = 0; // Adjust based on your data, if needed
        const endMonthIndex = data.length - 1; // Assuming data is ordered by month
        console.log(data);
        // Call generateFormFields with the uploaded data
        $("#turnoverForm").show();
        generateFormFields(startMonthIndex, endMonthIndex, data);
        updateMonthDropdowns(data); // 'processedUploadedData' should be your array of processed data from the file
      },
      error: function () {
        console.error("Upload error");
      },
    });
  });

  // Function to create the turnover chart
  function createChart(
    chartOptions,
    monthlyRates,
    quarterlyRates,
    ytdRates,
    annualizedRates,
    startMonthIndex,
    endMonthIndex
  ) {
    // Ensure previous chart instance is cleared if it exists
    if (window.turnoverChart instanceof Chart) {
      window.turnoverChart.destroy();
    }

    // Generate labels for the selected date range
    const labels = generateLabelsForSelectedRange(
      startMonthIndex,
      endMonthIndex
    );

    let datasets = [];
    if (chartOptions.monthlyRates) {
      datasets.push({
        label: "Monthly Rates",
        data: monthlyRates, // Ensure this is available from your calculations
        borderColor: "blue",
        fill: false,
      });
    }
    if (chartOptions.quarterlyRates) {
      datasets.push({
        label: "Quarterly Rates",
        data: quarterlyRates, // Ensure this is available from your calculations
        borderColor: "green",
        fill: false,
      });
    }
    // Add other conditions for YTD Rates and Annualized Rates similarly...
    if (chartOptions.ytdRates) {
      datasets.push({
        label: "Year-To-Date Rates",
        data: ytdRates, // Ensure this is available from your calculations
        borderColor: "red",
        fill: false,
      });
    }
    if (chartOptions.annualizedRates) {
      datasets.push({
        label: "Annualized Rates",
        data: annualizedRates, // Ensure this is available from your calculations
        borderColor: "black",
        fill: false,
      });
    }

    const ctx = document.getElementById("turnoverChart").getContext("2d");
    window.turnoverChart = new Chart(ctx, {
      type: "line", // or 'bar' based on your preference
      data: {
        labels: labels,
        datasets: datasets,
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  // Assuming generateLabelsForSelectedRange is defined outside if it's used elsewhere
  function generateLabelsForSelectedRange(startMonthIndex, endMonthIndex) {
    let labels = [];
    for (let i = startMonthIndex; i <= endMonthIndex; i++) {
      const monthName = new Date(2000, i).toLocaleString("en", {
        month: "long",
      });
      labels.push(monthName);
    }
    console.log("Generated Labels:", labels);
    return labels;
  }
});
