// POST /api/auth/reset-password  복구 코드로 비밀번호 재설정
import { resetPassword } from '../../../server/http/endpoints.js';

export const onRequestPost = resetPassword;
