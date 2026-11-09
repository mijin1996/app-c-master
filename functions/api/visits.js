// GET /api/visits   오늘(한국 시간) 접속 수 보기
// POST /api/visits  접속 하나 기록
import { todayVisits, recordVisit } from '../../server/http/endpoints.js';

export const onRequestGet = todayVisits;
export const onRequestPost = recordVisit;
