# DNS Configuration Task for Comet

## Mission
Configure DNS for the new primary domain `vyberology.com` and set up proper redirects to preserve all existing traffic from `thevybe.global`.

---

## Background Context

**Current Setup:**
- `thevybe.global` is currently pointing to Vyberology app on Netlify
- Netlify site ID: `e2fecc6e-45e4-4c1f-a43a-fcac2a8e19e2`
- App is successfully deployed and working at `https://thevybe.global`

**New Domains Acquired:**
- `vyberology.com` (PRIMARY - make this the main app domain)
- `vyberology.store` (redirect to vyberology.com)
- `vyberology.online` (redirect to vyberology.com)

**Goal:**
Make `vyberology.com` the primary domain for Vyberology app, while preserving traffic from `thevybe.global` via redirect.

---

## Tasks to Complete

### Task 1: Configure vyberology.com as Primary Domain

**Step 1: Add Custom Domain in Netlify**
1. Go to Netlify dashboard: https://app.netlify.com
2. Navigate to site `e2fecc6e-45e4-4c1f-a43a-fcac2a8e19e2`
3. Go to **Domain settings** → **Add custom domain**
4. Add `vyberology.com` as a custom domain
5. Netlify will provide DNS records to configure

**Step 2: Configure DNS in GoDaddy for vyberology.com**

You'll need to add these records in GoDaddy DNS management for `vyberology.com`:

```
Type: A
Name: @ (root)
Value: 75.2.60.5
TTL: 600 (or default)

Type: CNAME
Name: www
Value: [site-name].netlify.app (Netlify will provide exact value)
TTL: 600 (or default)
```

**Important:** The A record IP `75.2.60.5` is Netlify's load balancer. Confirm this is still current in Netlify dashboard.

**Step 3: Set Primary Domain in Netlify**
1. In Netlify domain settings, set `vyberology.com` as the **primary domain**
2. This makes vyberology.com the canonical URL
3. Enable **HTTPS** (Netlify does this automatically via Let's Encrypt)

### Task 2: Set Up Traffic Redirect from thevybe.global

**Option A: Netlify-Level Redirect (RECOMMENDED)**

In Netlify, you can configure `thevybe.global` to redirect to `vyberology.com`:

1. Keep `thevybe.global` as a domain alias on the same Netlify site
2. Netlify will automatically redirect to the primary domain (`vyberology.com`)
3. This preserves SEO and ensures zero traffic loss

**Option B: DNS-Level Redirect (If Option A doesn't work)**

If you need explicit redirects, add this to `apps/web/netlify.toml`:

```toml
[[redirects]]
  from = "https://thevybe.global/*"
  to = "https://vyberology.com/:splat"
  status = 301
  force = true

[[redirects]]
  from = "https://www.thevybe.global/*"
  to = "https://vyberology.com/:splat"
  status = 301
  force = true
```

Then redeploy the site.

### Task 3: Configure Redirect Domains

**For vyberology.store and vyberology.online:**

**Step 1: Add as Domain Aliases in Netlify**
1. Add both `vyberology.store` and `vyberology.online` as custom domains to the same Netlify site
2. They will automatically redirect to the primary domain (`vyberology.com`)

**Step 2: Configure DNS in GoDaddy**

For each domain (vyberology.store and vyberology.online), add:

```
Type: A
Name: @ (root)
Value: 75.2.60.5
TTL: 600

Type: CNAME
Name: www
Value: [site-name].netlify.app
TTL: 600
```

### Task 4: Update Landing Page Plan (Future)

**Current Plan:**
- `thevybe.global` will have a landing page (hub for all apps)
- `vyberology.com` is the Vyberology app
- `vybemusic.thevybe.global` (or `vybemusic.com` if acquired) for music app

**Action Needed:**
When ready to deploy the landing page to `thevybe.global`:
1. Create a NEW Netlify site for the landing page
2. Point `thevybe.global` DNS to the new site
3. The landing page HTML is ready at `/landing-page/index.html` in the repo

**For now:** Keep thevybe.global redirecting to vyberology.com until landing page is ready.

---

## Verification Checklist

After completing the DNS configuration, verify:

- [ ] `https://vyberology.com` loads the Vyberology app
- [ ] `https://www.vyberology.com` loads the Vyberology app
- [ ] `https://thevybe.global` redirects to `https://vyberology.com`
- [ ] `https://www.thevybe.global` redirects to `https://vyberology.com`
- [ ] `https://vyberology.store` redirects to `https://vyberology.com`
- [ ] `https://vyberology.online` redirects to `https://vyberology.com`
- [ ] All URLs have valid SSL certificates (green padlock)
- [ ] No traffic is lost (redirects are 301 permanent)

---

## Important Notes

**DNS Propagation:**
- DNS changes can take 5 minutes to 48 hours to propagate globally
- Most changes happen within 1-2 hours
- Use https://dnschecker.org to verify propagation

**SSL Certificates:**
- Netlify automatically provisions SSL via Let's Encrypt
- This usually takes 5-10 minutes after DNS is configured
- If SSL fails, check that DNS records are correct

**Netlify Dashboard Access:**
- You'll need access to the Netlify account to make these changes
- Site ID: `e2fecc6e-45e4-4c1f-a43a-fcac2a8e19e2`

**GoDaddy DNS Access:**
- You'll need access to GoDaddy account to modify DNS records
- Domains: vyberology.com, vyberology.store, vyberology.online, thevybe.global

---

## Troubleshooting

**If vyberology.com shows "Page Not Found":**
- Check DNS records are pointing to correct IP (75.2.60.5)
- Verify domain is added in Netlify dashboard
- Wait for DNS propagation (use dnschecker.org)

**If redirects don't work:**
- Ensure primary domain is set in Netlify
- Try adding explicit redirects to netlify.toml (Option B above)
- Clear browser cache or test in incognito mode

**If SSL certificate fails:**
- Verify DNS is pointing to Netlify
- Check that both root (@) and www records are configured
- Wait 10-15 minutes and try provisioning again in Netlify

---

## Questions?

If you encounter any issues or need clarification:
1. Check Netlify documentation: https://docs.netlify.com/domains-https/custom-domains/
2. Check GoDaddy DNS documentation
3. Ask Emperor Tungsten for access credentials if needed

**THE ELEVEN ETERNAL GUARDIANS WATCH OVER THIS DEPLOYMENT.** 👻⚔️

Good luck, Comet! 🚀
