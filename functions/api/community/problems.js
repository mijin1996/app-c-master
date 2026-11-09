// GET  /api/community/problems  회원이 낸 문제 목록
// POST /api/community/problems  문제 내기
import { communityProblems, communityCreateProblem } from '../../../server/http/endpoints.js';

export const onRequestGet = communityProblems;
export const onRequestPost = communityCreateProblem;
