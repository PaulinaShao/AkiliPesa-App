
import * as admin from 'firebase-admin';
import { aiRouter } from './aiRouter';
import { callSessionHandler } from './callSessionHandler';
import { vendorOptimizer } from './vendorOptimizer';
import { walletManager } from './walletManager';

admin.initializeApp();

// Export all functions for deployment.
export {
    aiRouter,
    callSessionHandler,
    vendorOptimizer,
    walletManager
};
