/* Comprehensive Geocoding & Place Selection Engine
   Provides instant offline search for all 38 Tamil Nadu districts, taluks & towns,
   all Indian states & major districts, and global capitals & NRI hubs,
   with online OpenStreetMap Nominatim fallback for geocoding down to village level. */

// Comprehensive database of Indian Districts, Taluks & Major Global Cities
export const POPULAR_PLACES_DB = [
  // ==========================================
  // TAMIL NADU - ALL 38 DISTRICTS & MAJOR TALUKS
  // ==========================================
  // 1. Chennai
  { name: "Chennai", district: "Chennai", state: "Tamil Nadu", country: "India", lat: 13.0827, lon: 80.2707, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சென்னை", districtTa: "சென்னை", stateTa: "தமிழ்நாடு" },
  { name: "T. Nagar", district: "Chennai", state: "Tamil Nadu", country: "India", lat: 13.0418, lon: 80.2341, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "தி. நகர்", districtTa: "சென்னை", stateTa: "தமிழ்நாடு" },
  { name: "Mylapore", district: "Chennai", state: "Tamil Nadu", country: "India", lat: 13.0368, lon: 80.2676, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "மயிலாப்பூர்", districtTa: "சென்னை", stateTa: "தமிழ்நாடு" },
  { name: "Adyar", district: "Chennai", state: "Tamil Nadu", country: "India", lat: 13.0012, lon: 80.2565, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "அடையாறு", districtTa: "சென்னை", stateTa: "தமிழ்நாடு" },
  { name: "Anna Nagar", district: "Chennai", state: "Tamil Nadu", country: "India", lat: 13.0850, lon: 80.2101, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "அண்ணா நகர்", districtTa: "சென்னை", stateTa: "தமிழ்நாடு" },
  { name: "Velachery", district: "Chennai", state: "Tamil Nadu", country: "India", lat: 12.9815, lon: 80.2180, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "வேளச்சேரி", districtTa: "சென்னை", stateTa: "தமிழ்நாடு" },

  // 2. Chengalpattu
  { name: "Chengalpattu", district: "Chengalpattu", state: "Tamil Nadu", country: "India", lat: 12.6819, lon: 79.9888, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "செங்கல்பட்டு", districtTa: "செங்கல்பட்டு", stateTa: "தமிழ்நாடு" },
  { name: "Tambaram", district: "Chengalpattu", state: "Tamil Nadu", country: "India", lat: 12.9249, lon: 80.1000, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "தாம்பரம்", districtTa: "செங்கல்பட்டு", stateTa: "தமிழ்நாடு" },
  { name: "Pallavaram", district: "Chengalpattu", state: "Tamil Nadu", country: "India", lat: 12.9675, lon: 80.1491, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பல்லாவரம்", districtTa: "செங்கல்பட்டு", stateTa: "தமிழ்நாடு" },
  { name: "Chromepet", district: "Chengalpattu", state: "Tamil Nadu", country: "India", lat: 12.9516, lon: 80.1462, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "குரோம்பேட்டை", districtTa: "செங்கல்பட்டு", stateTa: "தமிழ்நாடு" },
  { name: "Maraimalai Nagar", district: "Chengalpattu", state: "Tamil Nadu", country: "India", lat: 12.7963, lon: 80.0242, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "மறைமலை நகர்", districtTa: "செங்கல்பட்டு", stateTa: "தமிழ்நாடு" },
  { name: "Maduranthakam", district: "Chengalpattu", state: "Tamil Nadu", country: "India", lat: 12.5097, lon: 79.8847, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "மதுராந்தகம்", districtTa: "செங்கல்பட்டு", stateTa: "தமிழ்நாடு" },
  { name: "Mahabalipuram (Mamallapuram)", district: "Chengalpattu", state: "Tamil Nadu", country: "India", lat: 12.6269, lon: 80.1927, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "மாமல்லபுரம்", districtTa: "செங்கல்பட்டு", stateTa: "தமிழ்நாடு" },
  { name: "Tirukalukundram", district: "Chengalpattu", state: "Tamil Nadu", country: "India", lat: 12.6106, lon: 80.0577, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திருக்கழுகுன்றம்", districtTa: "செங்கல்பட்டு", stateTa: "தமிழ்நாடு" },

  // 3. Tiruvallur
  { name: "Tiruvallur", district: "Tiruvallur", state: "Tamil Nadu", country: "India", lat: 13.1432, lon: 79.9083, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திருவள்ளூர்", districtTa: "திருவள்ளூர்", stateTa: "தமிழ்நாடு" },
  { name: "Avadi", district: "Tiruvallur", state: "Tamil Nadu", country: "India", lat: 13.1147, lon: 80.1018, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஆவடி", districtTa: "திருவள்ளூர்", stateTa: "தமிழ்நாடு" },
  { name: "Ambattur", district: "Tiruvallur", state: "Tamil Nadu", country: "India", lat: 13.1143, lon: 80.1548, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "அம்பத்தூர்", districtTa: "திருவள்ளூர்", stateTa: "தமிழ்நாடு" },
  { name: "Poonamallee", district: "Tiruvallur", state: "Tamil Nadu", country: "India", lat: 13.0489, lon: 80.0933, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பூந்தமல்லி", districtTa: "திருவள்ளூர்", stateTa: "தமிழ்நாடு" },
  { name: "Ponneri", district: "Tiruvallur", state: "Tamil Nadu", country: "India", lat: 13.3300, lon: 80.1900, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பொன்னேரி", districtTa: "திருவள்ளூர்", stateTa: "தமிழ்நாடு" },
  { name: "Gummidipoondi", district: "Tiruvallur", state: "Tamil Nadu", country: "India", lat: 13.4072, lon: 80.1292, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கும்மிடிப்பூண்டி", districtTa: "திருவள்ளூர்", stateTa: "தமிழ்நாடு" },
  { name: "Tiruttani", district: "Tiruvallur", state: "Tamil Nadu", country: "India", lat: 13.1786, lon: 79.6105, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திருத்தணி", districtTa: "திருவள்ளூர்", stateTa: "தமிழ்நாடு" },

  // 4. Kanchipuram
  { name: "Kanchipuram", district: "Kanchipuram", state: "Tamil Nadu", country: "India", lat: 12.8342, lon: 79.7036, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "காஞ்சிபுரம்", districtTa: "காஞ்சிபுரம்", stateTa: "தமிழ்நாடு" },
  { name: "Sriperumbudur", district: "Kanchipuram", state: "Tamil Nadu", country: "India", lat: 12.9691, lon: 79.9442, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஸ்ரீபெரும்புதூர்", districtTa: "காஞ்சிபுரம்", stateTa: "தமிழ்நாடு" },
  { name: "Walajabad", district: "Kanchipuram", state: "Tamil Nadu", country: "India", lat: 12.7936, lon: 79.8228, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "வாலாஜாபாத்", districtTa: "காஞ்சிபுரம்", stateTa: "தமிழ்நாடு" },
  { name: "Kundrathur", district: "Kanchipuram", state: "Tamil Nadu", country: "India", lat: 12.9984, lon: 80.0963, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "குன்றத்தூர்", districtTa: "காஞ்சிபுரம்", stateTa: "தமிழ்நாடு" },
  { name: "Uthiramerur", district: "Kanchipuram", state: "Tamil Nadu", country: "India", lat: 12.6133, lon: 79.7578, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "உத்திரமேரூர்", districtTa: "காஞ்சிபுரம்", stateTa: "தமிழ்நாடு" },

  // 5. Vellore
  { name: "Vellore", district: "Vellore", state: "Tamil Nadu", country: "India", lat: 12.9165, lon: 79.1325, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "வேலூர்", districtTa: "வேலூர்", stateTa: "தமிழ்நாடு" },
  { name: "Katpadi", district: "Vellore", state: "Tamil Nadu", country: "India", lat: 12.9818, lon: 79.1384, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "காட்பாடி", districtTa: "வேலூர்", stateTa: "தமிழ்நாடு" },
  { name: "Gudiyatham", district: "Vellore", state: "Tamil Nadu", country: "India", lat: 12.9463, lon: 78.8715, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "குடியாத்தம்", districtTa: "வேலூர்", stateTa: "தமிழ்நாடு" },
  { name: "Pernambut", district: "Vellore", state: "Tamil Nadu", country: "India", lat: 12.9341, lon: 78.7186, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பேரணாம்பட்டு", districtTa: "வேலூர்", stateTa: "தமிழ்நாடு" },
  { name: "Anaicut", district: "Vellore", state: "Tamil Nadu", country: "India", lat: 12.8725, lon: 78.9950, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "அணைக்கட்டு", districtTa: "வேலூர்", stateTa: "தமிழ்நாடு" },

  // 6. Ranipet
  { name: "Ranipet", district: "Ranipet", state: "Tamil Nadu", country: "India", lat: 12.9272, lon: 79.3330, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ராணிப்பேட்டை", districtTa: "ராணிப்பேட்டை", stateTa: "தமிழ்நாடு" },
  { name: "Arakkonam", district: "Ranipet", state: "Tamil Nadu", country: "India", lat: 13.0800, lon: 79.6700, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "அரக்கோணம்", districtTa: "ராணிப்பேட்டை", stateTa: "தமிழ்நாடு" },
  { name: "Arcot", district: "Ranipet", state: "Tamil Nadu", country: "India", lat: 12.9056, lon: 79.3333, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஆற்காடு", districtTa: "ராணிப்பேட்டை", stateTa: "தமிழ்நாடு" },
  { name: "Walajah", district: "Ranipet", state: "Tamil Nadu", country: "India", lat: 12.9333, lon: 79.3667, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "வாலாஜா", districtTa: "ராணிப்பேட்டை", stateTa: "தமிழ்நாடு" },
  { name: "Sholinghur", district: "Ranipet", state: "Tamil Nadu", country: "India", lat: 13.1147, lon: 79.4261, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சோளிங்கர்", districtTa: "ராணிப்பேட்டை", stateTa: "தமிழ்நாடு" },
  { name: "Nemili", district: "Ranipet", state: "Tamil Nadu", country: "India", lat: 13.0233, lon: 79.6200, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "நெமிலி", districtTa: "ராணிப்பேட்டை", stateTa: "தமிழ்நாடு" },

  // 7. Tirupathur
  { name: "Tirupathur", district: "Tirupathur", state: "Tamil Nadu", country: "India", lat: 12.4925, lon: 78.5678, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திருப்பத்தூர்", districtTa: "திருப்பத்தூர்", stateTa: "தமிழ்நாடு" },
  { name: "Vaniyambadi", district: "Tirupathur", state: "Tamil Nadu", country: "India", lat: 12.6825, lon: 78.6186, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "வாணியம்பாடி", districtTa: "திருப்பத்தூர்", stateTa: "தமிழ்நாடு" },
  { name: "Ambur", district: "Tirupathur", state: "Tamil Nadu", country: "India", lat: 12.7903, lon: 78.7166, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஆம்பூர்", districtTa: "திருப்பத்தூர்", stateTa: "தமிழ்நாடு" },
  { name: "Natrampalli", district: "Tirupathur", state: "Tamil Nadu", country: "India", lat: 12.5647, lon: 78.5414, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "நாட்ராம்பள்ளி", districtTa: "திருப்பத்தூர்", stateTa: "தமிழ்நாடு" },
  { name: "Jolarpettai", district: "Tirupathur", state: "Tamil Nadu", country: "India", lat: 12.5700, lon: 78.5800, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஜோலார்பேட்டை", districtTa: "திருப்பத்தூர்", stateTa: "தமிழ்நாடு" },

  // 8. Krishnagiri
  { name: "Krishnagiri", district: "Krishnagiri", state: "Tamil Nadu", country: "India", lat: 12.5186, lon: 78.2137, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கிருஷ்ணகிரி", districtTa: "கிருஷ்ணகிரி", stateTa: "தமிழ்நாடு" },
  { name: "Hosur", district: "Krishnagiri", state: "Tamil Nadu", country: "India", lat: 12.7409, lon: 77.8253, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஓசூர்", districtTa: "கிருஷ்ணகிரி", stateTa: "தமிழ்நாடு" },
  { name: "Denkanikottai", district: "Krishnagiri", state: "Tamil Nadu", country: "India", lat: 12.5278, lon: 77.7850, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "தேன்கனிக்கோட்டை", districtTa: "கிருஷ்ணகிரி", stateTa: "தமிழ்நாடு" },
  { name: "Pochampalli", district: "Krishnagiri", state: "Tamil Nadu", country: "India", lat: 12.3392, lon: 78.3614, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "போச்சம்பள்ளி", districtTa: "கிருஷ்ணகிரி", stateTa: "தமிழ்நாடு" },
  { name: "Uthangarai", district: "Krishnagiri", state: "Tamil Nadu", country: "India", lat: 12.2611, lon: 78.5433, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஊத்தங்கரை", districtTa: "கிருஷ்ணகிரி", stateTa: "தமிழ்நாடு" },
  { name: "Bargur", district: "Krishnagiri", state: "Tamil Nadu", country: "India", lat: 12.5500, lon: 78.3500, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பர்கூர்", districtTa: "கிருஷ்ணகிரி", stateTa: "தமிழ்நாடு" },
  { name: "Shoolagiri", district: "Krishnagiri", state: "Tamil Nadu", country: "India", lat: 12.6681, lon: 78.0167, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சூளகிரி", districtTa: "கிருஷ்ணகிரி", stateTa: "தமிழ்நாடு" },

  // 9. Dharmapuri
  { name: "Dharmapuri", district: "Dharmapuri", state: "Tamil Nadu", country: "India", lat: 12.1211, lon: 78.1582, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "தருமபுரி", districtTa: "தருமபுரி", stateTa: "தமிழ்நாடு" },
  { name: "Harur", district: "Dharmapuri", state: "Tamil Nadu", country: "India", lat: 12.0622, lon: 78.4908, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "அரூர்", districtTa: "தருமபுரி", stateTa: "தமிழ்நாடு" },
  { name: "Palacode", district: "Dharmapuri", state: "Tamil Nadu", country: "India", lat: 12.3025, lon: 78.0772, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பாலக்கோடு", districtTa: "தருமபுரி", stateTa: "தமிழ்நாடு" },
  { name: "Pennagaram", district: "Dharmapuri", state: "Tamil Nadu", country: "India", lat: 12.1333, lon: 77.9000, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பென்னாகரம்", districtTa: "தருமபுரி", stateTa: "தமிழ்நாடு" },
  { name: "Pappireddipatti", district: "Dharmapuri", state: "Tamil Nadu", country: "India", lat: 11.9133, lon: 78.3686, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பாப்பிரெட்டிப்பட்டி", districtTa: "தருமபுரி", stateTa: "தமிழ்நாடு" },

  // 10. Tiruvannamalai
  { name: "Tiruvannamalai", district: "Tiruvannamalai", state: "Tamil Nadu", country: "India", lat: 12.2253, lon: 79.0747, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திருவண்ணாமலை", districtTa: "திருவண்ணாமலை", stateTa: "தமிழ்நாடு" },
  { name: "Arani", district: "Tiruvannamalai", state: "Tamil Nadu", country: "India", lat: 12.6700, lon: 79.2800, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஆரணி", districtTa: "திருவண்ணாமலை", stateTa: "தமிழ்நாடு" },
  { name: "Cheyyar", district: "Tiruvannamalai", state: "Tamil Nadu", country: "India", lat: 12.6586, lon: 79.5447, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "செய்யாறு", districtTa: "திருவண்ணாமலை", stateTa: "தமிழ்நாடு" },
  { name: "Polur", district: "Tiruvannamalai", state: "Tamil Nadu", country: "India", lat: 12.5081, lon: 79.1258, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "போளூர்", districtTa: "திருவண்ணாமலை", stateTa: "தமிழ்நாடு" },
  { name: "Chengam", district: "Tiruvannamalai", state: "Tamil Nadu", country: "India", lat: 12.3089, lon: 78.8000, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "செங்கம்", districtTa: "திருவண்ணாமலை", stateTa: "தமிழ்நாடு" },
  { name: "Vandavasi", district: "Tiruvannamalai", state: "Tamil Nadu", country: "India", lat: 12.5028, lon: 79.6103, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "வந்தவாசி", districtTa: "திருவண்ணாமலை", stateTa: "தமிழ்நாடு" },

  // 11. Villupuram
  { name: "Villupuram", district: "Villupuram", state: "Tamil Nadu", country: "India", lat: 11.9401, lon: 79.4861, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "விழுப்புரம்", districtTa: "விழுப்புரம்", stateTa: "தமிழ்நாடு" },
  { name: "Tindivanam", district: "Villupuram", state: "Tamil Nadu", country: "India", lat: 12.2344, lon: 79.6517, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திண்டிவனம்", districtTa: "விழுப்புரம்", stateTa: "தமிழ்நாடு" },
  { name: "Gingee", district: "Villupuram", state: "Tamil Nadu", country: "India", lat: 12.2536, lon: 79.4183, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "செஞ்சி", districtTa: "விழுப்புரம்", stateTa: "தமிழ்நாடு" },
  { name: "Vanur", district: "Villupuram", state: "Tamil Nadu", country: "India", lat: 12.0250, lon: 79.7222, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "வானூர்", districtTa: "விழுப்புரம்", stateTa: "தமிழ்நாடு" },
  { name: "Vikravandi", district: "Villupuram", state: "Tamil Nadu", country: "India", lat: 12.0167, lon: 79.5500, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "விக்கிரவாண்டி", districtTa: "விழுப்புரம்", stateTa: "தமிழ்நாடு" },

  // 12. Kallakurichi
  { name: "Kallakurichi", district: "Kallakurichi", state: "Tamil Nadu", country: "India", lat: 11.7383, lon: 78.9639, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கள்ளக்குறிச்சி", districtTa: "கள்ளக்குறிச்சி", stateTa: "தமிழ்நாடு" },
  { name: "Sankarapuram", district: "Kallakurichi", state: "Tamil Nadu", country: "India", lat: 11.8833, lon: 78.9167, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சங்கராபுரம்", districtTa: "கள்ளக்குறிச்சி", stateTa: "தமிழ்நாடு" },
  { name: "Tirukkoyilur", district: "Kallakurichi", state: "Tamil Nadu", country: "India", lat: 11.9567, lon: 79.2000, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திருக்கோவிலூர்", districtTa: "கள்ளக்குறிச்சி", stateTa: "தமிழ்நாடு" },
  { name: "Ulundurpet", district: "Kallakurichi", state: "Tamil Nadu", country: "India", lat: 11.6903, lon: 79.2903, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "உளுந்தூர்பேட்டை", districtTa: "கள்ளக்குறிச்சி", stateTa: "தமிழ்நாடு" },
  { name: "Chinnasalem", district: "Kallakurichi", state: "Tamil Nadu", country: "India", lat: 11.6444, lon: 78.8806, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சின்னசேலம்", districtTa: "கள்ளக்குறிச்சி", stateTa: "தமிழ்நாடு" },

  // 13. Cuddalore
  { name: "Cuddalore", district: "Cuddalore", state: "Tamil Nadu", country: "India", lat: 11.7480, lon: 79.7714, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கடலூர்", districtTa: "கடலூர்", stateTa: "தமிழ்நாடு" },
  { name: "Chidambaram", district: "Cuddalore", state: "Tamil Nadu", country: "India", lat: 11.3992, lon: 79.6934, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சிதம்பரம்", districtTa: "கடலூர்", stateTa: "தமிழ்நாடு" },
  { name: "Virudhachalam", district: "Cuddalore", state: "Tamil Nadu", country: "India", lat: 11.5036, lon: 79.3247, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "விருத்தாசலம்", districtTa: "கடலூர்", stateTa: "தமிழ்நாடு" },
  { name: "Panruti", district: "Cuddalore", state: "Tamil Nadu", country: "India", lat: 11.7700, lon: 79.5500, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பண்ருட்டி", districtTa: "கடலூர்", stateTa: "தமிழ்நாடு" },
  { name: "Neyveli", district: "Cuddalore", state: "Tamil Nadu", country: "India", lat: 11.5975, lon: 79.4861, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "நெய்வேலி", districtTa: "கடலூர்", stateTa: "தமிழ்நாடு" },
  { name: "Tittakudi", district: "Cuddalore", state: "Tamil Nadu", country: "India", lat: 11.4167, lon: 79.1167, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திட்டக்குடி", districtTa: "கடலூர்", stateTa: "தமிழ்நாடு" },
  { name: "Kattumannarkoil", district: "Cuddalore", state: "Tamil Nadu", country: "India", lat: 11.2722, lon: 79.5528, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "காட்டுமன்னார்கோவில்", districtTa: "கடலூர்", stateTa: "தமிழ்நாடு" },

  // 14. Salem
  { name: "Salem", district: "Salem", state: "Tamil Nadu", country: "India", lat: 11.6643, lon: 78.1460, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சேலம்", districtTa: "சேலம்", stateTa: "தமிழ்நாடு" },
  { name: "Attur", district: "Salem", state: "Tamil Nadu", country: "India", lat: 11.5983, lon: 78.5986, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஆத்தூர்", districtTa: "சேலம்", stateTa: "தமிழ்நாடு" },
  { name: "Mettur", district: "Salem", state: "Tamil Nadu", country: "India", lat: 11.7967, lon: 77.8008, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "மேட்டூர்", districtTa: "சேலம்", stateTa: "தமிழ்நாடு" },
  { name: "Omalur", district: "Salem", state: "Tamil Nadu", country: "India", lat: 11.7456, lon: 78.0431, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஓமலூர்", districtTa: "சேலம்", stateTa: "தமிழ்நாடு" },
  { name: "Edappadi", district: "Salem", state: "Tamil Nadu", country: "India", lat: 11.5833, lon: 77.8500, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "எடப்பாடி", districtTa: "சேலம்", stateTa: "தமிழ்நாடு" },
  { name: "Sankari", district: "Salem", state: "Tamil Nadu", country: "India", lat: 11.4833, lon: 77.8667, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சங்ககிரி", districtTa: "சேலம்", stateTa: "தமிழ்நாடு" },
  { name: "Yercaud", district: "Salem", state: "Tamil Nadu", country: "India", lat: 11.7753, lon: 78.2094, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஏற்காடு", districtTa: "சேலம்", stateTa: "தமிழ்நாடு" },

  // 15. Namakkal
  { name: "Namakkal", district: "Namakkal", state: "Tamil Nadu", country: "India", lat: 11.2189, lon: 78.1674, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "நாமக்கல்", districtTa: "நாமக்கல்", stateTa: "தமிழ்நாடு" },
  { name: "Rasipuram", district: "Namakkal", state: "Tamil Nadu", country: "India", lat: 11.4642, lon: 78.1728, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ராசிபுரம்", districtTa: "நாமக்கல்", stateTa: "தமிழ்நாடு" },
  { name: "Tiruchengode", district: "Namakkal", state: "Tamil Nadu", country: "India", lat: 11.3789, lon: 77.8944, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திருச்செங்கோடு", districtTa: "நாமக்கல்", stateTa: "தமிழ்நாடு" },
  { name: "Paramathi Velur", district: "Namakkal", state: "Tamil Nadu", country: "India", lat: 11.0500, lon: 78.0167, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பரமத்தி வேலூர்", districtTa: "நாமக்கல்", stateTa: "தமிழ்நாடு" },
  { name: "Kumarapalayam", district: "Namakkal", state: "Tamil Nadu", country: "India", lat: 11.4422, lon: 77.7178, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "குமாரபாளையம்", districtTa: "நாமக்கல்", stateTa: "தமிழ்நாடு" },

  // 16. Erode
  { name: "Erode", district: "Erode", state: "Tamil Nadu", country: "India", lat: 11.3410, lon: 77.7172, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஈரோடு", districtTa: "ஈரோடு", stateTa: "தமிழ்நாடு" },
  { name: "Gobichettipalayam", district: "Erode", state: "Tamil Nadu", country: "India", lat: 11.4547, lon: 77.4372, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கோபிசெட்டிபாளையம்", districtTa: "ஈரோடு", stateTa: "தமிழ்நாடு" },
  { name: "Sathyamangalam", district: "Erode", state: "Tamil Nadu", country: "India", lat: 11.5033, lon: 77.2378, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சத்தியமங்கலம்", districtTa: "ஈரோடு", stateTa: "தமிழ்நாடு" },
  { name: "Bhavani", district: "Erode", state: "Tamil Nadu", country: "India", lat: 11.4456, lon: 77.6833, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பவானி", districtTa: "ஈரோடு", stateTa: "தமிழ்நாடு" },
  { name: "Perundurai", district: "Erode", state: "Tamil Nadu", country: "India", lat: 11.2778, lon: 77.5833, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பெருந்துறை", districtTa: "ஈரோடு", stateTa: "தமிழ்நாடு" },
  { name: "Anthiyur", district: "Erode", state: "Tamil Nadu", country: "India", lat: 11.5833, lon: 77.6000, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "அந்தியூர்", districtTa: "ஈரோடு", stateTa: "தமிழ்நாடு" },

  // 17. Tiruppur
  { name: "Tiruppur", district: "Tiruppur", state: "Tamil Nadu", country: "India", lat: 11.1085, lon: 77.3411, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திருப்பூர்", districtTa: "திருப்பூர்", stateTa: "தமிழ்நாடு" },
  { name: "Avinashi", district: "Tiruppur", state: "Tamil Nadu", country: "India", lat: 11.1942, lon: 77.2689, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "அவினாசி", districtTa: "திருப்பூர்", stateTa: "தமிழ்நாடு" },
  { name: "Palladam", district: "Tiruppur", state: "Tamil Nadu", country: "India", lat: 10.9994, lon: 77.2881, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பல்லடம்", districtTa: "திருப்பூர்", stateTa: "தமிழ்நாடு" },
  { name: "Dharapuram", district: "Tiruppur", state: "Tamil Nadu", country: "India", lat: 10.7308, lon: 77.5258, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "தாராபுரம்", districtTa: "திருப்பூர்", stateTa: "தமிழ்நாடு" },
  { name: "Kangeyam", district: "Tiruppur", state: "Tamil Nadu", country: "India", lat: 11.0064, lon: 77.5617, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "காங்கேயம்", districtTa: "திருப்பூர்", stateTa: "தமிழ்நாடு" },
  { name: "Udumalaipettai", district: "Tiruppur", state: "Tamil Nadu", country: "India", lat: 10.5842, lon: 77.2472, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "உடுமலைப்பேட்டை", districtTa: "திருப்பூர்", stateTa: "தமிழ்நாடு" },
  { name: "Madathukulam", district: "Tiruppur", state: "Tamil Nadu", country: "India", lat: 10.5500, lon: 77.3800, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "மடத்துக்குளம்", districtTa: "திருப்பூர்", stateTa: "தமிழ்நாடு" },

  // 18. Coimbatore
  { name: "Coimbatore", district: "Coimbatore", state: "Tamil Nadu", country: "India", lat: 11.0168, lon: 76.9558, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கோயம்புத்தூர்", districtTa: "கோயம்புத்தூர்", stateTa: "தமிழ்நாடு" },
  { name: "Pollachi", district: "Coimbatore", state: "Tamil Nadu", country: "India", lat: 10.6586, lon: 77.0094, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பொள்ளாச்சி", districtTa: "கோயம்புத்தூர்", stateTa: "தமிழ்நாடு" },
  { name: "Mettupalayam", district: "Coimbatore", state: "Tamil Nadu", country: "India", lat: 11.3000, lon: 76.9500, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "மேட்டுப்பாளையம்", districtTa: "கோயம்புத்தூர்", stateTa: "தமிழ்நாடு" },
  { name: "Sulur", district: "Coimbatore", state: "Tamil Nadu", country: "India", lat: 11.0256, lon: 77.1264, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சூலூர்", districtTa: "கோயம்புத்தூர்", stateTa: "தமிழ்நாடு" },
  { name: "Valparai", district: "Coimbatore", state: "Tamil Nadu", country: "India", lat: 10.3267, lon: 76.9553, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "வால்பாறை", districtTa: "கோயம்புத்தூர்", stateTa: "தமிழ்நாடு" },
  { name: "Annur", district: "Coimbatore", state: "Tamil Nadu", country: "India", lat: 11.2333, lon: 77.1333, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "அன்னூர்", districtTa: "கோயம்புத்தூர்", stateTa: "தமிழ்நாடு" },

  // 19. Nilgiris
  { name: "Udhagamandalam (Ooty)", district: "Nilgiris", state: "Tamil Nadu", country: "India", lat: 11.4102, lon: 76.6950, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "உதகமண்டலம் (ஊட்டி)", districtTa: "நீலகிரி", stateTa: "தமிழ்நாடு" },
  { name: "Coonoor", district: "Nilgiris", state: "Tamil Nadu", country: "India", lat: 11.3530, lon: 76.7959, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "குன்னூர்", districtTa: "நீலகிரி", stateTa: "தமிழ்நாடு" },
  { name: "Kotagiri", district: "Nilgiris", state: "Tamil Nadu", country: "India", lat: 11.4239, lon: 76.8656, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கோத்தகிரி", districtTa: "நீலகிரி", stateTa: "தமிழ்நாடு" },
  { name: "Gudalur", district: "Nilgiris", state: "Tamil Nadu", country: "India", lat: 11.5078, lon: 76.4928, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கூடலூர்", districtTa: "நீலகிரி", stateTa: "தமிழ்நாடு" },

  // 20. Karur
  { name: "Karur", district: "Karur", state: "Tamil Nadu", country: "India", lat: 10.9601, lon: 78.0766, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கரூர்", districtTa: "கரூர்", stateTa: "தமிழ்நாடு" },
  { name: "Kulithalai", district: "Karur", state: "Tamil Nadu", country: "India", lat: 10.9333, lon: 78.4167, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "குளித்தலை", districtTa: "கரூர்", stateTa: "தமிழ்நாடு" },
  { name: "Aravakurichi", district: "Karur", state: "Tamil Nadu", country: "India", lat: 10.7667, lon: 77.9167, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "அரவக்குறிச்சி", districtTa: "கரூர்", stateTa: "தமிழ்நாடு" },

  // 21. Tiruchirappalli
  { name: "Tiruchirappalli", district: "Tiruchirappalli", state: "Tamil Nadu", country: "India", lat: 10.7905, lon: 78.7047, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திருச்சிராப்பள்ளி", districtTa: "திருச்சிராப்பள்ளி", stateTa: "தமிழ்நாடு" },
  { name: "Srirangam", district: "Tiruchirappalli", state: "Tamil Nadu", country: "India", lat: 10.8622, lon: 78.6947, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஸ்ரீரங்கம்", districtTa: "திருச்சிராப்பள்ளி", stateTa: "தமிழ்நாடு" },
  { name: "Manapparai", district: "Tiruchirappalli", state: "Tamil Nadu", country: "India", lat: 10.6078, lon: 78.4181, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "மணப்பாறை", districtTa: "திருச்சிராப்பள்ளி", stateTa: "தமிழ்நாடு" },
  { name: "Musiri", district: "Tiruchirappalli", state: "Tamil Nadu", country: "India", lat: 10.9389, lon: 78.4417, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "முசிறி", districtTa: "திருச்சிராப்பள்ளி", stateTa: "தமிழ்நாடு" },
  { name: "Thuraiyur", district: "Tiruchirappalli", state: "Tamil Nadu", country: "India", lat: 11.1442, lon: 78.5975, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "துறையூர்", districtTa: "திருச்சிராப்பள்ளி", stateTa: "தமிழ்நாடு" },
  { name: "Lalgudi", district: "Tiruchirappalli", state: "Tamil Nadu", country: "India", lat: 10.8667, lon: 78.8167, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "லால்குடி", districtTa: "திருச்சிராப்பள்ளி", stateTa: "தமிழ்நாடு" },

  // 22. Perambalur
  { name: "Perambalur", district: "Perambalur", state: "Tamil Nadu", country: "India", lat: 11.2342, lon: 78.8820, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பெரம்பலூர்", districtTa: "பெரம்பலூர்", stateTa: "தமிழ்நாடு" },
  { name: "Veppanthattai", district: "Perambalur", state: "Tamil Nadu", country: "India", lat: 11.3500, lon: 78.8333, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "வேப்பந்தட்டை", districtTa: "பெரம்பலூர்", stateTa: "தமிழ்நாடு" },
  { name: "Kunnam", district: "Perambalur", state: "Tamil Nadu", country: "India", lat: 11.2500, lon: 79.0167, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "குன்னம்", districtTa: "பெரம்பலூர்", stateTa: "தமிழ்நாடு" },

  // 23. Ariyalur
  { name: "Ariyalur", district: "Ariyalur", state: "Tamil Nadu", country: "India", lat: 11.1401, lon: 79.0786, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "அரியலூர்", districtTa: "அரியலூர்", stateTa: "தமிழ்நாடு" },
  { name: "Jayankondam", district: "Ariyalur", state: "Tamil Nadu", country: "India", lat: 11.2167, lon: 79.3500, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஜெயங்கொண்டம்", districtTa: "அரியலூர்", stateTa: "தமிழ்நாடு" },
  { name: "Sendurai", district: "Ariyalur", state: "Tamil Nadu", country: "India", lat: 11.2667, lon: 79.1833, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "செந்துறை", districtTa: "அரியலூர்", stateTa: "தமிழ்நாடு" },

  // 24. Thanjavur
  { name: "Thanjavur", district: "Thanjavur", state: "Tamil Nadu", country: "India", lat: 10.7870, lon: 79.1378, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "தஞ்சாவூர்", districtTa: "தஞ்சாவூர்", stateTa: "தமிழ்நாடு" },
  { name: "Kumbakonam", district: "Thanjavur", state: "Tamil Nadu", country: "India", lat: 10.9602, lon: 79.3845, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கும்பகோணம்", districtTa: "தஞ்சாவூர்", stateTa: "தமிழ்நாடு" },
  { name: "Pattukkottai", district: "Thanjavur", state: "Tamil Nadu", country: "India", lat: 10.4286, lon: 79.3178, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பட்டுக்கோட்டை", districtTa: "தஞ்சாவூர்", stateTa: "தமிழ்நாடு" },
  { name: "Thiruvaiyaru", district: "Thanjavur", state: "Tamil Nadu", country: "India", lat: 10.8800, lon: 79.1000, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திருவையாறு", districtTa: "தஞ்சாவூர்", stateTa: "தமிழ்நாடு" },
  { name: "Papanasam", district: "Thanjavur", state: "Tamil Nadu", country: "India", lat: 10.9250, lon: 79.2800, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பாபநாசம்", districtTa: "தஞ்சாவூர்", stateTa: "தமிழ்நாடு" },
  { name: "Peravurani", district: "Thanjavur", state: "Tamil Nadu", country: "India", lat: 10.2833, lon: 79.2167, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பேராவூரணி", districtTa: "தஞ்சாவூர்", stateTa: "தமிழ்நாடு" },

  // 25. Tiruvarur
  { name: "Tiruvarur", district: "Tiruvarur", state: "Tamil Nadu", country: "India", lat: 10.7725, lon: 79.6365, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திருவாரூர்", districtTa: "திருவாரூர்", stateTa: "தமிழ்நாடு" },
  { name: "Mannargudi", district: "Tiruvarur", state: "Tamil Nadu", country: "India", lat: 10.6667, lon: 79.4500, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "மன்னார்குடி", districtTa: "திருவாரூர்", stateTa: "தமிழ்நாடு" },
  { name: "Thiruthuraipoondi", district: "Tiruvarur", state: "Tamil Nadu", country: "India", lat: 10.5333, lon: 79.6500, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திருத்துறைப்பூண்டி", districtTa: "திருவாரூர்", stateTa: "தமிழ்நாடு" },
  { name: "Needamangalam", district: "Tiruvarur", state: "Tamil Nadu", country: "India", lat: 10.7667, lon: 79.4167, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "நீடாமங்கலம்", districtTa: "திருவாரூர்", stateTa: "தமிழ்நாடு" },

  // 26. Nagapattinam
  { name: "Nagapattinam", district: "Nagapattinam", state: "Tamil Nadu", country: "India", lat: 10.7672, lon: 79.8449, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "நாகப்பட்டினம்", districtTa: "நாகப்பட்டினம்", stateTa: "தமிழ்நாடு" },
  { name: "Velankanni", district: "Nagapattinam", state: "Tamil Nadu", country: "India", lat: 10.6811, lon: 79.8436, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "வேளாங்கண்ணி", districtTa: "நாகப்பட்டினம்", stateTa: "தமிழ்நாடு" },
  { name: "Vedaranyam", district: "Nagapattinam", state: "Tamil Nadu", country: "India", lat: 10.3742, lon: 79.8492, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "வேதாரண்யம்", districtTa: "நாகப்பட்டினம்", stateTa: "தமிழ்நாடு" },
  { name: "Kilvelur", district: "Nagapattinam", state: "Tamil Nadu", country: "India", lat: 10.7167, lon: 79.7500, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கீழ்வேளூர்", districtTa: "நாகப்பட்டினம்", stateTa: "தமிழ்நாடு" },

  // 27. Mayiladuthurai
  { name: "Mayiladuthurai", district: "Mayiladuthurai", state: "Tamil Nadu", country: "India", lat: 11.1018, lon: 79.6522, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "மயிலாடுதுறை", districtTa: "மயிலாடுதுறை", stateTa: "தமிழ்நாடு" },
  { name: "Sirkazhi", district: "Mayiladuthurai", state: "Tamil Nadu", country: "India", lat: 11.2333, lon: 79.7333, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சீர்காழி", districtTa: "மயிலாடுதுறை", stateTa: "தமிழ்நாடு" },
  { name: "Tarangambadi", district: "Mayiladuthurai", state: "Tamil Nadu", country: "India", lat: 11.0300, lon: 79.8500, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "தரங்கம்பாடி", districtTa: "மயிலாடுதுறை", stateTa: "தமிழ்நாடு" },
  { name: "Kuthalam", district: "Mayiladuthurai", state: "Tamil Nadu", country: "India", lat: 11.0833, lon: 79.5667, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "குத்தாலம்", districtTa: "மயிலாடுதுறை", stateTa: "தமிழ்நாடு" },

  // 28. Pudukkottai
  { name: "Pudukkottai", district: "Pudukkottai", state: "Tamil Nadu", country: "India", lat: 10.3797, lon: 78.8208, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "புதுக்கோட்டை", districtTa: "புதுக்கோட்டை", stateTa: "தமிழ்நாடு" },
  { name: "Aranthangi", district: "Pudukkottai", state: "Tamil Nadu", country: "India", lat: 10.1667, lon: 78.9833, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "அறந்தாங்கி", districtTa: "புதுக்கோட்டை", stateTa: "தமிழ்நாடு" },
  { name: "Alangudi", district: "Pudukkottai", state: "Tamil Nadu", country: "India", lat: 10.3667, lon: 78.9833, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஆலங்குடி", districtTa: "புதுக்கோட்டை", stateTa: "தமிழ்நாடு" },
  { name: "Iluppur", district: "Pudukkottai", state: "Tamil Nadu", country: "India", lat: 10.5167, lon: 78.6333, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "இலுப்பூர்", districtTa: "புதுக்கோட்டை", stateTa: "தமிழ்நாடு" },

  // 29. Dindigul
  { name: "Dindigul", district: "Dindigul", state: "Tamil Nadu", country: "India", lat: 10.3673, lon: 77.9803, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திண்டுக்கல்", districtTa: "திண்டுக்கல்", stateTa: "தமிழ்நாடு" },
  { name: "Palani", district: "Dindigul", state: "Tamil Nadu", country: "India", lat: 10.4500, lon: 77.5167, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பழனி", districtTa: "திண்டுக்கல்", stateTa: "தமிழ்நாடு" },
  { name: "Oddanchatram", district: "Dindigul", state: "Tamil Nadu", country: "India", lat: 10.4833, lon: 77.7500, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஒட்டன்சத்திரம்", districtTa: "திண்டுக்கல்", stateTa: "தமிழ்நாடு" },
  { name: "Kodaikanal", district: "Dindigul", state: "Tamil Nadu", country: "India", lat: 10.2381, lon: 77.4892, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கொடைக்கானல்", districtTa: "திண்டுக்கல்", stateTa: "தமிழ்நாடு" },
  { name: "Natham", district: "Dindigul", state: "Tamil Nadu", country: "India", lat: 10.2333, lon: 78.2333, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "நத்தம்", districtTa: "திண்டுக்கல்", stateTa: "தமிழ்நாடு" },
  { name: "Nilakottai", district: "Dindigul", state: "Tamil Nadu", country: "India", lat: 10.1667, lon: 77.8667, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "நிலக்கோட்டை", districtTa: "திண்டுக்கல்", stateTa: "தமிழ்நாடு" },

  // 30. Theni
  { name: "Theni", district: "Theni", state: "Tamil Nadu", country: "India", lat: 10.0104, lon: 77.4768, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "தேனி", districtTa: "தேனி", stateTa: "தமிழ்நாடு" },
  { name: "Periyakulam", district: "Theni", state: "Tamil Nadu", country: "India", lat: 10.1167, lon: 77.5500, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பெரியகுளம்", districtTa: "தேனி", stateTa: "தமிழ்நாடு" },
  { name: "Bodinaickanur", district: "Theni", state: "Tamil Nadu", country: "India", lat: 10.0167, lon: 77.3500, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "போடிநாயக்கனூர்", districtTa: "தேனி", stateTa: "தமிழ்நாடு" },
  { name: "Cumbum", district: "Theni", state: "Tamil Nadu", country: "India", lat: 9.7333, lon: 77.3000, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கம்பம்", districtTa: "தேனி", stateTa: "தமிழ்நாடு" },
  { name: "Uthamapalayam", district: "Theni", state: "Tamil Nadu", country: "India", lat: 9.8000, lon: 77.3333, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "உத்தமபாளையம்", districtTa: "தேனி", stateTa: "தமிழ்நாடு" },

  // 31. Madurai
  { name: "Madurai", district: "Madurai", state: "Tamil Nadu", country: "India", lat: 9.9252, lon: 78.1198, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "மதுரை", districtTa: "மதுரை", stateTa: "தமிழ்நாடு" },
  { name: "Melur", district: "Madurai", state: "Tamil Nadu", country: "India", lat: 10.0333, lon: 78.3333, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "மேலூர்", districtTa: "மதுரை", stateTa: "தமிழ்நாடு" },
  { name: "Thirumangalam", district: "Madurai", state: "Tamil Nadu", country: "India", lat: 9.8236, lon: 77.9867, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திருமங்கலம்", districtTa: "மதுரை", stateTa: "தமிழ்நாடு" },
  { name: "Usilampatti", district: "Madurai", state: "Tamil Nadu", country: "India", lat: 9.9667, lon: 77.7833, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "உசிலம்பட்டி", districtTa: "மதுரை", stateTa: "தமிழ்நாடு" },
  { name: "Vadipatti", district: "Madurai", state: "Tamil Nadu", country: "India", lat: 10.0833, lon: 77.9500, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "வாடிப்பட்டி", districtTa: "மதுரை", stateTa: "தமிழ்நாடு" },

  // 32. Sivaganga
  { name: "Sivaganga", district: "Sivaganga", state: "Tamil Nadu", country: "India", lat: 9.8433, lon: 78.4809, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சிவகங்கை", districtTa: "சிவகங்கை", stateTa: "தமிழ்நாடு" },
  { name: "Karaikudi", district: "Sivaganga", state: "Tamil Nadu", country: "India", lat: 10.0735, lon: 78.7732, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "காரைக்குடி", districtTa: "சிவகங்கை", stateTa: "தமிழ்நாடு" },
  { name: "Devakottai", district: "Sivaganga", state: "Tamil Nadu", country: "India", lat: 9.9500, lon: 78.8200, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "தேவகோட்டை", districtTa: "சிவகங்கை", stateTa: "தமிழ்நாடு" },
  { name: "Manamadurai", district: "Sivaganga", state: "Tamil Nadu", country: "India", lat: 9.7000, lon: 78.4500, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "மானாமதுரை", districtTa: "சிவகங்கை", stateTa: "தமிழ்நாடு" },

  // 33. Ramanathapuram
  { name: "Ramanathapuram", district: "Ramanathapuram", state: "Tamil Nadu", country: "India", lat: 9.3639, lon: 78.8395, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ராமநாதபுரம்", districtTa: "ராமநாதபுரம்", stateTa: "தமிழ்நாடு" },
  { name: "Rameswaram", district: "Ramanathapuram", state: "Tamil Nadu", country: "India", lat: 9.2876, lon: 79.3129, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ராமேஸ்வரம்", districtTa: "ராமநாதபுரம்", stateTa: "தமிழ்நாடு" },
  { name: "Paramakudi", district: "Ramanathapuram", state: "Tamil Nadu", country: "India", lat: 9.5444, lon: 78.5917, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பரமக்குடி", districtTa: "ராமநாதபுரம்", stateTa: "தமிழ்நாடு" },
  { name: "Mudukulathur", district: "Ramanathapuram", state: "Tamil Nadu", country: "India", lat: 9.3333, lon: 78.5000, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "முதுகுளத்தூர்", districtTa: "ராமநாதபுரம்", stateTa: "தமிழ்நாடு" },

  // 34. Virudhunagar
  { name: "Virudhunagar", district: "Virudhunagar", state: "Tamil Nadu", country: "India", lat: 9.5872, lon: 77.9514, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "விருதுநகர்", districtTa: "விருதுநகர்", stateTa: "தமிழ்நாடு" },
  { name: "Sivakasi", district: "Virudhunagar", state: "Tamil Nadu", country: "India", lat: 9.4533, lon: 77.7978, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சிவகாசி", districtTa: "விருதுநகர்", stateTa: "தமிழ்நாடு" },
  { name: "Rajapalayam", district: "Virudhunagar", state: "Tamil Nadu", country: "India", lat: 9.4500, lon: 77.5500, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ராஜபாளையம்", districtTa: "விருதுநகர்", stateTa: "தமிழ்நாடு" },
  { name: "Srivilliputhur", district: "Virudhunagar", state: "Tamil Nadu", country: "India", lat: 9.5167, lon: 77.6333, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஸ்ரீவில்லிபுத்தூர்", districtTa: "விருதுநகர்", stateTa: "தமிழ்நாடு" },
  { name: "Aruppukkottai", district: "Virudhunagar", state: "Tamil Nadu", country: "India", lat: 9.5100, lon: 78.1000, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "அருப்புக்கோட்டை", districtTa: "விருதுநகர்", stateTa: "தமிழ்நாடு" },
  { name: "Sattur", district: "Virudhunagar", state: "Tamil Nadu", country: "India", lat: 9.3667, lon: 77.9333, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சாத்தூர்", districtTa: "விருதுநகர்", stateTa: "தமிழ்நாடு" },

  // 35. Tenkasi
  { name: "Tenkasi", district: "Tenkasi", state: "Tamil Nadu", country: "India", lat: 8.9594, lon: 77.3161, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "தென்காசி", districtTa: "தென்காசி", stateTa: "தமிழ்நாடு" },
  { name: "Sankarankovil", district: "Tenkasi", state: "Tamil Nadu", country: "India", lat: 9.1719, lon: 77.5336, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சங்கரன்கோவில்", districtTa: "தென்காசி", stateTa: "தமிழ்நாடு" },
  { name: "Kadayanallur", district: "Tenkasi", state: "Tamil Nadu", country: "India", lat: 9.0753, lon: 77.3456, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கடையநல்லூர்", districtTa: "தென்காசி", stateTa: "தமிழ்நாடு" },
  { name: "Shenkottai", district: "Tenkasi", state: "Tamil Nadu", country: "India", lat: 8.9833, lon: 77.2500, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "செங்கோட்டை", districtTa: "தென்காசி", stateTa: "தமிழ்நாடு" },
  { name: "Alangulam", district: "Tenkasi", state: "Tamil Nadu", country: "India", lat: 8.8667, lon: 77.5000, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஆலங்குளம்", districtTa: "தென்காசி", stateTa: "தமிழ்நாடு" },

  // 36. Tirunelveli
  { name: "Tirunelveli", district: "Tirunelveli", state: "Tamil Nadu", country: "India", lat: 8.7139, lon: 77.7567, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திருநெல்வேலி", districtTa: "திருநெல்வேலி", stateTa: "தமிழ்நாடு" },
  { name: "Palayamkottai", district: "Tirunelveli", state: "Tamil Nadu", country: "India", lat: 8.7167, lon: 77.7333, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பாளையங்கோட்டை", districtTa: "திருநெல்வேலி", stateTa: "தமிழ்நாடு" },
  { name: "Ambasamudram", district: "Tirunelveli", state: "Tamil Nadu", country: "India", lat: 8.7000, lon: 77.4500, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "அம்பாசமுத்திரம்", districtTa: "திருநெல்வேலி", stateTa: "தமிழ்நாடு" },
  { name: "Nanguneri", district: "Tirunelveli", state: "Tamil Nadu", country: "India", lat: 8.4833, lon: 77.6667, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "நாங்குநேரி", districtTa: "திருநெல்வேலி", stateTa: "தமிழ்நாடு" },
  { name: "Radhapuram", district: "Tirunelveli", state: "Tamil Nadu", country: "India", lat: 8.2667, lon: 77.6833, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ராதாபுரம்", districtTa: "திருநெல்வேலி", stateTa: "தமிழ்நாடு" },

  // 37. Thoothukudi
  { name: "Thoothukudi", district: "Thoothukudi", state: "Tamil Nadu", country: "India", lat: 8.7642, lon: 78.1348, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "தூத்துக்குடி", districtTa: "தூத்துக்குடி", stateTa: "தமிழ்நாடு" },
  { name: "Tiruchendur", district: "Thoothukudi", state: "Tamil Nadu", country: "India", lat: 8.4950, lon: 78.1250, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திருச்செந்தூர்", districtTa: "தூத்துக்குடி", stateTa: "தமிழ்நாடு" },
  { name: "Kovilpatti", district: "Thoothukudi", state: "Tamil Nadu", country: "India", lat: 9.1700, lon: 77.8700, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கோவில்பட்டி", districtTa: "தூத்துக்குடி", stateTa: "தமிழ்நாடு" },
  { name: "Srivaikuntam", district: "Thoothukudi", state: "Tamil Nadu", country: "India", lat: 8.6236, lon: 77.9250, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஸ்ரீவைகுண்டம்", districtTa: "தூத்துக்குடி", stateTa: "தமிழ்நாடு" },
  { name: "Vilathikulam", district: "Thoothukudi", state: "Tamil Nadu", country: "India", lat: 9.1333, lon: 78.1667, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "விளாத்திகுளம்", districtTa: "தூத்துக்குடி", stateTa: "தமிழ்நாடு" },
  { name: "Ettayapuram", district: "Thoothukudi", state: "Tamil Nadu", country: "India", lat: 9.1500, lon: 77.9833, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "எட்டயபுரம்", districtTa: "தூத்துக்குடி", stateTa: "தமிழ்நாடு" },

  // 38. Kanniyakumari
  { name: "Nagercoil", district: "Kanniyakumari", state: "Tamil Nadu", country: "India", lat: 8.1833, lon: 77.4119, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "நாகர்கோவில்", districtTa: "கன்னியாகுமரி", stateTa: "தமிழ்நாடு" },
  { name: "Kanniyakumari", district: "Kanniyakumari", state: "Tamil Nadu", country: "India", lat: 8.0883, lon: 77.5385, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கன்னியாகுமரி", districtTa: "கன்னியாகுமரி", stateTa: "தமிழ்நாடு" },
  { name: "Padmanabhapuram", district: "Kanniyakumari", state: "Tamil Nadu", country: "India", lat: 8.2433, lon: 77.3275, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பத்மநாபபுரம்", districtTa: "கன்னியாகுமரி", stateTa: "தமிழ்நாடு" },
  { name: "Thuckalay", district: "Kanniyakumari", state: "Tamil Nadu", country: "India", lat: 8.2500, lon: 77.3167, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "தக்கலை", districtTa: "கன்னியாகுமரி", stateTa: "தமிழ்நாடு" },
  { name: "Kuzhithurai", district: "Kanniyakumari", state: "Tamil Nadu", country: "India", lat: 8.3167, lon: 77.1833, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "குழித்துறை", districtTa: "கன்னியாகுமரி", stateTa: "தமிழ்நாடு" },
  { name: "Marthandam", district: "Kanniyakumari", state: "Tamil Nadu", country: "India", lat: 8.3000, lon: 77.2167, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "மார்த்தாண்டம்", districtTa: "கன்னியாகுமரி", stateTa: "தமிழ்நாடு" },
  { name: "Colachel", district: "Kanniyakumari", state: "Tamil Nadu", country: "India", lat: 8.1764, lon: 77.2583, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "குளச்சல்", districtTa: "கன்னியாகுமரி", stateTa: "தமிழ்நாடு" },

  // Union Territory - Puducherry
  { name: "Puducherry", district: "Puducherry", state: "Puducherry UT", country: "India", lat: 11.9416, lon: 79.8083, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "புதுச்சேரி", districtTa: "புதுச்சேரி", stateTa: "புதுச்சேரி" },
  { name: "Karaikal", district: "Karaikal", state: "Puducherry UT", country: "India", lat: 10.9254, lon: 79.8380, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "காரைக்கால்", districtTa: "காரைக்கால்", stateTa: "புதுச்சேரி" },

  // ==========================================
  // OTHER MAJOR INDIAN DISTRICTS & CITIES
  // ==========================================
  // Karnataka
  { name: "Bengaluru", district: "Bengaluru Urban", state: "Karnataka", country: "India", lat: 12.9716, lon: 77.5946, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பெங்களூரு", districtTa: "பெங்களூரு நகர்ப்புறம்", stateTa: "கர்நாடகா" },
  { name: "Mysuru", district: "Mysuru", state: "Karnataka", country: "India", lat: 12.2958, lon: 76.6394, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "மைசூரு", districtTa: "மைசூரு", stateTa: "கர்நாடகா" },
  { name: "Mangaluru", district: "Dakshina Kannada", state: "Karnataka", country: "India", lat: 12.9141, lon: 74.8560, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "மங்களூரு", districtTa: "தட்சிண கன்னடா", stateTa: "கர்நாடகா" },
  { name: "Hubballi-Dharwad", district: "Dharwad", state: "Karnataka", country: "India", lat: 15.3647, lon: 75.1240, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஹுப்பள்ளி", districtTa: "தார்வாட்", stateTa: "கர்நாடகா" },
  { name: "Belagavi", district: "Belagavi", state: "Karnataka", country: "India", lat: 15.8497, lon: 74.4977, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பெலகாவி", districtTa: "பெலகாவி", stateTa: "கர்நாடகா" },
  { name: "Shivamogga", district: "Shivamogga", state: "Karnataka", country: "India", lat: 13.9299, lon: 75.5681, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சிவமொக்கா", districtTa: "சிவமொக்கா", stateTa: "கர்நாடகா" },
  { name: "Udupi", district: "Udupi", state: "Karnataka", country: "India", lat: 13.3409, lon: 74.7421, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "உடுப்பி", districtTa: "உடுப்பி", stateTa: "கர்நாடகா" },
  { name: "Tumakuru", district: "Tumakuru", state: "Karnataka", country: "India", lat: 13.3379, lon: 77.1010, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "துமகூரு", districtTa: "துமகூரு", stateTa: "கர்நாடகா" },
  { name: "Ballari", district: "Ballari", state: "Karnataka", country: "India", lat: 15.1394, lon: 76.9214, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பல்லாரி", districtTa: "பல்லாரி", stateTa: "கர்நாடகா" },
  { name: "Davanagere", district: "Davanagere", state: "Karnataka", country: "India", lat: 14.4644, lon: 75.9218, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "தாவணகெரே", districtTa: "தாவணகெரே", stateTa: "கர்நாடகா" },

  // Kerala
  { name: "Thiruvananthapuram", district: "Thiruvananthapuram", state: "Kerala", country: "India", lat: 8.5241, lon: 76.9366, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திருவனந்தபுரம்", districtTa: "திருவனந்தபுரம்", stateTa: "கேரளா" },
  { name: "Kochi", district: "Ernakulam", state: "Kerala", country: "India", lat: 9.9312, lon: 76.2673, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கொச்சி", districtTa: "எர்ணாகுளம்", stateTa: "கேரளா" },
  { name: "Kozhikode", district: "Kozhikode", state: "Kerala", country: "India", lat: 11.2588, lon: 75.7804, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கோழிக்கோடு", districtTa: "கோழிக்கோடு", stateTa: "கேரளா" },
  { name: "Thrissur", district: "Thrissur", state: "Kerala", country: "India", lat: 10.5276, lon: 76.2144, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திருச்சூர்", districtTa: "திருச்சூர்", stateTa: "கேரளா" },
  { name: "Palakkad", district: "Palakkad", state: "Kerala", country: "India", lat: 10.7867, lon: 76.6548, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பாலக்காடு", districtTa: "பாலக்காடு", stateTa: "கேரளா" },
  { name: "Kollam", district: "Kollam", state: "Kerala", country: "India", lat: 8.8932, lon: 76.6141, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கொல்லம்", districtTa: "கொல்லம்", stateTa: "கேரளா" },
  { name: "Kannur", district: "Kannur", state: "Kerala", country: "India", lat: 11.8745, lon: 75.3704, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கண்ணூர்", districtTa: "கண்ணூர்", stateTa: "கேரளா" },
  { name: "Alappuzha", district: "Alappuzha", state: "Kerala", country: "India", lat: 9.4981, lon: 76.3388, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஆலப்புழா", districtTa: "ஆலப்புழா", stateTa: "கேரளா" },
  { name: "Kottayam", district: "Kottayam", state: "Kerala", country: "India", lat: 9.5916, lon: 76.5222, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கோட்டயம்", districtTa: "கோட்டயம்", stateTa: "கேரளா" },

  // Andhra Pradesh & Telangana
  { name: "Hyderabad", district: "Hyderabad", state: "Telangana", country: "India", lat: 17.3850, lon: 78.4867, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஹைதராபாத்", districtTa: "ஹைதராபாத்", stateTa: "தெலுங்கானா" },
  { name: "Warangal", district: "Warangal", state: "Telangana", country: "India", lat: 17.9689, lon: 79.5941, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "வாரங்கல்", districtTa: "வாரங்கல்", stateTa: "தெலுங்கானா" },
  { name: "Nizamabad", district: "Nizamabad", state: "Telangana", country: "India", lat: 18.6725, lon: 78.0941, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "நிஜாமாபாத்", districtTa: "நிஜாமாபாத்", stateTa: "தெலுங்கானா" },
  { name: "Karimnagar", district: "Karimnagar", state: "Telangana", country: "India", lat: 18.4386, lon: 79.1288, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கரீம்நகர்", districtTa: "கரீம்நகர்", stateTa: "தெலுங்கானா" },
  { name: "Khammam", district: "Khammam", state: "Telangana", country: "India", lat: 17.2473, lon: 80.1514, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கம்மம்", districtTa: "கம்மம்", stateTa: "தெலுங்கானா" },
  { name: "Visakhapatnam", district: "Visakhapatnam", state: "Andhra Pradesh", country: "India", lat: 17.6868, lon: 83.2185, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "விசாகப்பட்டினம்", districtTa: "விசாகப்பட்டினம்", stateTa: "ஆந்திரப் பிரதேசம்" },
  { name: "Vijayawada", district: "NTR District", state: "Andhra Pradesh", country: "India", lat: 16.5062, lon: 80.6480, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "விஜயவாடா", districtTa: "என்.டி.ஆர் மாவட்டம்", stateTa: "ஆந்திரப் பிரதேசம்" },
  { name: "Guntur", district: "Guntur", state: "Andhra Pradesh", country: "India", lat: 16.3067, lon: 80.4365, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "குண்டூர்", districtTa: "குண்டூர்", stateTa: "ஆந்திரப் பிரதேசம்" },
  { name: "Tirupati", district: "Tirupati", state: "Andhra Pradesh", country: "India", lat: 13.6288, lon: 79.4192, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "திருப்பதி", districtTa: "திருப்பதி", stateTa: "ஆந்திரப் பிரதேசம்" },
  { name: "Nellore", district: "SPSR Nellore", state: "Andhra Pradesh", country: "India", lat: 14.4426, lon: 79.9865, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "நெல்லூர்", districtTa: "நெல்லூர்", stateTa: "ஆந்திரப் பிரதேசம்" },
  { name: "Kurnool", district: "Kurnool", state: "Andhra Pradesh", country: "India", lat: 15.8281, lon: 78.0373, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கர்நூல்", districtTa: "கர்நூல்", stateTa: "ஆந்திரப் பிரதேசம்" },
  { name: "Rajahmundry", district: "East Godavari", state: "Andhra Pradesh", country: "India", lat: 17.0005, lon: 81.8040, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ராஜமுந்திரி", districtTa: "கிழக்கு கோதாவரி", stateTa: "ஆந்திரப் பிரதேசம்" },
  { name: "Kakinada", district: "Kakinada", state: "Andhra Pradesh", country: "India", lat: 16.9891, lon: 82.2475, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "காக்கிநாடா", districtTa: "காக்கிநாடா", stateTa: "ஆந்திரப் பிரதேசம்" },
  { name: "Kadapa", district: "YSR Kadapa", state: "Andhra Pradesh", country: "India", lat: 14.4673, lon: 78.8242, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கடப்பா", districtTa: "கடப்பா", stateTa: "ஆந்திரப் பிரதேசம்" },
  { name: "Anantapur", district: "Anantapur", state: "Andhra Pradesh", country: "India", lat: 14.6819, lon: 77.6006, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "அனந்தபூர்", districtTa: "அனந்தபூர்", stateTa: "ஆந்திரப் பிரதேசம்" },
  { name: "Chittoor", district: "Chittoor", state: "Andhra Pradesh", country: "India", lat: 13.2172, lon: 79.1003, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சித்தூர்", districtTa: "சித்தூர்", stateTa: "ஆந்திரப் பிரதேசம்" },

  // Maharashtra & Goa
  { name: "Mumbai", district: "Mumbai City", state: "Maharashtra", country: "India", lat: 19.0760, lon: 72.8777, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "மும்பை", districtTa: "மும்பை நகரம்", stateTa: "மகாராஷ்டிரா" },
  { name: "Pune", district: "Pune", state: "Maharashtra", country: "India", lat: 18.5204, lon: 73.8567, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "புனே", districtTa: "புனே", stateTa: "மகாராஷ்டிரா" },
  { name: "Nagpur", district: "Nagpur", state: "Maharashtra", country: "India", lat: 21.1458, lon: 79.0882, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "நாக்பூர்", districtTa: "நாக்பூர்", stateTa: "மகாராஷ்டிரா" },
  { name: "Nashik", district: "Nashik", state: "Maharashtra", country: "India", lat: 19.9975, lon: 73.7898, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "நாசிக்", districtTa: "நாசிக்", stateTa: "மகாராஷ்டிரா" },
  { name: "Thane", district: "Thane", state: "Maharashtra", country: "India", lat: 19.2183, lon: 72.9781, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "தானே", districtTa: "தானே", stateTa: "மகாராஷ்டிரா" },
  { name: "Aurangabad (Chhatrapati Sambhajinagar)", district: "Aurangabad", state: "Maharashtra", country: "India", lat: 19.8762, lon: 75.3433, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஔரங்காபாத்", districtTa: "ஔரங்காபாத்", stateTa: "மகாராஷ்டிரா" },
  { name: "Kolhapur", district: "Kolhapur", state: "Maharashtra", country: "India", lat: 16.7050, lon: 74.2433, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கோலாப்பூர்", districtTa: "கோலாப்பூர்", stateTa: "மகாராஷ்டிரா" },
  { name: "Solapur", district: "Solapur", state: "Maharashtra", country: "India", lat: 17.6599, lon: 75.9064, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சோலாப்பூர்", districtTa: "சோலாப்பூர்", stateTa: "மகாராஷ்டிரா" },
  { name: "Panaji", district: "North Goa", state: "Goa", country: "India", lat: 15.4909, lon: 73.8278, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பனாஜி", districtTa: "வடக்கு கோவா", stateTa: "கோவா" },
  { name: "Margao", district: "South Goa", state: "Goa", country: "India", lat: 15.2832, lon: 73.9862, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "மட்காவ்", districtTa: "தெற்கு கோவா", stateTa: "கோவா" },

  // Gujarat
  { name: "Ahmedabad", district: "Ahmedabad", state: "Gujarat", country: "India", lat: 23.0225, lon: 72.5714, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "அகமதாபாத்", districtTa: "அகமதாபாத்", stateTa: "குஜராத்" },
  { name: "Surat", district: "Surat", state: "Gujarat", country: "India", lat: 21.1702, lon: 72.8311, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சூரத்", districtTa: "சூரத்", stateTa: "குஜராத்" },
  { name: "Vadodara", district: "Vadodara", state: "Gujarat", country: "India", lat: 22.3072, lon: 73.1812, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "வதோதரா", districtTa: "வதோதரா", stateTa: "குஜராத்" },
  { name: "Rajkot", district: "Rajkot", state: "Gujarat", country: "India", lat: 22.3039, lon: 70.8022, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ராஜ்கோட்", districtTa: "ராஜ்கோட்", stateTa: "குஜராத்" },
  { name: "Gandhinagar", district: "Gandhinagar", state: "Gujarat", country: "India", lat: 23.2156, lon: 72.6369, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "காந்திநகர்", districtTa: "காந்திநகர்", stateTa: "குஜராத்" },

  // North India & NCR
  { name: "New Delhi", district: "New Delhi", state: "Delhi NCR", country: "India", lat: 28.6139, lon: 77.2090, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "புது தில்லி", districtTa: "புது தில்லி", stateTa: "தில்லி" },
  { name: "Noida", district: "Gautam Buddha Nagar", state: "Uttar Pradesh", country: "India", lat: 28.5355, lon: 77.3910, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "நொய்டா", districtTa: "கௌதம் புத்த நகர்", stateTa: "உத்தரப் பிரதேசம்" },
  { name: "Greater Noida", district: "Gautam Buddha Nagar", state: "Uttar Pradesh", country: "India", lat: 28.4744, lon: 77.5040, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கிரேட்டர் நொய்டா", districtTa: "கௌதம் புத்த நகர்", stateTa: "உத்தரப் பிரதேசம்" },
  { name: "Gurugram", district: "Gurugram", state: "Haryana", country: "India", lat: 28.4595, lon: 77.0266, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "குருகிராம்", districtTa: "குருகிராம்", stateTa: "ஹரியானா" },
  { name: "Faridabad", district: "Faridabad", state: "Haryana", country: "India", lat: 28.4089, lon: 77.3178, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பரிதாபாத்", districtTa: "பரிதாபாத்", stateTa: "ஹரியானா" },
  { name: "Ghaziabad", district: "Ghaziabad", state: "Uttar Pradesh", country: "India", lat: 28.6692, lon: 77.4538, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "காசியாபாத்", districtTa: "காசியாபாத்", stateTa: "உத்தரப் பிரதேசம்" },

  // Uttar Pradesh & Bihar
  { name: "Lucknow", district: "Lucknow", state: "Uttar Pradesh", country: "India", lat: 26.8467, lon: 80.9462, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "லக்னோ", districtTa: "லக்னோ", stateTa: "உத்தரப் பிரதேசம்" },
  { name: "Kanpur", district: "Kanpur Nagar", state: "Uttar Pradesh", country: "India", lat: 26.4499, lon: 80.3319, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கான்பூர்", districtTa: "கான்பூர்", stateTa: "உத்தரப் பிரதேசம்" },
  { name: "Varanasi", district: "Varanasi", state: "Uttar Pradesh", country: "India", lat: 25.3176, lon: 82.9739, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "வாரணாசி (காசி)", districtTa: "வாரணாசி", stateTa: "உத்தரப் பிரதேசம்" },
  { name: "Prayagraj (Allahabad)", district: "Prayagraj", state: "Uttar Pradesh", country: "India", lat: 25.4358, lon: 81.8463, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பிரயாக்ராஜ் (அலகாபாத்)", districtTa: "பிரயாக்ராஜ்", stateTa: "உத்தரப் பிரதேசம்" },
  { name: "Agra", district: "Agra", state: "Uttar Pradesh", country: "India", lat: 27.1767, lon: 78.0081, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஆக்ரா", districtTa: "ஆக்ரா", stateTa: "உத்தரப் பிரதேசம்" },
  { name: "Mathura", district: "Mathura", state: "Uttar Pradesh", country: "India", lat: 27.4924, lon: 77.6737, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "மதுரா", districtTa: "மதுரா", stateTa: "உத்தரப் பிரதேசம்" },
  { name: "Ayodhya", district: "Ayodhya", state: "Uttar Pradesh", country: "India", lat: 26.7922, lon: 82.1998, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "அயோத்தி", districtTa: "அயோத்தி", stateTa: "உத்தரப் பிரதேசம்" },
  { name: "Patna", district: "Patna", state: "Bihar", country: "India", lat: 25.5941, lon: 85.1376, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பாட்னா", districtTa: "பாட்னா", stateTa: "பீகார்" },
  { name: "Gaya", district: "Gaya", state: "Bihar", country: "India", lat: 24.7914, lon: 85.0002, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கயா", districtTa: "கயா", stateTa: "பீகார்" },

  // West Bengal & North East & Odisha
  { name: "Kolkata", district: "Kolkata", state: "West Bengal", country: "India", lat: 22.5726, lon: 88.3639, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "கொல்கத்தா", districtTa: "கொல்கத்தா", stateTa: "மேற்கு வங்கம்" },
  { name: "Howrah", district: "Howrah", state: "West Bengal", country: "India", lat: 22.5958, lon: 88.2636, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஹவுரா", districtTa: "ஹவுரா", stateTa: "மேற்கு வங்கம்" },
  { name: "Siliguri", district: "Darjeeling", state: "West Bengal", country: "India", lat: 26.7271, lon: 88.3953, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சிலிகுரி", districtTa: "டார்ஜிலிங்", stateTa: "மேற்கு வங்கம்" },
  { name: "Bhubaneswar", district: "Khordha", state: "Odisha", country: "India", lat: 20.2961, lon: 85.8245, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "புவனேசுவரம்", districtTa: "கோர்தா", stateTa: "ஒடிசா" },
  { name: "Puri", district: "Puri", state: "Odisha", country: "India", lat: 19.8135, lon: 85.8312, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "பூரி", districtTa: "பூரி", stateTa: "ஒடிசா" },
  { name: "Guwahati", district: "Kamrup Metropolitan", state: "Assam", country: "India", lat: 26.1445, lon: 91.7362, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "குவஹாத்தி", districtTa: "காம்ரூப்", stateTa: "அசாம்" },

  // Rajasthan, MP & Punjab/Haryana
  { name: "Jaipur", district: "Jaipur", state: "Rajasthan", country: "India", lat: 26.9124, lon: 75.7873, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஜெய்ப்பூர்", districtTa: "ஜெய்ப்பூர்", stateTa: "ராஜஸ்தான்" },
  { name: "Jodhpur", district: "Jodhpur", state: "Rajasthan", country: "India", lat: 26.2389, lon: 73.0243, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "ஜோத்பூர்", districtTa: "ஜோத்பூர்", stateTa: "ராஜஸ்தான்" },
  { name: "Udaipur", district: "Udaipur", state: "Rajasthan", country: "India", lat: 24.5854, lon: 73.7125, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "உதய்பூர்", districtTa: "உதய்பூர்", stateTa: "ராஜஸ்தான்" },
  { name: "Bhopal", district: "Bhopal", state: "Madhya Pradesh", country: "India", lat: 23.2599, lon: 77.4126, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "போபால்", districtTa: "போபால்", stateTa: "மத்திய பிரதேசம்" },
  { name: "Indore", district: "Indore", state: "Madhya Pradesh", country: "India", lat: 22.7196, lon: 75.8577, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "இந்தூர்", districtTa: "இந்தூர்", stateTa: "மத்திய பிரதேசம்" },
  { name: "Ujjain", district: "Ujjain", state: "Madhya Pradesh", country: "India", lat: 23.1765, lon: 75.7885, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "உஜ்ஜைன்", districtTa: "உஜ்ஜைன்", stateTa: "மத்திய பிரதேசம்" },
  { name: "Chandigarh", district: "Chandigarh", state: "Chandigarh UT", country: "India", lat: 30.7333, lon: 76.7794, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "சண்டிகர்", districtTa: "சண்டிகர்", stateTa: "சண்டிகர்" },
  { name: "Amritsar", district: "Amritsar", state: "Punjab", country: "India", lat: 31.6340, lon: 74.8723, tz: 5.5, timezoneId: "Asia/Kolkata", nameTa: "அமிர்தசரஸ்", districtTa: "அமிர்தசரஸ்", stateTa: "பஞ்சாப்" },

  // ==========================================
  // MAJOR GLOBAL CITIES & NRI HUBS
  // ==========================================
  { name: "Singapore", district: "Central Region", state: "Singapore", country: "Singapore", lat: 1.3521, lon: 103.8198, tz: 8.0, timezoneId: "Asia/Singapore", nameTa: "சிங்கப்பூர்", districtTa: "மத்திய பகுதி", stateTa: "சிங்கப்பூர்" },
  { name: "Kuala Lumpur", district: "Federal Territory", state: "Kuala Lumpur", country: "Malaysia", lat: 3.1390, lon: 101.6869, tz: 8.0, timezoneId: "Asia/Kuala_Lumpur", nameTa: "கோலாலம்பூர்", districtTa: "மத்திய பிரதேசம்", stateTa: "மலேசியா" },
  { name: "Penang", district: "George Town", state: "Penang", country: "Malaysia", lat: 5.4141, lon: 100.3288, tz: 8.0, timezoneId: "Asia/Kuala_Lumpur", nameTa: "பினாங்கு", districtTa: "ஜார்ஜ் டவுன்", stateTa: "மலேசியா" },
  { name: "Colombo", district: "Western Province", state: "Colombo", country: "Sri Lanka", lat: 6.9271, lon: 79.8612, tz: 5.5, timezoneId: "Asia/Colombo", nameTa: "கொழும்பு", districtTa: "மேற்கு மாகாணம்", stateTa: "இலங்கை" },
  { name: "Jaffna", district: "Northern Province", state: "Jaffna", country: "Sri Lanka", lat: 9.6615, lon: 80.0255, tz: 5.5, timezoneId: "Asia/Colombo", nameTa: "யாழ்ப்பாணம்", districtTa: "வடக்கு மாகாணம்", stateTa: "இலங்கை" },
  { name: "London", district: "Greater London", state: "England", country: "United Kingdom", lat: 51.5074, lon: -0.1278, tz: 0.0, timezoneId: "Europe/London", nameTa: "லண்டன்", districtTa: "கிரேட்டர் லண்டன்", stateTa: "இங்கிலாந்து" },
  { name: "Dubai", district: "Dubai Emirate", state: "Dubai", country: "United Arab Emirates", lat: 25.2048, lon: 55.2708, tz: 4.0, timezoneId: "Asia/Dubai", nameTa: "துபாய்", districtTa: "துபாய் எமிரேட்ஸ்", stateTa: "யு.ஏ.இ" },
  { name: "Abu Dhabi", district: "Abu Dhabi Emirate", state: "Abu Dhabi", country: "United Arab Emirates", lat: 24.4539, lon: 54.3773, tz: 4.0, timezoneId: "Asia/Dubai", nameTa: "அபுதாபி", districtTa: "அபுதாபி", stateTa: "யு.ஏ.இ" },
  { name: "Doha", district: "Doha Municipality", state: "Doha", country: "Qatar", lat: 25.2854, lon: 51.5310, tz: 3.0, timezoneId: "Asia/Qatar", nameTa: "தோஹா", districtTa: "தோஹா", stateTa: "கத்தார்" },
  { name: "Kuwait City", district: "Al Asimah", state: "Kuwait", country: "Kuwait", lat: 29.3759, lon: 47.9774, tz: 3.0, timezoneId: "Asia/Kuwait", nameTa: "குவைத் நகரம்", districtTa: "அல் ஆசிமா", stateTa: "குவைத்" },
  { name: "Muscat", district: "Muscat Governorate", state: "Muscat", country: "Oman", lat: 23.5880, lon: 58.3829, tz: 4.0, timezoneId: "Asia/Muscat", nameTa: "மஸ்கட்", districtTa: "மஸ்கட்", stateTa: "ஓமான்" },
  { name: "Riyadh", district: "Riyadh Province", state: "Riyadh", country: "Saudi Arabia", lat: 24.7136, lon: 46.6753, tz: 3.0, timezoneId: "Asia/Riyadh", nameTa: "ரியாத்", districtTa: "ரியாத்", stateTa: "சவுதி அரேபியா" },
  { name: "New York", district: "New York County (Manhattan)", state: "New York", country: "United States", lat: 40.7128, lon: -74.0060, tz: -5.0, timezoneId: "America/New_York", nameTa: "நியூயார்க்", districtTa: "மன்ஹாட்டன்", stateTa: "அமெரிக்கா" },
  { name: "San Francisco", district: "San Francisco County", state: "California", country: "United States", lat: 37.7749, lon: -122.4194, tz: -8.0, timezoneId: "America/Los_Angeles", nameTa: "சான் பிரான்சிஸ்கோ", districtTa: "கலிபோர்னியா", stateTa: "அமெரிக்கா" },
  { name: "San Jose", district: "Santa Clara County", state: "California", country: "United States", lat: 37.3382, lon: -121.8863, tz: -8.0, timezoneId: "America/Los_Angeles", nameTa: "சான் ஜோஸ்", districtTa: "சாண்டா கிளாரா", stateTa: "அமெரிக்கா" },
  { name: "Fremont", district: "Alameda County", state: "California", country: "United States", lat: 37.5485, lon: -121.9886, tz: -8.0, timezoneId: "America/Los_Angeles", nameTa: "பிரிமாண்ட்", districtTa: "அலமேடா", stateTa: "அமெரிக்கா" },
  { name: "Dallas", district: "Dallas County", state: "Texas", country: "United States", lat: 32.7767, lon: -96.7970, tz: -6.0, timezoneId: "America/Chicago", nameTa: "டல்லாஸ்", districtTa: "டெக்சாஸ்", stateTa: "அமெரிக்கா" },
  { name: "Houston", district: "Harris County", state: "Texas", country: "United States", lat: 29.7604, lon: -95.3698, tz: -6.0, timezoneId: "America/Chicago", nameTa: "ஹூஸ்டன்", districtTa: "டெக்சாஸ்", stateTa: "அமெரிக்கா" },
  { name: "Austin", district: "Travis County", state: "Texas", country: "United States", lat: 30.2672, lon: -97.7431, tz: -6.0, timezoneId: "America/Chicago", nameTa: "ஆஸ்டின்", districtTa: "டெக்சாஸ்", stateTa: "அமெரிக்கா" },
  { name: "Chicago", district: "Cook County", state: "Illinois", country: "United States", lat: 41.8781, lon: -87.6298, tz: -6.0, timezoneId: "America/Chicago", nameTa: "சிகாகோ", districtTa: "இல்லினாய்ஸ்", stateTa: "அமெரிக்கா" },
  { name: "Seattle", district: "King County", state: "Washington", country: "United States", lat: 47.6062, lon: -122.3321, tz: -8.0, timezoneId: "America/Los_Angeles", nameTa: "சியாட்டில", districtTa: "வாஷிங்டன்", stateTa: "அமெரிக்கா" },
  { name: "Toronto", district: "Golden Horseshoe", state: "Ontario", country: "Canada", lat: 43.6532, lon: -79.3832, tz: -5.0, timezoneId: "America/Toronto", nameTa: "டொராண்டோ", districtTa: "ஒன்டாரியோ", stateTa: "கனடா" },
  { name: "Vancouver", district: "Metro Vancouver", state: "British Columbia", country: "Canada", lat: 49.2827, lon: -123.1207, tz: -8.0, timezoneId: "America/Vancouver", nameTa: "வான்கூவர்", districtTa: "பிரிட்டிஷ் கொலம்பியா", stateTa: "கனடா" },
  { name: "Sydney", district: "New South Wales", state: "New South Wales", country: "Australia", lat: -33.8688, lon: 151.2093, tz: 10.0, timezoneId: "Australia/Sydney", nameTa: "சிட்னி", districtTa: "நியூ சவுத் வேல்ஸ்", stateTa: "ஆஸ்திரேலியா" },
  { name: "Melbourne", district: "Victoria", state: "Victoria", country: "Australia", lat: -37.8136, lon: 144.9631, tz: 10.0, timezoneId: "Australia/Melbourne", nameTa: "மெல்போர்ன்", districtTa: "விக்டோரியா", stateTa: "ஆஸ்திரேலியா" },
  { name: "Auckland", district: "Auckland Region", state: "Auckland", country: "New Zealand", lat: -36.8485, lon: 174.7633, tz: 12.0, timezoneId: "Pacific/Auckland", nameTa: "ஆக்லாந்து", districtTa: "ஆக்லாந்து பகுதி", stateTa: "நியூசிலாந்து" },
  { name: "Frankfurt", district: "Hesse", state: "Hesse", country: "Germany", lat: 50.1109, lon: 8.6821, tz: 1.0, timezoneId: "Europe/Berlin", nameTa: "பிராங்பேர்ட்", districtTa: "ஹெஸ்ஸே", stateTa: "ஜெர்மனி" },
  { name: "Paris", district: "Ile-de-France", state: "Ile-de-France", country: "France", lat: 48.8566, lon: 2.3522, tz: 1.0, timezoneId: "Europe/Paris", nameTa: "பாரிஸ்", districtTa: "இல்-டி-பிரான்ஸ்", stateTa: "பிரான்ஸ்" },
  { name: "Dublin", district: "Leinster", state: "County Dublin", country: "Ireland", lat: 53.3498, lon: -6.2603, tz: 0.0, timezoneId: "Europe/Dublin", nameTa: "டப்ளின்", districtTa: "லீன்ஸ்டர்", stateTa: "அயர்லாந்து" },
  { name: "Tokyo", district: "Kanto", state: "Tokyo", country: "Japan", lat: 35.6762, lon: 139.6503, tz: 9.0, timezoneId: "Asia/Tokyo", nameTa: "டோக்கியோ", districtTa: "கன்டோ", stateTa: "ஜப்பான்" }
];

export function resolveIanaTimezone(lat, lon, country = "", countryCode = "", state = "", city = "") {
  const cNorm = (country || "").toLowerCase().trim();
  const codeNorm = (countryCode || "").toLowerCase().trim();
  const sNorm = (state || "").toLowerCase().trim();
  const cityNorm = (city || "").toLowerCase().trim();

  // 1. India & South Asia
  if (cNorm === "india" || cNorm === "இந்தியா" || codeNorm === "in") {
    return { timezoneId: "Asia/Kolkata", tz: 5.5 };
  }
  if (cNorm === "sri lanka" || codeNorm === "lk" || cNorm === "இலங்கை") {
    return { timezoneId: "Asia/Colombo", tz: 5.5 };
  }
  if (cNorm === "nepal" || codeNorm === "np" || sNorm.includes("nepal") || cityNorm.includes("kathmandu")) {
    return { timezoneId: "Asia/Kathmandu", tz: 5.75 };
  }
  if (cNorm === "bangladesh" || codeNorm === "bd") {
    return { timezoneId: "Asia/Dhaka", tz: 6.0 };
  }
  if (cNorm === "pakistan" || codeNorm === "pk") {
    return { timezoneId: "Asia/Karachi", tz: 5.0 };
  }
  if (cNorm === "afghanistan" || codeNorm === "af" || cityNorm.includes("kabul")) {
    return { timezoneId: "Asia/Kabul", tz: 4.5 };
  }
  if (cNorm === "iran" || codeNorm === "ir" || cityNorm.includes("tehran")) {
    return { timezoneId: "Asia/Tehran", tz: 3.5 };
  }
  if (cNorm === "myanmar" || cNorm === "burma" || codeNorm === "mm" || cityNorm.includes("yangon")) {
    return { timezoneId: "Asia/Yangon", tz: 6.5 };
  }
  if (cNorm === "bhutan" || codeNorm === "bt") {
    return { timezoneId: "Asia/Thimphu", tz: 6.0 };
  }
  if (cNorm === "maldives" || codeNorm === "mv") {
    return { timezoneId: "Indian/Maldives", tz: 5.0 };
  }

  // 2. Southeast & East Asia
  if (cNorm === "singapore" || codeNorm === "sg" || cNorm === "சிங்கப்பூர்") {
    return { timezoneId: "Asia/Singapore", tz: 8.0 };
  }
  if (cNorm === "malaysia" || codeNorm === "my" || cNorm === "மலேசியா") {
    return { timezoneId: "Asia/Kuala_Lumpur", tz: 8.0 };
  }
  if (cNorm === "japan" || codeNorm === "jp" || cNorm === "ஜப்பான்") {
    return { timezoneId: "Asia/Tokyo", tz: 9.0 };
  }
  if (cNorm === "south korea" || cNorm === "korea" || codeNorm === "kr") {
    return { timezoneId: "Asia/Seoul", tz: 9.0 };
  }
  if (cNorm === "china" || codeNorm === "cn") {
    return { timezoneId: "Asia/Shanghai", tz: 8.0 };
  }
  if (cNorm === "hong kong" || codeNorm === "hk") {
    return { timezoneId: "Asia/Hong_Kong", tz: 8.0 };
  }
  if (cNorm === "taiwan" || codeNorm === "tw") {
    return { timezoneId: "Asia/Taipei", tz: 8.0 };
  }
  if (cNorm === "thailand" || codeNorm === "th") {
    return { timezoneId: "Asia/Bangkok", tz: 7.0 };
  }
  if (cNorm === "vietnam" || codeNorm === "vn") {
    return { timezoneId: "Asia/Ho_Chi_Minh", tz: 7.0 };
  }
  if (cNorm === "philippines" || codeNorm === "ph") {
    return { timezoneId: "Asia/Manila", tz: 8.0 };
  }
  if (cNorm === "indonesia" || codeNorm === "id") {
    if (lon < 110) return { timezoneId: "Asia/Jakarta", tz: 7.0 };
    if (lon < 125) return { timezoneId: "Asia/Makassar", tz: 8.0 };
    return { timezoneId: "Asia/Jayapura", tz: 9.0 };
  }

  // 3. Middle East
  if (cNorm === "united arab emirates" || cNorm === "uae" || codeNorm === "ae" || cNorm === "யு.ஏ.இ") {
    return { timezoneId: "Asia/Dubai", tz: 4.0 };
  }
  if (cNorm === "saudi arabia" || codeNorm === "sa" || cNorm === "சவுதி அரேபியா") {
    return { timezoneId: "Asia/Riyadh", tz: 3.0 };
  }
  if (cNorm === "qatar" || codeNorm === "qa" || cNorm === "கத்தார்") {
    return { timezoneId: "Asia/Qatar", tz: 3.0 };
  }
  if (cNorm === "kuwait" || codeNorm === "kw" || cNorm === "குவைத்") {
    return { timezoneId: "Asia/Kuwait", tz: 3.0 };
  }
  if (cNorm === "oman" || codeNorm === "om" || cNorm === "ஓமான்") {
    return { timezoneId: "Asia/Muscat", tz: 4.0 };
  }
  if (cNorm === "bahrain" || codeNorm === "bh") {
    return { timezoneId: "Asia/Bahrain", tz: 3.0 };
  }
  if (cNorm === "israel" || codeNorm === "il") {
    return { timezoneId: "Asia/Jerusalem", tz: 2.0 };
  }
  if (cNorm === "turkey" || codeNorm === "tr") {
    return { timezoneId: "Europe/Istanbul", tz: 3.0 };
  }

  // 4. United Kingdom & Europe
  if (cNorm === "united kingdom" || cNorm === "uk" || cNorm === "england" || cNorm === "scotland" || cNorm === "wales" || codeNorm === "gb" || codeNorm === "uk" || cNorm === "இங்கிலாந்து") {
    return { timezoneId: "Europe/London", tz: 0.0 };
  }
  if (cNorm === "ireland" || codeNorm === "ie" || cNorm === "அயர்லாந்து") {
    return { timezoneId: "Europe/Dublin", tz: 0.0 };
  }
  if (cNorm === "france" || codeNorm === "fr" || cNorm === "பிரான்ஸ்") {
    return { timezoneId: "Europe/Paris", tz: 1.0 };
  }
  if (cNorm === "germany" || codeNorm === "de" || cNorm === "ஜெர்மனி") {
    return { timezoneId: "Europe/Berlin", tz: 1.0 };
  }
  if (cNorm === "italy" || codeNorm === "it") {
    return { timezoneId: "Europe/Rome", tz: 1.0 };
  }
  if (cNorm === "spain" || codeNorm === "es") {
    if (lon < -13 && lat < 30) return { timezoneId: "Atlantic/Canary", tz: 0.0 };
    return { timezoneId: "Europe/Madrid", tz: 1.0 };
  }
  if (cNorm === "portugal" || codeNorm === "pt") {
    if (lon < -20) return { timezoneId: "Atlantic/Azores", tz: -1.0 };
    if (lon < -13) return { timezoneId: "Atlantic/Madeira", tz: 0.0 };
    return { timezoneId: "Europe/Lisbon", tz: 0.0 };
  }
  if (cNorm === "switzerland" || codeNorm === "ch") {
    return { timezoneId: "Europe/Zurich", tz: 1.0 };
  }
  if (cNorm === "netherlands" || codeNorm === "nl") {
    return { timezoneId: "Europe/Amsterdam", tz: 1.0 };
  }
  if (cNorm === "belgium" || codeNorm === "be") {
    return { timezoneId: "Europe/Brussels", tz: 1.0 };
  }
  if (cNorm === "austria" || codeNorm === "at") {
    return { timezoneId: "Europe/Vienna", tz: 1.0 };
  }
  if (cNorm === "sweden" || codeNorm === "se") {
    return { timezoneId: "Europe/Stockholm", tz: 1.0 };
  }
  if (cNorm === "norway" || codeNorm === "no") {
    return { timezoneId: "Europe/Oslo", tz: 1.0 };
  }
  if (cNorm === "denmark" || codeNorm === "dk") {
    return { timezoneId: "Europe/Copenhagen", tz: 1.0 };
  }
  if (cNorm === "finland" || codeNorm === "fi") {
    return { timezoneId: "Europe/Helsinki", tz: 2.0 };
  }
  if (cNorm === "greece" || codeNorm === "gr") {
    return { timezoneId: "Europe/Athens", tz: 2.0 };
  }
  if (cNorm === "poland" || codeNorm === "pl") {
    return { timezoneId: "Europe/Warsaw", tz: 1.0 };
  }

  // 5. United States & Canada
  if (cNorm === "united states" || cNorm === "usa" || cNorm === "us" || codeNorm === "us" || cNorm === "அமெரிக்கா") {
    if (sNorm.includes("hawaii") || codeNorm === "us-hi" || (lat >= 18 && lat <= 23 && lon <= -154 && lon >= -162)) {
      return { timezoneId: "Pacific/Honolulu", tz: -10.0 };
    }
    if (sNorm.includes("alaska") || codeNorm === "us-ak" || (lat >= 51 && lon <= -130)) {
      return { timezoneId: "America/Anchorage", tz: -9.0 };
    }
    // Arizona: does NOT observe Daylight Saving Time
    if (sNorm.includes("arizona") || sNorm === "az" || cityNorm.includes("phoenix") || cityNorm.includes("tucson") || (lat >= 31.3 && lat <= 37.0 && lon >= -114.8 && lon <= -109.0)) {
      return { timezoneId: "America/Phoenix", tz: -7.0 };
    }
    // Pacific: CA, WA, OR, NV
    if (sNorm.includes("california") || sNorm.includes("washington") || sNorm.includes("oregon") || sNorm.includes("nevada") || lon < -114.5) {
      return { timezoneId: "America/Los_Angeles", tz: -8.0 };
    }
    // Mountain: CO, UT, NM, WY, MT, ID
    if (sNorm.includes("colorado") || sNorm.includes("utah") || sNorm.includes("new mexico") || sNorm.includes("wyoming") || sNorm.includes("montana") || sNorm.includes("idaho") || lon < -100.0) {
      return { timezoneId: "America/Denver", tz: -7.0 };
    }
    // Central: IL, TX, MN, MO, WI, IA, KS, NE, OK, LA, MS, AL, TN, AR, ND, SD
    if (sNorm.includes("texas") || sNorm.includes("illinois") || sNorm.includes("minnesota") || sNorm.includes("missouri") || sNorm.includes("wisconsin") || lon < -85.5) {
      return { timezoneId: "America/Chicago", tz: -6.0 };
    }
    // Eastern
    return { timezoneId: "America/New_York", tz: -5.0 };
  }

  if (cNorm === "canada" || codeNorm === "ca" || cNorm === "கனடா") {
    if (sNorm.includes("newfoundland") || sNorm.includes("labrador") || cityNorm.includes("st. john's") || (lat >= 46 && lat <= 60 && lon >= -62 && lon <= -52)) {
      return { timezoneId: "America/St_Johns", tz: -3.5 };
    }
    if (sNorm.includes("nova scotia") || sNorm.includes("new brunswick") || sNorm.includes("prince edward") || lon >= -68.0) {
      return { timezoneId: "America/Halifax", tz: -4.0 };
    }
    if (sNorm.includes("ontario") || sNorm.includes("quebec") || lon >= -85.0) {
      return { timezoneId: "America/Toronto", tz: -5.0 };
    }
    if (sNorm.includes("manitoba") || sNorm.includes("saskatchewan") || lon >= -102.0) {
      return { timezoneId: "America/Winnipeg", tz: -6.0 };
    }
    if (sNorm.includes("alberta") || lon >= -115.0) {
      return { timezoneId: "America/Edmonton", tz: -7.0 };
    }
    return { timezoneId: "America/Vancouver", tz: -8.0 };
  }

  // 6. Australia & New Zealand (with Adelaide, Darwin, Perth, Lord Howe, Chatham)
  if (cNorm === "australia" || codeNorm === "au" || cNorm === "ஆஸ்திரேலியா") {
    // Lord Howe Island (UTC+10.5)
    if (cityNorm.includes("lord howe") || (lat <= -31.3 && lat >= -31.8 && lon >= 159.0)) {
      return { timezoneId: "Australia/Lord_Howe", tz: 10.5 };
    }
    // Western Australia / Perth (UTC+8 no DST)
    if (sNorm.includes("western australia") || sNorm === "wa" || cityNorm.includes("perth") || lon < 129.0) {
      return { timezoneId: "Australia/Perth", tz: 8.0 };
    }
    // Northern Territory / Darwin (UTC+9.5 no DST)
    if (sNorm.includes("northern territory") || sNorm === "nt" || cityNorm.includes("darwin") || (lat > -26.0 && lon >= 129.0 && lon < 138.0)) {
      return { timezoneId: "Australia/Darwin", tz: 9.5 };
    }
    // South Australia / Adelaide (UTC+9.5 with DST)
    if (sNorm.includes("south australia") || sNorm === "sa" || cityNorm.includes("adelaide") || (lat <= -26.0 && lon >= 129.0 && lon < 141.0)) {
      return { timezoneId: "Australia/Adelaide", tz: 9.5 };
    }
    // Queensland / Brisbane (UTC+10 no DST)
    if (sNorm.includes("queensland") || sNorm === "qld" || cityNorm.includes("brisbane") || (lat > -29.0 && lon >= 138.0)) {
      return { timezoneId: "Australia/Brisbane", tz: 10.0 };
    }
    // NSW / VIC / TAS / ACT (Sydney, Melbourne, Hobart, Canberra - UTC+10 with DST)
    return { timezoneId: "Australia/Sydney", tz: 10.0 };
  }

  if (cNorm === "new zealand" || codeNorm === "nz" || cNorm === "நியூசிலாந்து") {
    // Chatham Islands (UTC+12:45)
    if (cityNorm.includes("chatham") || lon < -170 || (lon > 175 && lat < -43.5 && lon > 180)) {
      return { timezoneId: "Pacific/Chatham", tz: 12.75 };
    }
    return { timezoneId: "Pacific/Auckland", tz: 12.0 };
  }

  // 7. Africa & South America
  if (cNorm === "south africa" || codeNorm === "za") {
    return { timezoneId: "Africa/Johannesburg", tz: 2.0 };
  }
  if (cNorm === "egypt" || codeNorm === "eg") {
    return { timezoneId: "Africa/Cairo", tz: 2.0 };
  }
  if (cNorm === "nigeria" || codeNorm === "ng") {
    return { timezoneId: "Africa/Lagos", tz: 1.0 };
  }
  if (cNorm === "kenya" || codeNorm === "ke") {
    return { timezoneId: "Africa/Nairobi", tz: 3.0 };
  }
  if (cNorm === "brazil" || codeNorm === "br") {
    if (lon > -35.0) return { timezoneId: "America/Noronha", tz: -2.0 };
    if (lon < -66.0) return { timezoneId: "America/Rio_Branco", tz: -5.0 };
    if (lon < -54.0) return { timezoneId: "America/Manaus", tz: -4.0 };
    return { timezoneId: "America/Sao_Paulo", tz: -3.0 };
  }
  if (cNorm === "argentina" || codeNorm === "ar") {
    return { timezoneId: "America/Argentina/Buenos_Aires", tz: -3.0 };
  }
  if (cNorm === "chile" || codeNorm === "cl") {
    return { timezoneId: "America/Santiago", tz: -4.0 };
  }

  // 8. Coordinate-Based Hierarchical Geographic Classifier (When country is omitted or unspecified)
  if (lat >= 8.0 && lat <= 37.0 && lon >= 68.0 && lon <= 97.5) {
    return { timezoneId: "Asia/Kolkata", tz: 5.5 };
  }
  if (lat >= 50.0 && lat <= 60.0 && lon >= -10.0 && lon <= 2.0) {
    return { timezoneId: "Europe/London", tz: 0.0 };
  }
  if (lat >= 35.0 && lat <= 71.0 && lon >= -10.0 && lon <= 35.0) {
    if (lon < 5.0) return { timezoneId: "Europe/Paris", tz: 1.0 };
    if (lon < 20.0) return { timezoneId: "Europe/Berlin", tz: 1.0 };
    return { timezoneId: "Europe/Athens", tz: 2.0 };
  }
  if (lat >= 24.0 && lat <= 50.0 && lon >= -125.0 && lon <= -65.0) {
    // US continental bounds
    if (lat >= 31.3 && lat <= 37.0 && lon >= -114.8 && lon <= -109.0) return { timezoneId: "America/Phoenix", tz: -7.0 };
    if (lon < -114.5) return { timezoneId: "America/Los_Angeles", tz: -8.0 };
    if (lon < -100.0) return { timezoneId: "America/Denver", tz: -7.0 };
    if (lon < -85.5) return { timezoneId: "America/Chicago", tz: -6.0 };
    return { timezoneId: "America/New_York", tz: -5.0 };
  }
  if (lat <= -10.0 && lat >= -45.0 && lon >= 112.0 && lon <= 155.0) {
    // Australia bounds
    if (lon < 129.0) return { timezoneId: "Australia/Perth", tz: 8.0 };
    if (lon < 140.0) return { timezoneId: "Australia/Adelaide", tz: 9.5 };
    return { timezoneId: "Australia/Sydney", tz: 10.0 };
  }

  return { timezoneId: "UTC", tz: 0.0 };
}

// In-memory cache for geocoding queries
const GEO_CACHE = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Direct Nominatim Geocoding API with fast timeout
 */
async function fetchNominatimPlaces(query, lang = "en") {
  const isTamil = lang === "ta";
  const cleanQuery = query ? query.trim() : "";
  if (!cleanQuery || cleanQuery.length < 2) return [];

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&addressdetails=1&limit=8&accept-language=${isTamil ? "ta,en" : "en"}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2800);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json"
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const items = await res.json();
    if (!Array.isArray(items)) return [];

    return items.map(item => {
      const addr = item.address || {};
      const cityName = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.hamlet || addr.county || item.name || cleanQuery;
      const districtName = addr.state_district || addr.county || addr.district || "";
      const stateName = addr.state || "";
      const countryName = addr.country || "";
      const countryCode = addr.country_code || "";
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      const tzInfo = resolveIanaTimezone(lat, lon, countryName, countryCode, stateName, cityName);

      const parts = [cityName];
      if (districtName && districtName !== cityName) parts.push(districtName);
      if (stateName && stateName !== districtName) parts.push(stateName);
      if (countryName) parts.push(countryName);

      return {
        name: cityName,
        district: districtName,
        state: stateName,
        country: countryName,
        lat,
        lon,
        tz: tzInfo.tz,
        timezoneId: tzInfo.timezoneId,
        displayString: parts.join(", ")
      };
    });
  } catch (err) {
    clearTimeout(timeoutId);
    return [];
  }
}

/**
 * Searches places with instant local matching, caching, and online fallback
 */
export async function searchPlaces(query, lang = "en") {
  const isTamil = lang === "ta";
  const clean = query ? query.trim().toLowerCase() : "";
  if (!clean || clean.length < 2) return [];

  // Check cache first
  const cacheKey = `${clean}:${isTamil ? "ta" : "en"}`;
  const cached = GEO_CACHE.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  // 1. Instant local DB search
  const tokens = clean.split(/[\s,]+/).filter(t => t.length > 1);
  const localMatches = POPULAR_PLACES_DB.filter(p => {
    const nEn = (p.name || "").toLowerCase();
    const dEn = (p.district || "").toLowerCase();
    const sEn = (p.state || "").toLowerCase();
    const cEn = (p.country || "").toLowerCase();
    const nTa = (p.nameTa || "").toLowerCase();
    const dTa = (p.districtTa || "").toLowerCase();
    const sTa = (p.stateTa || "").toLowerCase();

    // Match if whole query is substring
    if (nEn.includes(clean) || dEn.includes(clean) || sEn.includes(clean) || cEn.includes(clean) ||
        nTa.includes(clean) || dTa.includes(clean) || sTa.includes(clean)) {
      return true;
    }

    // Match if multiple tokens are found (e.g., "Hosur Krishnagiri" or "Salem TN")
    if (tokens.length > 1) {
      const fullText = `${nEn} ${dEn} ${sEn} ${cEn} ${nTa} ${dTa} ${sTa}`.toLowerCase();
      return tokens.every(t => fullText.includes(t));
    }

    return false;
  }).map(p => formatPlaceResult(p, isTamil));

  // If we have strong local matches, return them immediately
  if (localMatches.length >= 6) {
    const results = localMatches.slice(0, 10);
    GEO_CACHE.set(cacheKey, { timestamp: Date.now(), data: results });
    return results;
  }

  // 2. Try online geocoding if online (Nominatim or proxy)
  try {
    let onlineResults = [];

    // Try backend proxy if available
    try {
      const proxyController = new AbortController();
      const proxyTimeout = setTimeout(() => proxyController.abort(), 1200);
      const proxyRes = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&lang=${isTamil ? "ta" : "en"}`, {
        signal: proxyController.signal,
        headers: { "Accept": "application/json" }
      });
      clearTimeout(proxyTimeout);
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (Array.isArray(data) && data.length > 0) {
          onlineResults = data.map(item => ({
            name: item.name,
            district: item.district || item.state || "",
            state: item.state || "",
            country: item.country || "",
            lat: Number(item.lat),
            lon: Number(item.lon ?? item.lng),
            tz: Number(item.tz ?? (resolveIanaTimezone(item.lat, item.lon, item.country, item.countryCode, item.state, item.name).tz)),
            timezoneId: item.timezoneId || resolveIanaTimezone(item.lat, item.lon, item.country, item.countryCode, item.state, item.name).timezoneId,
            displayString: item.displayString || `${item.name}${item.district ? `, ${item.district}` : ""}${item.state ? `, ${item.state}` : ""}${item.country ? `, ${item.country}` : ""}`
          }));
        }
      }
    } catch {}

    // If proxy yielded nothing, fallback directly to Nominatim
    if (onlineResults.length === 0) {
      onlineResults = await fetchNominatimPlaces(query, lang);
    }

    if (onlineResults.length > 0) {
      // Merge unique local and online results
      const combined = [...localMatches];
      for (const om of onlineResults) {
        if (!combined.some(c => Math.abs(c.lat - om.lat) < 0.05 && Math.abs(c.lon - om.lon) < 0.05)) {
          combined.push(om);
        }
      }
      const finalResults = combined.slice(0, 10);
      GEO_CACHE.set(cacheKey, { timestamp: Date.now(), data: finalResults });
      return finalResults;
    }
  } catch (err) {
    console.warn("Geocoding lookup fallback to local DB:", err?.message || err);
  }

  GEO_CACHE.set(cacheKey, { timestamp: Date.now(), data: localMatches });
  return localMatches;
}

/**
 * Synchronously resolves a typed place text against the local places database.
 */
export function resolveTypedPlace(text, isTamil = false) {
  if (!text || typeof text !== "string") return null;
  const clean = text.trim().toLowerCase();
  if (!clean || clean.length < 2) return null;

  // 1. Exact match by name / district / Tamil name / displayString
  for (const p of POPULAR_PLACES_DB) {
    const nEn = (p.name || "").toLowerCase();
    const dEn = (p.district || "").toLowerCase();
    const nTa = (p.nameTa || "").toLowerCase();
    const dTa = (p.districtTa || "").toLowerCase();
    const disp = `${nEn}, ${dEn}, ${(p.state || "").toLowerCase()}, ${(p.country || "").toLowerCase()}`;
    if (clean === nEn || clean === dEn || clean === nTa || clean === dTa || clean === disp) {
      return formatPlaceResult(p, isTamil);
    }
  }

  // 2. Exact word prefix with comma/delimiter (e.g. "Pollachi, Coimbatore" or "Hosur, Tamil Nadu")
  for (const p of POPULAR_PLACES_DB) {
    const nEn = (p.name || "").toLowerCase();
    const nTa = (p.nameTa || "").toLowerCase();
    if (clean.startsWith(`${nEn},`) || clean.startsWith(`${nEn} `) || (nTa && (clean.startsWith(`${nTa},`) || clean.startsWith(`${nTa} `)))) {
      return formatPlaceResult(p, isTamil);
    }
  }

  // 3. Multi-token exact match where first token is the exact city name
  const tokens = clean.split(/[\s,]+/).filter(t => t.length > 1);
  if (tokens.length >= 2) {
    for (const p of POPULAR_PLACES_DB) {
      const nEn = (p.name || "").toLowerCase();
      const nTa = (p.nameTa || "").toLowerCase();
      const dEn = (p.district || "").toLowerCase();
      const sEn = (p.state || "").toLowerCase();
      if ((tokens[0] === nEn || tokens[0] === nTa) && (tokens.slice(1).some(t => dEn.includes(t) || sEn.includes(t)))) {
        return formatPlaceResult(p, isTamil);
      }
    }
  }

  return null;
}

function formatPlaceResult(p, isTamil) {
  const name = isTamil && p.nameTa ? p.nameTa : p.name;
  const district = isTamil && p.districtTa ? p.districtTa : p.district;
  const state = isTamil && p.stateTa ? p.stateTa : p.state;
  const country = isTamil ? (p.country === "India" ? "இந்தியா" : p.country) : p.country;
  const resolved = resolveIanaTimezone(p.lat, p.lon, p.country, "", p.state || "", p.name || "");
  const timezoneId = p.timezoneId || resolved.timezoneId;
  const tz = typeof p.tz === "number" ? p.tz : resolved.tz;

  const displayString = `${name}, ${district}, ${state}, ${country}`;
  return {
    ...p,
    name,
    district,
    state,
    country,
    tz,
    timezoneId,
    displayString
  };
}
