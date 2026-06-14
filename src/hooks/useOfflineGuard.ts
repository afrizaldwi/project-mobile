/**
 * Hook reaktif untuk mendeteksi status koneksi internet secara real-time.
 * Berbeda dari `getConnectivityStatus()` yang hanya one-shot async,
 * hook ini menggunakan event listener sehingga komponen otomatis re-render
 * saat koneksi mati atau kembali menyala.
 *
 * Mengembalikan `isOffline: boolean` — true jika tidak ada koneksi internet.
 */

import * as Network from "expo-network";
import { useEffect, useState } from "react";

export function useOfflineGuard(): boolean {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        let isMounted = true;

        /** Cek status awal saat komponen pertama kali di-render */
        async function checkInitial() {
            const state = await Network.getNetworkStateAsync();
            if (!isMounted) return;
            setIsOffline(
                state.isConnected === false || state.isInternetReachable === false,
            );
        }

        void checkInitial();

        /**
         * expo-network tidak menyediakan event listener native,
         * sehingga kita lakukan polling ringan setiap 5 detik.
         * Ini lebih efisien daripada pengecekan one-shot di setiap handler aksi.
         */
        const interval = setInterval(async () => {
            const state = await Network.getNetworkStateAsync();
            if (!isMounted) return;
            setIsOffline(
                state.isConnected === false || state.isInternetReachable === false,
            );
        }, 5000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    return isOffline;
}
