// POST /api/auth/login  로그인
import { login } from '../../../server/http/endpoints.js';

export const onRequestPost = login;
