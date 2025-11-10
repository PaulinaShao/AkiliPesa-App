

// All values in credits per second
const RATES = {
    audio: 0.1,
    video: 0.2,
};

const COMMISSION_RATE = 0.7; // Agent gets 70%

export function computeCallCost(durationSeconds: number, mode: 'audio' | 'video' = 'audio') {
    const rate = RATES[mode] || RATES.audio;
    const totalCost = Math.ceil(durationSeconds * rate);
    const commission = Math.floor(totalCost * COMMISSION_RATE);
    
    return {
        cost: totalCost,
        commission: commission
    };
}
