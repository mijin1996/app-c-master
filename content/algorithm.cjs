// 알고리즘 문제: USACO처럼 브론즈 → 실버 → 골드 → 플래티넘 단계로 나눈 오리지널 문제.
// 지문·예제·테스트·힌트·모범답안은 모두 새로 작성한 것입니다 (USACO 문제를 옮기지 않음).
// 정답 출력은 tools/build-content.mjs 가 모범답안을 gcc로 실행해 만든다.

// 테스트 입력을 만들 때 쓰는 고정 난수 (매번 같은 테스트가 나오게)
function rng(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}
const randInt = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const list = (r, n, lo, hi) => Array.from({ length: n }, () => randInt(r, lo, hi));

function gridCase(seed, h, w, wallRate) {
    const r = rng(seed);
    const rows = [];
    for (let y = 0; y < h; y++) {
        let line = '';
        for (let x = 0; x < w; x++) {
            line += r() < wallRate ? '#' : '.';
        }
        rows.push(line);
    }
    return rows;
}

const tracks = [
{
    track: 'bronze', name: '브론즈', level: 4,
    intro: '반복문과 배열만으로 풀 수 있어요. 모든 경우를 다 해 보는 완전 탐색과, 문제에 적힌 대로 따라 하는 시뮬레이션을 연습해요.',
    topics: ['완전 탐색', '시뮬레이션', '구간 계산'],
    problems: [
        { id: 5101, title: '가장 긴 따뜻한 날', level: 4,
            desc: '코디가 N일 동안의 기온을 기록했어요. 기온이 바로 전날보다 높아지는 날이 연속으로 이어진 구간 중 가장 긴 구간은 며칠짜리일까요? 하루만 있는 구간의 길이는 1입니다.',
            input: '첫째 줄에 N (1 ≤ N ≤ 1000)이 주어집니다. 둘째 줄에 N일 동안의 기온 N개가 공백으로 구분되어 주어집니다. 기온은 -50 이상 50 이하의 정수입니다.',
            output: '기온이 계속 오르기만 하는 가장 긴 연속 구간의 길이를 출력합니다.',
            tests: ['7\n3 5 6 2 4 8 9\n', '5\n5 4 3 2 1\n', '1\n10\n', '6\n1 2 2 3 4 5\n',
                (() => { const r = rng(11); return '1000\n' + list(r, 1000, -50, 50).join(' ') + '\n'; })()],
            hints: ['지금 이어지고 있는 구간의 길이(cur)와 지금까지 가장 긴 길이(best)를 따로 기억해요.', '오늘 기온이 어제보다 높으면 cur 를 1 늘리고, 아니면 cur 를 1로 되돌려요. 매일 best 와 비교해요.'],
            solution: '#include <stdio.h>\n\nint main() {\n    int n, prev, now, cur = 1, best = 1;\n    scanf("%d", &n);\n    scanf("%d", &prev);\n    for (int i = 1; i < n; i++) {\n        scanf("%d", &now);\n        if (now > prev) {\n            cur++;\n        } else {\n            cur = 1;\n        }\n        if (cur > best) {\n            best = cur;\n        }\n        prev = now;\n    }\n    printf("%d\\n", best);\n    return 0;\n}' },
        { id: 5102, title: '자리 바꾸기', level: 4,
            desc: '교실에 자리가 N개 있고, i번 자리에는 처음에 i번 학생이 앉아 있어요. 선생님이 "a번 자리와 b번 자리의 학생을 서로 바꿔 앉아라"라는 명령을 M번 내립니다. 모든 명령이 끝난 뒤 1번 자리부터 N번 자리까지 앉은 학생 번호를 출력하세요.',
            input: '첫째 줄에 N과 M (1 ≤ N ≤ 100, 0 ≤ M ≤ 1000)이 주어집니다. 다음 M개의 줄에 바꿀 자리 번호 a와 b (1 ≤ a, b ≤ N)가 주어집니다. a와 b가 같을 수도 있습니다.',
            output: '1번 자리부터 차례대로 앉은 학생 번호를 공백으로 구분해 한 줄에 출력합니다.',
            tests: ['5 3\n1 2\n3 5\n2 5\n', '3 0\n', '4 2\n2 2\n1 4\n',
                (() => { const r = rng(21); const m = 1000; let s = '100 ' + m + '\n'; for (let i = 0; i < m; i++) { s += randInt(r, 1, 100) + ' ' + randInt(r, 1, 100) + '\n'; } return s; })()],
            hints: ['seat[i] 배열에 i번 자리에 앉은 학생 번호를 넣어 두고 시작해요.', '두 값을 바꿀 때는 임시 변수 하나를 써요: t = seat[a]; seat[a] = seat[b]; seat[b] = t;'],
            solution: '#include <stdio.h>\n\nint main() {\n    int n, m, seat[101];\n    scanf("%d %d", &n, &m);\n    for (int i = 1; i <= n; i++) {\n        seat[i] = i;\n    }\n    for (int k = 0; k < m; k++) {\n        int a, b, t;\n        scanf("%d %d", &a, &b);\n        t = seat[a];\n        seat[a] = seat[b];\n        seat[b] = t;\n    }\n    for (int i = 1; i <= n; i++) {\n        printf("%d%c", seat[i], i == n ? \'\\n\' : \' \');\n    }\n    return 0;\n}' },
        { id: 5103, title: '울타리 페인트', level: 4,
            desc: '일직선 울타리에서 첫째 날에는 a부터 b까지, 둘째 날에는 c부터 d까지 페인트를 칠했어요 (a < b, c < d). 두 번 칠한 곳은 한 번만 셉니다. 페인트가 칠해진 울타리의 전체 길이를 구하세요.',
            input: '첫째 줄에 a와 b, 둘째 줄에 c와 d가 주어집니다. 모든 수는 0 이상 100 이하의 정수입니다.',
            output: '칠해진 부분의 전체 길이를 출력합니다.',
            tests: ['7 10\n4 8\n', '1 3\n5 9\n', '0 100\n20 30\n', '2 5\n5 8\n', '10 20\n0 10\n'],
            hints: ['두 구간의 길이를 더한 다음, 겹친 부분의 길이를 한 번 빼면 돼요.', '겹친 부분은 max(a, c) 부터 min(b, d) 까지예요. 그 값이 0보다 작으면 겹치지 않은 거예요.'],
            solution: '#include <stdio.h>\n\nint main() {\n    int a, b, c, d;\n    scanf("%d %d %d %d", &a, &b, &c, &d);\n    int lo = a > c ? a : c;\n    int hi = b < d ? b : d;\n    int overlap = hi - lo;\n    if (overlap < 0) {\n        overlap = 0;\n    }\n    printf("%d\\n", (b - a) + (d - c) - overlap);\n    return 0;\n}' },
        { id: 5104, title: '세 장의 카드', level: 4,
            desc: '숫자가 적힌 카드 N장이 있어요. 서로 다른 카드 3장을 골라 적힌 수의 합이 정확히 K가 되는 방법은 모두 몇 가지일까요? 고르는 순서는 따지지 않아요.',
            input: '첫째 줄에 N과 K (3 ≤ N ≤ 100, 0 ≤ K ≤ 300)가 주어집니다. 둘째 줄에 카드에 적힌 수 N개 (0 이상 100 이하)가 주어집니다.',
            output: '합이 K가 되도록 카드 3장을 고르는 방법의 수를 출력합니다.',
            tests: ['5 10\n1 2 3 4 7\n', '4 100\n1 2 3 4\n', '5 6\n2 2 2 2 2\n',
                (() => { const r = rng(31); return '100 150\n' + list(r, 100, 0, 100).join(' ') + '\n'; })()],
            hints: ['반복문 3개를 겹쳐서 i < j < k 인 모든 세 장을 다 확인해요.', 'j 는 i+1 부터, k 는 j+1 부터 시작하면 같은 조합을 두 번 세지 않아요.'],
            solution: '#include <stdio.h>\n\nint main() {\n    int n, k, card[100], count = 0;\n    scanf("%d %d", &n, &k);\n    for (int i = 0; i < n; i++) {\n        scanf("%d", &card[i]);\n    }\n    for (int i = 0; i < n; i++) {\n        for (int j = i + 1; j < n; j++) {\n            for (int t = j + 1; t < n; t++) {\n                if (card[i] + card[j] + card[t] == k) {\n                    count++;\n                }\n            }\n        }\n    }\n    printf("%d\\n", count);\n    return 0;\n}' },
    ],
},
{
    track: 'silver', name: '실버', level: 5,
    intro: '같은 일을 덜 반복하도록 생각을 바꿔요. 정렬, 누적 합, 이분 탐색, 그래프를 따라가는 DFS를 연습해요.',
    topics: ['누적 합', '정렬과 그리디', '이분 탐색', 'DFS'],
    problems: [
        { id: 5201, title: '구간 합 질문', level: 5,
            desc: '수 N개가 한 줄로 놓여 있어요. "l번째부터 r번째까지 수의 합은?"이라는 질문이 Q개 들어옵니다. 질문마다 답을 빠르게 구하세요.',
            input: '첫째 줄에 N과 Q (1 ≤ N, Q ≤ 5000)가 주어집니다. 둘째 줄에 수 N개 (-1000 이상 1000 이하)가 주어집니다. 다음 Q개의 줄에 l과 r (1 ≤ l ≤ r ≤ N)이 주어집니다.',
            output: '질문마다 구간의 합을 한 줄에 하나씩 출력합니다.',
            tests: ['5 3\n3 -1 4 1 5\n1 3\n2 5\n4 4\n', '1 1\n-7\n1 1\n',
                (() => { const r = rng(41); const n = 5000, q = 5000; let s = n + ' ' + q + '\n' + list(r, n, -1000, 1000).join(' ') + '\n'; for (let i = 0; i < q; i++) { const a = randInt(r, 1, n), b = randInt(r, 1, n); s += Math.min(a, b) + ' ' + Math.max(a, b) + '\n'; } return s; })()],
            hints: ['질문마다 l 부터 r 까지 더하면 너무 느려질 수 있어요. 미리 계산해 둘 수 있는 게 없을까요?', 'sum[i] = 1번째부터 i번째까지의 합 을 만들어 두면, 답은 sum[r] - sum[l-1] 이에요.'],
            solution: '#include <stdio.h>\n\nint sum[5001];\n\nint main() {\n    int n, q;\n    scanf("%d %d", &n, &q);\n    for (int i = 1; i <= n; i++) {\n        int x;\n        scanf("%d", &x);\n        sum[i] = sum[i - 1] + x;\n    }\n    for (int i = 0; i < q; i++) {\n        int l, r;\n        scanf("%d %d", &l, &r);\n        printf("%d\\n", sum[r] - sum[l - 1]);\n    }\n    return 0;\n}' },
        { id: 5202, title: '섬의 개수', level: 5,
            desc: '지도에서 # 은 땅, . 은 바다예요. 위·아래·왼쪽·오른쪽으로 이어진 땅들은 하나의 섬입니다. 지도에 섬이 모두 몇 개 있는지 세어 보세요.',
            input: '첫째 줄에 지도의 세로 H와 가로 W (1 ≤ H, W ≤ 50)가 주어집니다. 다음 H개의 줄에 # 과 . 으로 이루어진 W글자가 주어집니다.',
            output: '섬의 개수를 출력합니다.',
            tests: ['4 5\n##..#\n#...#\n..#..\n....#\n', '2 3\n...\n...\n', '3 3\n###\n#.#\n###\n',
                (() => { const g = gridCase(51, 50, 50, 0.45); return '50 50\n' + g.join('\n') + '\n'; })()],
            hints: ['아직 방문하지 않은 땅을 찾을 때마다 섬 개수를 1 늘리고, 그 땅과 이어진 땅을 전부 방문 표시해요.', '이어진 땅을 전부 표시하는 함수 dfs(y, x)를 만들어 자기 자신을 위·아래·왼쪽·오른쪽으로 다시 불러요. 지도 밖으로 나가지 않게 조심해요.'],
            solution: '#include <stdio.h>\n\nint h, w;\nchar map[50][51];\n\nvoid dfs(int y, int x) {\n    if (y < 0 || y >= h || x < 0 || x >= w || map[y][x] != \'#\') {\n        return;\n    }\n    map[y][x] = \'v\';\n    dfs(y - 1, x);\n    dfs(y + 1, x);\n    dfs(y, x - 1);\n    dfs(y, x + 1);\n}\n\nint main() {\n    int count = 0;\n    scanf("%d %d", &h, &w);\n    for (int y = 0; y < h; y++) {\n        scanf("%s", map[y]);\n    }\n    for (int y = 0; y < h; y++) {\n        for (int x = 0; x < w; x++) {\n            if (map[y][x] == \'#\') {\n                count++;\n                dfs(y, x);\n            }\n        }\n    }\n    printf("%d\\n", count);\n    return 0;\n}' },
        { id: 5203, title: '동아리방 예약', level: 5,
            desc: '동아리방 하나를 쓰고 싶은 모임이 N개 있어요. 각 모임은 시작 시각 s와 끝 시각 e가 정해져 있고, 한 모임이 끝나는 시각에 바로 다음 모임을 시작할 수 있어요. 시간이 겹치지 않게 최대한 많은 모임을 넣으면 몇 개까지 넣을 수 있을까요?',
            input: '첫째 줄에 N (1 ≤ N ≤ 1000)이 주어집니다. 다음 N개의 줄에 s와 e (0 ≤ s < e ≤ 10000)가 주어집니다.',
            output: '넣을 수 있는 모임의 최대 개수를 출력합니다.',
            tests: ['5\n1 4\n3 5\n0 6\n5 7\n8 9\n', '3\n1 2\n2 3\n3 4\n', '3\n0 10\n1 2\n2 3\n',
                (() => { const r = rng(61); let s = '1000\n'; for (let i = 0; i < 1000; i++) { const a = randInt(r, 0, 9900); s += a + ' ' + (a + randInt(r, 1, 100)) + '\n'; } return s; })()],
            hints: ['일찍 끝나는 모임을 먼저 넣을수록 뒤에 남는 시간이 많아져요.', '끝 시각 순서로 정렬하고(끝 시각이 같으면 시작 시각 순), 앞에서부터 "지금까지 마지막 끝 시각 ≤ 시작 시각"인 모임만 넣어요. 정렬은 qsort 를 쓸 수 있어요.'],
            solution: '#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct {\n    int s;\n    int e;\n} Meeting;\n\nint compare(const void *a, const void *b) {\n    const Meeting *x = a;\n    const Meeting *y = b;\n    if (x->e != y->e) {\n        return x->e - y->e;\n    }\n    return x->s - y->s;\n}\n\nint main() {\n    int n, count = 0, last = 0;\n    Meeting m[1000];\n    scanf("%d", &n);\n    for (int i = 0; i < n; i++) {\n        scanf("%d %d", &m[i].s, &m[i].e);\n    }\n    qsort(m, n, sizeof(Meeting), compare);\n    for (int i = 0; i < n; i++) {\n        if (m[i].s >= last) {\n            count++;\n            last = m[i].e;\n        }\n    }\n    printf("%d\\n", count);\n    return 0;\n}' },
        { id: 5204, title: '떡 자르기', level: 5,
            desc: '길이가 서로 다른 가래떡 N개가 있어요. 칼 높이를 H로 정하면 H보다 긴 떡은 H를 넘는 부분이 잘려 나갑니다. 잘려 나온 떡 길이의 합이 적어도 M이 되도록 할 때, H의 최댓값을 구하세요.',
            input: '첫째 줄에 N과 M (1 ≤ N ≤ 1000, 1 ≤ M ≤ 1000000)이 주어집니다. 둘째 줄에 떡의 길이 N개 (1 이상 1000000 이하)가 주어집니다. 떡 길이의 합은 항상 M 이상입니다.',
            output: '잘린 떡의 합이 M 이상이 되는 H의 최댓값을 출력합니다. H는 0 이상의 정수입니다.',
            tests: ['4 6\n19 15 10 17\n', '3 10\n5 5 5\n', '1 1\n1\n',
                (() => { const r = rng(71); return '1000 1000000\n' + list(r, 1000, 1, 1000000).join(' ') + '\n'; })()],
            hints: ['H를 0부터 하나씩 늘려 보면 너무 오래 걸려요. H가 커질수록 잘리는 양은 줄어들기만 해요.', '이분 탐색: lo = 0, hi = 가장 긴 떡. 가운데 mid 로 잘라 본 합이 M 이상이면 답이 mid 이상이니 lo 를 올리고, 아니면 hi 를 내려요. 합은 long long 으로 계산해요.'],
            solution: '#include <stdio.h>\n\nint n;\nint len[1000];\n\nlong long cut(int h) {\n    long long total = 0;\n    for (int i = 0; i < n; i++) {\n        if (len[i] > h) {\n            total += len[i] - h;\n        }\n    }\n    return total;\n}\n\nint main() {\n    long long m;\n    int lo = 0, hi = 0;\n    scanf("%d %lld", &n, &m);\n    for (int i = 0; i < n; i++) {\n        scanf("%d", &len[i]);\n        if (len[i] > hi) {\n            hi = len[i];\n        }\n    }\n    while (lo < hi) {\n        int mid = (lo + hi + 1) / 2;\n        if (cut(mid) >= m) {\n            lo = mid;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    printf("%d\\n", lo);\n    return 0;\n}' },
    ],
},
{
    track: 'gold', name: '골드', level: 6,
    intro: '작은 문제의 답을 모아 큰 문제를 푸는 동적 계획법(DP), 가장 짧은 길을 찾는 BFS, 무리를 합치는 유니온 파인드를 배워요.',
    topics: ['동적 계획법', 'BFS 최단 거리', '유니온 파인드'],
    problems: [
        { id: 5301, title: '소풍 가방 싸기', level: 6,
            desc: '소풍 가방에는 무게 W까지 넣을 수 있어요. 물건이 N개 있고 i번 물건은 무게 w와 행복도 v를 가집니다. 같은 물건은 한 번만 넣을 수 있을 때, 넣은 물건의 행복도 합의 최댓값을 구하세요.',
            input: '첫째 줄에 N과 W (1 ≤ N ≤ 100, 1 ≤ W ≤ 10000)가 주어집니다. 다음 N개의 줄에 물건의 무게 w (1 ≤ w ≤ W)와 행복도 v (0 ≤ v ≤ 1000)가 주어집니다.',
            output: '행복도 합의 최댓값을 출력합니다.',
            tests: ['4 7\n6 13\n4 8\n3 6\n5 12\n', '1 5\n6 100\n', '3 10\n5 10\n5 10\n5 10\n',
                (() => { const r = rng(81); let s = '100 5000\n'; for (let i = 0; i < 100; i++) { s += randInt(r, 1, 500) + ' ' + randInt(r, 0, 1000) + '\n'; } return s; })()],
            hints: ['dp[c] = 가방 무게를 c 까지 썼을 때 얻을 수 있는 최대 행복도 라고 정해요.', '물건을 하나씩 보면서 c 를 W 부터 w 까지 거꾸로 내려가며 dp[c] = max(dp[c], dp[c - w] + v) 로 고쳐요. 거꾸로 가야 같은 물건을 두 번 넣지 않아요.'],
            solution: '#include <stdio.h>\n\nint dp[10001];\n\nint main() {\n    int n, cap;\n    scanf("%d %d", &n, &cap);\n    for (int i = 0; i < n; i++) {\n        int w, v;\n        scanf("%d %d", &w, &v);\n        for (int c = cap; c >= w; c--) {\n            if (dp[c - w] + v > dp[c]) {\n                dp[c] = dp[c - w] + v;\n            }\n        }\n    }\n    printf("%d\\n", dp[cap]);\n    return 0;\n}' },
        { id: 5302, title: '닮은 글자 찾기', level: 6,
            desc: '두 단어 A와 B가 있어요. 각 단어에서 글자 몇 개를 지워(순서는 그대로) 똑같은 단어를 만들려고 해요. 이렇게 만들 수 있는 가장 긴 공통 단어의 길이를 구하세요. 이것을 최장 공통 부분 수열(LCS)이라고 해요.',
            input: '첫째 줄에 단어 A, 둘째 줄에 단어 B가 주어집니다. 두 단어는 영어 대문자로만 이루어지고 길이는 1 이상 1000 이하입니다.',
            output: '가장 긴 공통 부분 수열의 길이를 출력합니다.',
            tests: ['ACAYKP\nCAPCAK\n', 'ABC\nDEF\n', 'CODY\nCODY\n',
                (() => { const r = rng(91); const word = (n) => Array.from({ length: n }, () => 'ACGT'[randInt(r, 0, 3)]).join(''); return word(300) + '\n' + word(300) + '\n'; })()],
            hints: ['dp[i][j] = A의 앞 i글자와 B의 앞 j글자의 LCS 길이 라고 정해요.', 'A의 i번째 글자와 B의 j번째 글자가 같으면 dp[i-1][j-1] + 1, 다르면 dp[i-1][j] 와 dp[i][j-1] 중 큰 값이에요.'],
            solution: '#include <stdio.h>\n#include <string.h>\n\nchar a[1001], b[1001];\nint dp[1001][1001];\n\nint main() {\n    scanf("%s %s", a, b);\n    int n = strlen(a), m = strlen(b);\n    for (int i = 1; i <= n; i++) {\n        for (int j = 1; j <= m; j++) {\n            if (a[i - 1] == b[j - 1]) {\n                dp[i][j] = dp[i - 1][j - 1] + 1;\n            } else if (dp[i - 1][j] > dp[i][j - 1]) {\n                dp[i][j] = dp[i - 1][j];\n            } else {\n                dp[i][j] = dp[i][j - 1];\n            }\n        }\n    }\n    printf("%d\\n", dp[n][m]);\n    return 0;\n}' },
        { id: 5303, title: '미로 탈출', level: 6,
            desc: '미로에서 . 은 지나갈 수 있는 칸, # 은 벽이에요. 왼쪽 위 칸에서 출발해 오른쪽 아래 칸까지 위·아래·왼쪽·오른쪽으로 한 칸씩 움직일 때, 가장 적게 움직이는 횟수를 구하세요. 갈 수 없으면 -1을 출력합니다.',
            input: '첫째 줄에 세로 H와 가로 W (2 ≤ H, W ≤ 60)가 주어집니다. 다음 H개의 줄에 미로가 주어집니다. 출발 칸과 도착 칸은 항상 . 입니다.',
            output: '최소 이동 횟수를 출력하고, 도착할 수 없으면 -1을 출력합니다.',
            tests: ['4 5\n..#..\n#.#.#\n.....\n.##..\n', '2 2\n.#\n#.\n', '3 3\n...\n...\n...\n',
                (() => { const g = gridCase(101, 60, 60, 0.25); g[0] = '.' + g[0].slice(1); g[59] = g[59].slice(0, 59) + '.'; return '60 60\n' + g.join('\n') + '\n'; })()],
            hints: ['가장 짧은 길은 너비 우선 탐색(BFS)으로 찾아요. 출발점에서 1칸, 2칸, 3칸… 떨어진 칸을 차례로 넓혀 가요.', '큐(queue)는 배열과 앞(head)·뒤(tail) 번호 두 개로 만들 수 있어요. dist 배열을 -1로 채워 두면 방문 표시도 같이 돼요.'],
            solution: '#include <stdio.h>\n\nint h, w;\nchar maze[60][61];\nint dist[60][60];\nint qy[3600], qx[3600];\n\nint main() {\n    int dy[4] = {-1, 1, 0, 0};\n    int dx[4] = {0, 0, -1, 1};\n    int head = 0, tail = 0;\n    scanf("%d %d", &h, &w);\n    for (int y = 0; y < h; y++) {\n        scanf("%s", maze[y]);\n        for (int x = 0; x < w; x++) {\n            dist[y][x] = -1;\n        }\n    }\n    dist[0][0] = 0;\n    qy[tail] = 0;\n    qx[tail] = 0;\n    tail++;\n    while (head < tail) {\n        int y = qy[head], x = qx[head];\n        head++;\n        for (int d = 0; d < 4; d++) {\n            int ny = y + dy[d], nx = x + dx[d];\n            if (ny < 0 || ny >= h || nx < 0 || nx >= w) {\n                continue;\n            }\n            if (maze[ny][nx] == \'#\' || dist[ny][nx] != -1) {\n                continue;\n            }\n            dist[ny][nx] = dist[y][x] + 1;\n            qy[tail] = ny;\n            qx[tail] = nx;\n            tail++;\n        }\n    }\n    printf("%d\\n", dist[h - 1][w - 1]);\n    return 0;\n}' },
        { id: 5304, title: '친구 무리', level: 6,
            desc: '학생 N명이 있고 처음에는 모두 서로 모르는 사이예요. "a와 b가 친구가 되었다"는 소식이 M번 들어옵니다. 친구의 친구도 같은 무리로 볼 때, 소식이 들어올 때마다 지금 무리가 모두 몇 개인지 출력하세요.',
            input: '첫째 줄에 N과 M (1 ≤ N ≤ 10000, 1 ≤ M ≤ 10000)이 주어집니다. 다음 M개의 줄에 a와 b (1 ≤ a, b ≤ N)가 주어집니다.',
            output: '소식마다 그 소식이 반영된 뒤의 무리 개수를 한 줄에 하나씩 출력합니다.',
            tests: ['5 4\n1 2\n3 4\n2 1\n2 3\n', '3 2\n1 1\n2 3\n',
                (() => { const r = rng(111); let s = '10000 10000\n'; for (let i = 0; i < 10000; i++) { s += randInt(r, 1, 10000) + ' ' + randInt(r, 1, 10000) + '\n'; } return s; })()],
            hints: ['parent[i] 에 i가 속한 무리의 "대장"으로 가는 길을 저장해요. 처음에는 parent[i] = i 예요.', 'find(x) 로 대장을 찾고, 두 대장이 다를 때만 하나로 합치고 무리 수를 1 줄여요. find 안에서 parent[x] = find(parent[x]) 로 길을 줄이면 빨라져요.'],
            solution: '#include <stdio.h>\n\nint parent[10001];\n\nint find(int x) {\n    if (parent[x] != x) {\n        parent[x] = find(parent[x]);\n    }\n    return parent[x];\n}\n\nint main() {\n    int n, m;\n    scanf("%d %d", &n, &m);\n    for (int i = 1; i <= n; i++) {\n        parent[i] = i;\n    }\n    int groups = n;\n    for (int i = 0; i < m; i++) {\n        int a, b;\n        scanf("%d %d", &a, &b);\n        int ra = find(a), rb = find(b);\n        if (ra != rb) {\n            parent[ra] = rb;\n            groups--;\n        }\n        printf("%d\\n", groups);\n    }\n    return 0;\n}' },
    ],
},
{
    track: 'platinum', name: '플래티넘', level: 7,
    intro: '자료구조와 알고리즘을 직접 설계해요. 세그먼트 트리, 다익스트라, 이분 탐색을 섞은 DP, 비트마스크 DP에 도전해요.',
    topics: ['세그먼트 트리', '다익스트라', 'LIS (N log N)', '비트마스크 DP'],
    problems: [
        { id: 5401, title: '바뀌는 기록판', level: 7,
            desc: '기록판에 수 N개가 적혀 있어요. 명령이 Q개 들어옵니다. "1 i x"는 i번째 수를 x로 바꾸라는 뜻이고, "2 l r"은 l번째부터 r번째까지 중 가장 작은 수를 출력하라는 뜻이에요.',
            input: '첫째 줄에 N과 Q (1 ≤ N, Q ≤ 5000)가 주어집니다. 둘째 줄에 수 N개 (0 이상 1000000000 이하)가 주어집니다. 다음 Q개의 줄에 명령이 주어집니다. 1 ≤ i ≤ N, 1 ≤ l ≤ r ≤ N, 0 ≤ x ≤ 1000000000 입니다.',
            output: '2번 명령마다 답을 한 줄에 하나씩 출력합니다.',
            tests: ['5 5\n5 3 8 6 1\n2 1 3\n1 2 9\n2 1 3\n2 3 5\n1 5 7\n', '1 2\n4\n2 1 1\n1 1 2\n',
                (() => { const r = rng(121); const n = 5000, q = 5000; let s = n + ' ' + q + '\n' + list(r, n, 0, 1000000000).join(' ') + '\n'; for (let i = 0; i < q; i++) { if (r() < 0.5) { s += '1 ' + randInt(r, 1, n) + ' ' + randInt(r, 0, 1000000000) + '\n'; } else { const a = randInt(r, 1, n), b = randInt(r, 1, n); s += '2 ' + Math.min(a, b) + ' ' + Math.max(a, b) + '\n'; } } return s; })()],
            hints: ['매번 l~r 을 다 보면 느려요. 구간을 반씩 나눈 나무(세그먼트 트리)에 각 구간의 최솟값을 저장해 두면 바꾸기와 묻기가 모두 빨라져요.', '노드 node 가 맡은 구간이 [s, e] 이면 왼쪽 자식은 node*2 가 [s, mid], 오른쪽 자식은 node*2+1 이 [mid+1, e] 를 맡아요. 배열 크기는 4N 이면 충분해요.'],
            solution: '#include <stdio.h>\n\n#define INF 2000000000\n\nint n;\nint tree[20000];\n\nvoid update(int node, int s, int e, int i, int x) {\n    if (s == e) {\n        tree[node] = x;\n        return;\n    }\n    int mid = (s + e) / 2;\n    if (i <= mid) {\n        update(node * 2, s, mid, i, x);\n    } else {\n        update(node * 2 + 1, mid + 1, e, i, x);\n    }\n    int a = tree[node * 2], b = tree[node * 2 + 1];\n    tree[node] = a < b ? a : b;\n}\n\nint query(int node, int s, int e, int l, int r) {\n    if (r < s || e < l) {\n        return INF;\n    }\n    if (l <= s && e <= r) {\n        return tree[node];\n    }\n    int mid = (s + e) / 2;\n    int a = query(node * 2, s, mid, l, r);\n    int b = query(node * 2 + 1, mid + 1, e, l, r);\n    return a < b ? a : b;\n}\n\nint main() {\n    int q;\n    scanf("%d %d", &n, &q);\n    for (int i = 1; i <= n; i++) {\n        int x;\n        scanf("%d", &x);\n        update(1, 1, n, i, x);\n    }\n    for (int k = 0; k < q; k++) {\n        int type, a, b;\n        scanf("%d %d %d", &type, &a, &b);\n        if (type == 1) {\n            update(1, 1, n, a, b);\n        } else {\n            printf("%d\\n", query(1, 1, n, a, b));\n        }\n    }\n    return 0;\n}' },
        { id: 5402, title: '가장 싼 배달길', level: 7,
            desc: '마을 N개가 양방향 도로 M개로 이어져 있고, 도로마다 통행료가 있어요. 1번 마을에서 출발해 각 마을까지 가는 데 드는 최소 통행료를 구하세요. 갈 수 없는 마을은 -1입니다.',
            input: '첫째 줄에 N과 M (1 ≤ N ≤ 200, 0 ≤ M ≤ 5000)이 주어집니다. 다음 M개의 줄에 도로가 잇는 두 마을 a, b와 통행료 c (1 ≤ c ≤ 1000)가 주어집니다. 같은 두 마을 사이에 도로가 여러 개 있을 수 있습니다.',
            output: '1번 마을부터 N번 마을까지 최소 통행료를 공백으로 구분해 한 줄에 출력합니다. 1번 마을은 0입니다.',
            tests: ['5 6\n1 2 4\n1 3 1\n3 2 2\n2 4 5\n3 4 8\n4 5 3\n', '3 1\n1 2 7\n', '1 0\n',
                (() => { const r = rng(131); const n = 200, m = 5000; let s = n + ' ' + m + '\n'; for (let i = 0; i < m; i++) { s += randInt(r, 1, n) + ' ' + randInt(r, 1, n) + ' ' + randInt(r, 1, 1000) + '\n'; } return s; })()],
            hints: ['다익스트라 알고리즘: 아직 확정되지 않은 마을 중 지금 가장 싼 마을을 하나 골라 확정하고, 그 마을에서 갈 수 있는 이웃의 값을 줄여요. 이것을 N번 반복해요.', '마을이 200개뿐이라 cost[a][b] 2차원 배열에 두 마을 사이 가장 싼 도로만 저장해도 충분해요. 도로가 없으면 아주 큰 수로 둬요.'],
            solution: '#include <stdio.h>\n\n#define INF 1000000000\n\nint cost[201][201];\nint dist[201];\nint done[201];\n\nint main() {\n    int n, m;\n    scanf("%d %d", &n, &m);\n    for (int i = 1; i <= n; i++) {\n        for (int j = 1; j <= n; j++) {\n            cost[i][j] = INF;\n        }\n        dist[i] = INF;\n    }\n    for (int i = 0; i < m; i++) {\n        int a, b, c;\n        scanf("%d %d %d", &a, &b, &c);\n        if (c < cost[a][b]) {\n            cost[a][b] = c;\n            cost[b][a] = c;\n        }\n    }\n    dist[1] = 0;\n    for (int step = 0; step < n; step++) {\n        int u = -1;\n        for (int i = 1; i <= n; i++) {\n            if (!done[i] && dist[i] < INF && (u == -1 || dist[i] < dist[u])) {\n                u = i;\n            }\n        }\n        if (u == -1) {\n            break;\n        }\n        done[u] = 1;\n        for (int v = 1; v <= n; v++) {\n            if (cost[u][v] < INF && dist[u] + cost[u][v] < dist[v]) {\n                dist[v] = dist[u] + cost[u][v];\n            }\n        }\n    }\n    for (int i = 1; i <= n; i++) {\n        printf("%d%c", dist[i] == INF ? -1 : dist[i], i == n ? \'\\n\' : \' \');\n    }\n    return 0;\n}' },
        { id: 5403, title: '키 순서대로 줄 세우기', level: 7,
            desc: '학생 N명이 한 줄로 서 있어요. 몇 명을 줄에서 빼서, 남은 학생들의 키가 앞에서부터 점점 커지게(같은 키는 안 됨) 만들려고 해요. 남길 수 있는 학생은 최대 몇 명일까요? 이것을 가장 긴 증가하는 부분 수열(LIS)이라고 해요.',
            input: '첫째 줄에 N (1 ≤ N ≤ 20000)이 주어집니다. 둘째 줄에 학생들의 키 N개 (1 이상 1000000000 이하)가 주어집니다.',
            output: '남길 수 있는 학생 수의 최댓값을 출력합니다.',
            tests: ['8\n10 20 10 30 20 50 40 60\n', '4\n5 5 5 5\n', '5\n5 4 3 2 1\n',
                (() => { const r = rng(141); return '20000\n' + list(r, 20000, 1, 1000000000).join(' ') + '\n'; })()],
            hints: ['N이 크면 모든 쌍을 비교하는 N×N 방법은 느려요. tail[k] = 길이가 k+1인 증가 수열 중 가장 작은 마지막 값 을 관리해 봐요.', '새 키 x 가 오면 tail 에서 x 이상인 첫 자리를 이분 탐색으로 찾아 x 로 바꿔요. 그런 자리가 없으면 맨 뒤에 붙여요. 마지막 tail 의 길이가 답이에요.'],
            solution: '#include <stdio.h>\n\nint tail[20000];\n\nint main() {\n    int n, len = 0;\n    scanf("%d", &n);\n    for (int i = 0; i < n; i++) {\n        int x;\n        scanf("%d", &x);\n        int lo = 0, hi = len;\n        while (lo < hi) {\n            int mid = (lo + hi) / 2;\n            if (tail[mid] < x) {\n                lo = mid + 1;\n            } else {\n                hi = mid;\n            }\n        }\n        tail[lo] = x;\n        if (lo == len) {\n            len++;\n        }\n    }\n    printf("%d\\n", len);\n    return 0;\n}' },
        { id: 5404, title: '모든 교실 순찰', level: 7,
            desc: '코디는 1번 교실에서 출발해 나머지 교실을 모두 한 번씩 들른 뒤 다시 1번 교실로 돌아와야 해요. i번 교실에서 j번 교실로 가는 시간이 표로 주어질 때, 가장 빨리 순찰을 마치는 시간을 구하세요.',
            input: '첫째 줄에 교실 수 N (2 ≤ N ≤ 10)이 주어집니다. 다음 N개의 줄에 N개씩 이동 시간이 주어집니다. i번째 줄의 j번째 수는 i번에서 j번 교실로 가는 시간 (1 이상 1000 이하, 자기 자신은 0)입니다. 가는 시간과 오는 시간이 다를 수 있습니다.',
            output: '순찰을 마치는 가장 짧은 시간을 출력합니다.',
            tests: ['4\n0 10 15 20\n5 0 9 10\n6 13 0 12\n8 8 9 0\n', '2\n0 3\n4 0\n',
                (() => { const r = rng(151); const n = 10; let s = n + '\n'; for (let i = 0; i < n; i++) { const row = []; for (let j = 0; j < n; j++) { row.push(i === j ? 0 : randInt(r, 1, 1000)); } s += row.join(' ') + '\n'; } return s; })()],
            hints: ['들른 교실의 모음을 비트로 나타내요. N개 교실이면 0부터 2^N - 1 까지의 수 하나가 "어디를 들렀는지"를 뜻해요.', 'dp[mask][i] = mask 에 있는 교실을 들르고 지금 i번에 있을 때 걸린 최소 시간. 아직 안 들른 j로 가면 dp[mask | (1<<j)][j] 를 고쳐요. 마지막에 1번으로 돌아오는 시간을 더해요.'],
            solution: '#include <stdio.h>\n\n#define INF 1000000000\n\nint t[10][10];\nint dp[1 << 10][10];\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) {\n            scanf("%d", &t[i][j]);\n        }\n    }\n    int full = (1 << n) - 1;\n    for (int mask = 0; mask <= full; mask++) {\n        for (int i = 0; i < n; i++) {\n            dp[mask][i] = INF;\n        }\n    }\n    dp[1][0] = 0;\n    for (int mask = 1; mask <= full; mask++) {\n        for (int i = 0; i < n; i++) {\n            if (dp[mask][i] == INF) {\n                continue;\n            }\n            for (int j = 0; j < n; j++) {\n                if (mask & (1 << j)) {\n                    continue;\n                }\n                int next = mask | (1 << j);\n                int value = dp[mask][i] + t[i][j];\n                if (value < dp[next][j]) {\n                    dp[next][j] = value;\n                }\n            }\n        }\n    }\n    int best = INF;\n    for (int i = 1; i < n; i++) {\n        if (dp[full][i] + t[i][0] < best) {\n            best = dp[full][i] + t[i][0];\n        }\n    }\n    printf("%d\\n", best);\n    return 0;\n}' },
    ],
},
];

// 추가 문제(algorithm-extra.cjs)를 단계별로 이어 붙인다
const extra = require('./algorithm-extra.cjs');
for (const track of tracks) {
    track.topics = [...track.topics, ...extra[track.track].topics];
    track.problems = [...track.problems, ...extra[track.track].problems];
}

module.exports = tracks;
