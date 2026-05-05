

# 事件循环

## 浏览器的进程模型

### 何为进程？

程序运行需要有它自己专属的内存空间，可以把这块内存空间简单的理解为进程

<img src="http://mdrs.yuanjin.tech/img/202208092057573.png" alt="image-20220809205743532" style="zoom:50%;" />

每个应用至少有一个进程，进程之间相互独立，即使要通信，也需要双方同意。

### 何为线程？

有了进程后，就可以运行程序的代码了。

运行代码的「人」称之为「线程」。

一个进程至少有一个线程，所以在进程开启后会自动创建一个线程来运行代码，该线程称之为主线程。

如果程序需要同时执行多块代码，主线程就会启动更多的线程来执行代码，所以一个进程中可以包含多个线程。

![image-20220809210859457](http://mdrs.yuanjin.tech/img/202208092108499.png)

### 浏览器有哪些进程和线程？

**浏览器是一个多进程多线程的应用程序**

浏览器内部工作极其复杂。

为了避免相互影响，为了减少连环崩溃的几率，当启动浏览器后，它会自动启动多个进程。

![image-20220809213152371](http://mdrs.yuanjin.tech/img/202208092131410.png)

> 可以在浏览器的任务管理器中查看当前的所有进程

其中，最主要的进程有：

1. 浏览器进程

   主要负责界面显示、用户交互、子进程管理等。浏览器进程内部会启动多个线程处理不同的任务。

2. 网络进程

   负责加载网络资源。网络进程内部会启动多个线程来处理不同的网络任务。

3. **渲染进程**（本节课重点讲解的进程）

   渲染进程启动后，会开启一个**渲染主线程**，主线程负责执行 HTML、CSS、JS 代码。

   默认情况下，浏览器会为每个标签页开启一个新的渲染进程，以保证不同的标签页之间不相互影响。

   > 将来该默认模式可能会有所改变，有兴趣的同学可参见[chrome官方说明文档](https://chromium.googlesource.com/chromium/src/+/main/docs/process_model_and_site_isolation.md#Modes-and-Availability)

## 渲染主线程是如何工作的？

渲染主线程是浏览器中最繁忙的线程，需要它处理的任务包括但不限于：

- 解析 HTML
- 解析 CSS
- 计算样式
- 布局
- 处理图层
- 每秒把页面画 60 次
- 执行全局 JS 代码
- 执行事件处理函数
- 执行计时器的回调函数
- ......

> 思考题：为什么渲染进程不适用多个线程来处理这些事情？

要处理这么多的任务，主线程遇到了一个前所未有的难题：如何调度任务？

比如：

- 我正在执行一个 JS 函数，执行到一半的时候用户点击了按钮，我该立即去执行点击事件的处理函数吗？
- 我正在执行一个 JS 函数，执行到一半的时候某个计时器到达了时间，我该立即去执行它的回调吗？
- 浏览器进程通知我“用户点击了按钮”，与此同时，某个计时器也到达了时间，我应该处理哪一个呢？
- ......

渲染主线程想出了一个绝妙的主意来处理这个问题：排队

![image-20220809223027806](http://mdrs.yuanjin.tech/img/202208092230847.png)

1. 在最开始的时候，渲染主线程会进入一个无限循环
2. 每一次循环会检查消息队列中是否有任务存在。如果有，就取出第一个任务执行，执行完一个后进入下一次循环；如果没有，则进入休眠状态。
3. 其他所有线程（包括其他进程的线程）可以随时向消息队列添加任务。新任务会加到消息队列的末尾。在添加新任务时，如果主线程是休眠状态，则会将其唤醒以继续循环拿取任务

这样一来，就可以让每个任务有条不紊的、持续的进行下去了。

**整个过程，被称之为事件循环（消息循环）**

## 若干解释

### 何为异步？

代码在执行过程中，会遇到一些无法立即处理的任务，比如：

- 计时完成后需要执行的任务 —— `setTimeout`、`setInterval`
- 网络通信完成后需要执行的任务 -- `XHR`、`Fetch`
- 用户操作后需要执行的任务 -- `addEventListener`

如果让渲染主线程等待这些任务的时机达到，就会导致主线程长期处于「阻塞」的状态，从而导致浏览器「卡死」

![image-20220810104344296](http://mdrs.yuanjin.tech/img/202208101043348.png)

**渲染主线程承担着极其重要的工作，无论如何都不能阻塞！**

因此，浏览器选择**异步**来解决这个问题

![image-20220810104858857](http://mdrs.yuanjin.tech/img/202208101048899.png)

使用异步的方式，**渲染主线程永不阻塞**

> 面试题：如何理解 JS 的异步？
>
> 
>
> 参考答案：
>
> JS是一门单线程的语言，这是因为它运行在浏览器的渲染主线程中，而渲染主线程只有一个。
>
> 而渲染主线程承担着诸多的工作，渲染页面、执行 JS 都在其中运行。
>
> 如果使用同步的方式，就极有可能导致主线程产生阻塞，从而导致消息队列中的很多其他任务无法得到执行。这样一来，一方面会导致繁忙的主线程白白的消耗时间，另一方面导致页面无法及时更新，给用户造成卡死现象。
>
> 所以浏览器采用异步的方式来避免。具体做法是当某些任务发生时，比如计时器、网络、事件监听，主线程将任务交给其他线程去处理，自身立即结束任务的执行，转而执行后续代码。当其他线程完成时，将事先传递的回调函数包装成任务，加入到消息队列的末尾排队，等待主线程调度执行。
>
> 在这种异步模式下，浏览器永不阻塞，从而最大限度的保证了单线程的流畅运行。

### JS为何会阻碍渲染？

先看代码

```html
<h1>Mr.Yuan is awesome!</h1>
<button>change</button>
<script>
  var h1 = document.querySelector('h1');
  var btn = document.querySelector('button');

  // 死循环指定的时间
  function delay(duration) {
    var start = Date.now();
    while (Date.now() - start < duration) {}
  }

  btn.onclick = function () {
    h1.textContent = '袁老师很帅！';
    delay(3000);
  };
</script>
```

点击按钮后，会发生什么呢？

<见具体演示>

### 任务有优先级吗？

任务没有优先级，在消息队列中先进先出

但**消息队列是有优先级的**

根据 W3C 的最新解释:

- 每个任务都有一个任务类型，同一个类型的任务必须在一个队列，不同类型的任务可以分属于不同的队列。
  在一次事件循环中，浏览器可以根据实际情况从不同的队列中取出任务执行。
- 浏览器必须准备好一个微队列，微队列中的任务优先所有其他任务执行
  https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint

> 随着浏览器的复杂度急剧提升，W3C 不再使用宏队列的说法

在目前 chrome 的实现中，至少包含了下面的队列：

- 延时队列：用于存放计时器到达后的回调任务，优先级「中」
- 交互队列：用于存放用户操作后产生的事件处理任务，优先级「高」
- 微队列：用户存放需要最快执行的任务，优先级「最高」

> 添加任务到微队列的主要方式主要是使用 Promise、MutationObserver
>
> 
>
> 例如：
>
> ```js
> // 立即把一个函数添加到微队列
> Promise.resolve().then(函数)
> ```

> 浏览器还有很多其他的队列，由于和我们开发关系不大，不作考虑

> 面试题：阐述一下 JS 的事件循环
>
> 
>
> 参考答案：
>
> 事件循环又叫做消息循环，是浏览器渲染主线程的工作方式。
>
> 在 Chrome 的源码中，它开启一个不会结束的 for 循环，每次循环从消息队列中取出第一个任务执行，而其他线程只需要在合适的时候将任务加入到队列末尾即可。
>
> 过去把消息队列简单分为宏队列和微队列，这种说法目前已无法满足复杂的浏览器环境，取而代之的是一种更加灵活多变的处理方式。
>
> 根据 W3C 官方的解释，每个任务有不同的类型，同类型的任务必须在同一个队列，不同的任务可以属于不同的队列。不同任务队列有不同的优先级，在一次事件循环中，由浏览器自行决定取哪一个队列的任务。但浏览器必须有一个微队列，微队列的任务一定具有最高的优先级，必须优先调度执行。

> 面试题：JS 中的计时器能做到精确计时吗？为什么？
>
> 
>
> 参考答案：
>
> 不行，因为：
>
> 1. 计算机硬件没有原子钟，无法做到精确计时
> 2. 操作系统的计时函数本身就有少量偏差，由于 JS 的计时器最终调用的是操作系统的函数，也就携带了这些偏差
> 3. 按照 W3C 的标准，浏览器实现计时器时，如果嵌套层级超过 5 层，则会带有 4 毫秒的最少时间，这样在计时时间少于 4 毫秒时又带来了偏差
> 4. 受事件循环的影响，计时器的回调函数只能在主线程空闲时运行，因此又带来了偏差

# 数组

## for-of 循环

ES6提供了一种爽翻天的方式遍历各种数组和伪数组

示例1：

```js
const arr = ['a', 'b', 'c']
// 过去的方式——垃圾
for(let i = 0; i < arr.length; i++){
  const item = arr[i]
  console.log(item)
}

// for of 的方式，结果一样
for(const item of arr){
  console.log(item)
}
```



示例2:

```js
const elements = document.querySelectorAll('.item');
// for of 的方式
for(const elem of elements){
  // elem 为获取到的每一个元素
}
```



## 新增API

| API                                                          | 作用                                                     | 图示                                                         |
| ------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------ |
| [Array.isArray(target)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray) | 判断target是否为一个数组                                 |                                                              |
| [Array.from(source)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/from) | 将某个伪数组source转换为一个真数组返回                   |                                                              |
| [Array.prototype.fill(n)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/fill) | 将数组的某些项设置为n                                    | <img src="http://mdrs.yuanjin.tech/img/20210602165516.png" alt="image-20210602165515908" style="zoom:50%;" /> |
| [Array.prototype.forEach(fn)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach) | 遍历数组，传入一个函数，每次遍历会运行该函数             | <img src="http://mdrs.yuanjin.tech/img/20210602165832.png" alt="image-20210602165832725" style="zoom:50%;" /> |
| [Array.prototype.map(fn)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/map) | 数组映射，传入一个函数，映射数组中的每一项               | <img src="http://mdrs.yuanjin.tech/img/20210602170025.png" alt="image-20210602170025141" style="zoom:50%;" /> |
| [Array.prototype.filter(fn)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) | 数组筛选，传入一个函数，仅保留满足条件的项               | <img src="http://mdrs.yuanjin.tech/img/20210602170149.png" alt="image-20210602170149489" style="zoom:50%;" /> |
| [Array.prototype.reduce(fn)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce) | 数组聚合，传入一个函数，对数组每一项按照该函数的返回聚合 | <img src="http://mdrs.yuanjin.tech/img/20210602170451.png" alt="image-20210602170451299" style="zoom:50%;" /> |
| [Array.prototype.some(fn)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/some) | 传入一个函数，判断数组中是否有至少一个通过该函数测试的项 | <img src="http://mdrs.yuanjin.tech/img/20210602171403.png" alt="image-20210602171403455" style="zoom:50%;" /> |
| [Array.prototype.every(fn)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/every) | 传入一个函数，判断数组中是否所有项都能通过该函数的测试   | <img src="http://mdrs.yuanjin.tech/img/20210602171441.png" alt="image-20210602171441468" style="zoom:50%;" /> |
| [Array.prototype.find(fn)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/find) | 传入一个函数，找到数组中第一个能通过该函数测试的项       | <img src="http://mdrs.yuanjin.tech/img/20210602171510.png" alt="image-20210602171510075" style="zoom:50%;" /> |
| [Array.prototype.includes(item)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/includes) | 判断数组中是否存在item，判定规则使用的是`Object.is`      | <img src="http://mdrs.yuanjin.tech/img/20210602170615.png" alt="image-20210602170615564" style="zoom:50%;" /> |
|                                                              |                                                          |                                                              |

# 对象

## 对象成员速写

在某些场景下，ES6提供了一种更加简洁的方式书写对象成员

示例1：

```js
const name = 'monica', age = 17;
const sayHello = function(){
  console.log(`my name is ${this.name}`);
}
// 过去的方式
const user = {
  name: name,
  age: age,
  sayHello: sayHello
}

// 速写
const user = {
  name,
  age,
  sayHello
}
```

示例2：

```js
// 过去的方式
const MyMath = {
  sum: function(a, b){
    //...
  },
  random: function(min, max){
    //...
  }
}

// 速写
const MyMath = {
  sum(a, b){
    // ...
  },
  random(min, max){
    // ...
  }
}
```

## 解构

ES6提供了一种特殊的语法，通过该语法，可以轻松的从数组或对象中取出想要的部分

示例1：

```js
const user = {
  name: 'monica',
  age: 17,
  addr: {
    province: '黑龙江',
    city: '哈尔滨'
  }
}

// 取出 user 中的 name 和 age
const { name, age } = user;
console.log(name, age); //  monica 17

// 取出 user 中的 city
const { addr: { city } } = user
console.log(city); //  哈尔滨
```

示例2：

```js
const arr = [1, 2, 3, 4]
// 取出数组每一项的值，分别放到变量a、b、c、d中
const [a, b, c, d] = arr;
// 仅取出数组下标1、2的值
const [, a, b] = arr; 
// 仅取出数组下标1、3的值
const [, a, , b] = arr;
// 取出数组前两位的值，放到变量a和b中，剩下的值放到一个新数组arr2中
const [a, b, ...arr2] = arr;
```

示例3：

```js
let a = 1, b = 2;
// 交换两个变量
[b, a] = [a, b]
```

示例4：

```js
// 在参数位置对传入的对象进行解构
function method({a, b}){
  console.log(a, b)
}
const obj = {
  a:1,
  b:2,
  c:3
}
method(obj); // 1 2
```

示例5：

```js
// 箭头函数也可以在参数位置进行解构
const method = ({a, b}) => {
  console.log(a, b)
}
const obj = {
  a:1,
  b:2,
  c:3
}
method(obj); // 1 2
```

示例6：

```js
const users = [
  {name:'monica', age:17},
  {name:'邓哥', age:70}
]
// 在遍历时进行解构
for(const {name, age} of users){
  console.log(name, age)
}
```

## 展开运算符

示例1：

```js
const arr = [3, 6, 1, 7, 2];
// 对数组的展开
Math.max(...arr); // 相当于：Math.max(3, 6, 1, 7, 2)
```

示例2：

```js
const o1 = {
  a: 1, 
  b: 2,
}
const o2 = {
  a: 3, 
  c: 4,
}
// 对对象的展开
const o3 = {
  ...o1,
  ...o2
}
/*
	o3：{
		a: 3,
		b: 2,
		c: 4
	}
*/
```

示例3：

```js
const arr = [2,3,4];
const arr2 = [1, ...arr, 5]; // [1,2,3,4,5]
```

示例4：

```js
const user = {
  name: 'monica',
  age: 17
}
const user2 = {
  ...user,
  name: '邓哥'
}
// user2: { name:'邓哥', age: 17 }
```

## 属性描述符

对于对象中的每个成员，JS使用属性描述符来描述它们

```js
const user = {
  name: 'monica',
  age: 17
}
```

上面的对象，在JS内部被描述为

```js
{
  // 属性 name 的描述符
  name: {
    value: 'monica',
    configurable: true, // 该属性的描述符是否可以被重新定义
    enumerable: true, // 该属性是否允许被遍历，会影响for-in循环
    writable: true // 该属性是否允许被修改
  },
  // 属性 age 的描述符
  age: {
    value: 'monica',
    configurable: true, // 该属性的描述符是否可以被重新定义
    enumerable: true, // 该属性是否允许被遍历，会影响for-in循环
    writable: true // 该属性是否允许被修改
  },
}
```

ES5提供了一系列的API，针对属性描述符进行操作

1. `Object.getOwnPropertyDescriptor(obj, propertyName)`

   该方法用于获取一个属性的描述符

   ```js
   const user = {
     name: 'monica',
     age: 17
   }
   
   Object.getOwnPropertyDescriptor(user, 'name');
   /*
   {
       value: 'monica',
       configurable: true, // 该属性的描述符是否可以被重新定义
       enumerable: true, // 该属性是否允许被遍历，会影响for-in循环
       writable: true // 该属性是否允许被修改
   }
   */
   ```

2. `Object.defineProperty(obj, propertyName, descriptor)`

   该方法用于定义某个属性的描述符

   ```js
   const user = {
     name: 'monica',
     age: 17
   };
   
   Object.defineProperty(obj, 'name', {
     value: '邓哥', // 将其值进行修改
     enumerable: false, // 让该属性不能被遍历
     writable: false // 让该属性无法被重新赋值
   })
   ```

### getter 和 setter

属性描述符中有两个特殊的配置，分别为`get`和`set`，通过它们，可以把属性的取值和赋值变为方法调用

```js
const obj = {};
Object.defineProperty(obj, 'a', {
  get(){ // 读取属性a时，得到的是该方法的返回值
    return 1;
  },
  set(val){ // 设置属性a时，会把值传入val，调用该方法
    console.log(val)
  }
})

console.log(obj.a); // 输出：1
obj.a = 3; // 输出：3
console.log(obj.a); // 输出：1
```

## 键值对

`Object.keys(obj)`：获取对象的属性名组成的数组

`Object.values(obj)`：获取对象的值组成的数组

`Object.entries(obj)`：获取对象属性名和属性值组成的数组

`Object.fromEntries(entries)`：将属性名和属性值的数组转换为对象

示例：

```js
const user = {
  name: 'monica',
  age: 17
}
Object.keys(user); // ["name", "age"]
Object.values(user); // ["monica", 17]
Object.entries(user); // [ ["name", "monica"], ["age", 17] ]
Object.fromEntries([ ["name", "monica"], ["age", 17] ]); // {name:'monica', age:17}
```

## 冻结

使用`Object.freeze(obj)`可以冻结一个对象，该对象的所有属性均不可更改

```js
const obj = {
  a: 1,
  b: {
    c: 3,
  },
};

Object.freeze(obj); //  冻结对象obj

obj.a = 2; // 不报错，代码无效
obj.k = 4; // 不报错，代码无效
delete obj.a; // 不报错，代码无效
obj.b = 5; // 不报错，代码无效

obj.b.c = 5; // b对象没有被冻结，有效

console.log(obj); // {a:1, b:{ c: 5 } }
```

可以使用`Object.isFrozen`来判断一个对象是否被冻结

## 相同性判定

`Object.is`方法，可以判断两个值是否相同，它和`===`的功能基本一致，区别在于：

- NaN和NaN相等
- +0和-0不相等

```js
Object.is(1, 2); // false
Object.is("1", 1); // false
Object.is(NaN, NaN); // true
Object.is(+0, -0); // false
```

## Set

[Set MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Set)

ES6新增了Set结构，用于保存唯一值的序列

## Map

[Map MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Map)

ES6新增了Map结构，用于保存键值对的映射，它和对象的最大区别在于：对象的键只能是字符串，而Map的键可以是任何类型

# 函数

## 箭头函数

所有使用**函数表达式**的位置，均可以替换为箭头函数

箭头函数语法：

```js
// 完整语法
(参数列表) => { 函数体 }
// 若有且仅有一个参数
参数 => { 函数体 }
// 若函数体有且仅有一条返回语句
(参数列表) => 返回语句
```

示例1：

```js
const sum = function(a, b) {
  return a + b;
}

// 箭头函数写法
const sum = (a, b) => a + b
```

示例2：

```js
dom.onclick = function(e){
  // ....
}

// 箭头函数写法
dom.onclick = e => {
  // ...
}
```

示例3：

```js
setTimeout(function(){
  // ...
}, 1000)

// 箭头函数写法
setTimeout(() => {
  // ...
}, 1000)
```

箭头函数有以下特点：

1. 不能使用`new`调用

2. 没有原型，即没有`prototype`属性

3. 没有`arugments`

4. 没有`this`

   > 有些教程中会说：箭头函数的`this`永远指向箭头函数定义位置的`this`，因为箭头函数会绑定`this`。
   >
   > 这个说法没错，根本原因是它没有`this`，它里面的`this`使用的是外层的`this`

   ```js
   const counter = {
     count: 0,
     start: function(){
       // 这里的 this 指向 counter
       setInterval(() => {
         // 这里的 this 实际上是 start 函数的 this
         this.count++;
       }, 1000)
     }
   }
   ```

箭头函数的这些特点，都足以说明：**箭头函数特别适用于那些临时需要函数的位置**

> 我们将来会在面试指导阶段对this指向进行总结

## 剩余参数

ES6不建议再使用`arguments`来获取参数列表，它推荐使用剩余参数来收集未知数量的参数

```js
// ...args为剩余参数
function method(a, b, ...args){
  console.log(a, b, args)
}

method(1, 2, 3, 4, 5, 6, 7); // 1 2 [3, 4, 5, 6, 7]
method(1, 2); // 1 2 []
```

**注意，剩余参数只能声明为最后一个参数**

## 参数默认值

ES6提供了参数默认值，当参数没有传递或传递为`undefined`时，会使用默认值

示例1：

```js
// 对参数 b 使用了默认值1
function method(a, b = 1){
  console.log(a, b)
}
method(1, 2); // 1  2
method(1); // 1 1
method(1, undefined); // 1 1
```

示例2：

```js
// 对参数 b 使用了默认值1， 对参数 c 使用默认值2
const method = (a, b = 1, c = 2, d) => {
  console.log(a, b, c, d)
}
method(1, 2); // 1 2 2 undefined
method(1); // 1 1 2 undefined
method(1, undefined, undefined, 4); // 1 1 2 4
```

## 类语法

过去，函数有着两种调用方式：

```js
function A(){}

A(); // 直接调用
new A(); // 作为构造函数调用
```

这种做法无法从定义上明确函数的用途，因此，ES6推出了一种全新的语法来书写构造函数

示例1：

```js
// 旧的写法
function User(firstName, lastName){
  this.firstName = firstName;
  this.lastName = lastName;
  this.fullName = `${firstName} ${lastName}`;
}
User.isUser = function(u){
  return !!u && !!u.fullName
}
User.prototype.sayHello = function(){
  console.log(`Hello, my name is ${this.fullName}`);
}

// 新的等效写法
class User{
  constructor(firstName, lastName){
    this.firstName = firstName;
    this.lastName = lastName;
    this.fullName = `${firstName} ${lastName}`;
  }
  
  static isUser(u){
  	 return !!u && !!u.fullName
  }
  
  sayHello(){
    console.log(`Hello, my name is ${this.fullName}`);
  }
}
```

示例2：

```js
function Animal(type, name){
  this.type = type;
  this.name = name;
}

Animal.prototype.intro = function(){
  console.log(`I am ${this.type}, my name is ${this.name}`)
}

function Dog(name){
  Animal.call(this, '狗', name);
}

Dog.prototype = Object.create(Animal.prototype); // 设置继承关系

// 新的方式

class Animal{
  constructor(type, name){
    this.type = type;
    this.name = name;
  }
  
  intro(){
    console.log(`I am ${this.type}, my name is ${this.name}`)
  }
}

class Dog extends Animal{
 	constructor(name){
    super('狗', name);
  }
}
```



## 函数API

| API                                                          | 含义                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [Function.prototype.call(obj, ...args)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/call) | 调用函数，绑定this为obj<br />后续以列表的形式提供参数        |
| [Function.prototype.apply(obj, args)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/apply) | 调用函数，绑定this为obj<br />args以数组的形式提供参数        |
| [Function.prototype.bind(obj, ...args)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) | 返回一个函数的拷贝<br />新函数的this被绑定为obj<br />起始参数被绑定为args |
|                                                              |                                                              |



