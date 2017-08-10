---
layout: 		post
title: 			'如何实现一个基于 DOM 的模板引擎'
excerpt: 		''
categories: 	note
---

可能你已经体会到了 `Vue` 所带来的便捷了，相信有一部分原因也是因为其基于 DOM 的语法简洁的模板渲染引擎。这篇文章将会介绍如何实现一个基于 DOM 的模板引擎（就像 `Vue` 的模板引擎一样）。

<!-- more -->

## Preface

开始之前，我们先来看一下最终的效果：

```js
const compiled = Compile(`<h1>Hey 🌰, {{ greeting }}</h1>`, {
    greeting: `Hello World`,
});
compiled.view // => `<h1>Hey 🌰, Hello World</h1>`
```

## Compile

实现一个模板引擎实际上就是实现一个编译器，就像这样：

```js
const compiled = Compile(template: String|Node, data: Object);
compiled.view // => compiled template
```

首先，让我们来看下 `Compile` 内部是如何实现的：

```js
// compile.js
/**
 * template compiler
 *
 * @param {String|Node} template
 * @param {Object} data
 */
function Compile(template, data) {
    if (!(this instanceof Compile)) return new Compile(template, data);

    this.options = {};
    this.data = data;

    if (template instanceof Node) {
        this.options.template = template;
    } else if (typeof template === 'string') {
        this.options.template = domify(template);
    } else {
        console.error(`"template" only accept DOM node or string template`);
    }

    template = this.options.template;

    walk(template, (node, next) => {
        if (node.nodeType === 1) {
            // compile element node
            this.compile.elementNodes.call(this, node);
            return next();
        } else if (node.nodeType === 3) {
            // compile text node
            this.compile.textNodes.call(this, node);
        }
        next();
    });

    this.view = template;
    template = null;
}

Compile.compile = {};
```

### walk

