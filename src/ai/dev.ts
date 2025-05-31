import { config } from 'dotenv';
config();

import '@/ai/flows/incident-detection.ts';
import '@/ai/flows/structured-response-parsing.ts';
import '@/ai/flows/send-incident-report-email-flow.ts';
