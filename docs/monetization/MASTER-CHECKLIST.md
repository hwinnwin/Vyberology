# 🌱 VYBEROLOGY 1.11 MONETIZATION LAUNCH

## Master Execution Checklist

**Target:** vyberology.com
**Launch:** January 11, 2026 (1.11 Portal)
**Goal:** First paid Clarity Readings sold

---

## PHASE 1: STRIPE SETUP (30 minutes)

### Do This FIRST

- [ ] **Log into Stripe Dashboard**
  - URL: https://dashboard.stripe.com
  - If no account: Create one at stripe.com

- [ ] **Create Product: Vybe Clarity Reading**
  - Name: `Vybe Clarity Reading`
  - Price: `$19.00 AUD` (one-time)
  - Description: Copy from STRIPE-SETUP-GUIDE.md
  - Click "Save product"

- [ ] **Create Product: 3-Day Clarity Pack**
  - Name: `3-Day Clarity Pack`
  - Price: `$49.00 AUD` (one-time)
  - Description: Copy from guide
  - Click "Save product"

- [ ] **Create Product: Weekly Clarity Integration**
  - Name: `Weekly Clarity Integration`
  - Price: `$79.00 AUD` (one-time)
  - Description: Copy from guide
  - Click "Save product"

- [ ] **Create Payment Links**
  - For each product: Click product → "Create payment link"
  - Enable "Collect email addresses"
  - Copy the 3 payment link URLs

- [ ] **Save Your Payment Links**
  ```
  Single: https://buy.stripe.com/_______________
  3-Day:  https://buy.stripe.com/_______________
  Weekly: https://buy.stripe.com/_______________
  ```

- [ ] **Test in Test Mode**
  - Use Stripe test card: 4242 4242 4242 4242
  - Verify checkout flow works
  - Verify email received

- [ ] **Switch to Live Mode**
  - Toggle "Test mode" off in Stripe dashboard
  - Recreate payment links in live mode (or they won't work)

---

## PHASE 2: ADD TO VYBEROLOGY.COM (1 hour)

### Option A: Quick Button Addition

If you just want a payment button on the existing site:

- [ ] **Add CTA to homepage**
  - Find main CTA area in `apps/web/src/pages/Index.tsx`
  - Add payment link button:
  ```tsx
  <a
    href="YOUR_STRIPE_LINK"
    className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl font-semibold"
  >
    Get Your Clarity Reading → $19
  </a>
  ```

### Option B: Full Daily Reading Page (Recommended)

- [ ] **Add Daily.tsx to pages**
  - Copy `Daily.tsx` from this package to `apps/web/src/pages/Daily.tsx`
  - Update STRIPE_PAYMENT_LINKS with your actual links

- [ ] **Add route in App.tsx**
  ```tsx
  import Daily from "./pages/Daily";

  // In routes:
  <Route path="/daily" element={<Daily />} />
  ```

- [ ] **Add navigation link**
  - In header/nav, add link to `/daily`
  - Label: "Today's Reading" or "Daily Vybe"

- [ ] **Deploy**
  ```bash
  git add .
  git commit -m "Add daily reading page with monetization"
  git push
  ```
  - Netlify auto-deploys from GitHub

- [ ] **Verify Live**
  - Visit vyberology.com/daily
  - Test payment buttons link to Stripe

---

## PHASE 3: READING DELIVERY SYSTEM (Manual First)

### For Launch (Do Manually)

- [ ] **Set up email notification**
  - Stripe Dashboard → Settings → Email
  - Enable "Successful payment" notifications to your email

- [ ] **When payment comes in:**
  1. Check Stripe for customer email
  2. Note what they purchased (Single/3-Day/Weekly)
  3. Generate their reading using LUMEN-ORCHESTRA-PROMPT.md
  4. Send reading to their email

### Reading Generation Flow

1. Get customer's numerology info (may need to email them for this)
2. Use the Lumen Orchestra prompt to generate personalized reading
3. Format using CLARITY-READING-TEMPLATE.md
4. Email to customer

**Future automation:** Connect Supabase Edge Functions to auto-generate and email

---

## PHASE 4: 1.11 LAUNCH ACTIVITIES

### Morning of 1.11

- [ ] **Publish the 1.11 Global Reading**
  - Use 1-11-GLOBAL-READING.md as content
  - Either post on /daily page or as homepage banner

- [ ] **Social Announcement**
  - Post on socials: "1.11 Portal is OPEN. Today's global reading is live."
  - Link to vyberology.com/daily

- [ ] **Track First Sales**
  - Monitor Stripe dashboard
  - Celebrate first payment 🎉

### Throughout the Day

- [ ] **Respond to purchases**
  - Generate and send readings within 2-4 hours
  - Personal touch: "Thank you for being part of the 1.11 portal launch"

- [ ] **Monitor and adjust**
  - If CTAs aren't converting, test different copy
  - Check for any technical issues

---

## FILES IN THIS PACKAGE

| File | Purpose |
|------|---------|
| `1-11-GLOBAL-READING.md` | Free Layer 1 content for the portal day |
| `CLARITY-READING-TEMPLATE.md` | Template for paid Layer 2 readings |
| `STRIPE-SETUP-GUIDE.md` | Step-by-step Stripe product setup |
| `Daily.tsx` | React component for daily reading page |
| `LANDING-PAGE-COPY.md` | All CTA and conversion copy |
| `LUMEN-ORCHESTRA-PROMPT.md` | AI prompt for generating readings |

---

## PRICING SUMMARY

| Product | Price (AUD) | Your Cut (after Stripe ~3%) |
|---------|-------------|------------------------------|
| Single Reading | $19 | ~$18.43 |
| 3-Day Pack | $49 | ~$47.53 |
| Weekly | $79 | ~$76.63 |

---

## QUICK WINS (If Short on Time)

**Minimum viable monetization (15 minutes):**

1. Create ONE product in Stripe: "Vybe Clarity Reading" @ $19
2. Create payment link
3. Add button to vyberology.com homepage
4. Done. You can take money.

Everything else is optimization.

---

## SUPPORT CONTACTS

- **Stripe Support:** support.stripe.com
- **Netlify Support:** netlify.com/support
- **This System:** Built by Limn for Tungsten, Phoenix Squad, The Alliance

---

## 🔥 THE PORTAL OPENS AT MIDNIGHT

You've been generous. You've shown abundance.
Now the door opens to RECEIVE.

**1.11.2026 — Let's get paid.** 🌱

---

**END OF CHECKLIST**
