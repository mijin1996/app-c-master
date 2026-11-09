// 객체지향 "코드 실습" 원본: 레슨마다 "코드로 보면" 예시를 바탕으로 한 빈칸 채우기 1개 + 결과 맞히기 1개.
// 빈칸은 코드 속 [[1]], [[2]] … 자리. 정답은 대소문자까지 똑같이 (C# 은 Virtual 과 virtual 이 달라요).
// 결과 맞히기는 Console 에 찍히는 줄을 그대로 (줄 끝 공백 · 마지막 빈 줄은 봐줌).
// content/oop.cjs 가 이 파일을 레슨에 붙인다. 고친 뒤에는 `node tools/build-oop.mjs` → `npm test`.

module.exports = {
    1: [
        {
            kind: 'blank',
            prompt: '기본 생성자가 다른 생성자를 부르고, 객체 이니셜라이저로 영웅을 하나 더 찍어 내요. 빈칸을 채워 보세요.',
            code: 'public class Hero\n{\n    public string Name { get; set; }\n    public int Hp { get; set; }\n\n    public Hero() : [[1]]("이름없음", 100) { }\n    public Hero(string name, int hp)\n    {\n        Name = name;\n        Hp = hp;\n    }\n}\n\nvar b = [[2]] Hero { Name = "배트맨", Hp = 200 };',
            blanks: [
                { answers: ['this'], hint: '"나 자신의 다른 생성자" 를 부르는 말' },
                { answers: ['new'], hint: '틀에서 붕어빵을 찍는 주문' },
            ],
            explain: ': this(...) 는 "내 다른 생성자에게 맡길게" 예요. 그리고 new 가 있어야 틀(클래스)에서 진짜 붕어빵(인스턴스)이 만들어져요.',
        },
        {
            kind: 'output',
            prompt: '붕어빵 가게에서 세 개를 찍었어요. 화면에 두 줄이 나와요. 무엇일까요?',
            code: 'class Shop\n{\n    public static int Made = 0;\n    public string Filling;\n    public Shop(string filling) { Filling = filling; Made++; }\n}\n\nvar a = new Shop("팥");\nvar b = new Shop("슈크림");\nvar c = new Shop("팥");\nConsole.WriteLine(Shop.Made);\nConsole.WriteLine(b.Filling);',
            answers: ['3\n슈크림'],
            hint: 'static 은 가게 전체의 칠판 하나, Filling 은 붕어빵마다 따로',
            explain: 'Made 는 static 이라 셋이 함께 쓰는 칠판이에요. 세 번 늘어서 3. b 의 속 재료는 b 만의 것이라 슈크림이에요.',
        },
    ],
    2: [
        {
            kind: 'blank',
            prompt: '나이를 숨기고, 음수가 들어오면 막는 프로퍼티예요. 빈칸을 채워 보세요.',
            code: 'public class Person\n{\n    [[1]] int _age;\n    public int Age\n    {\n        get => _age;\n        set\n        {\n            if ([[2]] < 0) throw new ArgumentException("나이는 음수가 될 수 없어요");\n            _age = value;\n        }\n    }\n}',
            blanks: [
                { answers: ['private'], hint: '내 방 서랍처럼 나만 여는 접근 제어자' },
                { answers: ['value'], hint: 'set 안에서 "새로 들어온 값" 을 부르는 이름' },
            ],
            explain: '_age 는 private 으로 숨기고, set 안에서는 들어온 값을 value 라고 불러요. 들어오는 문에서 검사하니 이상한 나이가 절대 안 들어가요.',
        },
        {
            kind: 'output',
            prompt: '돼지 저금통에 동전을 넣었어요. 몇 개가 들어 있을까요?',
            code: 'class PiggyBank\n{\n    private int _coins = 0;\n    public void Put(int n) { if (n > 0) _coins += n; }\n    public int Count => _coins;\n}\n\nvar pig = new PiggyBank();\npig.Put(500);\npig.Put(-300);\npig.Put(100);\nConsole.WriteLine(pig.Count);',
            answers: ['600'],
            hint: 'Put 안의 if 를 잘 보세요',
            explain: '-300 은 저금통이 스스로 막아요(n > 0 일 때만 넣음). 500 + 100 = 600. 이게 캡슐화가 지켜 주는 규칙이에요.',
        },
    ],
    3: [
        {
            kind: 'blank',
            prompt: '고양이가 동물을 상속하고, "울기" 를 야옹으로 바꿔 끼워요. 빈칸을 채워 보세요.',
            code: 'class Animal\n{\n    public [[1]] void Cry() => Console.WriteLine("...");\n}\n\nclass Cat [[2]] Animal\n{\n    public [[3]] void Cry() => Console.WriteLine("야옹");\n}',
            blanks: [
                { answers: ['virtual'], hint: '부모가 "바꿔도 돼" 하고 허락하는 말' },
                { answers: [':'], hint: 'C# 에서 상속을 나타내는 기호 하나' },
                { answers: ['override'], hint: '자식이 부모 메서드를 바꿔 끼우는 말' },
            ],
            explain: 'C# 은 부모가 virtual 로 허락하고, 자식이 override 로 바꿔 끼워요. 상속은 class Cat : Animal 처럼 콜론(:)으로 써요. Java 라면 extends 예요.',
        },
        {
            kind: 'output',
            prompt: 'new(숨기기)와 override(바꿔 끼우기)가 섞여 있어요. 세 줄이 나와요.',
            code: 'class Parent\n{\n    public void Hello() => Console.WriteLine("Parent");\n    public virtual void Cry() => Console.WriteLine("...");\n}\nclass Dog : Parent\n{\n    public new void Hello() => Console.WriteLine("Dog");\n    public override void Cry() => Console.WriteLine("멍멍");\n}\n\nParent p = new Dog();\np.Hello();\np.Cry();\nDog d = new Dog();\nd.Hello();',
            answers: ['Parent\n멍멍\nDog'],
            hint: '변수 타입이 Parent 일 때 new 는 부모 것, override 는 자식 것',
            explain: 'p 는 Parent 상자라서 숨기기(new)한 Hello 는 부모 것 "Parent". Cry 는 override 라 진짜 물건(Dog)의 "멍멍". d 는 Dog 상자라 "Dog" 예요.',
        },
    ],
    4: [
        {
            kind: 'blank',
            prompt: '상자 안 몬스터가 슬라임인지 확인하고 꺼내요. 고블린이 아니면 null 이 되게 해요.',
            code: 'Monster m = GetMonster();\n\nif (m [[1]] Slime slime)\n{\n    slime.RunAway();\n}\n\nGoblin? g = m [[2]] Goblin;',
            blanks: [
                { answers: ['is'], hint: '"너 ~ 맞니?" 하고 확인 + 꺼내기를 한 번에' },
                { answers: ['as'], hint: '바꿀 수 없으면 조용히 null' },
            ],
            explain: 'is 는 확인과 꺼내기를 한 번에, as 는 아니면 에러 대신 null 을 줘요. 둘 다 강제 형변환보다 안전해요.',
        },
        {
            kind: 'output',
            prompt: '동물원 친구들에게 "소리 내 봐!" 를 차례로 시켰어요. 한 줄로 무엇이 나올까요?',
            code: 'abstract class Animal { public abstract string Sound(); }\nclass Dog : Animal { public override string Sound() => "멍멍"; }\nclass Cat : Animal { public override string Sound() => "야옹"; }\nclass Duck : Animal { public override string Sound() => "꽥"; }\n\nAnimal[] zoo = { new Dog(), new Cat(), new Duck(), new Dog() };\nforeach (Animal a in zoo)\n{\n    Console.Write(a.Sound() + " ");\n}',
            answers: ['멍멍 야옹 꽥 멍멍'],
            hint: '변수는 모두 Animal 이지만 실제 물건은 각자 달라요',
            explain: '같은 a.Sound() 인데 진짜 물건에 따라 다르게 대답해요. 이게 다형성! 멍멍 야옹 꽥 멍멍.',
        },
    ],
    5: [
        {
            kind: 'blank',
            prompt: '반쯤 만든 설계도(Animal)와 수영 자격증(ISwimmer)을 함께 가진 오리예요. 빈칸을 채워 보세요.',
            code: 'interface ISwimmer { void Swim(); }\n\n[[1]] class Animal\n{\n    public [[2]] void Cry();   // 자식이 꼭 채우기\n}\n\nclass Duck : Animal, [[3]]\n{\n    public override void Cry() => Console.WriteLine("꽥");\n    public void Swim() => Console.WriteLine("첨벙");\n}',
            blanks: [
                { answers: ['abstract'], hint: '직접 new 할 수 없는 "반쯤 만든" 클래스' },
                { answers: ['abstract'], hint: '몸통 없이 "자식이 채워" 하고 비워 둔 메서드' },
                { answers: ['ISwimmer'], hint: '오리가 딴 자격증 이름' },
            ],
            explain: '추상 클래스와 추상 메서드는 둘 다 abstract 예요. 부모 클래스 하나 뒤에 쉼표로 자격증(인터페이스)을 붙여요.',
        },
        {
            kind: 'output',
            prompt: '플레이어로서의 공격과 몬스터로서의 공격을 따로 만들었어요. 두 줄이 나와요.',
            code: 'interface IPlayer { void Attack(); }\ninterface IMonster { void Attack(); }\n\nclass Hybrid : IPlayer, IMonster\n{\n    void IPlayer.Attack() => Console.WriteLine("검");\n    void IMonster.Attack() => Console.WriteLine("발톱");\n}\n\nvar h = new Hybrid();\n((IMonster)h).Attack();\n((IPlayer)h).Attack();',
            answers: ['발톱\n검'],
            hint: '어떤 자격(인터페이스)으로 불렀는지 순서대로 보세요',
            explain: '먼저 몬스터 자격으로 불러서 "발톱", 다음 플레이어 자격으로 "검". 이름이 겹쳐도 명시적 구현으로 따로 동작해요.',
        },
    ],
    6: [
        {
            kind: 'blank',
            prompt: '아이템 이름으로 공격력을 바로 찾는 사물함을 만들어요. 빈칸을 채워 보세요.',
            code: 'var items = new [[1]]<string, int>();\nitems["sword"] = 10;\nitems["shield"] = 5;\n\nif (items.[[2]]("sword", out var power))\n{\n    Console.WriteLine(power);\n}',
            blanks: [
                { answers: ['Dictionary'], hint: '"이름 → 값" 사물함 (Java 는 Map)' },
                { answers: ['TryGetValue'], hint: '"있으면 꺼내 줘, 없으면 false" 메서드' },
            ],
            explain: 'Dictionary 는 키로 바로 찾아서 O(1)! TryGetValue 는 없을 때 에러 대신 false 를 돌려줘서 안전해요.',
        },
        {
            kind: 'output',
            prompt: '접시 쌓기(Stack)와 급식 줄(Queue)에 1, 2, 3 을 차례로 넣고 하나씩 꺼냈어요.',
            code: 'var stack = new Stack<int>();\nstack.Push(1); stack.Push(2); stack.Push(3);\n\nvar queue = new Queue<int>();\nqueue.Enqueue(1); queue.Enqueue(2); queue.Enqueue(3);\n\nConsole.WriteLine(stack.Pop() + " " + queue.Dequeue());',
            answers: ['3 1'],
            hint: 'Stack 은 나중에 넣은 것부터, Queue 는 먼저 넣은 것부터',
            explain: 'Stack(LIFO)은 맨 위 3 이 먼저, Queue(FIFO)는 맨 앞 1 이 먼저 나와요. 그래서 "3 1".',
        },
    ],
    7: [
        {
            kind: 'blank',
            prompt: '값이 같으면 같은 것으로 보는 점(Point)을 한 줄로 만들고, Y 만 바꾼 복사본을 만들어요.',
            code: 'public [[1]] Point(int X, int Y);\n\nvar a = new Point(1, 2);\nvar c = a [[2]] { Y = 9 };\nConsole.WriteLine(c);   // Point { X = 1, Y = 9 }',
            blanks: [
                { answers: ['record'], hint: 'Equals · GetHashCode · ToString 을 자동으로 만들어 주는 말' },
                { answers: ['with'], hint: '"복사해서 이것만 바꿔 줘"' },
            ],
            explain: 'record 는 값 비교 · 예쁜 ToString 을 자동으로 만들어요. with 는 원본은 그대로 두고 바꾼 새 값을 만들어요 (불변!).',
        },
        {
            kind: 'output',
            prompt: '문자열은 불변이에요. 세 줄이 나와요.',
            code: 'string s = "hello";\nstring t = s.ToUpper();\n\nvar sb = new StringBuilder();\nsb.Append("ab");\nsb.Append("cd");\n\nConsole.WriteLine(s);\nConsole.WriteLine(t);\nConsole.WriteLine(sb.ToString().Length);',
            answers: ['hello\nHELLO\n4'],
            hint: 'ToUpper 는 s 를 고칠까요, 새 글자를 줄까요?',
            explain: 'ToUpper 는 새 글자 "HELLO" 를 돌려줄 뿐 s 는 그대로 hello. StringBuilder 에 ab + cd 를 이어 써서 abcd, 길이 4.',
        },
    ],
    8: [
        {
            kind: 'blank',
            prompt: '짝수만 거르고, 제곱으로 바꾸는 LINQ 예요. 빈칸을 채워 보세요.',
            code: 'var numbers = new List<int> { 1, 2, 3, 4, 5, 6 };\n\nvar evenSquares = numbers\n    .[[1]](n => n % 2 == 0)   // 2, 4, 6\n    .[[2]](n => n * n)        // 4, 16, 36\n    .ToList();',
            blanks: [
                { answers: ['Where'], hint: '조건에 맞는 것만 남기기 (거르기)' },
                { answers: ['Select'], hint: '하나하나 다른 모양으로 바꾸기' },
            ],
            explain: 'Where 로 거르고 → Select 로 바꾸고 → ToList 로 지금 바로 계산! 대문자로 시작하는 것도 잊지 마세요.',
        },
        {
            kind: 'output',
            prompt: '숫자 목록에 LINQ 세 가지를 써 봤어요. 세 줄이 나와요.',
            code: 'var nums = new List<int> { 3, 8, 1, 6 };\n\nvar big = nums.Where(n => n > 2).Select(n => n * 2).ToList();\nConsole.WriteLine(string.Join(",", big));\nConsole.WriteLine(nums.Any(n => n > 7));\nConsole.WriteLine(nums.Aggregate(0, (acc, n) => acc + n));',
            answers: ['6,16,12\nTrue\n18', '6,16,12\ntrue\n18'],
            hint: '순서는 그대로 남아요. Any 는 하나라도 있으면 True',
            explain: '2보다 큰 3, 8, 6 을 두 배 → 6,16,12. 7보다 큰 8 이 있으니 True. 다 더하면 3+8+1+6 = 18.',
        },
    ],
    9: [
        {
            kind: 'blank',
            prompt: '없는 칸에 점수를 넣다가 사고가 나요. 사고를 받고, 무조건 뒷정리를 하게 빈칸을 채워 보세요.',
            code: 'try\n{\n    int[] scores = new int[3];\n    scores[5] = 100;\n}\n[[1]] (IndexOutOfRangeException)\n{\n    Console.WriteLine("칸이 없어요");\n}\n[[2]]\n{\n    Console.WriteLine("정리 끝");\n}',
            blanks: [
                { answers: ['catch'], hint: '떨어지는 사고를 받아 주는 그물' },
                { answers: ['finally'], hint: '사고가 나든 안 나든 꼭 하는 뒷정리' },
            ],
            explain: '배열은 0~2번 칸뿐이라 5번에 넣으면 사고! catch 가 받아서 "칸이 없어요", finally 가 "정리 끝" 을 꼭 찍어요.',
        },
        {
            kind: 'output',
            prompt: '6 을 0 으로 나눠 봤어요. 네 줄이 나와요. finally 와 return 의 순서를 잘 생각해 보세요.',
            code: 'static int Divide(int a, int b)\n{\n    try\n    {\n        Console.WriteLine("시작");\n        return a / b;\n    }\n    catch (DivideByZeroException)\n    {\n        Console.WriteLine("0으로 못 나눠요");\n        return -1;\n    }\n    finally\n    {\n        Console.WriteLine("정리");\n    }\n}\n\nConsole.WriteLine(Divide(6, 0));',
            answers: ['시작\n0으로 못 나눠요\n정리\n-1'],
            hint: 'return 을 만나도 함수를 나가기 전에 finally 가 먼저 돌아요',
            explain: '"시작" → 0으로 나누다 사고 → catch 가 "0으로 못 나눠요" 하고 -1 을 돌려주려다 → 나가기 직전 finally "정리" → 바깥에서 -1 을 찍어요.',
        },
    ],
    10: [
        {
            kind: 'blank',
            prompt: '영웅과 아이템을 동시에 받아 오고, 받은 JSON 을 객체로 풀어요. 빈칸을 채워 보세요.',
            code: 'public [[1]] Task LoadAsync()\n{\n    Task<string> a = http.GetStringAsync("/api/hero");\n    Task<string> b = http.GetStringAsync("/api/items");\n    string[] both = [[2]] Task.WhenAll(a, b);\n    var hero = JsonSerializer.[[3]]<HeroDto>(both[0]);\n}',
            blanks: [
                { answers: ['async'], hint: '"이 함수 안에서 기다릴 거예요" 표시' },
                { answers: ['await'], hint: '화면을 멈추지 않고 기다리기' },
                { answers: ['Deserialize'], hint: '글자(JSON) → 객체로 푸는 것' },
            ],
            explain: 'async 함수 안에서 await 로 기다려요. Task.WhenAll 로 둘을 동시에! 받은 글자를 객체로 푸는 건 역직렬화(Deserialize)예요.',
        },
        {
            kind: 'output',
            prompt: '라면 물을 올리고 기다리는 동안 김치를 꺼내요. 네 줄이 어떤 순서로 나올까요?',
            code: 'static async Task<int> CookAsync()\n{\n    Console.WriteLine("물 올림");\n    await Task.Delay(100);   // 물 끓는 중…\n    Console.WriteLine("라면 완성");\n    return 1;\n}\n\nTask<int> cooking = CookAsync();\nConsole.WriteLine("김치 꺼냄");\nawait cooking;\nConsole.WriteLine("먹자!");',
            answers: ['물 올림\n김치 꺼냄\n라면 완성\n먹자!'],
            hint: 'async 함수는 첫 await 까지는 바로 실행되고, 거기서 잠깐 손을 놔요',
            explain: '"물 올림" 까지 바로 하고, 기다리는 동안 손이 비어서 "김치 꺼냄". 물이 끓으면 "라면 완성", 다 기다린 뒤 "먹자!". 이게 비동기예요.',
        },
    ],
    11: [
        {
            kind: 'blank',
            prompt: 'DTO 를 손질해서 깨끗한 Model 로 바꾸는 Mapper(확장 메서드)예요. 빈칸을 채워 보세요.',
            code: 'public static class PokemonMapper\n{\n    public static Pokemon ToModel([[1]] PokemonDto dto) =>\n        new(dto.Id, dto.RawName [[2]] "Unknown", dto.BaseExperience ?? 0);\n}',
            blanks: [
                { answers: ['this'], hint: 'dto.ToModel() 처럼 부를 수 있게 하는 확장 메서드 표시' },
                { answers: ['??'], hint: '"왼쪽이 null 이면 오른쪽" 기호 두 개' },
            ],
            explain: '첫 매개변수 앞 this 가 확장 메서드 표시라서 dto.ToModel() 로 불러요. ?? 는 null 이면 기본값으로 바꿔 주는 손질 도구예요.',
        },
        {
            kind: 'output',
            prompt: '서버에서 포켓몬 두 마리가 왔는데 하나는 비어 있었어요. Mapper 를 거치면 두 줄이 나와요.',
            code: 'var dtos = new List<PokemonDto>\n{\n    new PokemonDto { Id = 25, RawName = "pikachu", BaseExperience = 112 },\n    new PokemonDto { Id = 0, RawName = null, BaseExperience = null },\n};\n\nforeach (var dto in dtos)\n{\n    Pokemon p = dto.ToModel();\n    Console.WriteLine(p.Name + " " + p.Exp);\n}',
            answers: ['pikachu 112\nUnknown 0'],
            hint: '위 빈칸 문제의 Mapper 가 null 을 무엇으로 바꾸나요?',
            explain: '피카츄는 그대로, 빈 데이터는 Mapper 가 이름 "Unknown", 경험치 0 으로 채워요. 그래서 Model 은 언제나 믿고 쓸 수 있어요.',
        },
    ],
    12: [
        {
            kind: 'blank',
            prompt: '단위 테스트를 이야기 순서로 나눠 주석을 달아요. 영어 세 단어로 채워 보세요.',
            code: '[Fact]\npublic void 경험치_250이면_레벨_3()\n{\n    // [[1]]  이런 상황에서\n    int xp = 250;\n\n    // [[2]]  이걸 하면\n    int level = LevelOf(xp);\n\n    // [[3]]  이렇게 돼야 해\n    Assert.Equal(3, level);\n}',
            blanks: [
                { answers: ['Given', 'given'], hint: '준비 (Arrange)' },
                { answers: ['When', 'when'], hint: '실행 (Act)' },
                { answers: ['Then', 'then'], hint: '확인 (Assert)' },
            ],
            explain: 'Given(상황) → When(실행) → Then(확인). 이렇게 나누면 테스트가 이야기처럼 읽혀서 무엇을 시험하는지 한눈에 보여요.',
        },
        {
            kind: 'output',
            prompt: '미네랄 80 과 30 으로 마린 생산을 시도했어요. Result 상자를 열어 보면 두 줄이 나와요.',
            code: 'Result<int, string> Produce(int minerals) =>\n    minerals >= 50\n        ? new Result<int, string>.Success(minerals - 50)\n        : new Result<int, string>.Failure("미네랄 부족");\n\nforeach (int m in new[] { 80, 30 })\n{\n    string msg = Produce(m) switch\n    {\n        Result<int, string>.Success s => "마린 생산! 남은 미네랄 " + s.Data,\n        Result<int, string>.Failure f => "실패: " + f.Error,\n        _ => "?",\n    };\n    Console.WriteLine(msg);\n}',
            answers: ['마린 생산! 남은 미네랄 30\n실패: 미네랄 부족'],
            hint: '80 은 50 이상, 30 은 50 미만',
            explain: '80 은 성공 상자에 80-50=30 이 들어 있고, 30 은 실패 상자에 "미네랄 부족" 쪽지가 들어 있어요. switch 로 상자 종류를 보고 열어요.',
        },
    ],
    13: [
        {
            kind: 'blank',
            prompt: '서비스가 구체 클래스 대신 "콘센트"(인터페이스)에 기대도록 만들어요. 빈칸을 채워 보세요.',
            code: 'public [[1]] IPokemonRepository\n{\n    Task<Pokemon> GetAsync(int id);\n}\n\npublic class PokemonService\n{\n    private readonly IPokemonRepository _repo;\n    public PokemonService([[2]] repo) => _repo = repo;\n}',
            blanks: [
                { answers: ['interface'], hint: '행동 약속(계약)을 정하는 말' },
                { answers: ['IPokemonRepository'], hint: '생성자로 받는 것은 구체 클래스가 아니라…' },
            ],
            explain: '의존 역전(DIP)! 서비스는 IPokemonRepository 라는 콘센트만 알아요. 진짜 저장소든 테스트용 가짜든 꽂기만 하면 돼요.',
        },
        {
            kind: 'output',
            prompt: '가게 코드는 그대로 두고 결제 수단만 바꿔 끼웠어요 (개방-폐쇄). 두 줄이 나와요.',
            code: 'interface IPayment { string Pay(int won); }\nclass Card : IPayment { public string Pay(int won) => "카드 " + won; }\nclass KakaoPay : IPayment { public string Pay(int won) => "카카오 " + won; }\n\nclass Shop\n{\n    private readonly IPayment _pay;\n    public Shop(IPayment pay) => _pay = pay;\n    public void Buy(int won) => Console.WriteLine(_pay.Pay(won));\n}\n\nnew Shop(new Card()).Buy(1000);\nnew Shop(new KakaoPay()).Buy(500);',
            answers: ['카드 1000\n카카오 500'],
            hint: '가게는 어떤 결제가 꽂혔는지만 따라가요',
            explain: '같은 Shop 코드인데 꽂은 결제 수단에 따라 "카드 1000", "카카오 500". 새 결제가 생겨도 Shop 은 안 고치고 클래스만 추가하면 돼요 (OCP + DIP).',
        },
    ],
};
