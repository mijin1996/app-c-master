// English translation · OOP lessons 1–4. Practice code stays as in the original, so Korean text the code prints is quoted as-is.
module.exports = {
    1: {
        title: 'Classes and instances',
        tag: 'A fish-bread mould and fish breads',
        story: [
            'A class is like a mould for fish-shaped bread (bungeoppang). With just one mould you can bake as many fish breads as you like. Each fish bread that comes out is an instance (object).',
            'The order that bakes a fish bread from the mould is new. The constructor is where you set its first shape while baking, like "fill it with red bean" or "fill it with custard".',
            'Each fish bread keeps its own filling (instance members). But a value the whole shop has only one of, like "the number of fish breads baked today", is static (a static member). It is like everyone looking at the same single blackboard.',
        ],
        points: [
            'Class = the blueprint (mould), instance = the real thing made with new (it lives in heap memory)',
            'Constructor = a special function that sets the first values when an object is made. this means "myself"',
            'Several constructors with the same name but different parameters = overloading',
            'static exists only once per class. Use it directly with the class name, without new (a singleton also "exists only once")',
            'Naming rules: classes in PascalCase, fields and variables in camelCase',
        ],
        exampleTitle: 'C# — constructor chaining and object initialisers',
        exampleCode: 'public class Hero\n{\n    public string Name { get; set; }\n    public int Hp { get; set; }\n\n    public Hero() : this("Nameless", 100) { }   // call another constructor\n    public Hero(string name, int hp)\n    {\n        Name = name;\n        Hp = hp;\n    }\n}\n\nvar a = new Hero();                          // Nameless, 100\nvar b = new Hero { Name = "Batman", Hp = 200 }; // object initialiser',
        quiz: [
            { q: 'If we compare it to a fish-bread mould and fish breads, what is an "instance"?', options: ['The fish-bread mould', 'The sign of the fish-bread shop', 'Each fish bread baked from the mould', 'The fish-bread recipe book'], explain: 'The class is the mould, and the real fish bread baked with new is the instance. Each fish bread has its own filling (field values).' },
            { q: 'What appears on the screen when this code runs?', options: ['2 1', '1 1', '2 2', '1 2'], explain: 'static Total is one blackboard everyone shares, so it goes up twice to 2. Mine belongs to each object, so b\'s Mine is 1.' },
            { q: 'What best describes the job of a constructor?', options: ['It cleans up when an object is deleted', 'It changes the class name', 'It inherits from another class', 'It sets the first values when an object is made'], explain: 'It is called exactly once, the moment you make an object with new, and sets up its "starting state" correctly. It is the moment you decide red bean or custard.' },
            { q: 'What is it called when you make several functions with the same name that differ only in the number or types of parameters?', options: ['Override', 'Overload', 'Encapsulation', 'Serialisation'], explain: 'Overloading is "same name, different ingredients", like Hero() and Hero(string, int). Overriding is rewriting a parent function through inheritance, which is different.' },
            { q: 'Which statement about static members is wrong?', options: ['A new one is created every time an instance is made', 'You can use it directly with the class name', 'All instances share one', 'It stays for the whole program, so putting too much in it takes up memory'], explain: 'Instance members are the ones created anew. static exists only once per class, so if you keep adding to a static List, memory keeps piling up (the memory-leak story from the notes!).' },
        ],
        practice: [
            { prompt: 'The default constructor calls another constructor, and an object initialiser bakes one more hero. Fill in the blanks.', blankHints: ['The word that calls "another constructor of myself"', 'The order that bakes a fish bread from the mould'], explain: ': this(...) means "I will leave it to my other constructor". And you need new to make a real fish bread (instance) from the mould (class).' },
            { prompt: 'The fish-bread shop baked three. Two lines appear on the screen. What are they?', hint: 'static is the one blackboard for the whole shop; Filling belongs to each fish bread (팥 = red bean, 슈크림 = custard)', explain: 'Made is static, so it is a blackboard all three share. It went up three times, so 3. b\'s filling belongs only to b, so it is 슈크림 (custard).' },
        ],
    },
    2: {
        title: 'Encapsulation (hiding information)',
        tag: 'A piggy bank',
        story: [
            'A piggy bank has only a slot for coins, and its belly is closed. That way nobody can open its belly to take money out as they like or put strange things in. This is encapsulation.',
            'In code we hide important values with private and open only fixed slots (methods, properties) such as "put in" and "look" to the outside.',
            'What really matters is not hiding but "keeping the rules". If someone tries to set an age of -5, the piggy bank itself must say "No!" and stop it. A promise an object always keeps like this is called an invariant.',
        ],
        points: [
            'private = only me, protected = me and my children, public = everyone, (C#) internal = the same project (assembly)',
            'Getter/Setter (Java) = C# properties { get; set; }',
            'The C# init accessor: you can set the value only when creating the object, and never change it afterwards',
            'Check the value inside the setter to block strange values (Tell, Don\'t Ask: tell the object to do the work)',
            'Hiding information means you can change the inside from an array to a hash map and the outside code stays the same (Divide and Conquer)',
        ],
        exampleTitle: 'C# — a property that checks values',
        exampleCode: 'public class Person\n{\n    public string Name { get; init; }  // only when creating\n    private int _age;\n    public int Age\n    {\n        get => _age;\n        set\n        {\n            if (value < 0) throw new ArgumentException("Age cannot be negative");\n            _age = value;\n        }\n    }\n}',
        quiz: [
            { q: 'What is the "real" purpose of encapsulation?', options: ['Making variable names short', 'Mechanically adding get/set to every variable', 'Blocking strange values so the object keeps its own rules', 'Putting all code into one file'], explain: 'Leaving every get/set open is like leaving the piggy bank\'s belly open. The key is checking incoming values so the rules (invariants) are kept.' },
            { q: 'In C#, what happens on the last line of this code?', options: ['Owner changes to 철수', 'A compile error occurs', 'It becomes null while running', 'Owner becomes "민지철수"'], explain: 'init means "you can only set it while creating". If you try to change it afterwards, the compiler stops you right away.' },
            { q: 'Which access modifier hides something so only the same class can use it?', options: ['public', 'protected', 'internal', 'private'], explain: 'private is "the drawer in my room". protected can be opened by children too, internal within the same project, and public by anyone.' },
            { q: 'When making a bank account object, which way keeps encapsulation best?', options: ['Leave balance public and change it freely from outside', 'Make balance static', 'Remove balance and calculate it every time', 'Keep balance private and check for negative amounts and insufficient funds inside Deposit(amount) and Withdraw(amount) methods'], explain: 'Hide the money and open only the put-in and take-out slots (methods). Checking "no negatives" and "you cannot take out more than the balance" inside them makes the account keep its own rules.' },
            { q: 'Which is NOT a benefit of good encapsulation?', options: ['Changing the inner data structure breaks less of the outside code', 'The program automatically becomes twice as fast', 'You can block strange values in one place', 'It becomes easier to find where a bug came from'], explain: 'Encapsulation makes code safe and easy to fix; it is not magic that raises speed.' },
        ],
        practice: [
            { prompt: 'A property that hides the age and blocks negative values. Fill in the blanks.', blankHints: ['The access modifier that only I can open, like the drawer in my room', 'The name for "the newly incoming value" inside set'], explain: '_age is hidden with private, and inside set the incoming value is called value. Because it is checked at the entrance, a strange age can never get in.' },
            { prompt: 'Coins were put into the piggy bank. How many are inside?', hint: 'Look carefully at the if inside Put', explain: 'The piggy bank blocks -300 by itself (it only adds when n > 0). 500 + 100 = 600. This is the rule encapsulation protects.' },
        ],
    },
    3: {
        title: 'Inheritance and overriding',
        tag: 'Inheriting from a parent',
        story: [
            'When "A is a B" makes sense, as in "a dog is an animal", use inheritance (an is-a relationship). The child class inherits the parent\'s fields and methods and adds only what it needs.',
            'If the parent made "cry" just print "...", a dog should cry "멍멍" (woof), right? A child rewriting a parent method in its own way is called overriding.',
            'In Java every method can be rewritten (is virtual) from the start. C# is the opposite: the parent must allow it with virtual before a child can override it. Using the same name without permission becomes new (hiding), and calling it through the parent type runs the parent\'s version.',
        ],
        points: [
            'Use inheritance only when "is-a" fits. Java extends / C# : Parent',
            'A class has only one parent (multiple inheritance is banned because of the diamond problem)',
            'Java: virtual by default, use final to block / C#: non-virtual by default, open with virtual + override',
            'C# new only hides the name → calling through a parent-type variable runs the parent method',
            'Keywords that block inheritance: Java final class, C# sealed class. Calling the parent: Java super / C# base',
        ],
        exampleTitle: 'C# — the difference between override and new',
        exampleCode: 'class Parent\n{\n    public void Hello() => Console.WriteLine("Parent");\n    public virtual void Cry() => Console.WriteLine("...");\n}\nclass Dog : Parent\n{\n    public new void Hello() => Console.WriteLine("Dog");\n    public override void Cry() => Console.WriteLine("Woof");\n}\n\nParent p = new Dog();\np.Hello(); // Parent  (new: hiding)\np.Cry();   // Woof    (override: swapping in)',
        quiz: [
            { q: 'Which relationship fits inheritance best?', options: ['Cat — animal (a cat is an animal)', 'Car — wheel (a car has wheels)', 'Student — bag (a student has a bag)', 'House — address (a house has an address)'], explain: '"A cat is an animal" makes sense, so it is is-a. "Has" is has-a, so you put it in a field instead of inheriting.' },
            { q: 'In C#, what does this code print? (부모 = parent, 자식 = child)', options: ['부모', '부모자식', '자식', 'Compile error'], explain: 'virtual + override "swaps" the child method into the parent\'s slot. Even though the variable type is Parent, the real object is a Child, so "자식" is printed.' },
            { q: 'If the code above uses new instead of override (public new string Name() => "자식") and the parent\'s virtual is also removed, what is the result?', options: ['자식', '부모', 'An error while running', 'Nothing is printed'], explain: 'new is "hiding" that only covers the name. Calling through a Parent-type variable runs the parent\'s version. If you want polymorphism, always use virtual/override!' },
            { q: 'Why do Java and C# allow a class to inherit from "only one parent"?', options: ['Because there is not enough memory', 'Because compiling gets slow', 'Because there are no interfaces', 'Because of the diamond problem: if two parents have methods with the same name, it is unclear which to use'], explain: 'If mum has "cook" and dad has "cook" too, whose recipe do you follow? So a class has one parent, but it can implement several interfaces.' },
            { q: 'Which C# keyword stops anyone from inheriting any further?', options: ['static', 'virtual', 'sealed', 'abstract'], explain: 'sealed means "Sealed!". In Java final class does the same. abstract is the opposite: it means you must inherit and complete it.' },
        ],
        practice: [
            { prompt: 'A cat inherits from animal and swaps "cry" for 야옹 (meow). Fill in the blanks.', blankHints: ['The word the parent uses to allow "you may change this"', 'The one symbol that shows inheritance in C#', 'The word a child uses to swap in a parent method'], explain: 'In C# the parent allows it with virtual and the child swaps it in with override. Inheritance is written with a colon (:), as in class Cat : Animal. In Java it would be extends.' },
            { prompt: 'new (hiding) and override (swapping in) are mixed. Three lines appear.', hint: 'When the variable type is Parent, new runs the parent\'s and override runs the child\'s (멍멍 = woof)', explain: 'p is a Parent box, so the hidden (new) Hello is the parent\'s "Parent". Cry is overridden, so it is the real object\'s (Dog) "멍멍". d is a Dog box, so "Dog".' },
        ],
    },
    4: {
        title: 'Polymorphism and casting',
        tag: 'Same words, different actions',
        story: [
            'The teacher says just one thing, "Everyone, make a sound!", and the dog goes woof, the cat goes meow and the duck goes quack. Each answering the same command in its own way is polymorphism.',
            'Putting a child into a parent box (upcasting) is always safe, because a dog is always an animal. But taking a "dog" back out of an "animal" box (downcasting) is risky. There might be a cat in the box!',
            'So before taking it out, you ask "Are you really a dog?". Java uses instanceof, and C# uses is and as. as quietly returns null if it is not, and is checks and takes it out in one go.',
        ],
        points: [
            'Polymorphism = the same message (method call), different behaviour for each object',
            'Upcasting (child → parent) is always safe / downcasting (parent → child) needs a check',
            'Java: obj instanceof Dog d / C#: obj is Dog d, obj as Dog (null if it fails)',
            'A forced cast (Dog)obj can stop the program with an InvalidCastException if it is wrong',
            'C# switch expression pattern matching: monster switch { Slime s => ..., Goblin g => ..., _ => ... }',
        ],
        exampleTitle: 'C# — taking things out safely',
        exampleCode: 'Monster m = GetMonster();\n\nif (m is Slime slime)      // check + take out in one go\n{\n    slime.RunAway();\n}\n\nGoblin? g = m as Goblin;  // null if not\n\nstring msg = m switch\n{\n    Slime s => "The slime runs away",\n    Goblin => "The goblin swings its club",\n    _ => "A monster I have never seen",\n};',
        quiz: [
            { q: 'What best explains "polymorphism"?', options: ['Calling the same method behaves differently depending on the real object', 'Having many variables in one class', 'Giving a class many names', 'Splitting code into many files'], explain: 'One "Make a sound!" and the dog says woof while the cat says meow. The caller is the same, but the answers differ.' },
            { q: 'Which of these is always safe and needs no check?', options: ['Dog d = (Dog)animal;  (downcasting)', 'Cat c = (Cat)someDog;', 'Animal a = new Dog();  (upcasting)', 'Dog d = (Dog)new Animal();'], explain: 'A dog is always an animal, so putting it into a parent box is always safe. When taking it back out, you must check it really is that animal.' },
            { q: 'In C#, what is the result of this code? (비었음 = empty, 강아지 = dog)', options: ['비었음', '강아지', 'InvalidCastException', 'Compile error'], explain: 'as quietly returns null instead of an error when it cannot convert. The box held text, not a dog, so it prints "비었음".' },
            { q: 'Which C# operator is most like Java\'s instanceof?', options: ['new', 'base', 'using', 'is'], explain: 'Java: if (m instanceof Slime s), C#: if (m is Slime s). Both mean "Are you a slime? If so, I will call you s".' },
            { q: 'What is the main reason to prefer is or as over a forced cast (Dog)animal?', options: ['They have fewer letters', 'When it is wrong, the program does not stop with an exception and you can handle it safely', 'They use more memory', 'They only work in Java'], explain: 'A wrong forced cast throws an InvalidCastException. With is and as you can decide in advance "if not, do this", so they are safe.' },
        ],
        practice: [
            { prompt: 'Check whether the monster in the box is a slime and take it out. Make it become null if it is not a goblin.', blankHints: ['Asks "Are you a ...?" and takes it out in one go', 'Quietly gives null if it cannot convert'], explain: 'is checks and takes out in one go, and as gives null instead of an error. Both are safer than a forced cast.' },
            { prompt: 'The zoo friends were told one after another, "Make a sound!". What appears on one line?', hint: 'The variables are all Animal, but the real objects are different (멍멍 woof, 야옹 meow, 꽥 quack)', explain: 'It is the same a.Sound(), but each real object answers differently. That is polymorphism! 멍멍 야옹 꽥 멍멍.' },
        ],
    },
};
