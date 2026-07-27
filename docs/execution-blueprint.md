# CrossTech Systems — Growth Operating System Blueprint

**Prepared:** 25 July 2026
**Role:** CTO / growth operator / product architect
**Objective:** Transform CrossTech Systems from an IT repair company into a
scalable technology partner with recurring revenue, powered by InsightForge.

> This blueprint executes on the [Growth Strategy](./growth-strategy.md) —
> that document says what to build; this one says how. A rendered,
> navigable version is also published as a Claude artifact.

---

## 1. Website transformation plan

### New sitemap

```
/                             Homepage
/services/                    Service hub
  /services/laptop-pc-repair/          [local SEO]
  /services/data-recovery/
  /services/virus-malware-removal/
  /services/cell-phone-device-repair/
  /services/business-it-support/       [MSP anchor page]
  /services/cybersecurity-popia/
  /services/refurbished-laptops-bundles/
/assess/                      Instant IT Assessment tool [conversion + SEO weapon]
/areas/                       Local-SEO location pages
  /areas/ferndale/
  /areas/randburg-cbd/
  /areas/cresta/
  /areas/northriding/
/for/                         Vertical landing pages
  /for/small-business/
  /for/schools/
  /for/medical-practices/
  /for/legal-firms/
/pricing/                     Managed IT tiers, transparent from-R pricing
/reviews/                     Aggregated reviews + review-request QR landing
/contact/                     WhatsApp-first contact + quote form
```

