// Mortgage Calculator JavaScript

class MortgageCalculator {
  constructor() {
    this.initializeElements();
    this.setDefaultDate();
    this.bindEvents();
    this.extraPaymentCounter = 0;
    this.loadFromUrlHash(); // Load from URL parameters on page load
  }

  initializeElements() {
    this.loanAmount = document.getElementById('loanAmount');
    this.interestRate = document.getElementById('interestRate');
    this.interestAccrual = document.getElementById('interestAccrual');
    this.loanPeriod = document.getElementById('loanPeriod');
    this.paymentFrequency = document.getElementById('paymentFrequency');
    this.startDate = document.getElementById('startDate');
    this.firstPaymentDate = document.getElementById('firstPaymentDate');
    this.addExtraPaymentBtn = document.getElementById('addExtraPaymentBtn');
    this.extraPaymentsContainer = document.getElementById('extraPaymentsContainer');
    this.calculateBtn = document.getElementById('calculateBtn');

    // Property elements
    this.propertyValue = document.getElementById('propertyValue');
    this.propertyOffer = document.getElementById('propertyOffer');
    this.depositPercentage = document.getElementById('depositPercentage');
    this.depositValue = document.getElementById('depositValue');

    // Error message elements
    this.loanAmountError = document.getElementById('loanAmountError');
    this.interestRateError = document.getElementById('interestRateError');
    this.loanPeriodError = document.getElementById('loanPeriodError');
    this.startDateError = document.getElementById('startDateError');
    this.firstPaymentDateError = document.getElementById('firstPaymentDateError');
    this.extraPaymentsError = document.getElementById('extraPaymentsError');

    // Results elements
    this.resultsSummary = document.getElementById('resultsSummary');
    this.urlShareNotification = document.getElementById('urlShareNotification');
    this.copyUrlBtn = document.getElementById('copyUrlBtn');
    this.scheduledPayment = document.getElementById('scheduledPayment');
    this.scheduledPayments = document.getElementById('scheduledPayments');
    this.actualPayments = document.getElementById('actualPayments');
    this.totalExtraPayments = document.getElementById('totalExtraPayments');
    this.totalInterest = document.getElementById('totalInterest');
    this.totalPaid = document.getElementById('totalPaid');
    this.interestSaved = document.getElementById('interestSaved');
    this.lastPaymentDate = document.getElementById('lastPaymentDate');
    this.earlyPaymentDate = document.getElementById('earlyPaymentDate');
    this.timeSavedBadge = document.getElementById('timeSavedBadge');

    // Table elements
    this.paymentTable = document.getElementById('paymentTable');
    this.paymentTableBody = document.getElementById('paymentTableBody');

    // Chart elements
    this.loanChart = document.getElementById('loanChart');
    this.netWorthChart = document.getElementById('netWorthChart');
    this.balanceChart = null;
    this.netWorthChartInstance = null;
  }

  setDefaultDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    this.startDate.value = formattedDate;
    this.firstPaymentDate.value = formattedDate;
  }

  showError(fieldName, message) {
    const errorElement = this[`${fieldName}Error`];
    const inputElement = this[fieldName];

    if (errorElement && inputElement) {
      errorElement.textContent = message;
      errorElement.classList.remove('hidden');
      inputElement.classList.add('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
      inputElement.classList.remove(
        'border-gray-300',
        'focus:ring-primary',
        'focus:border-transparent'
      );
    }
  }

  clearError(fieldName) {
    const errorElement = this[`${fieldName}Error`];
    const inputElement = this[fieldName];

    if (errorElement && inputElement) {
      errorElement.classList.add('hidden');
      inputElement.classList.remove('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
      inputElement.classList.add(
        'border-gray-300',
        'focus:ring-primary',
        'focus:border-transparent'
      );
    }
  }

  clearAllErrors() {
    this.clearError('loanAmount');
    this.clearError('interestRate');
    this.clearError('loanPeriod');
    this.clearError('startDate');
    this.clearError('firstPaymentDate');
    this.clearExtraPaymentsGlobalError();
  }

  showExtraPaymentsGlobalError(message) {
    if (this.extraPaymentsError) {
      this.extraPaymentsError.textContent = message;
      this.extraPaymentsError.classList.remove('hidden');
    }
  }

  clearExtraPaymentsGlobalError() {
    if (this.extraPaymentsError) {
      this.extraPaymentsError.classList.add('hidden');
    }
  }

  checkForConflicts() {
    const hasRecurring = this.hasPaymentType('recurring');
    const hasCustomTotal = this.hasPaymentType('custom');

    if (hasRecurring && hasCustomTotal) {
      this.showExtraPaymentsGlobalError(
        'Cannot have both recurring and custom total payment types. Please remove one type before calculating.'
      );
      return true; // Conflict exists
    } else {
      this.clearExtraPaymentsGlobalError();
      this.clearAllDropdownHighlights();
      return false; // No conflict
    }
  }

  clearAllDropdownHighlights() {
    const entries = this.extraPaymentsContainer.querySelectorAll('[id^="extra-payment-"]');
    entries.forEach((entry) => {
      const entryId = entry.id;
      const dropdown = document.getElementById(`paymentType-${entryId}`);
      if (dropdown) {
        dropdown.classList.remove('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
        dropdown.classList.add('border-gray-300', 'focus:ring-primary', 'focus:border-transparent');
      }
    });
  }

  clearAllResults() {
    // Hide all result sections
    this.resultsSummary.classList.add('hidden');
    this.paymentTable.classList.add('hidden');
    this.loanChart.classList.add('hidden');
    this.netWorthChart.classList.add('hidden');

    // Destroy chart if it exists
    if (this.balanceChart) {
      this.balanceChart.destroy();
      this.balanceChart = null;
    }

    // Destroy net worth chart if it exists
    if (this.netWorthChartInstance) {
      this.netWorthChartInstance.destroy();
      this.netWorthChartInstance = null;
    }

    // Clear table body
    if (this.paymentTableBody) {
      this.paymentTableBody.innerHTML = '';
    }
  }

  highlightConflictingDropdown(entryId) {
    const dropdown = document.getElementById(`paymentType-${entryId}`);
    if (dropdown) {
      dropdown.classList.add('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
      dropdown.classList.remove(
        'border-gray-300',
        'focus:ring-primary',
        'focus:border-transparent'
      );
    }
  }

  hasPaymentType(type, excludeEntryId = null) {
    const entries = this.extraPaymentsContainer.querySelectorAll('[id^="extra-payment-"]');
    return Array.from(entries).some((entry) => {
      const entryId = entry.id;
      // Skip the excluded entry
      if (excludeEntryId && entryId === excludeEntryId) {
        return false;
      }
      return document.getElementById(`paymentType-${entryId}`).value === type;
    });
  }

  bindEvents() {
    this.addExtraPaymentBtn.addEventListener('click', () => this.addExtraPaymentEntry());
    this.calculateBtn.addEventListener('click', () => this.calculate());

    // Copy URL button
    if (this.copyUrlBtn) {
      this.copyUrlBtn.addEventListener('click', () => this.copyUrlToClipboard());
    }

    // Clear errors when user starts typing
    this.loanAmount.addEventListener('input', () => this.clearError('loanAmount'));
    this.interestRate.addEventListener('input', () => this.clearError('interestRate'));
    this.loanPeriod.addEventListener('input', () => this.clearError('loanPeriod'));
    this.startDate.addEventListener('change', () => this.clearError('startDate'));
    this.firstPaymentDate.addEventListener('change', () => this.clearError('firstPaymentDate'));

    // Property input event bindings
    this.propertyOffer.addEventListener('input', () => {
      this.updateDepositValueFromPercentage();
      this.updateLoanAmountFromDeposit();
    });
    this.depositPercentage.addEventListener('input', () => {
      this.updateDepositValueFromPercentage();
      this.updateLoanAmountFromDeposit();
    });
    this.depositValue.addEventListener('input', () => {
      this.updateDepositPercentageFromValue();
      this.updateLoanAmountFromDeposit();
    });

    // Sync loan amount when property inputs change
    this.propertyOffer.addEventListener('input', () => this.syncLoanAmountFromProperty());
    this.depositValue.addEventListener('input', () => this.syncLoanAmountFromProperty());

    // When loan amount is manually changed, clear property inputs to avoid confusion
    this.loanAmount.addEventListener('input', () => {
      const offer = parseFloat(this.propertyOffer.value) || 0;
      const depositValue = parseFloat(this.depositValue.value) || 0;

      // If user manually changes loan amount and property inputs are set,
      // clear them to avoid confusion about which value is correct
      if (offer > 0 || depositValue > 0) {
        this.propertyOffer.value = '';
        this.depositValue.value = '';
        this.depositPercentage.value = '20';
      }
    });

    // Clear extra payments global error when user interacts with extra payments
    this.extraPaymentsContainer.addEventListener('click', () =>
      this.clearExtraPaymentsGlobalError()
    );

    // Check for conflicts when the page loads (in case there are existing entries)
    setTimeout(() => this.checkForConflicts(), 100);
  }

  updateDepositValueFromPercentage() {
    const offer = parseFloat(this.propertyOffer.value) || 0;
    const percentage = parseFloat(this.depositPercentage.value) || 0;

    if (offer > 0 && percentage > 0) {
      const depositValue = (offer * percentage) / 100;
      this.depositValue.value = Math.round(depositValue);
    }
  }

  updateDepositPercentageFromValue() {
    const offer = parseFloat(this.propertyOffer.value) || 0;
    const depositValue = parseFloat(this.depositValue.value) || 0;

    if (offer > 0 && depositValue > 0) {
      const percentage = (depositValue / offer) * 100;
      this.depositPercentage.value = percentage.toFixed(1);
    }
  }

  updateLoanAmountFromDeposit() {
    const offer = parseFloat(this.propertyOffer.value) || 0;
    const depositValue = parseFloat(this.depositValue.value) || 0;

    if (offer > 0) {
      const loanAmount = offer - depositValue;
      this.loanAmount.value = Math.max(0, loanAmount);
    }
  }

  syncLoanAmountFromProperty() {
    const offer = parseFloat(this.propertyOffer.value) || 0;
    const depositValue = parseFloat(this.depositValue.value) || 0;

    // Only update loan amount if both property offer and deposit value are set
    if (offer > 0 && depositValue > 0) {
      const calculatedLoanAmount = offer - depositValue;
      const currentLoanAmount = parseFloat(this.loanAmount.value) || 0;

      // Only update if the calculated amount is different from current
      if (Math.abs(calculatedLoanAmount - currentLoanAmount) > 0.01) {
        this.loanAmount.value = Math.max(0, calculatedLoanAmount);
      }
    }
  }

  addExtraPaymentEntry() {
    // Clear any previous global error
    this.clearExtraPaymentsGlobalError();

    // Check if adding this entry would create a conflict
    const hasRecurring = this.hasPaymentType('recurring');
    const hasCustomTotal = this.hasPaymentType('custom');

    if (hasRecurring && hasCustomTotal) {
      this.showExtraPaymentsGlobalError(
        'Cannot add more extra payments. You already have both recurring and custom total payment types. Please remove one type before adding another.'
      );
      return;
    }

    this.extraPaymentCounter++;
    const entryId = `extra-payment-${this.extraPaymentCounter}`;

    // Store the previous selection for this entry
    this[`previousPaymentType_${entryId}`] = 'recurring'; // Default

    const entryHtml = `
            <div id="${entryId}" class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-lg font-semibold text-gray-700">Extra Payment #${this.extraPaymentCounter}</h4>
                    <button onclick="mortgageCalculator.removeExtraPaymentEntry('${entryId}')" class="text-red-600 hover:text-red-800 font-semibold">
                        ✕ Remove
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- Payment Type -->
                    <div>
                        <label for="paymentType-${entryId}" class="block text-sm font-medium text-gray-700 mb-2">
                            Payment Type
                        </label>
                        <select id="paymentType-${entryId}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" onchange="mortgageCalculator.updatePaymentTypeFields('${entryId}')">
                            <option value="recurring">Recurring Extra Payment</option>
                            <option value="custom">Custom Total Payment</option>
                            <option value="lump">Lump Sum Payment</option>
                        </select>
                    </div>
                    
                    <!-- Amount Field -->
                    <div id="amountField-${entryId}">
                        <label for="amount-${entryId}" class="block text-sm font-medium text-gray-700 mb-2">
                            Extra Payment Amount ($)
                        </label>
                        <input type="number" id="amount-${entryId}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="0" min="0" step="100" value="0">
                        <div id="amountError-${entryId}" class="hidden text-red-600 text-sm mt-1"></div>
                    </div>
                    
                    <!-- Number of Payments Field -->
                    <div id="countField-${entryId}">
                        <label for="count-${entryId}" class="block text-sm font-medium text-gray-700 mb-2">
                            Number of Payments (Optional)
                        </label>
                        <input type="number" id="count-${entryId}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Leave empty for all payments" min="0" value="">
                        <p class="text-xs text-gray-500 mt-1">Leave empty to apply to all payments until loan is paid off</p>
                        <div id="countError-${entryId}" class="hidden text-red-600 text-sm mt-1"></div>
                    </div>
                    
                    <!-- Custom Total Payment Field -->
                    <div id="customTotalField-${entryId}" class="hidden">
                        <label for="customTotal-${entryId}" class="block text-sm font-medium text-gray-700 mb-2">
                            Custom Total Payment ($)
                        </label>
                        <input type="number" id="customTotal-${entryId}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Must be more than scheduled payment" min="0" step="100" value="0">
                        <p class="text-xs text-gray-500 mt-1">Must be greater than the scheduled payment</p>
                        <div id="customTotalError-${entryId}" class="hidden text-red-600 text-sm mt-1"></div>
                    </div>
                    
                    <!-- Lump Sum Date Field -->
                    <div id="lumpDateField-${entryId}" class="hidden">
                        <label for="lumpDate-${entryId}" class="block text-sm font-medium text-gray-700 mb-2">
                            Lump Sum Date
                        </label>
                        <input type="date" id="lumpDate-${entryId}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                        <div id="lumpDateError-${entryId}" class="hidden text-red-600 text-sm mt-1"></div>
                    </div>
                    
                    <!-- Lump Sum Amount Field -->
                    <div id="lumpAmountField-${entryId}" class="hidden">
                        <label for="lumpAmount-${entryId}" class="block text-sm font-medium text-gray-700 mb-2">
                            Lump Sum Amount ($)
                        </label>
                        <input type="number" id="lumpAmount-${entryId}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="0" min="0" step="1000" value="0">
                        <div id="lumpAmountError-${entryId}" class="hidden text-red-600 text-sm mt-1"></div>
                    </div>
                </div>
            </div>
        `;

    this.extraPaymentsContainer.insertAdjacentHTML('beforeend', entryHtml);

    // Add event listeners for error clearing
    const amountInput = document.getElementById(`amount-${entryId}`);
    const countInput = document.getElementById(`count-${entryId}`);
    const customTotalInput = document.getElementById(`customTotal-${entryId}`);
    const lumpAmountInput = document.getElementById(`lumpAmount-${entryId}`);
    const lumpDateInput = document.getElementById(`lumpDate-${entryId}`);
    const paymentTypeSelect = document.getElementById(`paymentType-${entryId}`);

    if (amountInput)
      amountInput.addEventListener('input', () => this.clearExtraPaymentError(entryId, 'amount'));
    if (countInput)
      countInput.addEventListener('input', () => this.clearExtraPaymentError(entryId, 'count'));
    if (customTotalInput)
      customTotalInput.addEventListener('input', () =>
        this.clearExtraPaymentError(entryId, 'customTotal')
      );
    if (lumpAmountInput)
      lumpAmountInput.addEventListener('input', () =>
        this.clearExtraPaymentError(entryId, 'lumpAmount')
      );
    if (lumpDateInput)
      lumpDateInput.addEventListener('change', () =>
        this.clearExtraPaymentError(entryId, 'lumpDate')
      );
    if (paymentTypeSelect)
      paymentTypeSelect.addEventListener('change', () => this.clearExtraPaymentsGlobalError());
  }

  removeExtraPaymentEntry(entryId) {
    const entry = document.getElementById(entryId);
    if (entry) {
      entry.remove();
      // Clean up stored previous selection
      delete this[`previousPaymentType_${entryId}`];
      // Check for conflicts after removal
      this.checkForConflicts();
    }
  }

  updatePaymentTypeFields(entryId) {
    const paymentType = document.getElementById(`paymentType-${entryId}`).value;
    const previousType = this[`previousPaymentType_${entryId}`] || 'recurring';

    // Clear any previous global error
    this.clearExtraPaymentsGlobalError();

    // Clear all errors for this entry when switching types
    this.clearExtraPaymentErrors(entryId);

    // Hide all fields first
    document.getElementById(`amountField-${entryId}`).classList.add('hidden');
    document.getElementById(`countField-${entryId}`).classList.add('hidden');
    document.getElementById(`customTotalField-${entryId}`).classList.add('hidden');
    document.getElementById(`lumpDateField-${entryId}`).classList.add('hidden');
    document.getElementById(`lumpAmountField-${entryId}`).classList.add('hidden');

    // Show relevant fields based on payment type (always show correct fields regardless of conflicts)
    switch (paymentType) {
      case 'recurring':
        document.getElementById(`amountField-${entryId}`).classList.remove('hidden');
        document.getElementById(`countField-${entryId}`).classList.remove('hidden');
        break;
      case 'custom':
        document.getElementById(`customTotalField-${entryId}`).classList.remove('hidden');
        break;
      case 'lump':
        document.getElementById(`lumpDateField-${entryId}`).classList.remove('hidden');
        document.getElementById(`lumpAmountField-${entryId}`).classList.remove('hidden');
        break;
    }

    // Check for conflicts when switching to recurring or custom types
    if (paymentType === 'recurring' && this.hasPaymentType('custom', entryId)) {
      this.showExtraPaymentsGlobalError(
        'Cannot switch to recurring payment type. You already have a custom total payment. Please remove the custom total payment first.'
      );
      // Highlight the conflicting dropdown
      this.highlightConflictingDropdown(entryId);
      // Store the current selection as previous for next time (even though it's invalid)
      this[`previousPaymentType_${entryId}`] = paymentType;
      return;
    }

    if (paymentType === 'custom' && this.hasPaymentType('recurring', entryId)) {
      this.showExtraPaymentsGlobalError(
        'Cannot switch to custom total payment type. You already have a recurring payment. Please remove the recurring payment first.'
      );
      // Highlight the conflicting dropdown
      this.highlightConflictingDropdown(entryId);
      // Store the current selection as previous for next time (even though it's invalid)
      this[`previousPaymentType_${entryId}`] = paymentType;
      return;
    }

    // Store the current selection as previous for next time
    this[`previousPaymentType_${entryId}`] = paymentType;
  }

  getExtraPayments() {
    const extraPayments = [];
    const entries = this.extraPaymentsContainer.querySelectorAll('[id^="extra-payment-"]');

    entries.forEach((entry) => {
      const entryId = entry.id;
      const paymentType = document.getElementById(`paymentType-${entryId}`).value;

      let extraPayment = {
        type: paymentType,
        id: entryId,
      };

      switch (paymentType) {
        case 'recurring':
          const amount = parseFloat(document.getElementById(`amount-${entryId}`).value) || 0;
          const count = parseInt(document.getElementById(`count-${entryId}`).value) || 0;
          if (amount > 0) {
            extraPayment.amount = amount;
            extraPayment.count = count;
            extraPayments.push(extraPayment);
          }
          break;

        case 'custom':
          const customTotal =
            parseFloat(document.getElementById(`customTotal-${entryId}`).value) || 0;
          if (customTotal > 0) {
            extraPayment.customTotal = customTotal;
            extraPayments.push(extraPayment);
          }
          break;

        case 'lump':
          const lumpAmount =
            parseFloat(document.getElementById(`lumpAmount-${entryId}`).value) || 0;
          const lumpDate = document.getElementById(`lumpDate-${entryId}`).value;
          if (lumpAmount > 0 && lumpDate) {
            extraPayment.amount = lumpAmount;
            extraPayment.date = lumpDate;
            extraPayments.push(extraPayment);
          }
          break;
      }
    });

    return extraPayments;
  }

  validateExtraPayments() {
    const entries = this.extraPaymentsContainer.querySelectorAll('[id^="extra-payment-"]');
    let isValid = true;

    // Check for conflicts between recurring and custom total payments
    const hasRecurring = this.hasPaymentType('recurring');
    const hasCustomTotal = this.hasPaymentType('custom');

    if (hasRecurring && hasCustomTotal) {
      this.showExtraPaymentsGlobalError(
        'Cannot have both recurring and custom total payment types. Please remove one type before calculating.'
      );
      isValid = false;
      return isValid; // Exit early since this is a blocking error
    }

    entries.forEach((entry) => {
      const entryId = entry.id;
      const paymentType = document.getElementById(`paymentType-${entryId}`).value;

      // Clear previous errors for this entry
      this.clearExtraPaymentErrors(entryId);

      switch (paymentType) {
        case 'recurring':
          const amount = parseFloat(document.getElementById(`amount-${entryId}`).value) || 0;
          const count = parseInt(document.getElementById(`count-${entryId}`).value) || 0;

          if (amount <= 0) {
            this.showExtraPaymentError(
              entryId,
              'amount',
              'Please enter a valid extra payment amount greater than 0.'
            );
            isValid = false;
          }

          if (count < 0) {
            this.showExtraPaymentError(entryId, 'count', 'Number of payments cannot be negative.');
            isValid = false;
          }
          break;

        case 'custom':
          const customTotal =
            parseFloat(document.getElementById(`customTotal-${entryId}`).value) || 0;
          const scheduledPayment = this.getScheduledPayment();

          if (customTotal <= 0) {
            this.showExtraPaymentError(
              entryId,
              'customTotal',
              'Please enter a valid custom total payment greater than 0.'
            );
            isValid = false;
          } else if (customTotal <= scheduledPayment) {
            this.showExtraPaymentError(
              entryId,
              'customTotal',
              `Custom total payment must be greater than the scheduled payment ($${scheduledPayment.toFixed(
                2
              )}).`
            );
            isValid = false;
          }
          break;

        case 'lump':
          const lumpAmount =
            parseFloat(document.getElementById(`lumpAmount-${entryId}`).value) || 0;
          const lumpDate = document.getElementById(`lumpDate-${entryId}`).value;
          const startDate = this.startDate.value;

          if (lumpAmount <= 0) {
            this.showExtraPaymentError(
              entryId,
              'lumpAmount',
              'Please enter a valid lump sum amount greater than 0.'
            );
            isValid = false;
          }

          if (!lumpDate) {
            this.showExtraPaymentError(
              entryId,
              'lumpDate',
              'Please select a lump sum payment date.'
            );
            isValid = false;
          } else if (new Date(lumpDate) < new Date(startDate)) {
            this.showExtraPaymentError(
              entryId,
              'lumpDate',
              'Lump sum date cannot be before the loan start date.'
            );
            isValid = false;
          }
          break;
      }
    });

    return isValid;
  }

  getScheduledPayment() {
    const inputs = this.getInputs();
    return this.calculatePaymentAmount(inputs);
  }

  showExtraPaymentError(entryId, fieldName, message) {
    const errorElement = document.getElementById(`${fieldName}Error-${entryId}`);
    const inputElement = document.getElementById(`${fieldName}-${entryId}`);

    if (errorElement && inputElement) {
      errorElement.textContent = message;
      errorElement.classList.remove('hidden');
      inputElement.classList.add('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
      inputElement.classList.remove(
        'border-gray-300',
        'focus:ring-primary',
        'focus:border-transparent'
      );
    }
  }

  clearExtraPaymentError(entryId, fieldName) {
    const errorElement = document.getElementById(`${fieldName}Error-${entryId}`);
    const inputElement = document.getElementById(`${fieldName}-${entryId}`);

    if (errorElement && inputElement) {
      errorElement.classList.add('hidden');
      inputElement.classList.remove('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
      inputElement.classList.add(
        'border-gray-300',
        'focus:ring-primary',
        'focus:border-transparent'
      );
    }
  }

  clearExtraPaymentErrors(entryId) {
    this.clearExtraPaymentError(entryId, 'amount');
    this.clearExtraPaymentError(entryId, 'count');
    this.clearExtraPaymentError(entryId, 'customTotal');
    this.clearExtraPaymentError(entryId, 'lumpAmount');
    this.clearExtraPaymentError(entryId, 'lumpDate');
  }

  calculate() {
    // Clear all previous results first
    this.clearAllResults();

    const inputs = this.getInputs();

    if (!this.validateInputs(inputs)) {
      return;
    }

    const results = this.calculateMortgage(inputs);
    this.displayResults(results);
    this.generateChart(results);

    // Generate net worth chart if property value is specified
    if (inputs.propertyValue > 0) {
      this.generateNetWorthChart(results);
    }

    this.generatePaymentTable(results);

    // Save current state to URL parameters
    this.saveToUrlHash(inputs);
  }

  getInputs() {
    // Calculate loan amount from property inputs if available
    let loanAmount = parseFloat(this.loanAmount.value) || 0;
    const propertyOffer = parseFloat(this.propertyOffer.value) || 0;
    const depositValue = parseFloat(this.depositValue.value) || 0;

    // If both property offer and deposit value are set, calculate loan amount
    if (propertyOffer > 0 && depositValue > 0) {
      loanAmount = propertyOffer - depositValue;
    }

    return {
      loanAmount: Math.max(0, loanAmount),
      interestRate: parseFloat(this.interestRate.value) || 0,
      interestAccrual: this.interestAccrual.value || 'daily',
      loanPeriod: parseFloat(this.loanPeriod.value) || 0,
      paymentFrequency: parseInt(this.paymentFrequency.value) || 12,
      startDate: this.startDate.value,
      firstPaymentDate: this.firstPaymentDate.value || this.startDate.value,
      propertyValue: parseFloat(this.propertyValue.value) || 0,
      propertyOffer: propertyOffer,
      depositPercentage: parseFloat(this.depositPercentage.value) || 0,
      depositValue: depositValue,
      extraPayments: this.getExtraPayments(),
    };
  }

  validateInputs(inputs) {
    // Clear all previous errors
    this.clearAllErrors();

    let isValid = true;

    if (inputs.loanAmount <= 0) {
      this.showError('loanAmount', 'Please enter a valid loan amount greater than 0.');
      isValid = false;
    }

    if (inputs.interestRate <= 0 || inputs.interestRate > 100) {
      this.showError('interestRate', 'Please enter a valid interest rate between 0 and 100%.');
      isValid = false;
    }

    if (inputs.loanPeriod <= 0) {
      this.showError('loanPeriod', 'Please enter a valid loan period greater than 0.');
      isValid = false;
    }

    if (!inputs.startDate) {
      this.showError('startDate', 'Please select a start date.');
      isValid = false;
    }

    if (inputs.firstPaymentDate && new Date(inputs.firstPaymentDate) < new Date(inputs.startDate)) {
      this.showError('firstPaymentDate', 'First payment date cannot be before the start date.');
      isValid = false;
    }

    // Validate extra payments
    const extraPaymentsValid = this.validateExtraPayments();
    if (!extraPaymentsValid) {
      isValid = false;
    }

    return isValid;
  }

  calculateMortgage(inputs) {
    // Calculate the appropriate payment amount based on frequency
    const scheduledPayment = this.calculatePaymentAmount(inputs);

    // Generate payment schedule with extra payments
    const paymentSchedule = this.generatePaymentSchedule(inputs, scheduledPayment);

    // Calculate summary statistics
    const summary = this.calculateSummary(paymentSchedule, inputs);

    // Calculate interest without extra payments for comparison
    const interestWithoutExtraPayments = this.calculateInterestWithoutExtraPayments(
      inputs,
      scheduledPayment
    );

    return {
      inputs,
      scheduledPayment,
      paymentSchedule,
      summary,
      interestWithoutExtraPayments,
    };
  }

  calculatePaymentAmount(inputs) {
    const annualRate = inputs.interestRate / 100;
    const totalPayments = inputs.loanPeriod * inputs.paymentFrequency;

    // Calculate the rate per payment period
    let ratePerPeriod;
    switch (inputs.paymentFrequency) {
      case 52: // Weekly
        ratePerPeriod = annualRate / 52;
        break;
      case 26: // Fortnightly
        ratePerPeriod = annualRate / 26;
        break;
      case 12: // Monthly
        ratePerPeriod = annualRate / 12;
        break;
      case 1: // Yearly
        ratePerPeriod = annualRate;
        break;
      default:
        ratePerPeriod = annualRate / 12; // Default to monthly
    }

    // Calculate payment amount for the given frequency
    if (ratePerPeriod === 0) {
      return inputs.loanAmount / totalPayments;
    }

    const rateFactor = Math.pow(1 + ratePerPeriod, totalPayments);
    return (inputs.loanAmount * (ratePerPeriod * rateFactor)) / (rateFactor - 1);
  }

  getInterestRateForPeriod(inputs, days) {
    const annualRate = inputs.interestRate / 100;

    switch (inputs.interestAccrual) {
      case 'daily':
        return (annualRate / 365) * days;
      case 'monthly':
        return (annualRate / 12) * (days / 30); // Approximate
      case 'yearly':
        return annualRate * (days / 365);
      default:
        return (annualRate / 365) * days; // Default to daily
    }
  }

  generatePaymentSchedule(inputs, scheduledPayment) {
    const schedule = [];
    let balance = inputs.loanAmount;
    let cumulativeInterest = 0;
    let paymentNumber = 1;

    // Track extra payments by type
    const recurringPayments = inputs.extraPayments.filter((ep) => ep.type === 'recurring');
    const customTotalPayments = inputs.extraPayments.filter((ep) => ep.type === 'custom');
    const lumpSumPayments = inputs.extraPayments.filter((ep) => ep.type === 'lump');

    // Track recurring payment counters
    const recurringCounters = {};
    recurringPayments.forEach((ep) => {
      recurringCounters[ep.id] = {
        remaining: ep.count || Infinity,
        amount: ep.amount,
      };
    });

    const startDate = new Date(inputs.startDate);
    const firstPaymentDate = new Date(inputs.firstPaymentDate);

    // Calculate days between payments based on frequency
    let daysBetweenPayments;
    switch (inputs.paymentFrequency) {
      case 52: // Weekly
        daysBetweenPayments = 7;
        break;
      case 26: // Fortnightly
        daysBetweenPayments = 14;
        break;
      case 12: // Monthly
        daysBetweenPayments = 30; // Approximate
        break;
      case 1: // Yearly
        daysBetweenPayments = 365; // Approximate
        break;
      default:
        daysBetweenPayments = 30;
    }

    // Collect all lump sum payments for standalone processing
    const allLumpSumPayments = [];
    lumpSumPayments.forEach((ep) => {
      if (ep.date) {
        allLumpSumPayments.push({
          date: ep.date,
          dateObj: new Date(ep.date),
          amount: ep.amount,
        });
      }
    });

    // Generate regular payment schedule
    const regularPayments = [];
    const maxPayments = inputs.loanPeriod * inputs.paymentFrequency;
    while (balance > 0.01 && paymentNumber <= maxPayments) {
      const paymentDate = new Date(firstPaymentDate);
      paymentDate.setDate(firstPaymentDate.getDate() + (paymentNumber - 1) * daysBetweenPayments);

      // Calculate interest based on the payment frequency (not interest accrual frequency)
      const annualRate = inputs.interestRate / 100;
      let ratePerPeriod;
      switch (inputs.paymentFrequency) {
        case 52: // Weekly
          ratePerPeriod = annualRate / 52;
          break;
        case 26: // Fortnightly
          ratePerPeriod = annualRate / 26;
          break;
        case 12: // Monthly
          ratePerPeriod = annualRate / 12;
          break;
        case 1: // Yearly
          ratePerPeriod = annualRate;
          break;
        default:
          ratePerPeriod = annualRate / 12;
      }
      const interest = balance * ratePerPeriod;

      // Calculate extra payment for this payment
      let extraPayment = 0;
      let extraPaymentDetails = [];

      // Add recurring extra payments
      recurringPayments.forEach((ep) => {
        const counter = recurringCounters[ep.id];
        if (counter.remaining > 0) {
          extraPayment += counter.amount;
          extraPaymentDetails.push(`Recurring: +$${counter.amount.toFixed(2)}`);
          if (counter.remaining !== Infinity) {
            counter.remaining--;
          }
        }
      });

      // Add custom total payment extra
      customTotalPayments.forEach((ep) => {
        if (ep.customTotal > scheduledPayment) {
          const customExtra = ep.customTotal - scheduledPayment;
          extraPayment += customExtra;
          extraPaymentDetails.push(`Custom Total: +$${customExtra.toFixed(2)}`);
        }
      });

      // Note: Lump sum payments are handled separately and not added to regular payments

      const totalPayment = scheduledPayment + extraPayment;

      // Calculate principal based on what's left on the loan
      let principal = totalPayment - interest;

      // Ensure we don't overpay - principal cannot exceed the remaining balance
      if (principal > balance) {
        principal = balance;
        // Adjust total payment to only pay what's needed
        const adjustedTotalPayment = principal + interest;
        const adjustedExtraPayment = adjustedTotalPayment - scheduledPayment;

        // Update extra payment details if needed
        if (adjustedExtraPayment !== extraPayment) {
          extraPayment = Math.max(0, adjustedExtraPayment);
          extraPaymentDetails =
            extraPayment > 0 ? [`Adjusted Extra: +$${extraPayment.toFixed(2)}`] : [];
        }
      }

      const endingBalance = balance - principal;
      cumulativeInterest += interest;

      regularPayments.push({
        paymentNumber,
        paymentDate: paymentDate.toLocaleDateString(),
        paymentDateObj: paymentDate,
        beginningBalance: balance,
        scheduledPayment,
        extraPayment,
        extraPaymentDetails,
        totalPayment: principal + interest, // Ensure total payment reflects actual amounts
        principal,
        interest,
        endingBalance,
        cumulativeInterest,
      });

      balance = endingBalance;
      paymentNumber++;

      // Stop if loan is fully paid off
      if (balance <= 0.01) {
        break;
      }
    }

    // If there are no lump sum payments, just return the regular payments
    if (allLumpSumPayments.length === 0) {
      return regularPayments;
    }

    // Process all payments (regular + lump sum) in chronological order
    let currentBalance = inputs.loanAmount;
    let currentCumulativeInterest = 0;
    let currentPaymentNumber = 1;

    // Combine regular payments and lump sum payments
    const allPayments = [];

    // Add regular payments
    regularPayments.forEach((payment) => {
      allPayments.push({
        type: 'regular',
        payment: payment,
        dateObj: payment.paymentDateObj,
      });
    });

    // Add all lump sum payments as standalone payments
    allLumpSumPayments.forEach((lumpSum) => {
      allPayments.push({
        type: 'lump',
        lumpSum: lumpSum,
        dateObj: lumpSum.dateObj,
      });
    });

    // Sort all payments by date
    allPayments.sort((a, b) => a.dateObj - b.dateObj);

    // Process payments in chronological order
    allPayments.forEach((paymentItem) => {
      // Stop processing if loan is already paid off
      if (currentBalance <= 0.01) {
        return;
      }

      if (paymentItem.type === 'regular') {
        const payment = paymentItem.payment;

        // Recalculate interest based on the current balance (which may have been affected by lump sum payments)
        const annualRate = inputs.interestRate / 100;
        let ratePerPeriod;
        switch (inputs.paymentFrequency) {
          case 52: // Weekly
            ratePerPeriod = annualRate / 52;
            break;
          case 26: // Fortnightly
            ratePerPeriod = annualRate / 26;
            break;
          case 12: // Monthly
            ratePerPeriod = annualRate / 12;
            break;
          case 1: // Yearly
            ratePerPeriod = annualRate;
            break;
          default:
            ratePerPeriod = annualRate / 12;
        }
        const interest = currentBalance * ratePerPeriod;

        // Calculate extra payment for this regular payment
        let extraPayment = 0;
        let extraPaymentDetails = [];

        // Check if there are custom total payments (they take precedence)
        const hasCustomTotal = customTotalPayments.length > 0;

        if (hasCustomTotal) {
          // Custom total payments take precedence over recurring payments
          customTotalPayments.forEach((ep) => {
            if (ep.customTotal > scheduledPayment) {
              const customExtra = ep.customTotal - scheduledPayment;
              extraPayment = customExtra;
              extraPaymentDetails.push(`Custom Total: +$${customExtra.toFixed(2)}`);
            }
          });
        } else {
          // Only apply recurring extra payments if no custom total payments exist
          recurringPayments.forEach((ep) => {
            const counter = recurringCounters[ep.id];
            if (counter.remaining > 0) {
              extraPayment += counter.amount;
              extraPaymentDetails.push(`Recurring: +$${counter.amount.toFixed(2)}`);
              if (counter.remaining !== Infinity) {
                counter.remaining--;
              }
            }
          });
        }

        const totalPayment = scheduledPayment + extraPayment;
        let principal = totalPayment - interest;

        // Ensure we don't overpay
        let adjustedScheduledPayment = scheduledPayment;
        let adjustedTotalPayment = totalPayment;

        if (principal > currentBalance) {
          principal = currentBalance;
          // Adjust the total payment to only pay what's needed
          adjustedTotalPayment = principal + interest;
          const adjustedExtraPayment = adjustedTotalPayment - scheduledPayment;

          // Update the payment details to reflect the adjusted amounts
          extraPayment = Math.max(0, adjustedExtraPayment);
          extraPaymentDetails =
            extraPayment > 0 ? [`Adjusted Extra: +$${extraPayment.toFixed(2)}`] : [];

          // If extra payment is 0, adjust scheduled payment to match total payment
          if (extraPayment === 0) {
            adjustedScheduledPayment = adjustedTotalPayment;
          }
        }

        const endingBalance = currentBalance - principal;
        currentCumulativeInterest += interest;

        schedule.push({
          paymentNumber: currentPaymentNumber++,
          paymentDate: payment.paymentDateObj.toLocaleDateString(),
          paymentDateObj: payment.paymentDateObj,
          beginningBalance: currentBalance,
          scheduledPayment: adjustedScheduledPayment,
          extraPayment: extraPayment,
          extraPaymentDetails: extraPaymentDetails,
          totalPayment: adjustedTotalPayment,
          principal: principal,
          interest: interest,
          endingBalance: endingBalance,
          cumulativeInterest: currentCumulativeInterest,
        });

        currentBalance = endingBalance;
      } else if (paymentItem.type === 'lump') {
        // Skip lump sum payments if loan is already paid off
        if (currentBalance <= 0.01) {
          return;
        }

        const lumpSum = paymentItem.lumpSum;

        // Calculate interest since last payment for lump sum
        const lastPaymentDate =
          currentPaymentNumber > 1
            ? schedule[currentPaymentNumber - 2]?.paymentDateObj || new Date(inputs.startDate)
            : new Date(inputs.startDate);
        const daysSinceLastPayment = (lumpSum.dateObj - lastPaymentDate) / (1000 * 60 * 60 * 24);

        // Calculate interest based on actual days and annual rate
        const annualRate = inputs.interestRate / 100;
        const interest = currentBalance * ((annualRate / 365) * daysSinceLastPayment);

        // For lump sum payments:
        // Total Payment = Lump Sum Amount
        // Interest = Interest accrued on current balance
        // Principal = Total Payment - Interest (what remains after paying interest)
        const totalPayment = lumpSum.amount;
        let principal = totalPayment - interest;

        // Ensure we don't overpay with lump sum
        if (principal > currentBalance) {
          principal = currentBalance;
        }

        const endingBalance = currentBalance - principal;
        currentCumulativeInterest += interest;

        schedule.push({
          paymentNumber: currentPaymentNumber++,
          paymentDate: lumpSum.dateObj.toLocaleDateString(),
          paymentDateObj: lumpSum.dateObj,
          beginningBalance: currentBalance,
          scheduledPayment: 0,
          extraPayment: totalPayment,
          extraPaymentDetails: [`Lump Sum: +$${lumpSum.amount.toFixed(2)}`],
          totalPayment: totalPayment,
          principal: principal,
          interest: interest,
          endingBalance: endingBalance,
          cumulativeInterest: currentCumulativeInterest,
        });

        currentBalance = endingBalance;
      }
    });

    return schedule;
  }

  calculateSummary(paymentSchedule, inputs) {
    const totalPayments = paymentSchedule.length;
    const totalInterest = paymentSchedule[paymentSchedule.length - 1]?.cumulativeInterest || 0;

    // Calculate total extra payments
    const totalExtraPayments = paymentSchedule.reduce(
      (sum, payment) => sum + payment.extraPayment,
      0
    );

    const totalPaid = inputs.loanAmount + totalInterest + totalExtraPayments;

    return {
      scheduledPayment: paymentSchedule[0]?.scheduledPayment || 0,
      scheduledPayments: Math.ceil(inputs.loanPeriod * inputs.paymentFrequency),
      actualPayments: totalPayments,
      totalExtraPayments,
      totalInterest,
      totalPaid,
    };
  }

  displayResults(results) {
    const { summary, interestWithoutExtraPayments, paymentSchedule, inputs } = results;

    this.scheduledPayment.textContent = this.formatCurrency(summary.scheduledPayment);
    this.scheduledPayments.textContent = summary.scheduledPayments.toLocaleString();
    this.actualPayments.textContent = summary.actualPayments.toLocaleString();
    this.totalExtraPayments.textContent = this.formatCurrency(summary.totalExtraPayments);
    this.totalInterest.textContent = this.formatCurrency(summary.totalInterest);
    this.totalPaid.textContent = this.formatCurrency(summary.totalPaid);

    // Calculate and display interest saved
    const interestSaved = interestWithoutExtraPayments - summary.totalInterest;
    this.interestSaved.textContent = this.formatCurrency(interestSaved);

    // Calculate and display payment dates
    const paymentDates = this.calculateLastPaymentDates(paymentSchedule, inputs);
    this.lastPaymentDate.textContent = paymentDates.lastPaymentDate;
    this.earlyPaymentDate.textContent = paymentDates.earlyPaymentDate;

    // Display time saved badge
    if (paymentDates.timeSaved) {
      this.timeSavedBadge.textContent = `${paymentDates.timeSaved} earlier`;
      this.timeSavedBadge.classList.remove('hidden');
    } else {
      this.timeSavedBadge.classList.add('hidden');
    }

    this.resultsSummary.classList.remove('hidden');

    // Show URL share notification
    this.showUrlShareNotification();
  }

  generatePaymentTable(results) {
    const { paymentSchedule, inputs } = results;

    // Clear existing table
    this.paymentTableBody.innerHTML = '';

    // Update table headers to include net worth column if property value is set
    this.updateTableHeaders(inputs.propertyValue > 0);

    // Calculate net worth for each payment
    const paymentsWithNetWorth = this.calculateNetWorthForPayments(paymentSchedule, inputs);

    // Add payment rows
    paymentsWithNetWorth.forEach((payment) => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50';

      // Create extra payment details tooltip
      let extraPaymentDisplay =
        payment.extraPayment > 0
          ? `+${this.formatCurrency(payment.extraPayment)}`
          : this.formatCurrency(payment.extraPayment);
      let extraPaymentClass =
        payment.extraPayment > 0 ? 'text-green-600 font-semibold' : 'text-gray-500';

      if (payment.extraPaymentDetails && payment.extraPaymentDetails.length > 0) {
        extraPaymentDisplay = `+${this.formatCurrency(payment.extraPayment)}`;
        extraPaymentClass = 'text-green-600 font-semibold cursor-help';
        row.title = payment.extraPaymentDetails.join('\n');
      }

      // Build row HTML with conditional net worth column
      let rowHtml = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${payment.paymentNumber}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${payment.paymentDate}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600 bg-indigo-50">
                    ${this.formatCurrency(payment.beginningBalance)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${this.formatCurrency(payment.scheduledPayment)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${extraPaymentClass}">
                    ${extraPaymentDisplay}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 bg-blue-50">
                    ${this.formatCurrency(payment.totalPayment)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                    -${this.formatCurrency(payment.principal)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                    -${this.formatCurrency(payment.interest)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-600 bg-purple-50">
                    ${this.formatCurrency(payment.endingBalance)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    ${this.formatCurrency(payment.cumulativeInterest)}
                </td>
            `;

      // Add net worth column if property value is set
      if (inputs.propertyValue > 0) {
        rowHtml += `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600 bg-emerald-50">
                        ${this.formatCurrency(payment.netWorth)}
                    </td>
                `;
      }

      row.innerHTML = rowHtml;
      this.paymentTableBody.appendChild(row);
    });

    this.paymentTable.classList.remove('hidden');
  }

  updateTableHeaders(showNetWorth) {
    const thead = this.paymentTable.querySelector('thead tr');
    if (!thead) return;

    // Remove existing net worth header if it exists
    const existingNetWorthHeader = thead.querySelector('[data-column="net-worth"]');
    if (existingNetWorthHeader) {
      existingNetWorthHeader.remove();
    }

    // Add net worth header if needed
    if (showNetWorth) {
      const netWorthHeader = document.createElement('th');
      netWorthHeader.className =
        'px-6 py-3 text-left text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-100';
      netWorthHeader.textContent = 'Net Worth';
      netWorthHeader.setAttribute('data-column', 'net-worth');
      thead.appendChild(netWorthHeader);
    }
  }

  calculateNetWorthForPayments(paymentSchedule, inputs) {
    if (inputs.propertyValue <= 0) {
      return paymentSchedule;
    }

    const propertyValue = inputs.propertyValue;
    const initialLoanAmount = inputs.loanAmount;

    return paymentSchedule.map((payment) => {
      // Net worth = Property Value - Remaining Loan Balance
      // This represents the equity in the property
      const netWorth = propertyValue - payment.endingBalance;
      return {
        ...payment,
        netWorth: Math.max(0, netWorth), // Ensure net worth doesn't go negative
      };
    });
  }

  generateChart(results) {
    const { paymentSchedule, inputs, interestWithoutExtraPayments } = results;

    // Prepare data for both scenarios
    const chartDataWithExtra = this.prepareChartData(paymentSchedule, inputs);
    const chartDataWithoutExtra = this.prepareChartDataWithoutExtra(inputs);

    // Check if there are actual extra payments
    const hasExtraPayments = inputs.extraPayments.length > 0;

    // Destroy existing chart if it exists
    if (this.balanceChart) {
      this.balanceChart.destroy();
    }

    // Create datasets array based on whether there are extra payments
    const datasets = [];

    if (hasExtraPayments) {
      // Show both scenarios when there are extra payments
      datasets.push({
        label: 'With Extra Payments',
        data: chartDataWithExtra.balances,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 3,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#3B82F6',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
      });
      datasets.push({
        label: 'Without Extra Payments',
        data: chartDataWithoutExtra.balances,
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.3)',
        borderWidth: 3,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#EF4444',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
      });
    } else {
      // Show only the base scenario when there are no extra payments
      datasets.push({
        label: 'Loan Balance',
        data: chartDataWithoutExtra.balances,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 3,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#3B82F6',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
      });
    }

    // Create new chart
    const ctx = document.getElementById('balanceChart').getContext('2d');
    this.balanceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartDataWithExtra.labels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 14,
                weight: 'bold',
              },
              color: '#374151',
            },
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#3B82F6',
            borderWidth: 1,
            callbacks: {
              title: function (context) {
                return `Year ${context[0].label}`;
              },
              label: function (context) {
                return `Balance: ${new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(context.parsed.y)}`;
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Years',
              font: {
                size: 14,
                weight: 'bold',
              },
              color: '#374151',
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
            ticks: {
              color: '#6B7280',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Loan Balance ($)',
              font: {
                size: 14,
                weight: 'bold',
              },
              color: '#374151',
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
            ticks: {
              color: '#6B7280',
              callback: function (value) {
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(value);
              },
            },
          },
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false,
        },
      },
    });

    this.loanChart.classList.remove('hidden');
  }

  generateNetWorthChart(results) {
    const { paymentSchedule, inputs } = results;

    // Only show net worth chart if property value is specified
    if (inputs.propertyValue <= 0) {
      return;
    }

    // Prepare data for both scenarios
    const chartDataWithExtra = this.prepareNetWorthChartData(paymentSchedule, inputs);
    const chartDataWithoutExtra = this.prepareNetWorthChartDataWithoutExtra(inputs);

    // Check if there are actual extra payments
    const hasExtraPayments = inputs.extraPayments.length > 0;

    // Destroy existing chart if it exists
    if (this.netWorthChartInstance) {
      this.netWorthChartInstance.destroy();
    }

    // Create datasets array based on whether there are extra payments
    const datasets = [];

    if (hasExtraPayments) {
      // Show both scenarios when there are extra payments
      datasets.push({
        label: 'With Extra Payments',
        data: chartDataWithExtra.netWorth,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.3)',
        borderWidth: 3,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#10B981',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
      });
      datasets.push({
        label: 'Without Extra Payments',
        data: chartDataWithoutExtra.netWorth,
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.3)',
        borderWidth: 3,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#F59E0B',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
      });
    } else {
      // Show only the base scenario when there are no extra payments
      datasets.push({
        label: 'Net Worth',
        data: chartDataWithoutExtra.netWorth,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.3)',
        borderWidth: 3,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#10B981',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
      });
    }

    // Create new chart
    const ctx = document.getElementById('netWorthChartCanvas').getContext('2d');
    this.netWorthChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartDataWithExtra.labels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 14,
                weight: 'bold',
              },
              color: '#374151',
            },
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#10B981',
            borderWidth: 1,
            callbacks: {
              title: function (context) {
                return `Year ${context[0].label}`;
              },
              label: function (context) {
                return `Net Worth: ${new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(context.parsed.y)}`;
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Years',
              font: {
                size: 14,
                weight: 'bold',
              },
              color: '#374151',
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
            ticks: {
              color: '#6B7280',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Net Worth ($)',
              font: {
                size: 14,
                weight: 'bold',
              },
              color: '#374151',
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
            ticks: {
              color: '#6B7280',
              callback: function (value) {
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(value);
              },
            },
          },
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false,
        },
      },
    });

    this.netWorthChart.classList.remove('hidden');
  }

  prepareNetWorthChartData(paymentSchedule, inputs) {
    const labels = [];
    const netWorth = [];

    // Group payments by year and get the net worth at the beginning of each year
    const paymentsPerYear = inputs.paymentFrequency;
    const totalYears = Math.ceil(paymentSchedule.length / paymentsPerYear);

    // Ensure we show the full loan term or until the loan is completely paid off
    const maxYears = Math.max(totalYears, inputs.loanPeriod);

    // Get the start year from the first payment
    const startYear =
      paymentSchedule.length > 0
        ? new Date(paymentSchedule[0].paymentDateObj).getFullYear()
        : new Date(inputs.startDate).getFullYear();

    for (let year = 0; year <= maxYears; year++) {
      const paymentIndex = year * paymentsPerYear;
      const actualYear = startYear + year;

      if (paymentIndex < paymentSchedule.length) {
        labels.push(actualYear.toString());
        // Net worth = Property Value - Remaining Loan Balance
        const netWorthValue = inputs.propertyValue - paymentSchedule[paymentIndex].beginningBalance;
        netWorth.push(Math.max(0, netWorthValue));
      } else if (year === totalYears && paymentSchedule.length > 0) {
        // Add final net worth
        labels.push(actualYear.toString());
        const finalNetWorth =
          inputs.propertyValue - paymentSchedule[paymentSchedule.length - 1].endingBalance;
        netWorth.push(Math.max(0, finalNetWorth));
      } else if (year > totalYears && paymentSchedule.length > 0) {
        // Continue with full property value after loan is paid off
        labels.push(actualYear.toString());
        netWorth.push(inputs.propertyValue);
      }
    }

    return { labels, netWorth };
  }

  prepareNetWorthChartDataWithoutExtra(inputs) {
    // Create inputs without extra payments
    const inputsWithoutExtra = {
      ...inputs,
      extraPayments: [],
    };

    // Calculate scheduled payment
    const scheduledPayment = this.calculatePaymentAmount(inputsWithoutExtra);

    // Generate payment schedule without extra payments
    const paymentScheduleWithoutExtra = this.generatePaymentSchedule(
      inputsWithoutExtra,
      scheduledPayment
    );

    // Use the same logic as prepareNetWorthChartData but with the schedule without extra payments
    const labels = [];
    const netWorth = [];

    const paymentsPerYear = inputs.paymentFrequency;
    const totalYears = Math.ceil(paymentScheduleWithoutExtra.length / paymentsPerYear);

    // Ensure we show the full loan term or until the loan is completely paid off
    const maxYears = Math.max(totalYears, inputs.loanPeriod);

    // Get the start year from the first payment
    const startYear =
      paymentScheduleWithoutExtra.length > 0
        ? new Date(paymentScheduleWithoutExtra[0].paymentDateObj).getFullYear()
        : new Date(inputs.startDate).getFullYear();

    for (let year = 0; year <= maxYears; year++) {
      const paymentIndex = year * paymentsPerYear;
      const actualYear = startYear + year;

      if (paymentIndex < paymentScheduleWithoutExtra.length) {
        labels.push(actualYear.toString());
        // Net worth = Property Value - Remaining Loan Balance
        const netWorthValue =
          inputs.propertyValue - paymentScheduleWithoutExtra[paymentIndex].beginningBalance;
        netWorth.push(Math.max(0, netWorthValue));
      } else if (year === totalYears && paymentScheduleWithoutExtra.length > 0) {
        // Add final net worth
        labels.push(actualYear.toString());
        const finalNetWorth =
          inputs.propertyValue -
          paymentScheduleWithoutExtra[paymentScheduleWithoutExtra.length - 1].endingBalance;
        netWorth.push(Math.max(0, finalNetWorth));
      } else if (year > totalYears && paymentScheduleWithoutExtra.length > 0) {
        // Continue with full property value after loan is paid off
        labels.push(actualYear.toString());
        netWorth.push(inputs.propertyValue);
      }
    }

    return { labels, netWorth };
  }

  prepareChartData(paymentSchedule, inputs) {
    const labels = [];
    const balances = [];

    // Group payments by year and get the balance at the beginning of each year
    const paymentsPerYear = inputs.paymentFrequency;
    const totalYears = Math.ceil(paymentSchedule.length / paymentsPerYear);

    // Ensure we show the full loan term or until the loan is completely paid off
    const maxYears = Math.max(totalYears, inputs.loanPeriod);

    // Get the start year from the first payment
    const startYear =
      paymentSchedule.length > 0
        ? new Date(paymentSchedule[0].paymentDateObj).getFullYear()
        : new Date(inputs.startDate).getFullYear();

    for (let year = 0; year <= maxYears; year++) {
      const paymentIndex = year * paymentsPerYear;
      const actualYear = startYear + year;

      if (paymentIndex < paymentSchedule.length) {
        labels.push(actualYear.toString());
        balances.push(paymentSchedule[paymentIndex].beginningBalance);
      } else if (year === totalYears && paymentSchedule.length > 0) {
        // Add final balance
        labels.push(actualYear.toString());
        balances.push(paymentSchedule[paymentSchedule.length - 1].endingBalance);
      } else if (year > totalYears && paymentSchedule.length > 0) {
        // Continue with zero balance after loan is paid off
        labels.push(actualYear.toString());
        balances.push(0);
      }
    }

    return { labels, balances };
  }

  prepareChartDataWithoutExtra(inputs) {
    // Create inputs without extra payments
    const inputsWithoutExtra = {
      ...inputs,
      extraPayments: [],
    };

    // Calculate scheduled payment
    const scheduledPayment = this.calculatePaymentAmount(inputsWithoutExtra);

    // Generate payment schedule without extra payments
    const paymentScheduleWithoutExtra = this.generatePaymentSchedule(
      inputsWithoutExtra,
      scheduledPayment
    );

    // Use the same logic as prepareChartData but with the schedule without extra payments
    const labels = [];
    const balances = [];

    const paymentsPerYear = inputs.paymentFrequency;
    const totalYears = Math.ceil(paymentScheduleWithoutExtra.length / paymentsPerYear);

    // Ensure we show the full loan term or until the loan is completely paid off
    const maxYears = Math.max(totalYears, inputs.loanPeriod);

    // Get the start year from the first payment
    const startYear =
      paymentScheduleWithoutExtra.length > 0
        ? new Date(paymentScheduleWithoutExtra[0].paymentDateObj).getFullYear()
        : new Date(inputs.startDate).getFullYear();

    for (let year = 0; year <= maxYears; year++) {
      const paymentIndex = year * paymentsPerYear;
      const actualYear = startYear + year;

      if (paymentIndex < paymentScheduleWithoutExtra.length) {
        labels.push(actualYear.toString());
        balances.push(paymentScheduleWithoutExtra[paymentIndex].beginningBalance);
      } else if (year === totalYears && paymentScheduleWithoutExtra.length > 0) {
        // Add final balance
        labels.push(actualYear.toString());
        balances.push(
          paymentScheduleWithoutExtra[paymentScheduleWithoutExtra.length - 1].endingBalance
        );
      } else if (year > totalYears && paymentScheduleWithoutExtra.length > 0) {
        // Continue with zero balance after loan is paid off
        labels.push(actualYear.toString());
        balances.push(0);
      }
    }

    return { labels, balances };
  }

  calculateInterestWithoutExtraPayments(inputs, scheduledPayment) {
    // Create a copy of inputs with no extra payments
    const inputsWithoutExtra = {
      ...inputs,
      extraPayments: [],
    };

    // Generate payment schedule without extra payments
    const scheduleWithoutExtra = this.generatePaymentSchedule(inputsWithoutExtra, scheduledPayment);

    // Return the total interest from the last payment
    return scheduleWithoutExtra[scheduleWithoutExtra.length - 1]?.cumulativeInterest || 0;
  }

  calculateLastPaymentDates(paymentSchedule, inputs) {
    if (!paymentSchedule || paymentSchedule.length === 0) {
      return {
        lastPaymentDate: 'Not calculated',
        earlyPaymentDate: 'Not applicable',
        timeSaved: null,
      };
    }

    // Calculate total extra payments to determine if early payment date should be shown
    const totalExtraPayments = paymentSchedule.reduce(
      (sum, payment) => sum + payment.extraPayment,
      0
    );

    // Find the last payment date from the schedule
    const lastPayment = paymentSchedule[paymentSchedule.length - 1];
    let earlyPaymentDate = 'Not applicable';
    let timeSaved = null;

    // Calculate the original last payment date (without extra payments)
    const inputsWithoutExtra = {
      ...inputs,
      extraPayments: [],
    };

    const scheduledPayment = this.calculatePaymentAmount(inputsWithoutExtra);

    const scheduleWithoutExtra = this.generatePaymentSchedule(inputsWithoutExtra, scheduledPayment);
    const lastPaymentWithoutExtra = scheduleWithoutExtra[scheduleWithoutExtra.length - 1];
    const lastPaymentDate =
      lastPaymentWithoutExtra && lastPaymentWithoutExtra.paymentDateObj
        ? this.formatDate(lastPaymentWithoutExtra.paymentDateObj)
        : 'Not calculated';

    // Only show early payment date if there are extra payments
    if (totalExtraPayments > 0 && lastPayment && lastPayment.paymentDateObj) {
      earlyPaymentDate = this.formatDate(lastPayment.paymentDateObj);

      if (lastPaymentWithoutExtra && lastPaymentWithoutExtra.paymentDateObj) {
        timeSaved = this.calculateTimeDifference(
          lastPayment.paymentDateObj,
          lastPaymentWithoutExtra.paymentDateObj
        );
      }
    }

    return {
      lastPaymentDate,
      earlyPaymentDate,
      timeSaved,
    };
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  calculateTimeDifference(date1, date2) {
    if (!date1 || !date2) return null;

    const d1 = new Date(date1);
    const d2 = new Date(date2);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;

    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);

    let result = '';
    if (years > 0) {
      result += `${years} year${years > 1 ? 's' : ''}`;
    }
    if (months > 0) {
      if (result) result += ' ';
      result += `${months} month${months > 1 ? 's' : ''}`;
    }
    if (years === 0 && months === 0) {
      result = 'Less than 1 month';
    }

    return result;
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  showUrlShareNotification() {
    if (this.urlShareNotification) {
      this.urlShareNotification.classList.remove('hidden');
    }
  }

  loadFromUrlHash() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.toString() === '') return;

      const hashData = {};

      // Basic loan details
      if (params.has('la')) hashData.la = params.get('la');
      if (params.has('ir')) hashData.ir = params.get('ir');
      if (params.has('ia')) hashData.ia = params.get('ia');
      if (params.has('lp')) hashData.lp = params.get('lp');
      if (params.has('pf')) hashData.pf = params.get('pf');
      if (params.has('sd')) hashData.sd = params.get('sd');
      if (params.has('fpd')) hashData.fpd = params.get('fpd');

      // Property details
      if (params.has('pv')) hashData.pv = params.get('pv');
      if (params.has('po')) hashData.po = params.get('po');
      if (params.has('dp')) hashData.dp = params.get('dp');
      if (params.has('dv')) hashData.dv = params.get('dv');

      // Extra payments
      if (params.has('ep')) {
        try {
          const extraPaymentsData = JSON.parse(atob(params.get('ep')));
          hashData.ep = extraPaymentsData;
        } catch (e) {
          console.warn('Failed to decode extra payments:', e);
        }
      }

      this.populateFormFromHash(hashData);

      // Auto-calculate if we have valid data
      const inputs = this.getInputs();
      if (this.validateInputs(inputs)) {
        // Use setTimeout to ensure DOM is fully ready
        setTimeout(() => this.calculate(), 100);
      }
    } catch (error) {
      console.warn('Failed to load from URL parameters:', error);
    }
  }

  populateFormFromHash(hashData) {
    // Basic loan details
    if (hashData.la !== undefined) this.loanAmount.value = hashData.la;
    if (hashData.ir !== undefined) this.interestRate.value = hashData.ir;
    if (hashData.ia !== undefined) this.interestAccrual.value = hashData.ia;
    if (hashData.lp !== undefined) this.loanPeriod.value = hashData.lp;
    if (hashData.pf !== undefined) this.paymentFrequency.value = hashData.pf;
    if (hashData.sd !== undefined) this.startDate.value = hashData.sd;
    if (hashData.fpd !== undefined) this.firstPaymentDate.value = hashData.fpd;

    // Property details
    if (hashData.pv !== undefined) this.propertyValue.value = hashData.pv;
    if (hashData.po !== undefined) this.propertyOffer.value = hashData.po;
    if (hashData.dp !== undefined) this.depositPercentage.value = hashData.dp;
    if (hashData.dv !== undefined) this.depositValue.value = hashData.dv;

    // Extra payments
    if (hashData.ep && Array.isArray(hashData.ep)) {
      // Clear existing extra payments
      this.extraPaymentsContainer.innerHTML = '';
      this.extraPaymentCounter = 0;

      // Add extra payments from hash
      hashData.ep.forEach((epData) => {
        this.extraPaymentCounter++;
        const entryId = `extra-payment-${this.extraPaymentCounter}`;

        // Create the extra payment entry
        const entryHtml = `
                    <div id="${entryId}" class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div class="flex items-center justify-between mb-4">
                            <h4 class="text-lg font-semibold text-gray-700">Extra Payment #${this.extraPaymentCounter}</h4>
                            <button onclick="mortgageCalculator.removeExtraPaymentEntry('${entryId}')" class="text-red-600 hover:text-red-800 font-semibold">
                                ✕ Remove
                            </button>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <!-- Payment Type -->
                            <div>
                                <label for="paymentType-${entryId}" class="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Type
                                </label>
                                <select id="paymentType-${entryId}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" onchange="mortgageCalculator.updatePaymentTypeFields('${entryId}')">
                                    <option value="recurring">Recurring Extra Payment</option>
                                    <option value="custom">Custom Total Payment</option>
                                    <option value="lump">Lump Sum Payment</option>
                                </select>
                            </div>
                            
                            <!-- Amount Field -->
                            <div id="amountField-${entryId}">
                                <label for="amount-${entryId}" class="block text-sm font-medium text-gray-700 mb-2">
                                    Extra Payment Amount ($)
                                </label>
                                <input type="number" id="amount-${entryId}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="0" min="0" step="100" value="0">
                                <div id="amountError-${entryId}" class="hidden text-red-600 text-sm mt-1"></div>
                            </div>
                            
                            <!-- Number of Payments Field -->
                            <div id="countField-${entryId}">
                                <label for="count-${entryId}" class="block text-sm font-medium text-gray-700 mb-2">
                                    Number of Payments (Optional)
                                </label>
                                <input type="number" id="count-${entryId}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Leave empty for all payments" min="0" value="">
                                <p class="text-xs text-gray-500 mt-1">Leave empty to apply to all payments until loan is paid off</p>
                                <div id="countError-${entryId}" class="hidden text-red-600 text-sm mt-1"></div>
                            </div>
                            
                            <!-- Custom Total Payment Field -->
                            <div id="customTotalField-${entryId}" class="hidden">
                                <label for="customTotal-${entryId}" class="block text-sm font-medium text-gray-700 mb-2">
                                    Custom Total Payment ($)
                                </label>
                                <input type="number" id="customTotal-${entryId}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Must be more than scheduled payment" min="0" step="100" value="0">
                                <p class="text-xs text-gray-500 mt-1">Must be greater than the scheduled payment</p>
                                <div id="customTotalError-${entryId}" class="hidden text-red-600 text-sm mt-1"></div>
                            </div>
                            
                            <!-- Lump Sum Date Field -->
                            <div id="lumpDateField-${entryId}" class="hidden">
                                <label for="lumpDate-${entryId}" class="block text-sm font-medium text-gray-700 mb-2">
                                    Lump Sum Date
                                </label>
                                <input type="date" id="lumpDate-${entryId}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                <div id="lumpDateError-${entryId}" class="hidden text-red-600 text-sm mt-1"></div>
                            </div>
                            
                            <!-- Lump Sum Amount Field -->
                            <div id="lumpAmountField-${entryId}" class="hidden">
                                <label for="lumpAmount-${entryId}" class="block text-sm font-medium text-gray-700 mb-2">
                                    Lump Sum Amount ($)
                                </label>
                                <input type="number" id="lumpAmount-${entryId}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="0" min="0" step="1000" value="0">
                                <div id="lumpAmountError-${entryId}" class="hidden text-red-600 text-sm mt-1"></div>
                            </div>
                        </div>
                    </div>
                `;

        this.extraPaymentsContainer.insertAdjacentHTML('beforeend', entryHtml);

        // Set the payment type and populate fields
        const paymentTypeSelect = document.getElementById(`paymentType-${entryId}`);
        paymentTypeSelect.value = epData.t;

        // Update the fields based on payment type
        this.updatePaymentTypeFields(entryId);

        // Populate the appropriate fields based on payment type
        switch (epData.t) {
          case 'recurring':
            if (epData.a !== undefined)
              document.getElementById(`amount-${entryId}`).value = epData.a;
            if (epData.c !== undefined)
              document.getElementById(`count-${entryId}`).value = epData.c;
            break;
          case 'custom':
            if (epData.ct !== undefined)
              document.getElementById(`customTotal-${entryId}`).value = epData.ct;
            break;
          case 'lump':
            if (epData.d !== undefined)
              document.getElementById(`lumpDate-${entryId}`).value = epData.d;
            if (epData.a !== undefined)
              document.getElementById(`lumpAmount-${entryId}`).value = epData.a;
            break;
        }

        // Add event listeners for error clearing
        const amountInput = document.getElementById(`amount-${entryId}`);
        const countInput = document.getElementById(`count-${entryId}`);
        const customTotalInput = document.getElementById(`customTotal-${entryId}`);
        const lumpAmountInput = document.getElementById(`lumpAmount-${entryId}`);
        const lumpDateInput = document.getElementById(`lumpDate-${entryId}`);

        if (amountInput)
          amountInput.addEventListener('input', () =>
            this.clearExtraPaymentError(entryId, 'amount')
          );
        if (countInput)
          countInput.addEventListener('input', () => this.clearExtraPaymentError(entryId, 'count'));
        if (customTotalInput)
          customTotalInput.addEventListener('input', () =>
            this.clearExtraPaymentError(entryId, 'customTotal')
          );
        if (lumpAmountInput)
          lumpAmountInput.addEventListener('input', () =>
            this.clearExtraPaymentError(entryId, 'lumpAmount')
          );
        if (lumpDateInput)
          lumpDateInput.addEventListener('change', () =>
            this.clearExtraPaymentError(entryId, 'lumpDate')
          );
        if (paymentTypeSelect)
          paymentTypeSelect.addEventListener('change', () => this.clearExtraPaymentsGlobalError());
      });
    }
  }

  saveToUrlHash(inputs) {
    try {
      const params = new URLSearchParams();

      // Basic loan details
      params.set('la', inputs.loanAmount);
      params.set('ir', inputs.interestRate);
      params.set('ia', inputs.interestAccrual);
      params.set('lp', inputs.loanPeriod);
      params.set('pf', inputs.paymentFrequency);
      params.set('sd', inputs.startDate);
      params.set('fpd', inputs.firstPaymentDate);

      // Property details
      params.set('pv', inputs.propertyValue);
      params.set('po', inputs.propertyOffer);
      params.set('dp', inputs.depositPercentage);
      params.set('dv', inputs.depositValue);

      // Extra payments - encode as JSON string
      if (inputs.extraPayments.length > 0) {
        const extraPaymentsData = inputs.extraPayments.map((ep) => {
          const encoded = { t: ep.type };
          if (ep.amount !== undefined) encoded.a = ep.amount;
          if (ep.count !== undefined) encoded.c = ep.count;
          if (ep.customTotal !== undefined) encoded.ct = ep.customTotal;
          if (ep.date !== undefined) encoded.d = ep.date;
          return encoded;
        });
        params.set('ep', btoa(JSON.stringify(extraPaymentsData)));
      }

      // Update URL without reloading the page
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState({}, '', newUrl);
    } catch (error) {
      console.warn('Failed to save to URL parameters:', error);
    }
  }

  copyUrlToClipboard() {
    try {
      navigator.clipboard.writeText(window.location.href).then(() => {
        // Temporarily change button text to show success
        const originalText = this.copyUrlBtn.textContent;
        this.copyUrlBtn.textContent = 'Copied!';
        this.copyUrlBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        this.copyUrlBtn.classList.add('bg-green-600');

        setTimeout(() => {
          this.copyUrlBtn.textContent = originalText;
          this.copyUrlBtn.classList.remove('bg-green-600');
          this.copyUrlBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }, 2000);
      });
    } catch (error) {
      console.warn('Failed to copy URL to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      // Show success message
      const originalText = this.copyUrlBtn.textContent;
      this.copyUrlBtn.textContent = 'Copied!';
      this.copyUrlBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
      this.copyUrlBtn.classList.add('bg-green-600');

      setTimeout(() => {
        this.copyUrlBtn.textContent = originalText;
        this.copyUrlBtn.classList.remove('bg-green-600');
        this.copyUrlBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
      }, 2000);
    }
  }
}

// Initialize the calculator when the page loads
let mortgageCalculator;
document.addEventListener('DOMContentLoaded', () => {
  mortgageCalculator = new MortgageCalculator();
});
