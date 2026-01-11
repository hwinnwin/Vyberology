# STRIPE PRODUCT SETUP GUIDE

## For: vyberology.com Monetization
## Launch: 1.11 Portal (January 11, 2026)

---

## QUICK START (10 Minutes)

### Step 1: Go to Stripe Dashboard
- URL: https://dashboard.stripe.com/products
- Click "Add Product"

### Step 2: Create These 3 Products

---

## PRODUCT 1: Vybe Clarity Reading (Entry Point)

**Product Name:** Vybe Clarity Reading

**Description:**
```
Your personal clarity translation for today's energy.

Discover how the global frequency affects YOU specifically:
✓ Personal context alignment
✓ Where your flow is supported
✓ Friction points to watch
✓ Integration guidance for your numbers

Delivered instantly via email. Valid for 24 hours.
```

**Price:** $19.00 AUD (One-time)

**Metadata (optional):**
- `tier`: entry
- `type`: single_reading
- `delivery`: instant

**Image:** Use Vyberology logo or a clean gradient image

---

## PRODUCT 2: 3-Day Clarity Pack (Bundle)

**Product Name:** 3-Day Clarity Pack

**Description:**
```
Track how the energy unfolds over 72 hours.

Includes:
✓ 3 consecutive daily Clarity Readings
✓ Pattern tracking across the 3 days
✓ Integration guidance for each day
✓ Summary of your 3-day arc

Perfect for portal days, new moons, or any significant transition.
Save $8 vs individual readings.
```

**Price:** $49.00 AUD (One-time)

**Metadata:**
- `tier`: bundle
- `type`: multi_day
- `readings`: 3

---

## PRODUCT 3: Weekly Clarity Integration (Premium)

**Product Name:** Weekly Clarity Integration

**Description:**
```
Full week navigation with your personal frequency map.

Includes:
✓ 7 daily Clarity Readings
✓ Weekly overview and theme
✓ Day-by-day friction/flow forecast
✓ Integration practices for each day
✓ End-of-week reflection guide

For those who want consistent clarity, not occasional insight.
Best value — less than $12/day.
```

**Price:** $79.00 AUD (One-time)

**Metadata:**
- `tier`: premium
- `type`: weekly
- `readings`: 7

---

## Step 3: Create Payment Links

For each product:
1. Click on the product
2. Click "Create payment link"
3. Settings:
   - ✓ Allow promotion codes (optional)
   - ✓ Collect email address
   - After payment: Redirect to thank you page OR show confirmation

### Payment Link URLs (Example)
```
Single Reading: https://buy.stripe.com/xxx_clarity_single
3-Day Pack:     https://buy.stripe.com/xxx_clarity_3day
Weekly:         https://buy.stripe.com/xxx_clarity_weekly
```

---

## Step 4: Add to vyberology.com

### Option A: Simple Button (Fastest)

Add this anywhere on the site:

```html
<a href="YOUR_STRIPE_PAYMENT_LINK"
   class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all">
  Get Your Clarity Reading → $19
</a>
```

### Option B: Pricing Section

```html
<section class="pricing py-16">
  <h2 class="text-3xl font-bold text-center mb-12">Choose Your Clarity</h2>

  <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">

    <!-- Single Reading -->
    <div class="bg-slate-800 rounded-2xl p-8 text-center">
      <h3 class="text-xl font-semibold mb-2">Clarity Reading</h3>
      <p class="text-4xl font-bold mb-4">$19</p>
      <p class="text-slate-400 mb-6">Today's energy, personalized for you</p>
      <a href="STRIPE_LINK_1" class="block w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold">
        Get Reading
      </a>
    </div>

    <!-- 3-Day Pack -->
    <div class="bg-slate-800 rounded-2xl p-8 text-center border-2 border-purple-500">
      <span class="bg-purple-600 text-xs px-3 py-1 rounded-full">POPULAR</span>
      <h3 class="text-xl font-semibold mb-2 mt-4">3-Day Pack</h3>
      <p class="text-4xl font-bold mb-4">$49</p>
      <p class="text-slate-400 mb-6">Track the energy over 72 hours</p>
      <a href="STRIPE_LINK_2" class="block w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold">
        Get 3-Day Pack
      </a>
    </div>

    <!-- Weekly -->
    <div class="bg-slate-800 rounded-2xl p-8 text-center">
      <h3 class="text-xl font-semibold mb-2">Weekly Integration</h3>
      <p class="text-4xl font-bold mb-4">$79</p>
      <p class="text-slate-400 mb-6">Full week navigation</p>
      <a href="STRIPE_LINK_3" class="block w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold">
        Get Weekly
      </a>
    </div>

  </div>
</section>
```

---

## POST-PURCHASE FLOW

### Immediate (Automated by Stripe)
1. Customer receives Stripe receipt email
2. Customer redirected to thank you page

### Reading Delivery (Your Process)
1. You receive Stripe notification of payment
2. Generate their Clarity Reading using the template
3. Email reading to customer
4. (Future: Automate with Supabase Edge Functions)

---

## WEBHOOK SETUP (Optional - For Automation)

If you want automatic notifications:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://vyberology.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`

This allows you to:
- Auto-trigger reading generation
- Auto-send to customer
- Track purchases in your database

---

## PROMOTION CODES (Optional)

Create launch codes:

| Code | Discount | Usage |
|------|----------|-------|
| `PORTAL111` | 11% off | 1.11 launch special |
| `FIRSTCLARITY` | $5 off | First-time customers |
| `VYBEFAM` | 15% off | Community/referrals |

---

## CHECKLIST

- [ ] Stripe account active (stripe.com)
- [ ] 3 products created
- [ ] Payment links generated
- [ ] Links added to vyberology.com
- [ ] Test purchase completed (use Stripe test mode first)
- [ ] Switch to live mode
- [ ] Ready for 1.11 🔥

---

## SUPPORT

Stripe Documentation: https://stripe.com/docs
Payment Links Guide: https://stripe.com/docs/payment-links

---

**You're ready to receive. Let's go.** 🌱
