import {withGenkitHandler} from '@genkit-ai/next';
import {ai} from '@/ai/genkit';
import '@/ai/flows/personalized-video-suggestions';

export const {GET, POST} = withGenkitHandler(ai);
