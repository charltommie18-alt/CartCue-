# CartCue Amazon Appstore subscription setup

The Pro Creator subscription uses Amazon In-App Purchasing (IAP), not a normal web payment link.

- Parent SKU: `CartCue_monthly_sub`
- Term SKU (what the app purchases): `CartCue_monthly_term`
- Price shown in the app UI: `$4.99/month`
- Native purchase button calls Amazon IAP via the Capacitor plugin.
- Restore checks Amazon purchase receipts before activating Pro.

## GitHub

1. Create/open the CartCue GitHub repository.
2. Upload the contents of this project folder (not the ZIP itself).
3. Keep these paths:
   - `amazon-iap/AppstoreAuthenticationKey.pem`
   - `amazon-iap/AmazonIAPPlugin.java`
   - `amazon-iap/MainActivity.java`
   - `lib/amazon-iap.ts`
   - `app/subscription/page.tsx`
   - `.github/workflows/android.yml`
4. In Amazon Developer Console, make sure:
   - Parent subscription SKU is exactly `CartCue_monthly_sub`
   - Monthly term SKU is exactly `CartCue_monthly_term`
5. Run GitHub Actions → **Build Android APK (Amazon Appstore IAP)**.
6. Test the generated APK with Amazon App Tester / Live App Testing before publishing.

Amazon processes the customer payment. The app must be distributed through the Amazon Appstore (or tested with Amazon App Tester) for the native IAP flow to work.

**Important for reviewers / testers**

- Purchases only work inside the native Amazon Appstore APK.
- Opening the website in a normal browser will correctly show that subscriptions must be bought in the Appstore version of CartCue.
- Always test the APK produced by the GitHub Action with Amazon App Tester before submitting for review.
