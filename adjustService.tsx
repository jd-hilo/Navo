import { Adjust, AdjustConfig, AdjustEvent } from 'react-native-adjust';
const adjustEvent = new AdjustEvent('27gu4x');
class AdjustService {
  isInitialized = false;
  constructor() {
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;

    const adjustConfig = new AdjustConfig(
      'fw7q3vvpgtts',
      __DEV__
        ? AdjustConfig.EnvironmentSandbox
        : AdjustConfig.EnvironmentProduction
    );

    // Set attribution callback to handle referrals
    adjustConfig.setAttributionCallback((attribution) => {
      console.log('Attribution callback called');
      console.log('Tracker token:', attribution.trackerToken);
      console.log('Tracker name:', attribution.trackerName);
      console.log('Network:', attribution.network);
      console.log('Campaign:', attribution.campaign);
      console.log('Creative:', attribution.creative);
      console.log('Click label:', attribution.clickLabel);
      const event = new AdjustEvent('27gu4x');

      // Add attribution parameters
      if (attribution.trackerToken)
        event.addCallbackParameter('tracker_token', attribution.trackerToken);
      if (attribution.trackerName)
        event.addCallbackParameter('tracker_name', attribution.trackerName);
      if (attribution.network)
        event.addCallbackParameter('network', attribution.network);
      if (attribution.campaign)
        event.addCallbackParameter('campaign', attribution.campaign);
      if (attribution.creative)
        event.addCallbackParameter('creative', attribution.creative);
      if (attribution.clickLabel)
        event.addCallbackParameter('click_label', attribution.clickLabel);

      // Send the event
      event.addCallbackParameter('attribution', JSON.stringify(attribution));

      Adjust.trackEvent(event);

      // Handle referral logic here
      this.handleReferral(attribution);
    });

    // Set deep link callback
    adjustConfig.setDeferredDeeplinkCallback((deeplink) => {
      console.log('Deep link callback called with:', deeplink);
      this.handleDeepLink(deeplink);
    });
    adjustConfig.setLogLevel(AdjustConfig.LogLevelVerbose);
    Adjust.initSdk(adjustConfig);
    this.isInitialized = true;
  }

  handleReferral(attribution: any) {
    if (attribution.trackerToken) {
      // Extract referrer information
      const referrerData = {
        referrerToken: attribution.trackerToken,
        referrerName: attribution.trackerName,
        campaign: attribution.campaign,
        network: attribution.network,
        creative: attribution.creative,
        clickLabel: attribution.clickLabel,
      };

      // Store referrer information locally or send to your backend
      this.processReferral(referrerData);
    }
  }

  async processReferral(referrerData: any) {
    try {
      // Save referrer data locally
      await this.saveReferrerData(referrerData);

      // Send to your backend API
      await this.sendReferralToBackend(referrerData);
    } catch (error) {
      console.error('Error processing referral:', error);
    }
  }

  async saveReferrerData(referrerData: any) {
    // You could use AsyncStorage or your preferred storage method
    // Note: In production, consider using encrypted storage for sensitive data
    const data = {
      ...referrerData,
    };

    // Store the referral data
    console.log('Saving referrer data:', data);
    // await AsyncStorage.setItem('referral_data', JSON.stringify(data));
  }

  async sendReferralToBackend(referrerData: any) {
    console.log('send data to backend :', referrerData);
  }

  handleDeepLink(deeplink: any) {
    // Handle deep link navigation
    console.log('Handling deep link:', deeplink);
    // Parse the deep link and navigate accordingly
    // Example: navigate to specific screen or apply promo code
  }
}

export default new AdjustService();
