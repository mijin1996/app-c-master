# code.ai Python 채점 도우미: Pyodide(브라우저 속 Python) 안에서 학생 코드를 한 번 실행한다.
# 입력은 sys.stdin 으로, 출력은 모아서 돌려준다. 시간 제한은 바깥(자바스크립트)에서 Worker를 끊어서 지킨다.
import io
import sys
import traceback

OUTPUT_LIMIT = 1_000_000  # 이보다 많이 출력하면 출력 초과


class _LimitedOutput(io.StringIO):
    def write(self, text):
        if self.tell() + len(text) > OUTPUT_LIMIT:
            raise _OutputLimit()
        return super().write(text)


class _OutputLimit(Exception):
    pass


def _user_line(tb):
    line = 0
    for frame in traceback.extract_tb(tb):
        if frame.filename == "main.py":
            line = frame.lineno
    return line


def cm_run(src, stdin_text):
    out = _LimitedOutput()
    old_in, old_out = sys.stdin, sys.stdout
    sys.stdin, sys.stdout = io.StringIO(stdin_text), out
    sys.setrecursionlimit(10000)
    try:
        try:
            code = compile(src, "main.py", "exec")
        except SyntaxError as e:
            return {"ok": False, "kind": "compile", "line": e.lineno or 0,
                    "message": "문법 오류: " + str(e.msg), "output": ""}
        try:
            exec(code, {"__name__": "__main__"})
        except SystemExit as e:
            if e.code not in (None, 0):
                return {"ok": False, "kind": "runtime", "line": 0,
                        "message": "프로그램이 0이 아닌 값으로 끝났어요: " + str(e.code), "output": out.getvalue()}
        except _OutputLimit:
            return {"ok": False, "kind": "ole", "line": 0, "message": "출력이 너무 많아요.", "output": ""}
        except RecursionError:
            return {"ok": False, "kind": "runtime", "line": _user_line(sys.exc_info()[2]),
                    "message": "재귀가 너무 깊어요 (RecursionError).", "output": out.getvalue()}
        except Exception as e:
            return {"ok": False, "kind": "runtime", "line": _user_line(sys.exc_info()[2]),
                    "message": type(e).__name__ + ": " + str(e), "output": out.getvalue()}
        return {"ok": True, "output": out.getvalue(), "files": {}}
    finally:
        sys.stdin, sys.stdout = old_in, old_out
