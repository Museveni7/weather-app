class LocalPaymentProcessor {
    constructor() {
        this.apiUrl = 'https://your-api.com';
        this.prices = {
            monthly: {
                amount: 4999, // 4,999 RWF ≈ $4.99
                currency: 'RWF'
            },
            annual: {
                amount: 49999, // 49,999 RWF ≈ $49.99
                currency: 'RWF'
            }
        };
        this.setupEventListeners();
    }

    setupEventListeners() {
        const paymentForm = document.getElementById('payment-form');
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
            const planType = document.querySelector('input[name="plan-type"]:checked').value;
            
            if (paymentMethod === 'mtn') {
                this.processMTNPayment(planType);
            } else if (paymentMethod === 'equity') {
                this.processEquityPayment(planType);
            }
        });
    }

    async processMTNPayment(planType) {
        try {
            const phone = document.getElementById('phone').value;
            const email = document.getElementById('email').value;
            
            // Show loading state
            this.showLoadingState('Initiating MTN Mobile Money payment...');

            const response = await fetch(`${this.apiUrl}/payments/mtn-momo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: this.prices[planType].amount,
                    phone: phone,
                    email: email,
                    planType: planType
                })
            });

            const data = await response.json();

            if (data.success) {
                // Show success message and instructions
                this.showSuccessMessage(`
                    Please check your phone for the MTN Mobile Money prompt.
                    Enter your PIN to complete the payment.
                    Transaction Reference: ${data.transactionRef}
                `);

                // Start checking payment status
                this.checkPaymentStatus(data.transactionRef, 'mtn');
            } else {
                this.showError('Payment initiation failed. Please try again.');
            }

        } catch (error) {
            console.error('MTN Payment Error:', error);
            this.showError('Payment processing failed. Please try again.');
        }
    }

    async processEquityPayment(planType) {
        try {
            const accountNumber = document.getElementById('account-number').value;
            const email = document.getElementById('email').value;

            // Show loading state
            this.showLoadingState('Initiating Equity Bank payment...');

            const response = await fetch(`${this.apiUrl}/payments/equity-bank`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: this.prices[planType].amount,
                    accountNumber: accountNumber,
                    email: email,
                    planType: planType
                })
            });

            const data = await response.json();

            if (data.success) {
                // Show success message and instructions
                this.showSuccessMessage(`
                    Payment request sent to your Equity Bank account.
                    Please approve the transaction in your Equity Mobile App.
                    Transaction Reference: ${data.transactionRef}
                `);

                // Start checking payment status
                this.checkPaymentStatus(data.transactionRef, 'equity');
            } else {
                this.showError('Payment initiation failed. Please try again.');
            }

        } catch (error) {
            console.error('Equity Payment Error:', error);
            this.showError('Payment processing failed. Please try again.');
        }
    }

    async checkPaymentStatus(transactionRef, paymentMethod) {
        const endpoint = paymentMethod === 'mtn' ? 'mtn-status' : 'equity-status';
        let attempts = 0;
        const maxAttempts = 12; // Check for 1 minute (5s * 12)

        const statusCheck = setInterval(async () => {
            try {
                const response = await fetch(`${this.apiUrl}/payments/${endpoint}/${transactionRef}`);
                const data = await response.json();

                if (data.status === 'COMPLETED' || data.status === 'SUCCESSFUL') {
                    clearInterval(statusCheck);
                    this.handleSuccessfulPayment();
                } else if (data.status === 'FAILED') {
                    clearInterval(statusCheck);
                    this.showError('Payment failed. Please try again.');
                }

                attempts++;
                if (attempts >= maxAttempts) {
                    clearInterval(statusCheck);
                    this.showError('Payment timeout. Please check your payment status and try again if needed.');
                }

            } catch (error) {
                console.error('Status Check Error:', error);
                clearInterval(statusCheck);
                this.showError('Error checking payment status.');
            }
        }, 5000); // Check every 5 seconds
    }

    handleSuccessfulPayment() {
        // Update UI to show premium features
        document.querySelector('.subscription-status').innerHTML = `
            <span class="premium-tag">Premium</span>
        `;

        // Hide upgrade button
        document.querySelector('.upgrade-btn').style.display = 'none';

        // Hide ads
        document.querySelector('.ad-space').style.display = 'none';

        // Close payment modal
        document.getElementById('subscription-modal').style.display = 'none';

        // Show success message
        this.showSuccessMessage('Payment successful! Welcome to Weather Pro Premium!');

        // Store premium status
        localStorage.setItem('premiumStatus', 'true');
        localStorage.setItem('subscriptionDate', new Date().toISOString());
    }

    showLoadingState(message) {
        const statusElement = document.getElementById('payment-status');
        statusElement.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
    }

    showSuccessMessage(message) {
        const statusElement = document.getElementById('payment-status');
        statusElement.innerHTML = `
            <div class="success">
                <i class="fas fa-check-circle"></i>
                <p>${message}</p>
            </div>
        `;
    }

    showError(message) {
        const statusElement = document.getElementById('payment-status');
        statusElement.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// Initialize payment processor
document.addEventListener('DOMContentLoaded', () => {
    new LocalPaymentProcessor();
});
