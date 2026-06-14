import { Image, Text, View } from "react-native";

const basecampLogo = require("../../../assets/images/icon.png");

export function WelcomeHero() {
    return (
        <View className="items-center px-6">
            <Image
                source={basecampLogo}
                resizeMode="contain"
                className="mb-8 h-28 w-28"
            />
            <Text className="text-center text-3xl font-extrabold text-dark">
                Selamat Datang di Basecamp Kost
            </Text>
            <Text className="mt-4 text-center text-base leading-6 text-gray-600">
                Kelola tagihan, pembayaran, keluhan, tamu, dan informasi sewa
                dalam satu aplikasi.
            </Text>
            <Text className="mt-4 text-center text-sm leading-6 text-gray-500">
                Aplikasi ini hanya dapat digunakan oleh pengguna yang telah
                terdaftar.
            </Text>
        </View>
    );
}
