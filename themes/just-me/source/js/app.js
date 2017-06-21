import '../style/style.scss';
(function () {
    var disqus_config = function () {
        this.page.url = location.href;
        this.page.identifier = location.pathname;
    };
    var d = document,
        s = d.createElement('script');
    s.src = 'https://meitufe.disqus.com/embed.js';
    s.setAttribute('data-timestamp', +new Date());
    (d.head || d.body).appendChild(s);
})();
