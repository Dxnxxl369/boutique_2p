const String kApiBaseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://192.168.0.13:8000/api',
);

const String kAuthLoginPath = '/auth/login/';
const String kAuthRegisterPath = '/auth/register/';
const String kAuthCurrentUserPath = '/auth/me/';
const String kAuthLogoutPath = '/auth/logout/';
const String kAuthUpdateFcmTokenPath = '/users/update_fcm_token/'; // New path for FCM token update

const String kImageBaseUrl = String.fromEnvironment(
  'IMAGE_URL',
  defaultValue: 'http://192.168.0.13:8000', // Assuming images are served from the backend root
);
