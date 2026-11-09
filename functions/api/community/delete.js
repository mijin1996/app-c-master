// POST /api/community/delete  내가 낸 문제 지우기 {id}
import { communityDeleteProblem } from '../../../server/http/endpoints.js';

export const onRequestPost = communityDeleteProblem;
