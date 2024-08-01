# Employee Turnover Calculator

## Overview

The Employee Turnover Calculator is a web application that helps businesses calculate and visualize employee turnover rates over a selected period. Users can enter data manually or upload a CSV file containing the necessary information.

## Features

- Calculate monthly, quarterly, and annualized turnover rates
- Upload CSV files with employee data
- Generate a PDF report of the turnover rates
- View detailed guides on how to use the application

## Technologies Used

- Node.js
- Express.js
- Bootstrap
- jQuery
- Chart.js
- Multer (for file uploads)

## Setup and Installation

### Prerequisites

- Node.js installed on your machine
- NPM (Node Package Manager) installed

### Installation Steps

1. Clone the repository:
2. Navigate to the project directory:
3. Install the dependencies:
4. Create a `.env` file in the root directory and add the following:
   PORT= {your preferred port}
   FILE_UPLOAD_PATH= {your preferred upload path}
5. Start the application:
   npm start
6. Open your browser and navigate to `http://localhost:{PORT}`.

## Usage

- Enter the initial headcount for the start month.
- Select the data entry method (manual or CSV upload).
- If manual entry is selected, provide the required data for each month.
- If CSV upload is selected, upload a CSV file with the following columns: month, number of employees who left, number of employees at the end of the month.
- View the calculated turnover rates and generate a PDF report.

## Guide

For a detailed guide on how to use the application, navigate to the "Guides" page from the header.

## Contact

For any inquiries or support, please contact [pgtipping1@gmail.com](mailto:pgtipping1@gmail.com).

© 2024 Employee Turnover Calculator
