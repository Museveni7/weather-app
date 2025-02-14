const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');

// MTN Mobile Money Configuration
const MTN_API_URL = 'https://proxy.momoapi.mtn.com';
const MTN_SUBSCRIPTION_KEY = 'YOUR_MTN_SUBSCRIPTION_KEY';
const MTN_API_USER = 'YOUR_API_USER';
const MTN_API_KEY = 'YOUR_API_KEY';

// Equity Bank Configuration
const EQUITY_API_URL = 'https://api.equitybankgroup.com/v1';
const EQUITY_MERCHANT_ID = 'YOUR_MERCHANT_ID';
const EQUITY_API_KEY = 'YOUR_EQUITY_API_KEY';

// Generate UUID for transaction reference
function generateUUID() {
    return crypto.randomUUID();
}

// MTN Mobile Money Payment
router.post('/mtn-momo', async (req, res) => {
    try {
        const { amount, phone, email, planType } = req.body;
        const transactionRef = generateUUID();

        // Step 1: Request to pay
        const requestToPay = await axios.post(
            `${MTN_API_URL}/collection/v1_0/requesttopay`,
            {
                amount: amount,
                currency: 'RWF',
                externalId: transactionRef,
                payer: {
                    partyIdType: 'MSISDN',
                    partyId: phone
                },
                payerMessage: `Weather Pro ${planType} Subscription`,
                payeeNote: `Weather Pro ${planType} Plan`
            },
            {
                headers: {
                    'X-Reference-Id': transactionRef,
                    'X-Target-Environment': 'production',
                    'Ocp-Apim-Subscription-Key': MTN_SUBSCRIPTION_KEY,
                    'Authorization': `Bearer ${MTN_API_KEY}`
                }
            }
        );

        // Step 2: Check transaction status
        const checkStatus = async () => {
            try {
                const status = await axios.get(
                    `${MTN_API_URL}/collection/v1_0/requesttopay/${transactionRef}`,
                    {
                        headers: {
                            'X-Target-Environment': 'production',
                            'Ocp-Apim-Subscription-Key': MTN_SUBSCRIPTION_KEY,
                            'Authorization': `Bearer ${MTN_API_KEY}`
                        }
                    }
                );

                return status.data.status;
            } catch (error) {
                console.error('Error checking transaction status:', error);
                return 'FAILED';
            }
        };

        // Step 3: Wait for payment confirmation
        let attempts = 0;
        const maxAttempts = 10;
        const checkPayment = setInterval(async () => {
            const status = await checkStatus();
            attempts++;

            if (status === 'SUCCESSFUL' || attempts >= maxAttempts) {
                clearInterval(checkPayment);
                if (status === 'SUCCESSFUL') {
                    // Save subscription details to database
                    await saveSubscription({
                        userId: req.user.id,
                        planType: planType,
                        paymentMethod: 'MTN_MOMO',
                        amount: amount,
                        transactionRef: transactionRef,
                        status: 'active'
                    });
                    
                    res.json({
                        success: true,
                        message: 'Payment successful',
                        transactionRef: transactionRef
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        message: 'Payment failed or timeout'
                    });
                }
            }
        }, 5000); // Check every 5 seconds

    } catch (error) {
        console.error('MTN Payment Error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment processing failed'
        });
    }
});

// Equity Bank Payment
router.post('/equity-bank', async (req, res) => {
    try {
        const { amount, accountNumber, email, planType } = req.body;
        const transactionRef = generateUUID();

        // Generate signature for Equity API
        const signature = crypto
            .createHmac('sha256', EQUITY_API_KEY)
            .update(`${EQUITY_MERCHANT_ID}${amount}${transactionRef}`)
            .digest('hex');

        // Step 1: Initiate payment
        const paymentRequest = await axios.post(
            `${EQUITY_API_URL}/payments/request`,
            {
                merchantId: EQUITY_MERCHANT_ID,
                transactionRef: transactionRef,
                amount: amount,
                currency: 'RWF',
                accountNumber: accountNumber,
                narration: `Weather Pro ${planType} Subscription`,
                callbackUrl: 'https://your-api.com/payments/equity/callback'
            },
            {
                headers: {
                    'Authorization': `Bearer ${EQUITY_API_KEY}`,
                    'X-Signature': signature
                }
            }
        );

        // Step 2: Check payment status
        const checkEquityStatus = async () => {
            try {
                const status = await axios.get(
                    `${EQUITY_API_URL}/payments/status/${transactionRef}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${EQUITY_API_KEY}`
                        }
                    }
                );

                return status.data.status;
            } catch (error) {
                console.error('Error checking Equity payment status:', error);
                return 'FAILED';
            }
        };

        // Step 3: Wait for payment confirmation
        let attempts = 0;
        const maxAttempts = 10;
        const checkPayment = setInterval(async () => {
            const status = await checkEquityStatus();
            attempts++;

            if (status === 'COMPLETED' || attempts >= maxAttempts) {
                clearInterval(checkPayment);
                if (status === 'COMPLETED') {
                    // Save subscription details to database
                    await saveSubscription({
                        userId: req.user.id,
                        planType: planType,
                        paymentMethod: 'EQUITY_BANK',
                        amount: amount,
                        transactionRef: transactionRef,
                        status: 'active'
                    });
                    
                    res.json({
                        success: true,
                        message: 'Payment successful',
                        transactionRef: transactionRef
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        message: 'Payment failed or timeout'
                    });
                }
            }
        }, 5000); // Check every 5 seconds

    } catch (error) {
        console.error('Equity Payment Error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment processing failed'
        });
    }
});

// Helper function to save subscription details
async function saveSubscription(subscriptionData) {
    // Implement your database logic here
    // This is just a placeholder
    console.log('Saving subscription:', subscriptionData);
}

module.exports = router;
