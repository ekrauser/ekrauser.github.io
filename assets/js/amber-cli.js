/* Amber-phosphor extras:
   1. CRT boot sequence — plays once per browsing session (sessionStorage), skippable.
   2. Interactive command line — summoned with `/`, reuses Chirpy's search.json index. */
(function () {
  'use strict';
  var S = window.__LAB__ || {};

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function slugOf(url) {
    return (url || '').replace(/\/+$/, '').split('/').filter(Boolean).pop() || '';
  }

  /* ── 1. Boot sequence ──────────────────────────────────────────────────── */
  function boot() {
    var root = document.documentElement;
    if (!root.classList.contains('booting')) return;

    var lines = [
      ['bl-amber', 'lab.krauser.tech &mdash; power on'],
      ['', ''],
      ['bl-ok', '[ OK ] phosphor display online'],
      ['bl-ok', '[ OK ] mounting /posts (' + (S.posts || 0) + ')'],
      ['bl-ok', '[ OK ] loading amber-phosphor theme'],
      ['bl-ok', '[ OK ] giscus &middot; goatcounter &middot; cloudflare up'],
      ['', ''],
      ['bl-amber', 'booting<span class="bl-cur">_</span>']
    ];

    var scr = document.createElement('div');
    scr.id = 'boot-screen';
    var hint = document.createElement('div');
    hint.className = 'bl-hint';
    hint.textContent = 'press any key to skip';
    scr.appendChild(hint);
    document.body.appendChild(scr);

    var i = 0, finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      try { sessionStorage.setItem('booted', '1'); } catch (e) {}
      scr.classList.add('done');
      root.classList.remove('booting');
      setTimeout(function () { if (scr.parentNode) scr.parentNode.removeChild(scr); }, 500);
    }
    function typeLine() {
      if (finished) return;
      if (i >= lines.length) { setTimeout(finish, 650); return; }
      var ln = lines[i++];
      var d = document.createElement('div');
      if (ln[0]) d.className = ln[0];
      d.innerHTML = ln[1] || '&nbsp;';
      scr.insertBefore(d, hint);
      setTimeout(typeLine, ln[1] ? 175 : 80);
    }
    typeLine();
    scr.addEventListener('click', finish);
    window.addEventListener('keydown', function onk() {
      window.removeEventListener('keydown', onk);
      finish();
    });
  }

  /* ── 2. Command line ───────────────────────────────────────────────────── */
  var cli = { overlay: null, out: null, input: null, data: null, loading: false, history: [], hi: 0 };

  function isOpen() { return cli.overlay && cli.overlay.classList.contains('open'); }

  function build() {
    var ov = document.createElement('div');
    ov.id = 'cli-overlay';
    ov.innerHTML =
      '<div id="cli-box">' +
      '<div id="cli-titlebar"><span class="dot dot-r"></span><span class="dot dot-y"></span>' +
      '<span class="dot dot-g"></span><span class="cli-title">eric@lab: ~ &mdash; type help</span></div>' +
      '<div id="cli-out"></div>' +
      '<div id="cli-inputline"><span class="prompt">eric@lab:~$</span>' +
      '<input id="cli-input" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="command line"></div>' +
      '</div>';
    document.body.appendChild(ov);
    cli.overlay = ov;
    cli.out = ov.querySelector('#cli-out');
    cli.input = ov.querySelector('#cli-input');
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    cli.input.addEventListener('keydown', onKey);
    print('<span class="c-muted">amber-phosphor shell. type </span><span class="c-amber">help</span>' +
      '<span class="c-muted"> for commands, esc to close.</span>');
  }
  function open() {
    if (!cli.overlay) build();
    cli.overlay.classList.add('open');
    loadData();
    setTimeout(function () { cli.input.focus(); }, 20);
  }
  function close() { if (cli.overlay) cli.overlay.classList.remove('open'); }
  function print(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    cli.out.appendChild(d);
    cli.out.scrollTop = cli.out.scrollHeight;
  }
  function loadData() {
    if (cli.data || cli.loading) return;
    cli.loading = true;
    var url = S.search || '/assets/js/data/search.json';
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (j) { cli.data = j || []; })
      .catch(function () { cli.data = []; });
  }
  function posts() { return cli.data || []; }

  function run(raw) {
    raw = raw.trim();
    print('<span class="c-amber">eric@lab:~$</span> ' + esc(raw));
    if (!raw) return;
    cli.history.push(raw);
    cli.hi = cli.history.length;
    var parts = raw.split(/\s+/);
    var cmd = parts[0].toLowerCase();
    var arg = raw.slice(parts[0].length).trim();

    if (!cli.data && ['ls', 'open', 'cat', 'search', 'grep', 'cd'].indexOf(cmd) !== -1) {
      print('<span class="c-muted">indexing&hellip; give it a second and retry.</span>');
      loadData();
      return;
    }

    switch (cmd) {
      case 'help':
        print(
          'commands:\n' +
          '  <span class="c-amber">ls</span> [tags|categories]   list posts / tags / categories\n' +
          '  <span class="c-amber">open</span> &lt;name&gt;          open a post (fuzzy match)\n' +
          '  <span class="c-amber">cd</span> &lt;page&gt;            home &middot; about &middot; archives &middot; tags &middot; categories\n' +
          '  <span class="c-amber">search</span> &lt;term&gt;        search post titles + text\n' +
          '  <span class="c-amber">theme</span> &lt;dark|light|system&gt;\n' +
          '  <span class="c-amber">whoami</span> &middot; <span class="c-amber">neofetch</span> &middot; <span class="c-amber">clear</span> &middot; <span class="c-amber">exit</span>'
        );
        break;
      case 'ls':
        if (/^tags?$/i.test(arg)) { listField('tags'); }
        else if (/^categor/i.test(arg)) { listField('categories'); }
        else {
          var out = posts().map(function (p) {
            return '<a href="' + p.url + '">' + esc(p.title) + '</a>  <span class="c-muted">(' + slugOf(p.url) + ')</span>';
          });
          print(out.length ? out.join('\n') : '<span class="c-muted">no posts.</span>');
        }
        break;
      case 'open':
      case 'cat': {
        if (!arg) { print('<span class="c-muted">usage: open &lt;name&gt;</span>'); break; }
        var m = matchPosts(arg);
        if (!m.length) { print('<span class="c-err">open: ' + esc(arg) + ': no such post</span>'); break; }
        if (m.length > 1) {
          print('<span class="c-muted">multiple matches:</span>\n' + m.map(function (p) {
            return '  <a href="' + p.url + '">' + esc(p.title) + '</a>';
          }).join('\n'));
          break;
        }
        print('<span class="c-muted">&rarr; opening </span><span class="c-amber">' + esc(m[0].title) + '</span>');
        setTimeout(function () { location.href = m[0].url; }, 250);
        break;
      }
      case 'cd': {
        var pages = { home: '/', '~': '/', about: '/about/', archives: '/archives/', tags: '/tags/', categories: '/categories/' };
        var key = arg.replace(/^\/+|\/+$/g, '').toLowerCase();
        if (key.indexOf('posts/') === 0) { run('open ' + key.slice(6)); break; }
        if (pages[key] != null) { setTimeout(function () { location.href = pages[key]; }, 150); print('<span class="c-muted">&rarr; ' + esc(key || 'home') + '</span>'); }
        else { print('<span class="c-err">cd: ' + esc(arg) + ': no such directory</span>'); }
        break;
      }
      case 'search':
      case 'grep': {
        if (!arg) { print('<span class="c-muted">usage: search &lt;term&gt;</span>'); break; }
        var q = arg.toLowerCase();
        var hits = posts().filter(function (p) {
          return (p.title + ' ' + (p.content || '')).toLowerCase().indexOf(q) !== -1;
        });
        if (!hits.length) { print('<span class="c-muted">no matches for “' + esc(arg) + '”.</span>'); break; }
        print('<span class="c-muted">' + hits.length + ' match' + (hits.length > 1 ? 'es' : '') + ':</span>\n' +
          hits.map(function (p) { return '  <a href="' + p.url + '">' + esc(p.title) + '</a>'; }).join('\n'));
        break;
      }
      case 'theme': {
        var mode = arg.toLowerCase();
        if (mode === 'light' || mode === 'dark') {
          try { localStorage.setItem('theme', mode); } catch (e) {}
          document.documentElement.setAttribute('data-bs-theme', mode);
          print('<span class="c-muted">theme &rarr; </span><span class="c-amber">' + mode + '</span>');
        } else if (mode === 'system') {
          try { localStorage.setItem('theme', 'system'); } catch (e) {}
          var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
          print('<span class="c-muted">theme &rarr; </span><span class="c-amber">system</span>');
        } else { print('<span class="c-muted">usage: theme &lt;dark|light|system&gt;</span>'); }
        break;
      }
      case 'whoami':
        print('uid=1000(<span class="c-amber">ekrauser</span>) loc=chicago,il groups=homelab,infra,net(sudo)\n' +
          '<span class="c-muted">infrastructure engineer &middot; builds systems, automates at scale, runs a\nproduction-grade homelab because the best way to understand tech is to run it.</span>');
        break;
      case 'neofetch':
        print('<span class="c-amber">ekrauser@lab</span>\n' +
          '<span class="c-muted">────────────</span>\n' +
          '<span class="c-amber">os</span>      Jekyll &middot; Chirpy 7.6\n' +
          '<span class="c-amber">theme</span>   amber-phosphor\n' +
          '<span class="c-amber">posts</span>   ' + (S.posts || 0) + '   <span class="c-amber">tags</span>   ' + (S.tags || 0) + '\n' +
          '<span class="c-amber">host</span>    GitHub Pages &middot; Cloudflare\n' +
          '<span class="c-amber">updated</span> ' + (S.built || ''));
        break;
      case 'clear':
        cli.out.innerHTML = '';
        break;
      case 'sudo':
        print('<span class="c-muted">nice try. this incident will be reported.</span>');
        break;
      case 'exit':
      case 'q':
      case ':q':
        close();
        break;
      default:
        print('<span class="c-err">bash: ' + esc(cmd) + ': command not found</span> <span class="c-muted">(try help)</span>');
    }
  }

  function matchPosts(arg) {
    var q = arg.toLowerCase();
    var exact = posts().filter(function (p) { return slugOf(p.url).toLowerCase() === q; });
    if (exact.length) return exact;
    return posts().filter(function (p) {
      return p.title.toLowerCase().indexOf(q) !== -1 || slugOf(p.url).toLowerCase().indexOf(q) !== -1;
    });
  }
  function listField(field) {
    var set = {};
    posts().forEach(function (p) {
      String(p[field] || '').split(/[,\s]+/).forEach(function (v) { if (v) set[v] = (set[v] || 0) + 1; });
    });
    var keys = Object.keys(set).sort();
    if (!keys.length) { print('<span class="c-muted">none.</span>'); return; }
    print(keys.map(function (k) { return '<span class="c-amber">' + esc(k) + '</span> <span class="c-muted">(' + set[k] + ')</span>'; }).join('  '));
  }

  function onKey(e) {
    if (e.key === 'Enter') { var v = cli.input.value; cli.input.value = ''; run(v); }
    else if (e.key === 'Escape') { close(); }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cli.hi > 0) { cli.hi--; cli.input.value = cli.history[cli.hi] || ''; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cli.hi < cli.history.length - 1) { cli.hi++; cli.input.value = cli.history[cli.hi] || ''; }
      else { cli.hi = cli.history.length; cli.input.value = ''; }
    }
  }

  /* ── init ──────────────────────────────────────────────────────────────── */
  ready(function () {
    boot();

    // global `/` to summon, esc to close
    document.addEventListener('keydown', function (e) {
      var t = e.target, tag = t && t.tagName;
      var typing = tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable);
      if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey && !isOpen()) {
        e.preventDefault();
        open();
      } else if (e.key === 'Escape' && isOpen()) {
        close();
      }
    });

    // "press / for cli" hint in the statusline (built by amber-terminal.js)
    var sl = document.querySelector('.statusline');
    if (sl && !sl.querySelector('.sl-hint')) {
      var hint = document.createElement('span');
      hint.className = 'sl sl-hint';
      hint.innerHTML = 'press <kbd>/</kbd> for cli';
      var sp = sl.querySelector('.sl-sp');
      if (sp) sl.insertBefore(hint, sp); else sl.appendChild(hint);
    }
  });
})();
