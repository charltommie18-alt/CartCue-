# CartCue Amazon Appstore subscription setup

The Pro Creator subscription uses Amazon In-App Purchasing (IAP), not a normal web payment link.

- Product/SKU: `CartCue_monthly_sub`
- Price configured in the app UI: `$4.99/month`
- Native purchase button calls Amazon IAP.
- The old manual “I subscribed on Amazon” activation has been removed.
- Restore checks Amazon purchase receipts before activating Pro.

## GitHub

1. Create/open the CartCue GitHub repository.
2. Upload the contents of this project folder (not the ZIP itself).
3. Keep these paths:
   - `amazon-iap/amazon-appstore-sdk-3.0.9.jar`
   - `amazon-iap/AppstoreAuthenticationKey.pem`
   - `amazon-iap/AmazonIAPPlugin.java`
   - `amazon-iap/MainActivity.java`
   - `lib/amazon-iap.ts`
   - `.github/workflows/android.yml`
4. In Amazon Developer Console, make sure the subscription SKU is exactly `CartCue_monthly_sub`.
5. Run GitHub Actions → **Build Android APK (Amazon Appstore IAP)**.
6. Test the generated APK with Amazon App Tester/Live App Testing before publishing.

Amazon processes the customer payment. The app should be distributed through the Amazon Appstore for the native IAP flow to work.
