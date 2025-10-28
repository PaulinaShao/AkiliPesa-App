"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickVendors = pickVendors;
function pickVendors(intent, tier) {
    var _a;
    // Extremely simple routing stub
    const map = {
        'voice-chat': tier === 'premium' ? 'openai-gpt-4o-realtime' : 'openvoice',
        'video-teach': tier === 'premium' ? 'openai-vision+runpod-avatar' : 'runpod-avatar',
        'music': 'openai-audio',
        'movie': 'runwayml',
        'design': 'sdxl',
        'document': 'gpt-4o'
    };
    return (_a = map[intent]) !== null && _a !== void 0 ? _a : 'gpt-4o';
}
//# sourceMappingURL=vendorRouter.js.map