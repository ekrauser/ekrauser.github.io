---
# the default layout is 'page'
icon: fas fa-info-circle
order: 4
---

{% assign words = 0 %}{% for p in site.posts %}{% assign n = p.content | strip_html | number_of_words %}{% assign words = words | plus: n %}{% endfor %}
<div class="neofetch"><pre class="nf-logo"> ╭─────────────╮
 │ ● ● ●       │
 ├─────────────┤
 │ $ ls ~/     │
 │ &gt; _         │
 ╰─────────────╯</pre><div class="nf-info"><div class="nf-title">ekrauser@lab</div><div class="nf-rule">──────────────────────────────</div><div><span>os</span> Jekyll · Chirpy 7.6</div><div><span>theme</span> amber-phosphor</div><div><span>shell</span> bash · lab notebook</div><div><span>posts</span> {{ site.posts | size }}</div><div><span>tags</span> {{ site.tags | size }}</div><div><span>words</span> {{ words }}</div><div><span>host</span> GitHub Pages · Cloudflare</div><div><span>online</span> since 2024</div><div><span>updated</span> {{ site.time | date: '%Y-%m-%d' }}</div></div></div>

I'm Eric Krauser. This is where I write up what I break and occasionally fix in
my home lab.

The lab exists to mimic real enterprise environments as closely as I can get
away with — same tooling, same service quality, an order of magnitude fewer
users. That means Active Directory, PKI, RADIUS, enterprise Wi-Fi, a k3s cluster
running everything under GitOps, a pile of network gear, and whatever piece of
used enterprise hardware I've most recently talked myself into buying. When
something turns into a good story — a Frankenstein JBOD with a custom ESP32
controller, reverse-engineering a $100 Nodegrid until it runs Docker and KVM — it
ends up here.

Fair warning: this is a lab notebook, not a set of polished tutorials. Posts lean
toward "here's exactly what I did, here's the wall I hit, here's what I'd do
differently." If that's useful to you, great. If you spot something I got wrong,
even better — I'd genuinely like to know.

## Elsewhere

- **GitHub:** [ekrauser](https://github.com/ekrauser)
- **LinkedIn:** [eric-krauser](https://www.linkedin.com/in/eric-krauser/)

The lab runs on [Jekyll](https://jekyllrb.com/) with the
[Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) theme.
