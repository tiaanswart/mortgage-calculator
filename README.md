# Mortgage Calculator

[![Deploy to GitHub Pages](https://github.com/tiaanswart/mortgage-calculator/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)](https://tiaanswart.github.io/mortgage-calculator)

A comprehensive mortgage calculator built with HTML, Tailwind CSS, and JavaScript. This single-page application provides detailed mortgage calculations including payment schedules, amortization tables, visual comparisons with interactive charts, net worth tracking, and **shareable URL functionality**.

## 🚀 Features

### **Core Loan Input Fields**

- **Loan Amount**: The principal amount of the mortgage
- **Annual Interest Rate**: The yearly interest rate as a percentage
- **Interest Accrual Frequency**: Choose how often interest is calculated:
  - Daily (365 days/year)
  - Monthly (12 periods/year)
  - Yearly (1 period/year)
- **Loan Period**: The term of the loan in years
- **Payment Frequency**: Choose from weekly, fortnightly, monthly, or yearly payments
- **Start Date**: When the loan begins
- **First Payment Date**: When the first payment is due (defaults to start date)

### **Property Details Section (Optional)**

- **Property Value**: Current market value of the property
- **Property Offer**: Purchase price offered for the property
- **Deposit Percentage**: Percentage of offer price as deposit
- **Deposit Value**: Fixed deposit amount
- **Auto-calculation**: Loan amount automatically calculated from property offer minus deposit
- **Net Worth Tracking**: Visual representation of equity growth over time

### **Advanced Extra Payment System**

- **Multiple Payment Types**:
  - **Recurring Extra Payments**: Regular additional payments with optional count limit
  - **Custom Total Payments**: Set a specific total payment amount (must exceed scheduled payment)
  - **Lump Sum Payments**: One-time payments on specific dates
- **Flexible Configuration**:
  - Add unlimited extra payment entries
  - Mix different payment types (except recurring + custom total)
  - Set payment counts or apply to all remaining payments
  - Specify exact dates for lump sum payments
- **Smart Validation**: Prevents conflicts between incompatible payment types

### **🔗 Shareable URL Functionality**

- **Automatic URL Updates**: Every calculation automatically updates the URL with all input parameters
- **Instant Sharing**: Copy the URL and share it with others - they'll see the exact same calculation
- **Complete State Preservation**: Saves all inputs including:
  - Basic loan details (amount, rate, period, frequency, dates)
  - Property details (value, offer, deposit amounts)
  - Extra payments (all types: recurring, custom total, lump sum)
  - Payment frequencies and interest accrual settings
- **One-Click Copy**: Copy URL button with visual feedback
- **Auto-Loading**: When someone opens a shared URL, the form auto-populates and calculates results instantly
- **URL Parameters**: Uses clean URL parameters (not hash fragments) for better compatibility
- **Base64 Encoding**: Complex extra payment data is efficiently encoded
- **Visual Notification**: Blue notification appears when URL is saved, confirming it's shareable

### **Comprehensive Calculations & Results**

- **Scheduled Payment**: The regular payment amount
- **Scheduled Number of Payments**: Total payments without extra payments
- **Actual Number of Payments**: Total payments including early payoff from extra payments
- **Total Extra Payments**: Sum of all extra payments made
- **Total Interest**: Total interest paid over the life of the loan
- **Interest Saved**: Amount of interest saved by making extra payments
- **Total Amount Paid**: Complete amount paid including principal, interest, and extra payments

### **Payment Date Analysis**

- **Estimated Last Payment Date**: When the loan will be paid off without extra payments
- **Early Last Payment Date**: When the loan will be paid off with extra payments
- **Time Saved Badge**: Shows how much earlier the loan will be paid off (e.g., "7 years 5 months earlier")

### **Interactive Visualizations**

#### **Loan Balance Chart**

- **Dual-Line Visualization**: Compares loan balance with and without extra payments
- **Actual Calendar Years**: Shows real years (2025, 2026, etc.) instead of generic "Year 1, Year 2"
- **Filled Areas**: Light colored areas under each line for better visual impact
- **Hover Tooltips**: Interactive tooltips showing exact balance amounts
- **Responsive Design**: Adapts to different screen sizes
- **Smart Display**: Shows single line when no extra payments, dual lines when extra payments exist

#### **Net Worth Chart** (when property value is specified)

- **Equity Tracking**: Shows property equity over time (Property Value - Remaining Loan Balance)
- **Comparison Scenarios**: Displays net worth with and without extra payments
- **Visual Growth**: Demonstrates how extra payments accelerate equity building
- **Professional Styling**: Green color scheme for positive net worth growth

### **Enhanced Payment Schedule Table**

- **Color-Coded Values**:
  - Green for positive values (extra payments, principal reduction)
  - Red for negative values (interest, cumulative interest)
  - Blue for total payment amounts
  - Purple for balance amounts
  - Emerald for net worth (when property value is set)
- **Visual Indicators**:
  - `+` signs for extra payments
  - `-` signs for principal and interest deductions
  - Bold text for important totals
- **Highlighted Columns**:
  - Beginning Balance (indigo background)
  - Total Payment (blue background)
  - Ending Balance (purple background)
  - Net Worth (emerald background, when applicable)
- **Interactive Details**: Hover tooltips for extra payment breakdowns
- **Responsive Design**: Horizontal scrolling on mobile devices

### **Smart Input Validation & Error Handling**

- **Real-time Validation**: Immediate feedback on invalid inputs
- **Conflict Detection**: Prevents incompatible extra payment configurations
- **Range Checking**: Ensures realistic values for all inputs
- **Date Validation**: Prevents invalid date combinations
- **Visual Error Indicators**: Clear highlighting of problematic fields
- **Helpful Error Messages**: Specific guidance on how to fix issues

### **Property Integration Features**

- **Automatic Calculations**: Loan amount updates when property details change
- **Deposit Flexibility**: Choose between percentage or fixed amount
- **Bidirectional Updates**: Changes in loan amount clear property inputs to avoid confusion
- **Net Worth Integration**: Property value enables net worth tracking throughout the loan term

## 🔧 How It Works

### **URL Sharing System**

The calculator automatically saves all input parameters to the URL, making calculations instantly shareable:

#### **URL Parameter Structure**

```
/mortgage-calculator?la=300000&ir=4.5&ia=daily&lp=30&pf=12&sd=2024-01-15&fpd=2024-01-15&pv=350000&po=350000&dp=20&dv=70000&ep=W3sidCI6InJlY3VycmluZyIsImEiOjUwMCwiYyI6MTJ9XQ==
```

**Parameter Breakdown:**
- `la` = Loan Amount
- `ir` = Interest Rate
- `ia` = Interest Accrual (daily/monthly/yearly)
- `lp` = Loan Period (years)
- `pf` = Payment Frequency (52=weekly, 26=fortnightly, 12=monthly, 1=yearly)
- `sd` = Start Date
- `fpd` = First Payment Date
- `pv` = Property Value
- `po` = Property Offer
- `dp` = Deposit Percentage
- `dv` = Deposit Value
- `ep` = Extra Payments (base64-encoded JSON)

#### **Extra Payments Encoding**

Complex extra payment data is base64-encoded as a single parameter:

```javascript
// Example: Recurring $500 monthly for 12 payments
const extraPayments = [{
  "t": "recurring",  // type
  "a": 500,         // amount
  "c": 12           // count
}];
// Encoded as: W3sidCI6InJlY3VycmluZyIsImEiOjUwMCwiYyI6MTJ9XQ==
```

#### **Auto-Loading Process**

1. **URL Detection**: On page load, checks for URL parameters
2. **Parameter Parsing**: Extracts all input values from URL
3. **Form Population**: Automatically fills all form fields
4. **Extra Payment Reconstruction**: Rebuilds extra payment entries from encoded data
5. **Auto-Calculation**: Runs calculation and displays results instantly
6. **Visual Feedback**: Shows notification that URL was loaded successfully

#### **Sharing Workflow**

1. **User Input**: Fill out mortgage calculator form
2. **Calculate**: Click "Calculate Mortgage" button
3. **URL Update**: URL automatically updates with all parameters
4. **Notification**: Blue notification appears: "Calculation saved to URL! You can now share this link with others."
5. **Copy URL**: Click "Copy URL" button to copy to clipboard
6. **Share**: Send URL via email, messaging, or any platform
7. **Recipient Experience**: Recipient opens URL and sees exact same calculation instantly

### **Core Calculation Engine**

The calculator uses advanced mortgage formulas to determine payment schedules:

#### **Payment Amount Formula**

```
P = L[c(1 + c)^n]/[(1 + c)^n - 1]
```

Where:

- P = payment amount
- L = loan amount
- c = rate per payment period (annual rate ÷ payment frequency)
- n = total number of payments

#### **Interest Accrual Options**

- **Daily**: Interest calculated daily (365 days/year)
- **Monthly**: Interest calculated monthly (12 periods/year)
- **Yearly**: Interest calculated yearly (1 period/year)

#### **Payment Schedule Generation**

1. **Initial Setup**: Creates payment schedule starting from the user's selected start date
2. **Payment Frequency**: Adjusts payment intervals based on frequency selection:
   - Weekly: 7 days between payments
   - Fortnightly: 14 days between payments
   - Monthly: 30 days between payments
   - Yearly: 365 days between payments
3. **Extra Payment Processing**:
   - **Recurring**: Applies extra payment for specified count or all remaining payments
   - **Custom Total**: Sets total payment to specified amount
   - **Lump Sum**: Applies one-time payment on specific date
4. **Chronological Processing**: All payments (regular + lump sum) processed in date order
5. **Balance Calculation**: For each payment:
   - Calculates interest on current balance
   - Applies scheduled payment + extra payment
   - Deducts interest from total payment
   - Remaining amount reduces principal
   - Updates ending balance and cumulative interest

### **Advanced Extra Payment Logic**

#### **Recurring Extra Payments**

- Applied to regular payment schedule
- Optional count limit (empty = all remaining payments)
- Can be combined with other recurring payments
- Automatically stops when loan is paid off

#### **Custom Total Payments**

- Sets the total payment amount (scheduled + extra)
- Must exceed the scheduled payment amount
- Takes precedence over recurring payments
- Cannot be combined with recurring payments

#### **Lump Sum Payments**

- Processed as standalone payments on specific dates
- Interest calculated based on actual days since last payment
- Can be applied at any point during the loan term
- Integrated chronologically with regular payments

### **Net Worth Calculation**

- **Formula**: Net Worth = Property Value - Remaining Loan Balance
- **Tracking**: Calculated for each payment period
- **Visualization**: Separate chart showing equity growth over time
- **Comparison**: Shows net worth with and without extra payments

### **Chart Generation Process**

1. **Data Preparation**:
   - Groups payments by year based on payment frequency
   - Extracts balance/net worth for each year
   - Calculates actual calendar years from start date
2. **Dual Scenario Comparison**:
   - Generates payment schedule with extra payments
   - Generates payment schedule without extra payments
   - Creates two data series for chart visualization
3. **Visual Styling**:
   - Blue line with fill for loan balance
   - Green line with fill for net worth
   - Interactive tooltips with currency formatting
   - Responsive design for all screen sizes

### **Payment Date Calculations**

1. **Last Payment Detection**:
   - Identifies when loan balance reaches zero
   - Extracts actual payment date from schedule
   - Formats date in user-friendly format
2. **Time Difference Calculation**:
   - Compares last payment dates between scenarios
   - Calculates years and months difference
   - Displays in human-readable format

### **Interest Savings Analysis**

1. **Dual Calculation**:
   - Calculates total interest with extra payments
   - Calculates total interest without extra payments
   - Computes the difference as "Interest Saved"
2. **Real-time Updates**:
   - Updates automatically when inputs change
   - Shows immediate impact of extra payments

## 🎨 User Interface Features

### **Responsive Design**

- **Mobile-First**: Optimized for all device sizes
- **Grid Layout**: Adapts from 1 column (mobile) to 3-4 columns (desktop)
- **Touch-Friendly**: Large buttons and input fields
- **Horizontal Scrolling**: Payment table scrolls horizontally on small screens

### **Visual Feedback**

- **Color Psychology**:
  - Green = positive/savings/equity
  - Red = negative/costs
  - Blue = totals
  - Purple = balances
  - Emerald = net worth
- **Interactive Elements**:
  - Hover effects on buttons and table rows
  - Smooth transitions and animations
  - Loading states and feedback
  - Tooltips for detailed information

### **Smart Form Management**

- **Auto-calculation**: Property inputs automatically update loan amount
- **Conflict Prevention**: Prevents incompatible extra payment combinations
- **Input Synchronization**: Bidirectional updates between related fields
- **Error Recovery**: Clear guidance on fixing validation issues

## 📊 Technical Implementation

### **Architecture**

- **Single Page Application**: Pure HTML/CSS/JavaScript
- **Object-Oriented Design**: ES6+ classes for maintainability
- **Modular Functions**: Separated concerns for calculations, UI, and data processing
- **No Dependencies**: Uses only CDN-loaded Chart.js and Tailwind CSS

### **Key JavaScript Classes**

#### **MortgageCalculator Class**

- **Initialization**: Sets up DOM elements and event listeners
- **Input Management**: Handles user input, validation, and auto-calculation
- **Calculation Orchestration**: Coordinates all calculation processes
- **UI Updates**: Manages display of results, charts, and tables
- **Error Handling**: Comprehensive validation and user feedback
- **URL Management**: Handles saving and loading from URL parameters

#### **Calculation Methods**

- `calculatePaymentAmount()`: Core mortgage formula implementation
- `generatePaymentSchedule()`: Creates complete payment timeline with extra payments
- `calculateSummary()`: Computes summary statistics
- `calculateInterestWithoutExtraPayments()`: Comparison calculations
- `calculateLastPaymentDates()`: Date analysis and formatting
- `calculateTimeDifference()`: Time savings calculations
- `calculateNetWorthForPayments()`: Net worth tracking

#### **URL Sharing Methods**

- `saveToUrlHash()`: Saves all form data to URL parameters
- `loadFromUrlHash()`: Loads and parses URL parameters on page load
- `populateFormFromHash()`: Reconstructs form state from URL data
- `copyUrlToClipboard()`: Copies current URL to clipboard with feedback
- `showUrlShareNotification()`: Displays sharing notification

#### **Advanced Features**

- `getExtraPayments()`: Processes multiple extra payment types
- `validateExtraPayments()`: Comprehensive validation logic
- `updatePaymentTypeFields()`: Dynamic UI updates based on payment type
- `prepareChartData()`: Data preparation for visualizations
- `generateNetWorthChart()`: Net worth chart generation

#### **Chart Integration**

- **Chart.js Library**: Professional charting capabilities
- **Dynamic Data**: Real-time chart updates
- **Custom Styling**: Tailored visual design
- **Responsive Charts**: Adapts to container size
- **Dual Charts**: Loan balance and net worth visualizations

### **Data Flow**

1. **User Input** → Input validation and auto-calculation
2. **Validated Data** → Core calculations with extra payments
3. **Payment Schedule** → Summary statistics and date analysis
4. **Results** → UI updates, chart generation, and table population
5. **URL Update** → Save all parameters to URL for sharing
6. **Visual Output** → Interactive display with tooltips and hover effects

## 🚀 Getting Started

### **Prerequisites**

- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server setup required
- Internet connection for CDN resources (Chart.js, Tailwind CSS)

### **Local Installation**

1. Clone or download the project files
2. Open `index.html` in your web browser
3. Start calculating mortgages!

### **GitHub Pages Deployment**

This project is optimized for secure GitHub Pages deployment with proper CI/CD practices. Follow these steps to deploy:

1. **Create a GitHub Repository**:
   - Go to [GitHub](https://github.com) and create a new repository
   - Name it `mortgage-calculator` or any name you prefer

2. **Upload Your Files**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/tiaanswart/mortgage-calculator.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click on "Settings" tab
   - Scroll down to "Pages" section
   - Under "Source", select "Deploy from a branch"
   - Choose "gh-pages" branch (will be created automatically)
   - Click "Save"

4. **Automatic Deployment**:
   - The GitHub Actions workflow will automatically deploy your site
   - **Only pushes to main/master branch trigger deployment** (secure)
   - Pull requests are validated but don't deploy (prevents unauthorized deployments)
   - Your site will be available at: `https://tiaanswart.github.io/mortgage-calculator`

### **Alternative: Manual GitHub Pages Setup**

If you prefer not to use GitHub Actions:

1. **Create gh-pages branch**:
   ```bash
   git checkout -b gh-pages
   git push origin gh-pages
   ```

2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Select "Deploy from a branch"
   - Choose "gh-pages" branch
   - Save

3. **Manual updates**:
   ```bash
   git checkout gh-pages
   git merge main
   git push origin gh-pages
   ```

### **Usage Example**

1. **Enter Loan Details**:
   - Loan Amount: $300,000
   - Interest Rate: 4.5%
   - Interest Accrual: Daily
   - Loan Period: 30 years
   - Payment Frequency: Monthly
   - Start Date: Today's date
2. **Add Property Details** (Optional):
   - Property Value: $375,000
   - Property Offer: $375,000
   - Deposit Percentage: 20%
3. **Add Extra Payments** (Optional):
   - Recurring Extra Payment: $100 monthly
   - Lump Sum Payment: $10,000 on 1st anniversary
4. **View Results**:
   - Summary cards show key metrics
   - Charts display visual comparisons
   - Payment schedule table shows detailed breakdown
   - Net worth chart shows equity growth
5. **Share Results**:
   - URL automatically updates with all parameters
   - Click "Copy URL" to copy shareable link
   - Share with others - they'll see the exact same calculation

## 🔍 Example Scenarios

### **Scenario 1: Standard 30-Year Mortgage**

- **Input**: $300,000 loan, 4.5% interest, 30 years, monthly payments
- **Result**: $1,520.06 monthly payment, paid off in 2055
- **Total Interest**: $247,220
- **Shareable URL**: `/mortgage-calculator?la=300000&ir=4.5&ia=daily&lp=30&pf=12&sd=2024-01-15&fpd=2024-01-15`

### **Scenario 2: With Extra Payments**

- **Input**: Same as above + $100 extra monthly + $10,000 lump sum on 1st anniversary
- **Result**: Paid off in 2047 (8 years early)
- **Interest Saved**: $66,770
- **Time Saved**: "8 years earlier"
- **Shareable URL**: Includes encoded extra payment data

### **Scenario 3: Property Investment Analysis**

- **Input**: $375,000 property, $300,000 loan, 4.5% interest, 30 years
- **Result**: Initial net worth $75,000, grows to $375,000 when paid off
- **With Extra Payments**: Net worth reaches $375,000 8 years earlier
- **Shareable URL**: Includes property details and net worth tracking

## 🛠️ Browser Compatibility

- **Chrome**: 60+ (recommended)
- **Firefox**: 55+
- **Safari**: 12+
- **Edge**: 79+

## 📁 File Structure

```
mortgage-calculator/
├── index.html          # Main HTML file with responsive UI
├── script.js           # JavaScript logic and calculations
└── README.md           # This documentation
```

## 🎯 Key Benefits

### **For Users**

- **Comprehensive Analysis**: Complete mortgage breakdown with multiple scenarios
- **Visual Comparisons**: Easy-to-understand charts and graphs
- **Flexible Extra Payments**: Multiple payment strategies and types
- **Real-time Updates**: Instant calculation results
- **Professional Design**: Clean, modern interface
- **Property Integration**: Track net worth and equity growth
- **Advanced Features**: Interest accrual options and detailed validation
- **Easy Sharing**: One-click URL sharing with complete state preservation
- **Instant Loading**: Shared URLs load and calculate results automatically

### **For Developers**

- **Modular Code**: Easy to maintain and extend
- **No Dependencies**: Pure vanilla JavaScript with CDN resources
- **Responsive Design**: Works on all devices
- **Well-Documented**: Clear code structure and comments
- **Extensible Architecture**: Easy to add new features
- **URL State Management**: Robust parameter handling and encoding

## 🔮 Future Enhancements

Potential features for future versions:

- **Multiple Loan Comparison**: Compare different loan scenarios side-by-side
- **Export Functionality**: Download results as PDF or CSV
- **Advanced Charts**: Additional visualization options (pie charts, bar charts)
- **Backend Integration**: Save and share calculations with user accounts
- **Amortization Schedule Export**: Download detailed payment schedules
- **Interest Rate Comparison**: Compare different interest rate scenarios
- **Property Value Appreciation**: Include property value growth over time
- **Tax Implications**: Calculate tax benefits and deductions
- **Refinancing Analysis**: Compare current loan vs. refinancing options
- **Investment Comparison**: Compare mortgage payments vs. investment returns
- **Social Sharing**: Direct sharing to social media platforms
- **QR Code Generation**: Generate QR codes for shared URLs
- **Calculation History**: Save recent calculations locally
- **Custom URL Shortening**: Create shorter, more memorable URLs

---

**Built with ❤️ using HTML, Tailwind CSS, and JavaScript (Vanilla and Chart.js)**
