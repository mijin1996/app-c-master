// 알고리즘 문제의 Python 모범답안 (문제 번호 → 코드). C 모범답안과 같은 출력을 내는지
// tools/build-content.mjs 가 python3 로 돌려 확인한다. 모두 새로 작성.
module.exports = {
5101: `import sys

data = sys.stdin.read().split()
n = int(data[0])
t = list(map(int, data[1:1 + n]))
best = cur = 1
for i in range(1, n):
    cur = cur + 1 if t[i] > t[i - 1] else 1
    best = max(best, cur)
print(best)
`,
5102: `import sys

data = sys.stdin.read().split()
n, m = int(data[0]), int(data[1])
seat = list(range(n + 1))
idx = 2
for _ in range(m):
    a, b = int(data[idx]), int(data[idx + 1])
    idx += 2
    seat[a], seat[b] = seat[b], seat[a]
print(' '.join(map(str, seat[1:])))
`,
5103: `a, b = map(int, input().split())
c, d = map(int, input().split())
overlap = max(0, min(b, d) - max(a, c))
print((b - a) + (d - c) - overlap)
`,
5104: `import sys

data = sys.stdin.read().split()
n, k = int(data[0]), int(data[1])
card = list(map(int, data[2:2 + n]))
count = 0
for i in range(n):
    for j in range(i + 1, n):
        rest = k - card[i] - card[j]
        for t in range(j + 1, n):
            if card[t] == rest:
                count += 1
print(count)
`,
5105: `ax1, ay1, ax2, ay2 = map(int, input().split())
bx1, by1, bx2, by2 = map(int, input().split())
total = (ax2 - ax1) * (ay2 - ay1) + (bx2 - bx1) * (by2 - by1)
w = min(ax2, bx2) - max(ax1, bx1)
h = min(ay2, by2) - max(ay1, by1)
if w > 0 and h > 0:
    total -= w * h
print(total)
`,
5106: `import sys

data = sys.stdin.read().split()
n = int(data[0])
t = [0] * (n + 1)
pre = [0] * (n + 1)
for i in range(1, n + 1):
    t[i] = int(data[2 * i - 1])
    pre[i] = int(data[2 * i])
used = [False] * (n + 1)
best = float('inf')


def go(count, now, total):
    global best
    if count == n:
        best = min(best, total)
        return
    for i in range(1, n + 1):
        if used[i] or (pre[i] != 0 and not used[pre[i]]):
            continue
        used[i] = True
        go(count + 1, now + t[i], total + now + t[i])
        used[i] = False


go(0, 0, 0)
print(best)
`,
5107: `import sys

data = sys.stdin.read().split()
n = int(data[0])
a = list(map(int, data[1:1 + n]))
print(len(set(a)), max(a) - min(a))
`,
5108: `w, h = map(int, input().split())
cmd = input().strip()
move = {'U': (0, -1), 'D': (0, 1), 'L': (-1, 0), 'R': (1, 0)}
x = y = 0
seen = {(0, 0)}
for c in cmd:
    dx, dy = move[c]
    nx, ny = x + dx, y + dy
    if 0 <= nx < w and 0 <= ny < h:
        x, y = nx, ny
        seen.add((x, y))
print(len(seen))
`,
5201: `import sys

data = sys.stdin.buffer.read().split()
n, q = int(data[0]), int(data[1])
prefix = [0] * (n + 1)
for i in range(n):
    prefix[i + 1] = prefix[i] + int(data[2 + i])
out = []
idx = 2 + n
for _ in range(q):
    l, r = int(data[idx]), int(data[idx + 1])
    idx += 2
    out.append(prefix[r] - prefix[l - 1])
print('\\n'.join(map(str, out)))
`,
5202: `import sys

data = sys.stdin.read().split()
h, w = int(data[0]), int(data[1])
grid = [list(row) for row in data[2:2 + h]]
count = 0
for sy in range(h):
    for sx in range(w):
        if grid[sy][sx] != '#':
            continue
        count += 1
        stack = [(sy, sx)]
        grid[sy][sx] = 'v'
        while stack:
            y, x = stack.pop()
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < h and 0 <= nx < w and grid[ny][nx] == '#':
                    grid[ny][nx] = 'v'
                    stack.append((ny, nx))
print(count)
`,
5203: `import sys

data = sys.stdin.read().split()
n = int(data[0])
meetings = [(int(data[2 + 2 * i]), int(data[1 + 2 * i])) for i in range(n)]
meetings.sort()
count = last = 0
for e, s in meetings:
    if s >= last:
        count += 1
        last = e
print(count)
`,
5204: `import sys

data = sys.stdin.read().split()
n, m = int(data[0]), int(data[1])
length = list(map(int, data[2:2 + n]))


def cut(h):
    return sum(x - h for x in length if x > h)


lo, hi = 0, max(length)
while lo < hi:
    mid = (lo + hi + 1) // 2
    if cut(mid) >= m:
        lo = mid
    else:
        hi = mid - 1
print(lo)
`,
5205: `import sys

data = sys.stdin.buffer.read().split()
n, s = int(data[0]), int(data[1])
a = list(map(int, data[2:2 + n]))
left = total = best = 0
for right in range(n):
    total += a[right]
    while total > s:
        total -= a[left]
        left += 1
    best = max(best, right - left + 1)
print(best)
`,
5206: `import sys

data = sys.stdin.buffer.read().split()
h, w, q = int(data[0]), int(data[1]), int(data[2])
idx = 3
total = [[0] * (w + 1) for _ in range(h + 1)]
for i in range(1, h + 1):
    row, above = total[i], total[i - 1]
    for j in range(1, w + 1):
        row[j] = int(data[idx]) + above[j] + row[j - 1] - above[j - 1]
        idx += 1
out = []
for _ in range(q):
    r1, c1, r2, c2 = (int(x) for x in data[idx:idx + 4])
    idx += 4
    out.append(total[r2][c2] - total[r1 - 1][c2] - total[r2][c1 - 1] + total[r1 - 1][c1 - 1])
print('\\n'.join(map(str, out)))
`,
5207: `import sys
from collections import deque

data = sys.stdin.read().split()
n = int(data[0])
children = [[] for _ in range(n + 1)]
for v in range(2, n + 1):
    children[int(data[v - 1])].append(v)
count = {}
queue = deque([(1, 1)])
while queue:
    u, d = queue.popleft()
    count[d] = count.get(d, 0) + 1
    for c in children[u]:
        queue.append((c, d + 1))
levels = max(count)
print(levels)
print(' '.join(str(count[d]) for d in range(1, levels + 1)))
`,
5208: `import sys
from collections import Counter

data = sys.stdin.buffer.read().split()
n = int(data[0])
count = Counter(map(int, data[1:1 + n]))
best = min(count, key=lambda song: (-count[song], song))
print(best, count[best])
`,
5301: `import sys

data = sys.stdin.read().split()
n, cap = int(data[0]), int(data[1])
dp = [0] * (cap + 1)
for i in range(n):
    w, v = int(data[2 + 2 * i]), int(data[3 + 2 * i])
    for c in range(cap, w - 1, -1):
        if dp[c - w] + v > dp[c]:
            dp[c] = dp[c - w] + v
print(dp[cap])
`,
5302: `a = input().strip()
b = input().strip()
prev = [0] * (len(b) + 1)
for ch in a:
    cur = [0] * (len(b) + 1)
    for j in range(1, len(b) + 1):
        if ch == b[j - 1]:
            cur[j] = prev[j - 1] + 1
        else:
            cur[j] = max(prev[j], cur[j - 1])
    prev = cur
print(prev[len(b)])
`,
5303: `import sys
from collections import deque

data = sys.stdin.read().split()
h, w = int(data[0]), int(data[1])
maze = data[2:2 + h]
dist = [[-1] * w for _ in range(h)]
dist[0][0] = 0
queue = deque([(0, 0)])
while queue:
    y, x = queue.popleft()
    for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
        if 0 <= ny < h and 0 <= nx < w and maze[ny][nx] == '.' and dist[ny][nx] == -1:
            dist[ny][nx] = dist[y][x] + 1
            queue.append((ny, nx))
print(dist[h - 1][w - 1])
`,
5304: `import sys

data = sys.stdin.buffer.read().split()
n, m = int(data[0]), int(data[1])
parent = list(range(n + 1))


def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x


groups = n
out = []
for i in range(m):
    ra, rb = find(int(data[2 + 2 * i])), find(int(data[3 + 2 * i]))
    if ra != rb:
        parent[ra] = rb
        groups -= 1
    out.append(groups)
print('\\n'.join(map(str, out)))
`,
5305: `import sys
import heapq

data = sys.stdin.read().split()
n, m = int(data[0]), int(data[1])
out_edges = [[] for _ in range(n + 1)]
indeg = [0] * (n + 1)
for i in range(m):
    a, b = int(data[2 + 2 * i]), int(data[3 + 2 * i])
    out_edges[a].append(b)
    indeg[b] += 1
ready = [v for v in range(1, n + 1) if indeg[v] == 0]
heapq.heapify(ready)
order = []
while ready:
    u = heapq.heappop(ready)
    order.append(u)
    for v in out_edges[u]:
        indeg[v] -= 1
        if indeg[v] == 0:
            heapq.heappush(ready, v)
print(' '.join(map(str, order)) if len(order) == n else -1)
`,
5306: `import sys

data = sys.stdin.read().split()
n, m = int(data[0]), int(data[1])
edges = sorted((int(data[4 + 3 * i]), int(data[2 + 3 * i]), int(data[3 + 3 * i])) for i in range(m))
parent = list(range(n + 1))


def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x


cost = used = 0
for c, a, b in edges:
    if used == n - 1:
        break
    ra, rb = find(a), find(b)
    if ra != rb:
        parent[ra] = rb
        cost += c
        used += 1
print(cost if used == n - 1 else -1)
`,
5307: `import sys

data = sys.stdin.buffer.read().split()
n, q = int(data[0]), int(data[1])
bit = [0] * (n + 1)


def add(i, x):
    while i <= n:
        bit[i] += x
        i += i & -i


def prefix(i):
    s = 0
    while i > 0:
        s += bit[i]
        i -= i & -i
    return s


out = []
idx = 2
for _ in range(q):
    t, a, b = int(data[idx]), int(data[idx + 1]), int(data[idx + 2])
    idx += 3
    if t == 1:
        add(a, b)
    else:
        out.append(prefix(b) - prefix(a - 1))
print('\\n'.join(map(str, out)))
`,
5308: `import sys

MOD = 1000000007
data = sys.stdin.read().split()
h, w = int(data[0]), int(data[1])
grid = data[2:2 + h]
ways = [0] * w
for y in range(h):
    row = grid[y]
    for x in range(w):
        if row[x] == '#':
            ways[x] = 0
        elif y == 0 and x == 0:
            ways[x] = 1
        elif x > 0:
            ways[x] = (ways[x] + ways[x - 1]) % MOD
print(ways[w - 1])
`,
5401: `import sys

data = sys.stdin.buffer.read().split()
n, q = int(data[0]), int(data[1])
size = 1
while size < n:
    size *= 2
INF = 2 * 10 ** 9
tree = [INF] * (2 * size)
for i in range(n):
    tree[size + i] = int(data[2 + i])
for i in range(size - 1, 0, -1):
    tree[i] = min(tree[2 * i], tree[2 * i + 1])
out = []
idx = 2 + n
for _ in range(q):
    t, a, b = int(data[idx]), int(data[idx + 1]), int(data[idx + 2])
    idx += 3
    if t == 1:
        i = size + a - 1
        tree[i] = b
        i //= 2
        while i:
            tree[i] = min(tree[2 * i], tree[2 * i + 1])
            i //= 2
    else:
        lo, hi, best = size + a - 1, size + b, INF
        while lo < hi:
            if lo & 1:
                best = min(best, tree[lo])
                lo += 1
            if hi & 1:
                hi -= 1
                best = min(best, tree[hi])
            lo //= 2
            hi //= 2
        out.append(best)
print('\\n'.join(map(str, out)))
`,
5402: `import sys
import heapq

data = sys.stdin.read().split()
n, m = int(data[0]), int(data[1])
graph = [[] for _ in range(n + 1)]
for i in range(m):
    a, b, c = int(data[2 + 3 * i]), int(data[3 + 3 * i]), int(data[4 + 3 * i])
    graph[a].append((b, c))
    graph[b].append((a, c))
INF = float('inf')
dist = [INF] * (n + 1)
dist[1] = 0
heap = [(0, 1)]
while heap:
    d, u = heapq.heappop(heap)
    if d > dist[u]:
        continue
    for v, c in graph[u]:
        if d + c < dist[v]:
            dist[v] = d + c
            heapq.heappush(heap, (dist[v], v))
print(' '.join(str(-1 if d == INF else d) for d in dist[1:]))
`,
5403: `import sys
from bisect import bisect_left

data = sys.stdin.buffer.read().split()
n = int(data[0])
tail = []
for x in map(int, data[1:1 + n]):
    i = bisect_left(tail, x)
    if i == len(tail):
        tail.append(x)
    else:
        tail[i] = x
print(len(tail))
`,
5404: `import sys

data = sys.stdin.read().split()
n = int(data[0])
t = [[int(data[1 + i * n + j]) for j in range(n)] for i in range(n)]
INF = float('inf')
full = (1 << n) - 1
dp = [[INF] * n for _ in range(1 << n)]
dp[1][0] = 0
for mask in range(1, full + 1):
    row = dp[mask]
    for i in range(n):
        cur = row[i]
        if cur == INF:
            continue
        for j in range(n):
            if mask >> j & 1:
                continue
            nxt = mask | (1 << j)
            if cur + t[i][j] < dp[nxt][j]:
                dp[nxt][j] = cur + t[i][j]
print(min(dp[full][i] + t[i][0] for i in range(1, n)))
`,
5405: `import sys

sys.setrecursionlimit(10000)
data = sys.stdin.buffer.read().split()
n, q = int(data[0]), int(data[1])
value = [0] + [int(x) for x in data[2:2 + n]]
tree = [0] * (4 * n)
lazy = [0] * (4 * n)


def build(node, s, e):
    if s == e:
        tree[node] = value[s]
        return
    mid = (s + e) // 2
    build(2 * node, s, mid)
    build(2 * node + 1, mid + 1, e)
    tree[node] = tree[2 * node] + tree[2 * node + 1]


def push(node, s, e):
    if lazy[node]:
        mid = (s + e) // 2
        tree[2 * node] += lazy[node] * (mid - s + 1)
        tree[2 * node + 1] += lazy[node] * (e - mid)
        lazy[2 * node] += lazy[node]
        lazy[2 * node + 1] += lazy[node]
        lazy[node] = 0


def update(node, s, e, l, r, x):
    if r < s or e < l:
        return
    if l <= s and e <= r:
        tree[node] += x * (e - s + 1)
        lazy[node] += x
        return
    push(node, s, e)
    mid = (s + e) // 2
    update(2 * node, s, mid, l, r, x)
    update(2 * node + 1, mid + 1, e, l, r, x)
    tree[node] = tree[2 * node] + tree[2 * node + 1]


def query(node, s, e, l, r):
    if r < s or e < l:
        return 0
    if l <= s and e <= r:
        return tree[node]
    push(node, s, e)
    mid = (s + e) // 2
    return query(2 * node, s, mid, l, r) + query(2 * node + 1, mid + 1, e, l, r)


build(1, 1, n)
out = []
idx = 2 + n
for _ in range(q):
    t, l, r = int(data[idx]), int(data[idx + 1]), int(data[idx + 2])
    idx += 3
    if t == 1:
        update(1, 1, n, l, r, int(data[idx]))
        idx += 1
    else:
        out.append(query(1, 1, n, l, r))
print('\\n'.join(map(str, out)))
`,
5406: `import sys
from collections import deque

data = sys.stdin.buffer.read().split()
n = int(data[0])
graph = [[] for _ in range(n + 1)]
idx = 1
for _ in range(n - 1):
    a, b = int(data[idx]), int(data[idx + 1])
    idx += 2
    graph[a].append(b)
    graph[b].append(a)
LOG = 15
depth = [0] * (n + 1)
up = [[1] * (n + 1) for _ in range(LOG)]
seen = [False] * (n + 1)
seen[1] = True
queue = deque([1])
while queue:
    u = queue.popleft()
    for v in graph[u]:
        if not seen[v]:
            seen[v] = True
            depth[v] = depth[u] + 1
            up[0][v] = u
            queue.append(v)
for k in range(1, LOG):
    prev, cur = up[k - 1], up[k]
    for v in range(1, n + 1):
        cur[v] = prev[prev[v]]


def lca(u, v):
    if depth[u] < depth[v]:
        u, v = v, u
    for k in range(LOG - 1, -1, -1):
        if depth[u] - (1 << k) >= depth[v]:
            u = up[k][u]
    if u == v:
        return u
    for k in range(LOG - 1, -1, -1):
        if up[k][u] != up[k][v]:
            u, v = up[k][u], up[k][v]
    return up[0][u]


q = int(data[idx])
idx += 1
out = []
for _ in range(q):
    out.append(lca(int(data[idx]), int(data[idx + 1])))
    idx += 2
print('\\n'.join(map(str, out)))
`,
5407: `import sys

data = sys.stdin.read().split()
n = int(data[0])
total = [0] * (n + 1)
for i in range(1, n + 1):
    total[i] = total[i - 1] + int(data[i])
dp = [[0] * (n + 1) for _ in range(n + 1)]
for length in range(2, n + 1):
    for i in range(1, n - length + 2):
        j = i + length - 1
        dp[i][j] = min(dp[i][k] + dp[k + 1][j] for k in range(i, j)) + total[j] - total[i - 1]
print(dp[1][n])
`,
5408: `import sys

data = sys.stdin.buffer.read().split()
n = int(data[0])
points = sorted((int(data[1 + 2 * i]), int(data[2 + 2 * i])) for i in range(n))


def cross(o, a, b):
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])


hull = []
for p in points:
    while len(hull) >= 2 and cross(hull[-2], hull[-1], p) <= 0:
        hull.pop()
    hull.append(p)
lower = len(hull) + 1
for p in reversed(points[:-1]):
    while len(hull) >= lower and cross(hull[-2], hull[-1], p) <= 0:
        hull.pop()
    hull.append(p)
area = sum(hull[i][0] * hull[i + 1][1] - hull[i + 1][0] * hull[i][1] for i in range(len(hull) - 1))
print(abs(area))
`,
};
