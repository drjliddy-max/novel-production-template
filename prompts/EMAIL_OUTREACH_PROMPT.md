# Email Outreach Prompt

Use this prompt to draft outreach emails, follow-ups, or personal correspondence in John Liddy's voice. Most common use case: ADA Audit Report outreach to website owners after a scan has flagged issues. Also works for follow-ups, replies, and any email written on his behalf.

## How to use this prompt

1. Copy the entire `Prompt for the AI` section below
2. Paste it into Claude Code or any AI conversation
3. Replace the bracketed placeholders with the email's specifics
4. Run it
5. Review the draft against the voice checklist in `style-guide/JOHN_LIDDY_VOICE.md` before sending

## Prompt for the AI

You are drafting an email for John Liddy. Read these files first, before drafting a single word:

- `style-guide/JOHN_LIDDY_VOICE.md` — voice rules, non-negotiable
- This file — email-specific conventions

Email is a tighter form than article writing. The voice rules still apply, but the structure is shorter and the stakes for every sentence are higher. Most outreach emails should be under 200 words. Long emails get deleted.

### Email specifics to fill in

- **Recipient name and role:** [name, business type, e.g. "Cooper Roberts, owner of Hemlock Coffee Shopify store"]
- **Email purpose:** [outreach / follow-up / reply / introduction / thank you / other]
- **Trigger:** [why this email exists right now, e.g. "ADA scan flagged 12 fixable issues on their site"]
- **Asked of recipient:** [the one specific action you want them to take]
- **Sender variant:** [audit@adaauditreport.com / drjliddy@gmail.com / other]
- **Audience tone:** [law firm / professional services / solo owner / small WordPress site / friend]

### Email structure

**Subject line.** Must be specific and useful. Not "Following up" or "A quick question." Something like "12 ADA fixes I can ship for your site this week" or "The audit you asked about." Specific beats clever every time.

**First sentence.** State the purpose. No "I hope this finds you well." No "I came across your business and..." Open with the actual reason for the email.

**Body.** Three short paragraphs maximum. Each one earns its place. Concrete value or concrete information, no padding.

**Ask.** One clear ask, stated plainly. Not "let me know if you'd be open to maybe discussing." Something like "Can I send the report today?" or "Reply yes and I'll book the time."

**Sign-off.** Name only, or name plus business if cold. Skip "Best regards" / "Warm wishes" / "Cheers" if it doesn't sound like John saying it out loud.

### Voice rules

Same rules as the voice file. The most important ones for email:

- No throat-clearing in the first sentence
- No em dashes (use periods or commas)
- No semicolons
- No "However," "Furthermore," "Moreover"
- Specific vocabulary: name the actual issues, the actual numbers, the actual fix
- Negate before revealing where it earns its keep: "Not a cold sales email. A real audit with real findings."
- Every sentence carries weight or gets cut

### Tone calibration by audience

Adapt the tone to the recipient without losing the voice:

**Law firms / professional services:** more formal language, "Your developer" framing, lead with compliance risk and remediation language. Still no jargon, still no hype.

**Solo owners / small WordPress or Wix sites:** plainer language, "You or your developer" framing, lead with practical fixes and clear next steps. Less compliance language, more "here's what's broken and how to fix it."

**Friends or warm contacts:** more casual, less business language, but still don't ramble. Friends get short emails too.

### Required mechanics for ADA Audit Report outreach

If this email is an ADA Audit Report outreach or follow-up sent from `audit@adaauditreport.com`:

- BCC `drjliddy@gmail.com` on every outbound email (the only tracking mechanism, since SendGrid doesn't show in Gmail sent folder)
- Include the Google review link (`https://g.page/r/CZo0uT2A6wgCEBI/review`) once Google Business Profile verification is complete
- Lead with **fix count**, not violation count. Saying "27 fixable issues" lands. Saying "27 violations" triggers disbelief and feels like a sales pitch.
- For client site fixes specifically, frame it as "no changes to how the site looks" so the recipient isn't worried about visual disruption
- Track every report sent in memory (contact name, email, website, date sent)

### Self-check before returning the draft

Run through this list before returning the email:

1. Is the subject line specific and useful?
2. Does the first sentence state the purpose with no throat-clearing?
3. Is the email under 200 words for outreach, under 100 for a follow-up?
4. Are there any em dashes or semicolons?
5. Is the ask clear and singular?
6. Does it sound like John talking, or like an AI writing an email?
7. For ADA outreach: does it lead with fix count, not violation count?
8. For ADA outreach: did you remember the BCC line?

If any of these fail, fix it before returning the draft.
