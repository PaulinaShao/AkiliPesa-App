"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickVendors = pickVendors;
function pickVendors(intent, tier) {
    // Extremely simple routing stub
    const map = {
        'voice-chat': tier === 'premium' ? 'openai-gpt-4o-realtime' : 'openvoice',
        'video-teach': tier === 'premium' ? 'openai-vision+runpod-avatar' : 'runpod-avatar',
        'music': 'openai-audio',
        'movie': 'runwayml',
        'design': 'sdxl',
        'document': 'gpt-4o'
    };
    return map[intent] ?? 'gpt-4o';
}
//# sourceMappingURL=vendorRouter.js.map