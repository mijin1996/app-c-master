// GET /api/progress  내 진도 불러오기
// PUT /api/progress  내 진도 저장 (경험치는 서버가 다시 계산)
import { getProgress, putProgress } from '../../server/http/endpoints.js';

export const onRequestGet = getProgress;
export const onRequestPut = putProgress;
