// Optional code for calculating quarterly Turnover rates
$("#turnoverForm").on("submit", function (event) {
  event.preventDefault();

  const startMonthIndex = parseInt($("#startMonth").val());
  const endMonthIndex = parseInt($("#endMonth").val());
  let quarterlyRates = [];
  let totalLeaversForQuarter = 0;
  let beginningHeadcountForQuarter = parseInt($("#initialHeadcount").val()); // Start with the initial headcount

  for (let i = startMonthIndex; i <= endMonthIndex; i++) {
    const employeesLeft = parseInt($(`#employeesLeft${i}`).val()) || 0;
    const employeesEnd = parseInt($(`#employeesEnd${i}`).val()) || 0;

    // Accumulate leavers for the quarter
    totalLeaversForQuarter += employeesLeft;

    // At the end of each quarter or the end of the data range, calculate and reset
    if ((i + 1) % 3 === 0 || i === endMonthIndex) {
      // Use the beginning headcount for the quarter for the first month of each quarter, or the initial headcount for the first quarter
      let quarterBeginningHeadcount =
        i % 3 === 2 ||
        (i === endMonthIndex && endMonthIndex - startMonthIndex + 1 < 3)
          ? beginningHeadcountForQuarter
          : ending_headcount[i - 3];
      let quarterEndingHeadcount = employeesEnd;
      let averageHeadcount =
        (quarterBeginningHeadcount + quarterEndingHeadcount) / 2;
      let quarterRate = (totalLeaversForQuarter / averageHeadcount) * 100;

      quarterlyRates.push(quarterRate);

      // Reset for the next quarter
      totalLeaversForQuarter = 0;
      beginningHeadcountForQuarter = quarterEndingHeadcount; // Set this to the ending headcount of the current quarter
    }
  }

  // Display the quarterly rates...
});

//Previous generate form field function
function generateFormFields(startMonthIndex, endMonthIndex, data = []) {
  let formHtml = "";

  // Ensure the data is being correctly utilized
  console.log("Generating form fields with data:", data);

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
    const monthData = data.find((d) => d.month === i + 1); // Find the data for the current month
    const leavers = monthData ? monthData.leavers : 0;
    const endCount = monthData ? monthData.endCount : 0;

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
}
