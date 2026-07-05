/* Amber-phosphor terminal flourishes: uid line, hex section headers,
   scroll-progress bar, vim-style statusline, and home prompt hero.
   Data (post/tag counts, build date) comes from window.__LAB__ (metadata-hook). */
(function () {
  'use strict';
  var S = window.__LAB__ || {};

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function hex(n) {
    return '0x' + n.toString(16).toUpperCase().padStart(2, '0');
  }

  ready(function () {
    // 1. passwd-style identity line under the sidebar subtitle
    var sub = document.querySelector('#sidebar .site-subtitle');
    if (sub && !document.querySelector('.uid-line')) {
      sub.insertAdjacentElement(
        'afterend',
        el(
          'div',
          'uid-line',
          'uid=1000(<b>ekrauser</b>) loc=chicago,il<br>groups=homelab,infra,net(<b>sudo</b>)'
        )
      );
    }

    // 2. hex-addressed section headers on article h2s
    document.querySelectorAll('.content h2').forEach(function (h, i) {
      if (h.classList.contains('sec-head')) return;
      h.appendChild(el('span', 'sec-addr', '[ ' + hex(i + 1) + ' ]'));
      h.classList.add('sec-head');
    });

    // 3. amber scroll-progress bar on posts
    if (location.pathname.indexOf('/posts/') === 0) {
      var bar = el('div', 'scroll-progress');
      document.body.appendChild(bar);
      var upd = function () {
        var d = document.documentElement;
        var max = d.scrollHeight - d.clientHeight;
        bar.style.width = (max > 0 ? (d.scrollTop / max) * 100 : 0) + '%';
      };
      window.addEventListener('scroll', upd, { passive: true });
      window.addEventListener('resize', upd);
      upd();
    }

    // 4. vim/tmux-style statusline above the footer
    var footer = document.querySelector('#tail-wrapper footer, footer[aria-label="Site Info"]');
    if (footer && !document.querySelector('.statusline')) {
      footer.insertAdjacentElement(
        'beforebegin',
        el(
          'div',
          'statusline',
          '<span class="sl sl-a">NORMAL</span>' +
            '<span class="sl sl-host">lab.krauser.tech</span>' +
            '<span class="sl">' + (S.posts || 0) + ' posts</span>' +
            '<span class="sl">' + (S.tags || 0) + ' tags</span>' +
            '<span class="sl sl-sp"></span>' +
            '<span class="sl">built ' + (S.built || '') + '</span>' +
            '<span class="sl sl-a">amber-phosphor</span>'
        )
      );
    }

    // 5. terminal prompt hero at the top of the home post list
    var list = document.getElementById('post-list');
    if (list && !document.querySelector('.home-hero')) {
      list.insertAdjacentElement(
        'beforebegin',
        el(
          'div',
          'home-hero',
          '<span class="hh-u">eric@lab</span><span class="hh-c">:</span>' +
            '<span class="hh-p">~</span><span class="hh-c">$</span> ls -t posts/' +
            ' <span class="hh-cur">&#9608;</span>'
        )
      );
    }
  });
})();