Every `/services/*` and `/areas/*` page targets a distinct query ("laptop
repair Ferndale," "data recovery Randburg") that a single page structurally
cannot rank for simultaneously. The `/for/*` pages exist to convert cold
vertical outreach into a page worth linking to instead of a cold call.

### Homepage structure

1. **Hero** — "Your outsourced IT department in Randburg," not "computer
   repairs." Phone/WhatsApp CTA + Instant Assessment CTA, side by side.
2. **Trust strip** — years trading, 7-day hours, review count/rating (once
   >30), real social icons linking to real profiles.
3. **Service grid** — six cards linking into `/services/*`, each with a
   from-R price anchor.
4. **Managed IT callout** — the Business IT Care/Complete pitch; the page's
   actual commercial priority, not an afterthought below repairs.
5. **Social proof** — full testimonials plus business-client logos/initials
   once a few sign on.
6. **Local footer** — address, map embed, hours, service-area list, feeding
   `/areas/*` internal linking.

### Conversion & trust improvements

- Replace the bare "WhatsApp Charles" button with a structured, pre-filled
  message (device, issue) so the first reply is a quote, not "what's wrong
  with it?"
- Real, working social links — fixes the schema gap directly.
- Visible from-R pricing on every service page.
- A reviews page embedding live Google reviews, not just testimonial
  screenshots — crawlable and reinforces the review-generation push.

### Instant IT Assessment — the SEO weapon

Every competitor in Randburg — big-box and independent alike — forces a
customer to phone in before they get any value. A tool that takes
**device type → issue category → home/business user → urgency** and
instantly returns a recommended service and estimated price range removes
that friction entirely, and becomes a page worth ranking and sharing on its
own ("is my laptop worth fixing," "laptop won't turn on Randburg").

Architecture reuses what already exists in-house: the PrimeTurf quote engine
(`ENGINCONFIGURATION` repo) is a config-driven calculator —
`pricing.json` + a pure `calc.js` with no DOM coupling. The same shape works
here: an `assessment-config.json` holding device types, issue categories,
urgency weights and price bands, plus a pure decision function that turns an
answer set into a recommendation.

| Input | Drives |
|---|---|
| Device type | Which service categories are possible (laptop / phone / desktop / network) |
| Issue category | Recommended service + base price band |
| Home / business user | Routes business users toward the Managed IT pitch instead of a one-off quote |
| Urgency | Same-day/priority surcharge band + CTA copy |
| Contact details (final step) | Writes a scored lead directly into the InsightForge `leads` table |

---

## 2. Revenue architecture

> Figures below are indicative Gauteng small-IT-shop market bands for 2026,
> not confirmed CrossTech price-list data — use them to anchor pricing
> decisions, then true them up against actual parts/labour costs before
> publishing.

### Repair pricing strategy — the transactional floor

| Service | Typical band (ZAR) | Notes |
|---|---|---|
| Diagnostic fee | R150 – R250 | Waived on completed repair |
| Virus / malware removal | R450 – R750 | |
| Data recovery (logical) | R800 – R1,800 | Physical/drive failure: R2,500–R6,000+, often outsourced |
| Laptop screen replacement | R1,200 – R3,500 | Model-dependent |
| Battery replacement | R650 – R1,800 | |
| RAM / SSD upgrade | R900 – R2,500 | Parts + labour |
| OS reinstall / setup | R450 – R650 | |
| Home network / router setup | R450 – R900 | |
| Cell phone screen repair | R650 – R2,200 | Device-dependent |

Publish these (Section 1's from-R pricing). They're the floor that funds
cashflow while the retainer tiers below become the growth line.

### Managed IT packages — the recurring-revenue shift

**Business IT Care** — R450–R650/seat/mo: remote support, proactive
monitoring, backup checks, basic security review, priority response SLA.

**Business IT Complete** — R850–R1,250/seat/mo: everything in Care, plus
Microsoft 365 management, managed endpoint protection/EDR, network
maintenance, hardware lifecycle planning.

**Onboarding & add-ons** — R1,500–R3,000 one-off site IT assessment before
contract start; 5-seat minimum per contract; quarterly review built into
the Complete tier.

Positioning shift: not "computer repairs" — **"Your outsourced IT
department in Randburg."** Repairs stay the entry point; the seat-based
monthly fee is the product.

### Hardware sales & cybersecurity — two more lines already half-built

| Line | Indicative pricing | Fits because |
|---|---|---|
| Refurbished bundles / corporate trade-in | Margin-based | Already sold on-site — formalize buy-back from Care/Complete clients as supply |
| UPS supply & install (load-shedding) | R1,200 – R4,500 | Natural extension of hardware expertise |
| Managed antivirus / EDR | R60 – R150/device/mo | Bundled into Complete tier, sellable standalone |
| POPIA readiness assessment | R4,500 – R12,000 one-off | Legal requirement most clients ignore |
| POPIA compliance retainer | R1,500 – R3,500/mo | Highest margin-per-hour line in the model |
| Phishing simulation / staff training | R2,500 – R6,000/session | Pairs with a POPIA retainer for medical/legal clients |

---

## 3. Lead generation system

**Google Business optimisation** — claim/verify; correct categories (IT
Services, Computer Repair Service, Computer Support and Services); full
service-area radius across Randburg/Ferndale/Cresta/Northriding; weekly
Posts tied to the promo calendar; seeded Q&A covering the top 10 questions
already asked by phone; 48-hour review-response SLA on every review.

**Review generation system** — QR code on every completed-repair
receipt/invoice linking directly to the Google review form; automated
WhatsApp message 24–48h after job completion with the review link; verbal
ask at handover every time (the highest-converting single step). Target:
3 → 30+ reviews in 90 days, 100+ in 12 months.

**WhatsApp automation** — WhatsApp Business App quick-reply menu (Repair /
Business Support / Buy a Laptop / Track my Job); auto-acknowledgement on
every inbound message with expected response time; template messages for
quote-ready, job-complete + review-ask, and care-plan renewal due.

**Quote request workflow** — the Instant IT Assessment tool as the primary
quote entry point; every submission scored (urgency × business/home ×
device value) and routed into the InsightForge `leads` table; a fallback
structured WhatsApp intake for visitors who skip the tool.

**Customer follow-up sequences** — day 1–2 post-repair "how's it running" +
review ask; month-11-of-device-life proactive check-up nudge (from customer
intelligence); care-plan renewal reminder 14 days before expiry; lost-quote
follow-up at 48h and 7 days.

---

## 4. InsightForge implementation

CrossTech becomes InsightForge's next `business_id` tenant — the same
isolation pattern already proven for PrimeTurf and Ready & Rooted.

### Database structure (tenant-scoped tables)

```
leads       id, business_id, source, contact, device_type, issue_category,
            urgency, business_or_home, score, status, created_at
customers   id, business_id, name, contact, segment[home|pro|sme|school|
            medical|legal], created_at
devices     id, customer_id, type, brand, model, serial, notes
jobs        id, business_id, customer_id, device_id, service_type,
            technician, quote_amount, status, opened_at, closed_at,
            turnaround_hours
quotes      id, lead_id, job_id, line_items jsonb, total, converted bool
retainers   id, customer_id, tier[care|complete], seats, mrr,
            start_date, renewal_date, status
reviews     id, business_id, source, rating, text, requested_at,
            received_at
campaigns   id, business_id, channel, name, spend, leads_generated,
            jobs_converted, revenue
```

### AI agents & workflows (built on the existing `lib/claude.ts`)

| Agent | Trigger | Output |
|---|---|---|
| Assessment / quote-assist | Instant IT Assessment submission | Recommended service, urgency-weighted price band, next action |
| Lead scoring | New row in `leads` | Priority score so business/urgent leads get answered first |
| Follow-up drafting | Job status → `closed` | Contextual WhatsApp message drafted for one-tap send |
| Review-response drafting | New Google review synced in | Draft reply for owner approval |
| Weekly ops digest | Scheduled, Monday 07:00 | Plain-English summary — same FORGE Lite pattern (one call, one report) used to produce this blueprint |

### Dashboards & reporting

- **Operations** — jobs this week, avg. turnaround, technician load
- **Revenue** — MRR vs. transactional, revenue by service line, retainer count
- **Marketing** — lead source & volume, quote → job conversion, cost per lead
- **Retention** — renewal risk (60/30/14-day), churned vs. active retainers, review velocity & rating trend

Reporting cadence: a Monday-morning digest agent output pushed via
WhatsApp/email, and a monthly board-style report rendered the same way
InsightForge already renders a VDOS blueprint.

---

## 5. Priority matrix

| Initiative | Revenue impact | Cost | Complexity | ROI tier |
|---|---|---|---|---|
| Fix schema / social links | Low | R0 | Trivial | Immediate |
| GBP claim & optimisation | High | R0 | Low | Immediate |
| Review-generation (QR + WhatsApp) | High | R0–R500 | Low | Immediate |
| Publish Business IT Care/Complete pricing | Very high | R0 | Low | Immediate |
| WhatsApp quick-reply automation | Medium | R0 | Low | Immediate |
| Service + area landing pages | High | Low | Medium | Fast follow |
| Instant IT Assessment tool | Very high | Low (pattern exists) | Medium | Fast follow |
| First 3–5 MSP retainer signings | Very high | Time-only | Medium | Fast follow |
| InsightForge tenant seed (leads/jobs) | Medium | Low | Medium | Fast follow |
| UPS / load-shedding resilience line | Medium | Medium (stock) | Low | Fast follow |
| Ops/revenue/marketing dashboards | Medium | Low–Med | Medium | Phase 2 |
| AI agents (follow-up, review-response, digest) | Medium | Low | Medium | Phase 2 |
| POPIA readiness + compliance retainers | High (highest margin) | Medium | High (sales cycle) | Phase 2–3 |
| School/medical/legal vertical pages + outreach | High | Medium | Medium | Phase 2–3 |
| Part-time hire (technician or ops) | Enabling | High | Medium | Phase 3, gated on MRR |

---

## 6. Build roadmap

### Phase 1 · Days 1–30 — everything scored "Immediate"

- Fix schema/social links; claim & fully optimise GBP
- Launch QR + WhatsApp review-generation flow
- Publish Business IT Care/Complete pricing as a real page
- WhatsApp quick-reply automation live
- Direct outreach to 10 local SMEs/schools/practices with the new pricing

### Phase 2 · Days 31–90 — everything scored "Fast follow"

- Service + area landing pages live
- Instant IT Assessment tool built and published at `/assess/`
- First 3–5 Managed IT retainer clients signed
- InsightForge tenant seeded (`leads`, `customers`, `jobs`)
- UPS/load-shedding resilience offer live as a named promo
- Target: 30+ Google reviews

### Phase 3 · Months 4–12 — dashboards, compliance, verticals, scale

- Ops, revenue, marketing and retention dashboards live inside InsightForge
- AI agents in production: follow-up drafting, review-response drafting, weekly digest
- POPIA readiness assessments + compliance retainers sold into first medical/legal clients
- School fleet contracts signed against the January academic intake
- 10–15 total Managed IT retainer clients; first part-time hire funded by retainer MRR
- Target: 100+ Google reviews, recurring revenue ≥ 40% of total

---

*Execution blueprint for CrossTech Systems, Ferndale, Randburg — built on
the completed Growth Strategy and the live PrimeTurf quote-engine
architecture (`ENGINCONFIGURATION` repo) as the reference pattern for the
Instant IT Assessment tool. Pricing bands are indicative Gauteng market
data, not confirmed CrossTech figures.*
