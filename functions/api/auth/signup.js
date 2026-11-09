// POST /api/auth/signup  회원가입
import { signup } from '../../../server/http/endpoints.js';

export const onRequestPost = signup;
