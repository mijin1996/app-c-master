// 中文翻译 · 面向对象第 1–4 课。练习代码保持原样，代码输出的韩文原样引用。
module.exports = {
    1: {
        title: '类和实例',
        tag: '鲷鱼烧模具和鲷鱼烧',
        story: [
            '类就像鲷鱼烧的模具。只要有一个模具，想烤多少个鲷鱼烧都可以。烤出来的每一个鲷鱼烧就是实例（对象）。',
            '用模具烤鲷鱼烧的命令就是 new。烤的时候说“放红豆”“放奶油”，决定最初样子的就是构造函数（Constructor）。',
            '每个鲷鱼烧都有自己的馅料（实例成员）。但像“今天烤了多少个鲷鱼烧”这样整个店只有一个的值，就是 static（静态成员）。就像大家一起看同一块黑板。',
        ],
        points: [
            '类 = 设计图（模具），实例 = 用 new 做出的真实物品（存在堆内存里）',
            '构造函数 = 创建时设定初始值的特殊函数。this 表示“我自己”',
            '名字相同、只有参数不同的多个构造函数 = 重载（Overload）',
            'static 每个类只有一个。不用 new，直接用类名使用（单例也是“只存在一个”）',
            '命名规则：类用 PascalCase，字段和变量用 camelCase',
        ],
        exampleTitle: 'C# — 构造函数链和对象初始化器',
        exampleCode: 'public class Hero\n{\n    public string Name { get; set; }\n    public int Hp { get; set; }\n\n    public Hero() : this("无名", 100) { }   // 调用另一个构造函数\n    public Hero(string name, int hp)\n    {\n        Name = name;\n        Hp = hp;\n    }\n}\n\nvar a = new Hero();                          // 无名, 100\nvar b = new Hero { Name = "蝙蝠侠", Hp = 200 }; // 对象初始化器',
        quiz: [
            { q: '用鲷鱼烧模具和鲷鱼烧来比喻，“实例”是什么？', options: ['鲷鱼烧模具', '鲷鱼烧店的招牌', '用模具烤出来的每一个鲷鱼烧', '鲷鱼烧食谱'], explain: '类是模具，用 new 烤出来的真实鲷鱼烧是实例。每个鲷鱼烧都有自己的馅料（字段值）。' },
            { q: '运行下面的代码，屏幕上会出现什么？', options: ['2 1', '1 1', '2 2', '1 2'], explain: 'static Total 是大家共用的一块黑板，增加了两次变成 2。Mine 是每个对象各自的，所以 b 的 Mine 是 1。' },
            { q: '最能说明构造函数（Constructor）作用的是？', options: ['删除对象时进行清理', '修改类名', '继承别的类', '对象被创建时设定初始值'], explain: '在用 new 创建的那一刻只调用一次，把“初始状态”设置正确。就是决定放红豆还是奶油的那一刻。' },
            { q: '做出多个名字相同、只有参数个数或类型不同的函数，叫做什么？', options: ['重写（Override）', '重载（Overload）', '封装', '序列化'], explain: '重载是“名字相同，材料不同”，比如 Hero() 和 Hero(string, int)。重写是在继承中重新编写父类的函数，两者不同。' },
            { q: '关于 static 成员，错误的说法是？', options: ['每创建一个实例就会新产生一个', '可以直接用类名使用', '所有实例共用一个', '它在整个程序运行期间都存在，放太多会占用内存'], explain: '会新产生的是实例成员。static 每个类只有一个，所以一直往 static List 里加东西，内存就会越积越多（笔记里讲的内存泄漏！）。' },
        ],
        practice: [
            { prompt: '默认构造函数调用另一个构造函数，再用对象初始化器多烤一个英雄。请填空。', blankHints: ['调用“自己的另一个构造函数”的词', '用模具烤鲷鱼烧的命令'], explain: ': this(...) 的意思是“交给我的另一个构造函数”。而且必须有 new，才能从模具（类）做出真正的鲷鱼烧（实例）。' },
            { prompt: '鲷鱼烧店烤了三个。屏幕上出现两行，是什么？', hint: 'static 是整个店的一块黑板，Filling 是每个鲷鱼烧各自的（팥 = 红豆，슈크림 = 奶油）', explain: 'Made 是 static，是三个共用的黑板。增加了三次，所以是 3。b 的馅料只属于 b，所以是 슈크림（奶油）。' },
        ],
    },
    2: {
        title: '封装（隐藏信息）',
        tag: '小猪存钱罐',
        story: [
            '小猪存钱罐只有一个投币口，肚子是封住的。这样谁也不能打开肚子随便拿钱或放奇怪的东西进去。这就是封装。',
            '在代码里，用 private 把重要的值藏起来，只向外面开放“放入”“查看”这样规定好的口子（方法、属性）。',
            '真正重要的不是隐藏，而是“遵守规则”。如果有人想把年龄设成 -5，存钱罐自己就要说“不行！”并挡住。像这样对象始终遵守的约定叫做不变式。',
        ],
        points: [
            'private = 只有我，protected = 我和子类，public = 所有人，（C#）internal = 同一个项目（程序集）',
            'Getter/Setter（Java）= C# 的属性 { get; set; }',
            'C# 的 init 访问器：只能在创建时赋值，之后不能修改',
            '在 Setter 里检查值，挡住奇怪的值（Tell, Don\'t Ask：让对象自己去做事）',
            '隐藏信息后，即使把内部从数组换成哈希表，外部代码也不用变（分而治之，Divide and Conquer）',
        ],
        exampleTitle: 'C# — 会检查的属性',
        exampleCode: 'public class Person\n{\n    public string Name { get; init; }  // 只在创建时\n    private int _age;\n    public int Age\n    {\n        get => _age;\n        set\n        {\n            if (value < 0) throw new ArgumentException("年龄不能是负数");\n            _age = value;\n        }\n    }\n}',
        quiz: [
            { q: '封装“真正”的目的最合适的是？', options: ['把变量名变短', '机械地给所有变量加上 get/set', '挡住奇怪的值，让对象自己遵守规则', '把代码集中到一个文件里'], explain: '把 get/set 全部敞开，就像把存钱罐的肚子打开一样。关键是检查进来的值，遵守规则（不变式）。' },
            { q: '在 C# 中，下面代码的最后一行会怎样？', options: ['Owner 变成 철수', '出现编译错误', '运行时变成 null', 'Owner 变成 "민지철수"'], explain: 'init 的意思是“只能在创建时赋值”。创建之后想修改，编译器会马上阻止。' },
            { q: '把东西藏起来、只能在同一个类里使用的访问修饰符是？', options: ['public', 'protected', 'internal', 'private'], explain: 'private 是“我房间的抽屉”。protected 子类也能打开，internal 是同一个项目内，public 是谁都可以。' },
            { q: '做银行账户对象时，最好地遵守封装的方法是？', options: ['把 balance 设为 public，在外面随便修改', '把 balance 设为 static', '去掉 balance，每次都重新计算', 'balance 设为 private，在 Deposit(金额) 和 Withdraw(金额) 方法里检查负数和余额不足'], explain: '把钱藏起来，只开放存入、取出的口子（方法）。在口子里检查“不能是负数”“不能取得比余额多”，账户就会自己遵守规则。' },
            { q: '做好封装的好处中，不对的是？', options: ['改变内部数据结构时，外部代码不容易坏', '程序会自动快两倍', '可以在一个地方挡住奇怪的值', '更容易找到 bug 出在哪里'], explain: '封装让代码安全、容易修改，但不是提高速度的魔法。' },
        ],
        practice: [
            { prompt: '一个把年龄藏起来、挡住负数的属性。请填空。', blankHints: ['像我房间的抽屉一样只有我能打开的访问修饰符', '在 set 里称呼“新进来的值”的名字'], explain: '_age 用 private 藏起来，在 set 里把进来的值叫做 value。在入口处检查，奇怪的年龄就绝对进不去。' },
            { prompt: '往小猪存钱罐里放了硬币。里面有多少个？', hint: '仔细看 Put 里面的 if', explain: '-300 被存钱罐自己挡住了（只在 n > 0 时才放入）。500 + 100 = 600。这就是封装守护的规则。' },
        ],
    },
    3: {
        title: '继承和重写',
        tag: '从父母那里继承',
        story: [
            '像“狗是动物”这样，“A 是 B”说得通时就用继承（is-a 关系）。子类继承父类的字段和方法，只添加自己需要的东西。',
            '父类把“叫一声”写成了 "..."，但狗应该叫 "멍멍"（汪汪）吧？子类用自己的方式重新编写父类的方法，就叫重写（Override）。',
            'Java 中所有方法一开始就可以重写（virtual）。C# 正好相反，父类必须用 virtual 允许，子类才能 override。没有允许就用同样的名字，会变成 new（隐藏），用父类类型调用时运行的是父类的方法。',
        ],
        points: [
            '只有“is-a”成立时才用继承。Java extends / C# : 父类',
            '类只能有一个父类（因为菱形问题，禁止多重继承）',
            'Java：默认是虚方法，要阻止用 final / C#：默认不是虚方法，要开放用 virtual + override',
            'C# 的 new 只是隐藏名字 → 用父类类型的变量调用时运行父类方法',
            '阻止继承的关键字：Java final class，C# sealed class。调用父类：Java super / C# base',
        ],
        exampleTitle: 'C# — override 和 new 的区别',
        exampleCode: 'class Parent\n{\n    public void Hello() => Console.WriteLine("Parent");\n    public virtual void Cry() => Console.WriteLine("...");\n}\nclass Dog : Parent\n{\n    public new void Hello() => Console.WriteLine("Dog");\n    public override void Cry() => Console.WriteLine("汪汪");\n}\n\nParent p = new Dog();\np.Hello(); // Parent  (new：隐藏)\np.Cry();   // 汪汪    (override：替换)',
        quiz: [
            { q: '最适合使用继承的关系是？', options: ['猫 — 动物（猫是动物）', '汽车 — 轮子（汽车有轮子）', '学生 — 书包（学生有书包）', '房子 — 地址（房子有地址）'], explain: '“猫是动物”说得通，所以是 is-a。“有”是 has-a，不用继承，而是放进字段里。' },
            { q: '在 C# 中，下面的代码输出什么？（부모 = 父，자식 = 子）', options: ['부모', '부모자식', '자식', '编译错误'], explain: 'virtual + override 是把子类的方法“替换”进父类的位置。即使变量类型是 Parent，真正的对象是 Child，所以输出 "자식"。' },
            { q: '如果上面的代码不用 override 而用 new（public new string Name() => "자식"），并且去掉父类的 virtual，结果是？', options: ['자식', '부모', '运行时出错', '什么都不输出'], explain: 'new 只是遮住名字的“隐藏”。用 Parent 类型的变量调用，就会运行父类的版本。想要多态，一定要用 virtual/override！' },
            { q: 'Java 和 C# 为什么只允许类继承“一个父类”？', options: ['因为内存不够', '因为编译会变慢', '因为没有接口', '因为菱形问题：如果两个父类有同名方法，不知道该用哪一个'], explain: '如果妈妈有“做饭”，爸爸也有“做饭”，该按谁的菜谱做呢？所以类只有一个父类，但可以实现多个接口。' },
            { q: '阻止任何人再继承的 C# 关键字是？', options: ['static', 'virtual', 'sealed', 'abstract'], explain: 'sealed 是“封印！”。Java 中 final class 做同样的事。abstract 正好相反，表示必须继承并完成它。' },
        ],
        practice: [
            { prompt: '猫继承动物，把“叫”替换成 야옹（喵）。请填空。', blankHints: ['父类说“可以修改”时用的词', 'C# 中表示继承的一个符号', '子类替换父类方法时用的词'], explain: 'C# 中父类用 virtual 允许，子类用 override 替换。继承像 class Cat : Animal 这样用冒号（:）表示。Java 中则是 extends。' },
            { prompt: 'new（隐藏）和 override（替换）混在一起。输出三行。', hint: '变量类型是 Parent 时，new 运行父类的，override 运行子类的（멍멍 = 汪汪）', explain: 'p 是 Parent 盒子，所以被隐藏（new）的 Hello 是父类的 "Parent"。Cry 是 override，所以是真正对象（Dog）的 "멍멍"。d 是 Dog 盒子，所以是 "Dog"。' },
        ],
    },
    4: {
        title: '多态和类型转换',
        tag: '同样的话，不同的行动',
        story: [
            '老师只说了一句“大家都出个声！”，狗汪汪叫，猫喵喵叫，鸭子嘎嘎叫。对同一个命令各自用自己的方式回答，这就是多态。',
            '把子类放进父类的盒子（向上转型）总是安全的，因为狗永远是动物。但从“动物”盒子里再拿出“狗”（向下转型）就有风险了。盒子里可能是一只猫！',
            '所以拿出来之前要先问“你真的是狗吗？”。Java 用 instanceof，C# 用 is 和 as。as 不是的话会悄悄返回 null，is 一次完成检查和取出。',
        ],
        points: [
            '多态 = 同样的消息（方法调用），每个对象有不同的行为',
            '向上转型（子 → 父）总是安全 / 向下转型（父 → 子）需要检查',
            'Java：obj instanceof Dog d / C#：obj is Dog d，obj as Dog（失败时为 null）',
            '强制类型转换 (Dog)obj 如果错了，可能因 InvalidCastException 让程序停下来',
            'C# switch 表达式模式匹配：monster switch { Slime s => ..., Goblin g => ..., _ => ... }',
        ],
        exampleTitle: 'C# — 安全地取出',
        exampleCode: 'Monster m = GetMonster();\n\nif (m is Slime slime)      // 检查 + 取出一次完成\n{\n    slime.RunAway();\n}\n\nGoblin? g = m as Goblin;  // 不是就为 null\n\nstring msg = m switch\n{\n    Slime s => "史莱姆逃跑了",\n    Goblin => "哥布林挥舞棍棒",\n    _ => "没见过的怪物",\n};',
        quiz: [
            { q: '最能说明“多态”的是？', options: ['调用同一个方法，根据实际对象的不同而有不同的行为', '在一个类里放很多变量', '给类起很多名字', '把代码分成很多文件'], explain: '一句“出个声！”，狗汪汪，猫喵喵。调用的一方一样，回答却不同。' },
            { q: '下面哪一个总是安全的，不需要另外检查？', options: ['Dog d = (Dog)animal;  （向下转型）', 'Cat c = (Cat)someDog;', 'Animal a = new Dog();  （向上转型）', 'Dog d = (Dog)new Animal();'], explain: '狗永远是动物，所以放进父类盒子总是安全的。反过来取出时，必须检查它真的是那种动物。' },
            { q: '在 C# 中，下面代码的结果是？（비었음 = 空，강아지 = 小狗）', options: ['비었음', '강아지', 'InvalidCastException', '编译错误'], explain: 'as 无法转换时不会报错，而是悄悄返回 null。盒子里放的是文字而不是小狗，所以输出 "비었음"。' },
            { q: '和 Java 的 instanceof 最像的 C# 运算符是？', options: ['new', 'base', 'using', 'is'], explain: 'Java：if (m instanceof Slime s)，C#：if (m is Slime s)。两者都是“你是史莱姆吗？是的话我就叫你 s”。' },
            { q: '推荐用 is 或 as 而不用强制转换 (Dog)animal 的最大原因是？', options: ['字数更少', '出错时程序不会因异常而停下，可以安全地处理', '会用更多内存', '只在 Java 中可用'], explain: '强制转换出错会抛出 InvalidCastException。is 和 as 可以事先决定“不是的话就这样做”，所以很安全。' },
        ],
        practice: [
            { prompt: '检查盒子里的怪物是不是史莱姆并取出。不是哥布林的话就让它变成 null。', blankHints: ['问“你是……吗？”并一次完成检查和取出', '无法转换时悄悄给出 null'], explain: 'is 一次完成检查和取出，as 不报错而是给出 null。两者都比强制转换安全。' },
            { prompt: '让动物园的朋友们依次“出个声！”。一行里会出现什么？', hint: '变量都是 Animal，但真正的对象各不相同（멍멍 汪汪，야옹 喵，꽥 嘎）', explain: '同样是 a.Sound()，真正的对象各自给出不同的回答。这就是多态！멍멍 야옹 꽥 멍멍。' },
        ],
    },
};
