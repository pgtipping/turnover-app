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
