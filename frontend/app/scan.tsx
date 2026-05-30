import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useRoom } from '../context/RoomContext';

export default function ScanScreen() {
  const router = useRouter();
  const { setPhoto, photo } = useRoom();

  const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      cameraType: ImagePicker.CameraType.back,
      base64: true,
      quality: 1,
    });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 1,
    });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  return (
    <View className="flex-1 bg-black items-center justify-center px-6">
      {photo ? (
        <>
          <Image source={{ uri: photo.uri }} className="w-full h-72 rounded-2xl mb-8" resizeMode="cover" />
          <Pressable className="bg-white px-8 py-4 rounded-full mb-4" onPress={() => router.push('/style')}>
            <Text className="text-black font-semibold text-base">Looks good</Text>
          </Pressable>
          <Pressable onPress={() => setPhoto(null)}>
            <Text className="text-gray-400 text-sm">Retake</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Pressable className="bg-white px-8 py-4 rounded-full mb-4" onPress={openCamera}>
            <Text className="text-black font-semibold text-base">Take Photo</Text>
          </Pressable>
          <Pressable onPress={openGallery}>
            <Text className="text-gray-400 text-sm">Choose from gallery</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
