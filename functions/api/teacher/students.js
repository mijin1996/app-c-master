// GET /api/teacher/students  선생님용 학생 진도
import { teacherStudents } from '../../../server/http/endpoints.js';

export const onRequestGet = teacherStudents;
