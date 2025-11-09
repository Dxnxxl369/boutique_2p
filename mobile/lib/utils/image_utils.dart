import '../config.dart';

String buildImageUrl(String? imageUrl) {
  if (imageUrl == null || imageUrl.isEmpty) {
    return ''; // Or a placeholder image URL
  }
  // Check if the URL is already absolute
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // Otherwise, prepend the base image URL
  return '$kImageBaseUrl$imageUrl';
}
