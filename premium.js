// Premium features handling
const upgradeBtn = document.getElementById('upgrade-btn');
const subscriptionModal = document.getElementById('subscription-modal');
const closeModal = document.querySelector('.close-modal');
const subscribeBtns = document.querySelectorAll('.subscribe-btn');
const premiumFeatures = document.querySelector('.premium-features');

// Payment processing configuration
const stripe = {
    // Initialize with your Stripe public key when you set up Stripe
    init: function(publishableKey) {
        this.key = publishableKey;
        // Initialize Stripe here when you have the key
    },
    
    processPayment: async function(planType) {
        // Implement Stripe payment processing
        alert('Payment processing will be implemented with Stripe');
        return true; // Simulate successful payment
    }
};

// Premium features management
const premiumManager = {
    isPremium: false,
    
    init: function() {
        // Check if user has premium subscription
        this.checkSubscriptionStatus();
        this.setupEventListeners();
    },
    
    checkSubscriptionStatus: function() {
        // Check local storage for premium status
        this.isPremium = localStorage.getItem('premiumStatus') === 'true';
        this.updateUI();
    },
    
    updateUI: function() {
        const subscriptionStatus = document.querySelector('.subscription-status');
        const freeTag = subscriptionStatus.querySelector('.free-tag');
        const upgradeButton = subscriptionStatus.querySelector('.upgrade-btn');
        const adSpace = document.querySelector('.ad-space');
        
        if (this.isPremium) {
            freeTag.textContent = 'Premium';
            freeTag.classList.add('premium-tag');
            upgradeButton.style.display = 'none';
            adSpace.style.display = 'none';
            this.unlockPremiumFeatures();
        } else {
            freeTag.textContent = 'Free Version';
            freeTag.classList.remove('premium-tag');
            upgradeButton.style.display = 'block';
            adSpace.style.display = 'block';
            this.lockPremiumFeatures();
        }
    },
    
    unlockPremiumFeatures: function() {
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.classList.remove('locked');
            card.classList.add('unlocked');
        });
    },
    
    lockPremiumFeatures: function() {
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.classList.add('locked');
            card.classList.remove('unlocked');
        });
    },
    
    setupEventListeners: function() {
        // Modal handling
        upgradeBtn.addEventListener('click', () => {
            subscriptionModal.style.display = 'block';
        });

        closeModal.addEventListener('click', () => {
            subscriptionModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === subscriptionModal) {
                subscriptionModal.style.display = 'none';
            }
        });

        // Subscribe buttons
        subscribeBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                const plan = btn.getAttribute('data-plan');
                await this.handleSubscription(plan);
            });
        });
    },
    
    handleSubscription: async function(planType) {
        try {
            // Process payment
            const paymentSuccess = await stripe.processPayment(planType);
            
            if (paymentSuccess) {
                this.isPremium = true;
                localStorage.setItem('premiumStatus', 'true');
                this.updateUI();
                subscriptionModal.style.display = 'none';
                alert('Thank you for upgrading to Premium!');
            }
        } catch (error) {
            console.error('Subscription error:', error);
            alert('There was an error processing your subscription. Please try again.');
        }
    }
};

// Initialize premium features
document.addEventListener('DOMContentLoaded', () => {
    premiumManager.init();
});
