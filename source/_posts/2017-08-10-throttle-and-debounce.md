---
layout: 		post
title: 			'函数节流与函数防抖'
excerpt: 		''
categories: 	note
---

## 什么是函数节流与函数防抖

举个栗子，我们知道目前的一种说法是当 1 秒内连续播放 24 张以上的图片时，在人眼的视觉中就会形成一个连贯的动画，所以在电影的播放（以前是，现在不知道）中基本是以每秒 24 张的速度播放的，为什么不 100 张或更多是因为 24 张就可以满足人类视觉需求的时候，100 张就会显得很浪费资源。再举个栗子，假设电梯一次只能载一人的话，10 个人要上楼的话电梯就得走 10 次，是一种浪费资源的行为；而实际生活正显然不是这样的，当电梯里有人准备上楼的时候如果外面又有人按电梯的话，电梯会再次打开直到满载位置，从电梯的角度来说，这时一种节约资源的行为（相对于一次只能载一个人）。

- 函数节流: 指定时间间隔内只会执行一次任务；
- 函数防抖: 任务频繁触发的情况下，只有任务触发的间隔超过指定间隔的时候，任务才会执行。

## 函数节流(throttle)

这里以判断页面是否滚动到底部为例，普通的做法就是监听 `window` 对象的 `scroll` 事件，然后再函数体中写入判断是否滚动到底部的逻辑：

```js
$(window).on('scroll', function () {
    // 判断是否滚动到底部的逻辑
    let pageHeight = $('body').height(),
        scrollTop = $(window).scrollTop(),
        winHeight = $(window).height(),
        thresold = pageHeight - scrollTop - winHeight;
    if (thresold > -100 && thresold <= 20) {
        console.log('end');
    }
});
```

![throttle](/images/posts/throttle-and-debounce/throttle-0.gif)

这样做的一个缺点就是比较消耗性能，因为当在滚动的时候，浏览器会无时不刻地在计算判断是否滚动到底部的逻辑，而在实际的场景中是不需要这么做的，在实际场景中可能是这样的：在滚动过程中，每隔一段时间在去计算这个判断逻辑。而函数节流所做的工作就是每隔一段时间去执行一次原本需要无时不刻地在执行的函数，所以在滚动事件中引入函数的节流是一个非常好的实践：

```js
$(window).on('scroll', throttle(function () {
    // 判断是否滚动到底部的逻辑
    let pageHeight = $('body').height(),
        scrollTop = $(window).scrollTop(),
        winHeight = $(window).height(),
        thresold = pageHeight - scrollTop - winHeight;
    if (thresold > -100 && thresold <= 20) {
        console.log('end');
    }
}));
```

![throttle](/images/posts/throttle-and-debounce/throttle-1.gif)

加上函数节流之后，当页面再滚动的时候，每隔 `300ms` 才会去执行一次判断逻辑。

简单来说，函数的节流就是通过闭包保存一个标记（`canRun = true`），在函数的开头**判断**这个标记是否为 `true`，如果为 `true` 的话就继续执行函数，否则则 return 掉，判断完标记后立即把这个标记设为 `false`，然后把外部传入的函数的执行包在一个 `setTimeout` 中，最后在 `setTimeout` 执行完毕后再把标记设置为 `true`（这里很关键），表示可以执行下一次的循环了。当 `setTimeout` 还未执行的时候，`canRun` 这个标记始终为 `false`，在开头的判断中被 return 掉。

```js
function throttle(fn, interval = 300) {
    let canRun = true;
    return function () {
        if (!canRun) return;
        canRun = false;
        setTimeout(() => {
            fn.apply(this, arguments);
            canRun = true;
        }, interval);
    };
}
```

## 函数防抖(debounce)

这里以用户注册时验证用户名是否被占用为例，如今很多网站为了提高用户体验，不会再输入框失去焦点的时候再去判断用户名是否被占用，而是在输入的时候就在判断这个用户名是否已被注册：

```js
$('input.user-name').on('input', function () {
    $.ajax({
        url: `https://just.com/check`,
        method: 'post',
        data: {
            username: $(this).val(),
        },
        success(data) {
            if (data.isRegistered) {
                $('.tips').text('该用户名已被注册！');
            } else {
                $('.tips').text('恭喜！该用户名还未被注册！');
            }
        },
        error(error) {
            console.log(error);
        },
    });
});
```

![throttle](/images/posts/throttle-and-debounce/debounce-0.gif)

很明显，这样的做法不好的是当用户输入第一个字符的时候，就开始请求判断了，不仅对服务器的压力增大了，对用户体验也未必比原来的好。而理想的做法应该是这样的，当用户输入第一个字符后的一段时间内如果还有字符输入的话，那就暂时不去请求判断用户名是否被占用。在这里引入函数防抖就能很好地解决这个问题：

```js
$('input.user-name').on('input', debounce(function () {
    $.ajax({
        url: `https://just.com/check`,
        method: 'post',
        data: {
            username: $(this).val(),
        },
        success(data) {
            if (data.isRegistered) {
                $('.tips').text('该用户名已被注册！');
            } else {
                $('.tips').text('恭喜！该用户名还未被注册！');
            }
        },
        error(error) {
            console.log(error);
        },
    });
}));
```

![throttle](/images/posts/throttle-and-debounce/debounce-1.gif)

其实函数防抖的原理也非常地简单，通过闭包保存一个标记来保存 `setTimeout` 返回的值，每当用户输入的时候把前一个 `setTimeout` clear 掉，然后又创建一个新的 `setTimeout`，这样就能保证输入字符后的 `interval` 间隔内如果还有字符输入的话，就不会执行 `fn` 函数了。

```js
function debounce(fn, interval = 300) {
    let timeout = null;
    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            fn.apply(this, arguments);
        }, interval);
    };
}
```

## 总结

其实函数节流与函数防抖的原理非常简单，巧妙地使用 `setTimeout` 来存放待执行的函数，这样可以很方便的利用 `clearTimeout` 在合适的时机来清除待执行的函数。

使用函数节流与函数防抖的目的，在开头的栗子中应该也能看得出来，就是为了节约计算机资源。
