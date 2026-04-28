# Team 7 — Campus closet

**Project:** https://campuscloset.illinihunt.org/
**Built by:** Meghan and Anthony
**Automation type:** Marketing | Operations

---

## Product

Our app, Campus Closet, is a student-to-student marketplace that allows college students to buy, sell, rent, and trade clothing within their campus community. It is designed for students who want affordable, convenient, and sustainable fashion options without dealing with shipping or large resale platforms. By focusing on local connections, it makes transactions faster, cheaper, and more flexible.

## Automation

This automation uses AI to generate and refine structured content for our product, such as descriptions, workflows, and documentation. It solves the problem of organizing ideas quickly and clearly, allowing us to focus more on building and improving Campus Closet rather than spending excessive time on writing and formatting.

## Prompt used

Create marketing content for Campus Closet, a student-to-student clothing marketplace where users can buy, sell, rent, and trade clothes on campus. Generate specific marketing instructions including what to post, which platform to post on (e.g., Instagram, TikTok), and when to post for best engagement. Include Instagram-style captions, short promotional blurbs, and a clear value proposition targeting college students. Focus on affordability, sustainability, and convenience, and keep the tone casual, relatable, and student-focused

## Inner / outer loop

- **Inner loop (AI execution):** The AI generated marketing content, including captions, post ideas, platform suggestions, and timing recommendations for Campus Closet based on our prompt.
- **Outer loop (human judgment):** Outer loop (human judgment):
We had to evaluate whether the suggested content actually fit our target audience and brand voice, decide which ideas were realistic or useful, and adjust or discard anything that didn’t align with our marketing strategy or available resources.
## Anthropic agent pattern

Which of these fits best? Pick one and defend in 1–2 sentences.

- [x] Prompt chaining
- [ ] Routing
- [ ] Parallelization
- [ ] Orchestrator-worker
- [ ] Evaluator-optimizer

**Why this one:** This automation fits prompt chaining because the output is produced in sequential steps, first generating marketing ideas (what to post), then refining them into specific platform recommendations and posting schedules (where and when to post). Each step builds on the previous output rather than being handled independently or evaluated in parallel.

## What required human judgment

This automation was not autonomous because it required us to evaluate and refine the AI’s outputs before they were usable. If Codex ran end-to-end without checking in, it would likely generate generic or misaligned marketing content (wrong platforms, poor timing, or off-brand messaging) that would reduce effectiveness and potentially lead to incorrect or low-impact posts going out.

## What didn't work

What didn’t work was that early iterations of the automation produced very generic marketing suggestions that didn’t feel specific to college student behavior or our Campus Closet concept. In some cases, it also recommended posting times and platforms without strong reasoning, which made parts of the output unreliable. We had to refine the prompt multiple times to force more specificity and reduce vague or overly broad recommendations.

---

*Submitted for BADM 350, Spring 2026.*
