// POST /api/auth/find-username  복구 코드로 아이디 찾기
import { findUsernames } from '../../../server/http/endpoints.js';

export const onRequestPost = findUsernames;
