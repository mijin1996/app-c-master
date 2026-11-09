// POST /api/run  유료 언어(C++ · Java) 서버 채점 (PAID_LANGUAGES_ENABLED=true 이고 JUDGE0_URL 이 있을 때만)
import { runCode } from '../../server/http/endpoints.js';

export const onRequestPost = runCode;
