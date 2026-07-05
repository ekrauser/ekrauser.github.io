---
title: The Blog Rebuild — Amber Phosphor and a Terminal That Actually Works
date: 2026-07-05 01:00:00 -500
categories: [meta, web]
tags: [jekyll, chirpy, css, javascript, meta]
description: Dragging this blog off the stock Chirpy theme into an amber-phosphor terminal look — analytics, a working in-page command line, and the three Chirpy internals that ate my evening.
image:
  path: /assets/img/cards/the-blog-rebuild.png
  alt: "The Blog Rebuild — Amber Phosphor and a Terminal That Actually Works"
---

This blog has been a bit of an embarrassment. Five posts, the stock Chirpy theme every other Jekyll blog on the internet uses, an About page that literally still said *"Add Markdown syntax content to file `about.md`,"* and — the part that actually bugged me — zero idea whether a single human had ever read any of it. So I sat down and fixed all of it in one go. This is the writeup, because apparently I write those now.

## First question: does anyone even come here

Before dumping effort into a site it's worth knowing if anyone's looking at it. I had no analytics of any kind, so the honest answer was "no clue."

Turns out I already had some data and didn't know it — the site sits behind Cloudflare, and because it's proxied, Cloudflare's been counting requests the whole time. So step one was just logging into a dashboard I already owned. On top of that I wired up a few things properly:

- **Cloudflare Web Analytics** — privacy-friendly, no cookie banner, and Chirpy supports it natively. Drop the token in `_config.yml` and you're done.
- **GoatCounter** — the only provider Chirpy uses for the little per-post view counter, so now each post shows its own count.
- **Google Analytics + Search Console** — for the full Google picture and to get the sitemap indexed.

Result: about what you'd expect for a site nothing links to yet — basically nobody. Which is fine. The point was to be able to *watch that change* once I start actually promoting posts, instead of shouting into a void with the lights off.

## Making it not look like every other Chirpy blog

My resume site runs an "amber phosphor / vintage terminal" look that I'm fond of — warm near-black background, cream text, amber everything, monospace. I ported that design language over here wholesale: `#0d0b07` background, `#ede0c4` text, `#ffb000` accent, Inter for body copy and JetBrains Mono for anything structural (titles, nav, tags, the works). There's a CRT scanline overlay and a warm vignette on the whole page, and amber text gets a subtle phosphor glow.

It's dark by default for everyone — the resume is dark-only and this should be too — with the light/dark toggle still there for people who hate their eyes.

## Chirpy did not make this easy

This is the part worth reading if you're theming Chirpy 7.x yourself. Three separate things ate real time:

**Production uses a different stylesheet than dev.** My custom stylesheet started with `@use "main"`. Chirpy 7.6's *actual* entry point is `@use "main.bundle"` in production, switched by a Liquid conditional on `jekyll.environment`. Plain `main` silently drops about 38KB of component CSS — but *only in the production build*, so a naive local `jekyll serve` looked perfect while the live site rendered the sidebar toggle and social icons as raw bulleted lists. This one's nasty because the environment where it breaks is the one you don't look at.

**The theme attribute moved.** I was flipping colors based on a `data-mode` attribute. Chirpy 7.6 switched to Bootstrap's `data-bs-theme`, so every one of my selectors was dead and only the `prefers-color-scheme` media-query fallback was doing anything. Worse, when I "fixed" the default by forcing dark in CSS, it desynced Chirpy's toggle JS — the first click did nothing, because the script thought it was already in the state I'd forced. The real fix was targeting `data-bs-theme` and seeding the default through Chirpy's own `theme` localStorage key so the toggle stays in sync.

**`compress_html` ate a comment.** Chirpy compresses the built HTML, which collapses inline `<script>` blocks onto a single line. I had a `//` line comment inside an inline boot script. On one line, `//` comments out *the rest of that line* — including the closing braces and the function call. Result: `Uncaught SyntaxError: Unexpected end of input`, the whole script dead, and the dark-mode default silently gone with it. Block comments only inside inline scripts. Lesson filed under "obvious in hindsight."

## The terminal junk

With the theme sorted, I went overboard, which is the whole point of a personal site:

- A **neofetch-style system card** on the About page with real build-time stats (post count, tag count, total word count).
- **Hex-addressed section headers** in posts — `▸ THE GOAL, AND THE WALL ──── [ 0x02 ]`.
- A `uid=1000(ekrauser)…` passwd-style line under the sidebar, a vim-style status line pinned above the footer, and an `eric@lab:~$` prompt on the home page.
- **Warm code blocks** — I recolored Chirpy's base16 Rouge syntax theme into amber/gold/brown so code stops looking like it was pasted in from a different site.
- A **terminal 404** that tells you `bash: cd: /whatever-you-typed: No such file or directory` and offers you an `ls ~/`.
- A **CRT boot sequence** that plays once per browsing session — a couple seconds of `[ OK ] mounting /posts` before the page fades in. Skippable, and it doesn't nag you on every click.

And the one I'm actually proud of: **hit `/` anywhere on the site and you get a real command line.** `ls` lists posts, `open nodegrid` navigates to one, `cd about`, `search radius`, `theme light`, `whoami`, `neofetch`, tab-completion, command history. It reads Chirpy's own `search.json` index so I didn't have to build a second one. It's pointless and I love it. Go try it.

I also generate a **terminal-style share card per post**, so when I finally do drop a link somewhere the preview isn't a blank rectangle.

## How this was actually built

The honest part, because the "how" is more interesting than the what. My main box has no Ruby and I wasn't about to fight a Windows Ruby toolchain to run Jekyll. So the loop was:

- A **Docker container** running `jekyll serve` in *production mode* (`JEKYLL_ENV=production`), so what I previewed matched what actually ships — which is the only reason that `main` vs `main.bundle` bug got caught *before* it went live instead of after.
- **Playwright** driving headless Chrome for screenshots and for actually clicking through the theme toggle and the command line to confirm they work.
- The whole thing driven by a coding agent from the terminal, previewing every change in the container before pushing. I'm not going to pretend I hand-wrote 700 lines of CSS and JS in an evening.

Deploys go out through GitHub Pages, which was flaky enough during all this — two "Deployment failed, try again later" in a row on unchanged builds — that I now understand why people move Jekyll sites to Cloudflare Pages. Might be a future post.

## Worth it?

Almost certainly spent more time on the paint than the five posts under it deserve. But it doesn't look stock anymore, I can finally see who shows up, and there's a working shell embedded in a blog about running enterprise gear in my basement — which is exactly the sort of pointless thing this site exists for. Now I just have to write enough posts to justify the frame.