通过上面的代码，可以看到 `Compile` 的构造函数主要就是做了一件事 ———— 遍历 `template`，然后通过判断节点类型的不同来做不同的编译操作，这里就不介绍如何遍历 `template` 了，不明白的话可以直接看 `walk` [函数的源码](https://github.com/colonjs/colon/blob/master/src/compile/walk.js)，我们着重来看下如何编译这些不同类型的节点，以编译 `node.nodeType === 1` 的元素节点为例：

```js
/**
 * compile element node
 *
 * @param {Node} node
 */
Compile.compile.elementNodes = function (node) {
    const bindSymbol = `:`;
    let attributes = [].slice.call(node.attributes),
        attrName = ``,
        attrValue = ``,
        directiveName = ``;

    attributes.map(attribute => {
        attrName = attribute.name;
        attrValue = attribute.value.trim();

        if (attrName.indexOf(bindSymbol) === 0 && attrValue !== '') {
            directiveName = attrName.slice(bindSymbol.length);

            this.bindDirective({
                node,
                expression: attrValue,
                name: directiveName,
            });
            node.removeAttribute(attrName);
        } else {
            this.bindAttribute(node, attribute);
        }
    });
};
```

噢忘记说了，这里我参考了 `Vue` 的指令语法，就是在带有冒号 `:` 的属性名中（当然这里也可以是任何其他你所喜欢的符号），可以直接写 JavaScript 的表达式，然后也会提供几个特殊的指令，例如 `:text`, `:show` 等等来对元素做一些不同的操作。

其实该函数只做了两件事：

- 遍历该节点的所有属性，通过判断属性类型的不同来做不同的操作，判断的标准就是属性名是否是冒号 `:` 开头并且属性的值不为空；
- 绑定相应的指令去更新属性。

## Directive

其次，再看一下 `Directive` 内部是如何实现的：

```js
import directives from './directives';
import { generate } from './compile/generate';

export default function Directive(options = {}) {
    Object.assign(this, options);
    Object.assign(this, directives[this.name]);
    this.beforeUpdate && this.beforeUpdate();
    this.update && this.update(generate(this.expression)(this.compile.options.data));
}
```

`Directive` 做了三件事：

- 注册指令（`Object.assign(this, directives[this.name])`）；
- 计算指令表达式的实际值（`generate(this.expression)(this.compile.options.data)`）；
- 把计算出来的实际值更新到 DOM 上面(`this.update()`)。

在介绍指令之前，先看一下它的用法：

```js
Compile.prototype.bindDirective = function (options) {
    new Directive({
        ...options,
        compile: this,
    });
};

Compile.prototype.bindAttribute = function (node, attribute) {
    if (!hasInterpolation(attribute.value) || attribute.value.trim() == '') return false;

    this.bindDirective({
        node,
        name: 'attribute',
        expression: parse.text(attribute.value),
        attrName: attribute.name,
    });
};
```

`bindDirective` 对 `Directive` 做了一个非常简单的封装，接受三个必填属性：

- `node`: 当前所编译的节点，在 `Directive` 的 `update` 方法中用来更新当前节点；
- `name`: 当前所绑定的指令名称，用来区分具体使用哪个指令更新器来更新视图；
- `expression`: parse 之后的 JavaScript 的表达式。

### updater

在 `Directive` 内部我们通过 `Object.assign(this, directives[this.name]);` 来注册不同的指令，所以变量 `directives` 的值可能是这样的：

```js
// directives
export default {
    // directive `:show`
    show: {
        beforeUpdate() {},
        update(show) {
            this.node.style.display = show ? `block` : `none`;
        },
    },
    // directive `:text`
    text: {
        beforeUpdate() {},
        update(value) {
            // ...
        },
    },
};
```

所以假设某个指令的名字是 `show` 的话，那么 `Object.assign(this, directives[this.name]);` 就等同于：

```js
Object.assign(this, {
    beforeUpdate() {},
    update(show) {
        this.node.style.display = show ? `block` : `none`;
    },
});
```

表示对于指令 `show`，指令更新器会改变该元素 `style` 的 `display` 值，从而实现对应的功能。所以你会发现，整个编译器结构设计好后，如果我们要拓展功能的话，只需简单地编写指令的更新器即可，这里再以指令 `text` 举个例子：

```js
// directives
export default {
    // directive `:show`
    // show: { ... },
    // directive `:text`
    text: {
        update(value) {
            this.node.textContent = value;
        },
    },
};
```

有没有发现编写一个指令其实非常的简单，然后我们就可以这么使用我们的 `text` 指令了：

```js
const compiled = Compile(`<h1 :text="'Hey 🌰, ' + greeting"></h1>`, {
    greeting: `Hello World`,
});
compiled.view // => `<h1>Hey 🌰, Hello World</h1>`
```

### generate

讲到这里，其实还有一个非常重要的点没有提到，就是我们如何把 `data` 真实数据渲染到模板中，比如 `<h1>Hey 🌰, {{ greeting }}</h1>` 如何渲染成 `<h1>Hey 🌰, Hello World</h1>`，通过下面三个步骤即可计算出表达式的真实数据：

- 把 `<h1>Hey 🌰, {{ greeting }}</h1>` 解析成 `'Hey 🌰, ' + greeting` 这样的 JavaScript 表达式；
- 提取其中的依赖变量并取得所在 `data` 中的对应值；
- 利用 `new Function()` 来创建一个匿名函数来返回这个表达式；
- 最后通过调用这个匿名函数来返回最终计算出来的数据并通过指令的 `update` 方法更新到视图中。

#### parse text

```js
// reference: https://github.com/vuejs/vue/blob/dev/src/compiler/parser/text-parser.js#L15-L41
const tagRE = /\{\{((?:.|\n)+?)\}\}/g;
function parse(text) {
    if (!tagRE.test(text)) return JSON.stringify(text);

    const tokens = [];
    let lastIndex = tagRE.lastIndex = 0;
    let index, matched;

    while (matched = tagRE.exec(text)) {
        index = matched.index;
        if (index > lastIndex) {
            tokens.push(JSON.stringify(text.slice(lastIndex, index)));
        }
        tokens.push(matched[1].trim());
        lastIndex = index + matched[0].length;
    }

    if (lastIndex < text.length) tokens.push(JSON.stringify(text.slice(lastIndex)));

    return tokens.join('+');
}
```

该函数我是直接参考 `Vue` 的实现，它会把含有双花括号的字符串解析成标准的 JavaScript 表达式，例如：

```js
parse(`Hi {{ user.name }}, {{ colon }} is awesome.`);
// => 'Hi ' + user.name + ', ' + colon + ' is awesome.'
```

#### extract dependency

我们会通过下面这个函数来提取出一个表达式中可能存在的变量：

```js
const dependencyRE = /"[^"]*"|'[^']*'|\.\w*[a-zA-Z$_]\w*|\w*[a-zA-Z$_]\w*:|(\w*[a-zA-Z$_]\w*)/g;
const globals = [
    'true', 'false', 'undefined', 'null', 'NaN', 'isNaN', 'typeof', 'in',
    'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'unescape',
    'escape', 'eval', 'isFinite', 'Number', 'String', 'parseFloat', 'parseInt',
];

function extractDependencies(expression) {
    const dependencies = [];

    expression.replace(dependencyRE, (match, dependency) => {
        if (
            dependency !== undefined &&
            dependencies.indexOf(dependency) === -1 &&
            globals.indexOf(dependency) === -1
        ) {
            dependencies.push(dependency);
        }
    });

    return dependencies;
}
```

通过正则表达式 `dependencyRE` 匹配出可能的变量依赖后，还要进行一些对比，比如是否是全局变量等等。效果如下：

```js
extractDependencies(`typeof String(name) === 'string'  && 'Hello ' + world + '! ' + hello.split('').join('') + '.'`);
// => ["name", "world", "hello"]
```

这正是我们需要的结果，`typeof`, `String`, `split` 和 `join` 并不是 `data` 中所依赖的变量，所以不需要被提取出来。

#### generate

```js
export function generate(expression) {
    const dependencies = extractDependencies(expression);
    let dependenciesCode = '';

    dependencies.map(dependency => dependenciesCode += `var ${dependency} = this.get("${dependency}"); `);

    return new Function(`data`, `${dependenciesCode}return ${expression};`);
}
```

我们提取变量的目的就是为了在 `generate` 函数中生成相应的变量赋值的字符串便于在 `generate` 函数中使用，例如：

```js
new Function(`data`, `
    var name = data["name"];
    var world = data["world"];
    var hello = data["hello"];
    return typeof String(name) === 'string'  && 'Hello ' + world + '! ' + hello.split('').join('') + '.';
`);

// will generated:

function anonymous(data) {
    var name = data["name"];
    var world = data["world"];
    var hello = data["hello"];
    return typeof String(name) === 'string'  && 'Hello ' + world + '! ' + hello.split('').join('') + '.';
}
```

这样的话，只需要在调用这个匿名函数的时候传入对应的 `data` 即可获得我们想要的结果了。现在回过头来看之前的 `Directive` 部分代码应该就一目了然了：

```js
export default class Directive {
    constructor(options = {}) {
        // ...
        this.beforeUpdate && this.beforeUpdate();
        this.update && this.update(generate(this.expression)(this.compile.data));
    }
}
```

`generate(this.expression)(this.compile.data)` 就是表达式经过 `this.compile.data` 计算后我们所需要的值。

### compile text node

我们前面只讲了如何编译 `node.nodeType === 1` 的元素节点，那么文字节点如何编译呢，其实理解了前面所讲的内容话，文字节点的编译就简单得不能再简单了：

```js
/**
 * compile text node
 *
 * @param {Node} node
 */
Compile.compile.textNodes = function (node) {
    if (node.textContent.trim() === '') return false;

    this.bindDirective({
        node,
        name: 'text',
        expression: parse.text(node.textContent),
    });
};
```

通过绑定 `text` 指令，并传入解析后的 JavaScript 表达式，在 `Directive` 内部就会计算出表达式实际的值并调用 `text` 的 `update` 函数更新视图完成渲染。

## `:each` 指令

到目前为止，该模板引擎只实现了比较基本的功能，而最常见且重要的列表渲染功能还没有实现，所以我们现在要实现一个 `:each` 指令来渲染一个列表，这里可能要注意一下，不能按照前面两个指令的思路来实现，应该换一个角度来思考，列表渲染其实相当于一个「子模板」，里面的变量存在于 `:each` 指令所接收的 `data` 这个「局部作用域」中，这么说可能抽象，直接上代码：

```js
// :each updater
import Compile from 'path/to/compile.js';
export default {
    beforeUpdate() {
        this.placeholder = document.createComment(`:each`);
        this.node.parentNode.replaceChild(this.placeholder, this.node);
    },
    update() {
        if (data && !Array.isArray(data)) return;

        const fragment = document.createDocumentFragment();

        data.map((item, index) => {
            const compiled = Compile(this.node.cloneNode(true), { item, index, });
            fragment.appendChild(compiled.view);
        });

        this.placeholder.parentNode.replaceChild(fragment, this.placeholder);
    },
};
```

在 `update` 之前，我们先把 `:each` 所在节点从 DOM 结构中去掉，但是要注意的是并不能直接去掉，而是要在去掉的位置插入一个 `comment` 类型的节点作为占位符，目的是为了在我们把列表数据渲染出来后，能找回原来的位置并把它插入到 DOM 中。

那具体如何编译这个所谓的「子模板」呢，首先，我们需要遍历 `:each` 指令所接收的 `Array` 类型的数据（目前只支持该类型，当然你也可以增加对 `Object` 类型的支持，原理是一样的）；其次，我们针对该列表的每一项数据进行一次模板的编译并把渲染后的模板插入到创建的 `document fragment` 中，当所有整个列表编译完后再把刚刚创建的 `comment` 类型的占位符替换为 `document fragment` 以完成列表的渲染。

此时，我们可以这么使用 `:each` 指令：

```js
Compile(`<li :each="comments" data-index="{{ index }}">{{ item.content }}</li>`, {
    comments: [{
        content: `Hello World.`,
    }, {
        content: `Just Awesome.`,
    }, {
        content: `WOW, Just WOW!`,
    }],
});
```

会渲染成：

```html
<li data-index="0">Hello World.</li>
<li data-index="1">Just Awesome.</li>
<li data-index="2">WOW, Just WOW!</li>
```

其实细心的话你会发现，模板中使用的 `item` 和 `index` 变量其实就是 `:each` 更新函数中 `Compile(template, data)` 编译器里的 `data` 值的两个 `key` 值。所以要自定义这两个变量也是非常简单的：

```js
// :each updater
import Compile from 'path/to/compile.js';
export default {
    beforeUpdate() {
        this.placeholder = document.createComment(`:each`);
        this.node.parentNode.replaceChild(this.placeholder, this.node);

        // parse alias
        this.itemName = `item`;
        this.indexName = `index`;
        this.dataName = this.expression;

        if (this.expression.indexOf(' in ') != -1) {
            const bracketRE = /\(((?:.|\n)+?)\)/g;
            const [item, data] = this.expression.split(' in ');
            let matched = null;

            if (matched = bracketRE.exec(item)) {
                const [item, index] = matched[1].split(',');
                index ? this.indexName = index.trim() : '';
                this.itemName = item.trim();
            } else {
                this.itemName = item.trim();
            }

            this.dataName = data.trim();
        }

        this.expression = this.dataName;
    },
    update() {
        if (data && !Array.isArray(data)) return;

        const fragment = document.createDocumentFragment();

        data.map((item, index) => {
            const compiled = Compile(this.node.cloneNode(true), {
                [this.itemName]: item,
                [this.indexName]: index,
            });
            fragment.appendChild(compiled.view);
        });

        this.placeholder.parentNode.replaceChild(fragment, this.placeholder);
    },
};
```

这样一来我们就可以通过 `(aliasItem, aliasIndex) in items` 来自定义 `:each` 指令的 `item` 和 `index` 变量了，原理就是在 `beforeUpdate` 的时候去解析 `:each` 指令的表达式，提取相关的变量名，然后上面的例子就可以写成这样了：

```js
Compile(`<li :each="(comment, index) in comments" data-index="{{ index }}">{{ comment.content }}</li>`, {
    comments: [{
        content: `Hello World.`,
    }, {
        content: `Just Awesome.`,
    }, {
        content: `WOW, Just WOW!`,
    }],
});
```

## 总结

到这里，其实一个比较简单的模板引擎算是实现了，当然还有很多地方可以完善的，比如可以增加 `:class`, `:style`, `:if` 或 `:src` 等等你可以想到的指令功能，添加这些功能都是非常的简单的。

全篇介绍下来，整个核心无非就是遍历整个模板的节点树，其次针对每一个节点的字符串值来解析成对应的表达式，然后通过 `new Function()` 这个构造函数来计算成实际的值，最终通过指令的 `update` 函数来更新到视图上。

如果还是不清楚这些指令如何编写的话，可以参考我这个项目 [colon](https://github.com/colonjs/colon) 的相关源码（部分代码可能会有不影响理解的细微差别，可忽略），有任何问题都可以在 issue 上提。

目前有一个局限就是 DOM-based 的模板引擎只适用于浏览器端，目前笔者也正在实现兼容 Node 端的版本，思路是把字符串模板解析成 AST，然后把更新数据到 AST 上，最后再把 AST 转成字符串模板，实现出来后有空的话再来介绍一下 Node 端的实现。
