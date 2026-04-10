# Article Draft Prompt

Use this prompt to draft a blog article in John Liddy's voice, for any of his web properties (theparticipationeffect.com, adaauditreport.com, daily-rise.com, or any future surface).

This prompt assumes the AI has access to `style-guide/JOHN_LIDDY_VOICE.md` in the same repository or workspace. If you are using this prompt outside the template repo, copy the voice file along with it.

## How to use this prompt

1. Copy the entire `Prompt for the AI` section below
2. Paste it into Claude Code or any AI conversation
3. Replace the bracketed placeholders with the article's specifics
4. Run it
5. Review the draft against the voice checklist in `style-guide/JOHN_LIDDY_VOICE.md` before publishing

## Prompt for the AI

You are drafting a blog article for John Liddy. Read these files first, before drafting a single word:

- `style-guide/JOHN_LIDDY_VOICE.md` — voice rules, non-negotiable
- `PROJECT_RULES.md` — editorial rules
- This file — article structure and conventions

Your job is to draft a complete article that matches his voice exactly. Voice violations are not acceptable. Do not negotiate with the rules. Re-read the voice file if you find yourself drifting.

### Article specifics to fill in

- **Topic:** [one-sentence description of what the article is about]
- **Target reader:** [who is reading this and what are they searching for]
- **Word count:** [usually 1200-1800]
- **Surface:** [which site, e.g. theparticipationeffect.com or adaauditreport.com]
- **Cluster:** [if applicable, e.g. recovery, anxiety, stress, ada-compliance]
- **Lead hook:** [a specific opening scene, image, or moment, not abstract]
- **Key insight:** [the one thing the reader should take away]
- **Soft CTA target:** [what should the reader do partway through, e.g. buy book, sign up for daily-rise, request audit]
- **End CTA target:** [what should the reader do at the end]
- **Tracking label prefix:** [e.g. blog-{slug} or essay-{slug} for narrative pieces]

### Article structure

Open with a specific scene, image, or moment. No throat-clearing. The first sentence is the first sentence of the actual article, not a meta-statement about what the article will do.

Use four to six H2 sections. Each section earns its place by adding new ground, not by restating the prior section.

Place a soft mid-article CTA after the first major insight. One sentence of context, then the link. Do not interrupt the flow with a hard sell.

End with a closing turn that lands instead of summarizing. The last sentence should feel like a small landing, not a recap of what the article said.

After the closing turn, place the end CTA block.

### Voice rules summary

The most important rules to internalize. The full version is in `style-guide/JOHN_LIDDY_VOICE.md` and you must read that file first.

- Open with the idea, not the framing
- Negate before revealing: "Not struggling. Wrecked."
- Specific vocabulary: "clenched jaw" not "stress"
- Short paragraphs, one to four sentences
- Vary sentence length, mix long and short deliberately
- No em dashes
- No semicolons
- No ellipses
- No "However," "Furthermore," "Moreover," "Additionally," "In conclusion"
- No bullet points in the prose itself
- Stories prove concepts then move on
- Conversational but precise

### Tracking and CTA conventions

For articles published on theparticipationeffect.com:

- Amazon link: `https://www.amazon.com/dp/B0GSF6QMZ7`
- Daily Rise link: `https://daily-rise.com/participation-effect`
- Amazon link tracking: `data-track-event="participation_book_buy_click" data-track-label="{prefix}-{placement}"`
- Daily Rise tracking: `data-track-event="participation_daily_rise_click" data-track-label="{prefix}-{placement}"`
- Helper script and click listener already live on the site, just include the attributes

For articles published on adaauditreport.com or daily-rise.com, follow the existing conventions for that site.

For sprint articles, also follow the sprint content overrides in `participation-effect-site/src/blog-schedule.json`.

For non-sprint narrative essays, use the `essay-{slug}` prefix on tracking labels to keep their click streams segregated from sprint pieces.

### Self-check before returning the draft

Run the eight-point checklist from `style-guide/JOHN_LIDDY_VOICE.md` against your draft. Fix anything that fails. Then return the draft.

Do not return a draft that fails any voice rule. If you cannot meet the voice in a particular section, stop and ask the author rather than producing a draft that violates the voice.
