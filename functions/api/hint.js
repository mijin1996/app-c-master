// POST /api/hint  AI 힌트 (AI_HINT_ENABLED=true 일 때만 동작)
import { hint } from '../../server/http/endpoints.js';

export const onRequestPost = hint;
