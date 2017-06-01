(function () {
    var disqus_config = function () {
        this.page.url = location.href;
        this.page.identifier = location.pathname;
    };
    var d = document,
        s = d.createElement('script');
    s.src = 'https://justclear.disqus.com/embed.js';
    s.setAttribute('data-timestamp', +new Date());
    (d.head || d.body).appendChild(s);
})();
