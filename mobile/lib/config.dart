const String kApiBaseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://192.168.3.37:8000/api',
);

const String kAuthLoginPath = '/auth/login/';
const String kAuthRegisterPath = '/auth/register/';
const String kAuthCurrentUserPath = '/auth/me/';
const String kAuthLogoutPath = '/auth/logout/';
