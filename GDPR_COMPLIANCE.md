# GDPR Compliance Guide for Vyberology

**Document Version:** 1.0
**Last Updated:** October 11, 2025

## Overview

This document outlines how Vyberology complies with the General Data Protection Regulation (GDPR) and provides guidance for handling data subject requests from EU users.

## Table of Contents

1. [Data Processing Principles](#data-processing-principles)
2. [Legal Basis for Processing](#legal-basis-for-processing)
3. [Data Subject Rights](#data-subject-rights)
4. [Data Processing Activities](#data-processing-activities)
5. [Third-Party Processors](#third-party-processors)
6. [Data Retention](#data-retention)
7. [Security Measures](#security-measures)
8. [Data Breach Procedures](#data-breach-procedures)
9. [International Data Transfers](#international-data-transfers)
10. [User Request Handling](#user-request-handling)

---

## Data Processing Principles

Vyberology adheres to the following GDPR principles:

### 1. Lawfulness, Fairness, and Transparency
- Users are informed about data collection through our Privacy Policy
- Data processing is based on clear legal grounds (consent, contract, legitimate interest)
- We provide clear information about how data is used

### 2. Purpose Limitation
- Data is collected only for specified, explicit, and legitimate purposes
- Personal data is not further processed in ways incompatible with those purposes

**Purposes:**
- Generating numerology readings
- Providing the requested service
- Improving service quality
- Communicating with users

### 3. Data Minimization
- We collect only data necessary for our service:
  - Full name
  - Date of birth
  - Optional: email for account creation
  - Authentication tokens (stored locally)

**We do NOT collect:**
- Social security numbers
- Financial information
- Extensive personal details
- Tracking data beyond service needs

### 4. Accuracy
- Users can update their information at any time
- We encourage users to keep their information accurate
- Correction requests are processed promptly

### 5. Storage Limitation
- Data is retained only as long as necessary
- Reading results are not permanently stored unless saved by the user
- Account data is retained while the account is active
- Data is deleted upon account deletion request

### 6. Integrity and Confidentiality
- Industry-standard security measures implemented
- HTTPS encryption for all data transmission
- API keys stored as server-side secrets
- Access controls and authentication

### 7. Accountability
- This document demonstrates compliance
- Regular review of data practices
- Records of processing activities maintained
- Data Processing Agreements with third parties

---

## Legal Basis for Processing

### 1. Consent (Article 6(1)(a))
- Users provide explicit consent when using the service
- Consent can be withdrawn at any time
- Withdrawal process is simple and accessible

### 2. Contract (Article 6(1)(b))
- Processing necessary to provide the numerology service
- Fulfilling the service the user requested

### 3. Legitimate Interests (Article 6(1)(f))
- Service improvement and optimization
- Fraud prevention and security
- Analytics for service enhancement

**Legitimate Interest Assessment:**
- Purpose: Improve service quality
- Necessity: Essential for service development
- Balance: Minimal data collected, user rights protected
- Safeguards: Anonymization, security measures

---

## Data Subject Rights

EU users have the following rights under GDPR:

### 1. Right to Access (Article 15)
**What:** Users can request a copy of their personal data
**How to Exercise:** Email request to [Your Email]
**Response Time:** Within 30 days
**Format:** Machine-readable format (JSON or CSV)

**Information Provided:**
- What personal data we hold
- Why we're processing it
- Who we share it with
- How long we'll keep it
- Rights regarding the data

### 2. Right to Rectification (Article 16)
**What:** Correct inaccurate or incomplete data
**How to Exercise:** Account settings or email request
**Response Time:** Within 30 days

### 3. Right to Erasure ("Right to be Forgotten") (Article 17)
**What:** Request deletion of personal data
**How to Exercise:** Email request with subject "GDPR Deletion Request"
**Response Time:** Within 30 days
**Exceptions:**
- Legal obligations requiring retention
- Exercise of legal claims

**What Gets Deleted:**
- Account information
- Name and date of birth
- Authentication tokens
- Any stored readings (if applicable)
- Usage history

### 4. Right to Restriction of Processing (Article 18)
**What:** Limit how we process data
**When Available:**
- Accuracy is contested
- Processing is unlawful but user doesn't want deletion
- Data is needed for legal claims
- Objection to processing is pending

### 5. Right to Data Portability (Article 20)
**What:** Receive data in structured, machine-readable format
**Format:** JSON or CSV export
**Includes:**
- Name and date of birth
- Account information
- Historical readings (if stored)

### 6. Right to Object (Article 21)
**What:** Object to processing based on legitimate interests
**How to Exercise:** Email request
**Effect:** We must stop processing unless compelling legitimate grounds exist

### 7. Rights Related to Automated Decision-Making (Article 22)
**Status:** Not applicable - we do not make automated decisions with legal/significant effects
**Note:** AI-generated readings are for entertainment only and require human review/interpretation

---

## Data Processing Activities

### Record of Processing Activities (Article 30)

#### Processing Activity 1: Numerology Reading Generation

| Field | Value |
|-------|-------|
| **Purpose** | Generate personalized numerology readings |
| **Legal Basis** | Consent, Contract |
| **Data Categories** | Name, date of birth, numerology inputs |
| **Data Subjects** | Service users |
| **Recipients** | OpenAI (for AI processing), Supabase (storage) |
| **Transfers** | May transfer to US (OpenAI, Supabase) |
| **Retention** | Readings not stored; input data stored while account active |
| **Security** | HTTPS encryption, API key security, Edge Functions |

#### Processing Activity 2: Account Management

| Field | Value |
|-------|-------|
| **Purpose** | User authentication and session management |
| **Legal Basis** | Contract |
| **Data Categories** | Email (optional), authentication tokens |
| **Data Subjects** | Registered users |
| **Recipients** | Supabase (auth provider) |
| **Transfers** | Supabase servers (may be outside EU) |
| **Retention** | While account is active |
| **Security** | Supabase Auth security standards, localStorage tokens |

#### Processing Activity 3: Voice Assistant ("Hey Lumen")

| Field | Value |
|-------|-------|
| **Purpose** | Voice-activated number recognition and screenshot processing |
| **Legal Basis** | Consent |
| **Data Categories** | Voice commands (processed locally), screenshots (temporary) |
| **Data Subjects** | Users of voice assistant feature |
| **Recipients** | OCR service (for screenshot processing) |
| **Transfers** | OCR processing service |
| **Retention** | Immediate deletion after processing |
| **Security** | Temporary processing only, no storage |

---

## Third-Party Processors

### Data Processing Agreements (DPAs)

We have or will establish DPAs with:

#### 1. Supabase (Backend Infrastructure)
- **Role:** Processor
- **Data:** Account information, authentication
- **Location:** Cloud servers (check Supabase's data center locations)
- **Compliance:** Supabase's GDPR compliance: https://supabase.com/privacy
- **Security:** SOC 2 Type II certified, ISO 27001

#### 2. OpenAI (AI Reading Generation)
- **Role:** Sub-processor
- **Data:** Name, date of birth, numerology calculations
- **Location:** United States
- **Compliance:** OpenAI's privacy policy: https://openai.com/privacy/
- **Security:** Enterprise-grade security, encryption in transit and at rest
- **Data Retention:** OpenAI's API policy (check for latest: typically 30 days for API requests)

#### 3. Lovable.dev (Hosting Platform)
- **Role:** Processor
- **Data:** Deployed application code and assets
- **Location:** [Check Lovable.dev's infrastructure]
- **Compliance:** Review Lovable's terms of service

### Standard Contractual Clauses (SCCs)

For transfers outside the EU, we rely on:
- Standard Contractual Clauses approved by the European Commission
- Adequacy decisions (if applicable)
- Processor's own compliance mechanisms (e.g., Privacy Shield successor frameworks)

---

## Data Retention

### Retention Periods

| Data Type | Retention Period | Reason |
|-----------|------------------|--------|
| **Account Information** | While account is active + 30 days after deletion request | Service provision, legal requirements |
| **Reading Inputs** | Not permanently stored; processed and returned | Service delivery |
| **Generated Readings** | Not stored server-side (user's device only) | Privacy by design |
| **Authentication Tokens** | Session duration (localStorage) | Authentication |
| **Usage Analytics** | Aggregated data: 2 years | Service improvement |
| **Logs** | 90 days | Security, troubleshooting |

### Deletion Procedures

Upon account deletion:
1. User submits deletion request
2. We verify identity
3. Account and associated data deleted within 30 days
4. Confirmation sent to user
5. Backup data purged within 90 days

---

## Security Measures

### Technical Measures

- **Encryption:**
  - HTTPS/TLS for all data transmission
  - Encrypted storage for sensitive data
  - API keys stored as environment variables (server-side)

- **Access Controls:**
  - Authentication required for account access
  - Role-based access to backend systems
  - Limited personnel access to production data

- **API Security:**
  - Supabase Edge Functions for secure API calls
  - No client-side API key exposure
  - Rate limiting to prevent abuse

- **Code Security:**
  - Regular dependency updates
  - Security audit findings remediated
  - GitHub secret scanning enabled

### Organizational Measures

- **Training:** Development team educated on data protection
- **Policies:** Privacy and security policies documented
- **Reviews:** Regular security audits
- **Incident Response:** Data breach procedures established

---

## Data Breach Procedures

### Breach Detection
- Monitoring of systems for unauthorized access
- Logging and alerting mechanisms
- Regular security reviews

### Breach Response Plan

#### Within 72 Hours of Discovery:

1. **Containment:**
   - Identify and isolate affected systems
   - Stop the breach source
   - Secure vulnerable entry points

2. **Assessment:**
   - Determine scope of breach (what data, how many users)
   - Assess risk to individuals' rights and freedoms
   - Document findings

3. **Notification to Supervisory Authority:**
   - If high risk to individuals, notify relevant Data Protection Authority
   - Provide: nature of breach, data categories affected, likely consequences, measures taken
   - Contact: [Your relevant DPA, e.g., ICO for UK, CNIL for France]

#### Within 72 Hours (if high risk to individuals):

4. **Notification to Data Subjects:**
   - Inform affected users directly
   - Provide: nature of breach, likely consequences, mitigation measures
   - Offer support and guidance

5. **Documentation:**
   - Record all breach details
   - Document response actions
   - Maintain evidence for accountability

6. **Remediation:**
   - Implement additional security measures
   - Update policies and procedures
   - Conduct post-incident review

### Breach Notification Template

```
Subject: Important Security Notice - Data Breach Notification

Dear [User],

We are writing to inform you of a data security incident that may affect your personal information.

What Happened:
[Brief description of the breach]

What Information Was Involved:
[Specific data categories affected]

What We Are Doing:
[Steps taken to address the breach and prevent future incidents]

What You Can Do:
[Recommended actions for users]

Contact:
[Support contact information]

We sincerely apologize for this incident and are committed to protecting your data.

Sincerely,
Vyberology Team
```

---

## International Data Transfers

### Transfers Outside the EU

Data may be transferred to:

1. **United States:**
   - **Recipients:** OpenAI (AI processing), Supabase (hosting)
   - **Safeguards:** Standard Contractual Clauses, processor's own compliance frameworks
   - **Adequacy:** Monitor EU-US data transfer framework developments

2. **Other Locations:**
   - Dependent on third-party service infrastructure
   - Check current locations: Supabase dashboard, OpenAI data centers

### Transfer Mechanisms

We rely on:
- **Standard Contractual Clauses (SCCs):** EU Commission-approved clauses with processors
- **Adequacy Decisions:** Where applicable (e.g., UK, Switzerland)
- **Explicit Consent:** For specific transfers (if applicable)

### User Rights Regarding Transfers

Users can:
- Request information about where their data is transferred
- Object to transfers (may limit service availability)
- Request a copy of SCCs or other safeguards

---

## User Request Handling

### How to Submit Requests

**Email:** [Your Email Address]
**Subject Line:** "GDPR Request - [Type of Request]"
**Required Information:**
- Full name
- Email address associated with account
- Specific request type
- Any additional details to verify identity

### Request Processing Workflow

1. **Receipt & Acknowledgment:**
   - Acknowledge receipt within 3 business days
   - Request additional info if needed to verify identity

2. **Verification:**
   - Verify user identity (match email, account details)
   - Protect against fraudulent requests

3. **Processing:**
   - Fulfill request according to type
   - Timeline: Within 30 days (can extend to 60 days if complex)

4. **Response:**
   - Provide requested data or confirm action taken
   - Explain any denials with reasons
   - Inform of right to lodge complaint with supervisory authority

### Request Log Template

```
| Request ID | Date Received | User Email | Request Type | Status | Date Completed | Notes |
|------------|---------------|------------|--------------|--------|----------------|-------|
| GDPR-001   | 2025-10-11    | user@email | Access       | Completed | 2025-10-15  | Data exported as JSON |
```

---

## Compliance Checklist

### Initial Setup (One-Time)
- [ ] Privacy Policy published and accessible
- [ ] Terms of Service includes GDPR provisions
- [ ] Data Processing Agreements with third parties
- [ ] Data protection impact assessment completed (if needed)
- [ ] DPO appointed (if required by Article 37)
- [ ] Records of processing activities maintained

### Ongoing Compliance
- [ ] Privacy Policy reviewed annually
- [ ] User requests handled within 30 days
- [ ] Security measures regularly updated
- [ ] Staff trained on GDPR requirements
- [ ] Data retention policies enforced
- [ ] Breach response plan tested

### For Each User Request
- [ ] Identity verified
- [ ] Request logged
- [ ] Response provided within timeline
- [ ] Documentation maintained

---

## Resources and References

### GDPR Text
- Full GDPR text: https://gdpr-info.eu/

### Supervisory Authorities
- **EU DPAs:** https://edpb.europa.eu/about-edpb/about-edpb/members_en
- **ICO (UK):** https://ico.org.uk/
- **CNIL (France):** https://www.cnil.fr/en/home

### Guidance
- EDPB Guidelines: https://edpb.europa.eu/our-work-tools/general-guidance_en
- ICO Guidance: https://ico.org.uk/for-organisations/

### Internal Contacts
- **Privacy Questions:** [Your Email]
- **DPO (if applicable):** [DPO Email]
- **Security Issues:** [Security Email]

---

## Document Maintenance

This document should be reviewed and updated:
- Annually (minimum)
- When processing activities change
- When new third parties are engaged
- When GDPR guidance evolves
- After any data breach

**Next Review Date:** October 11, 2026

---

**Vyberology - Committed to Data Protection and Privacy**
