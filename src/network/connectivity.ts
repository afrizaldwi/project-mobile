import * as Network from "expo-network";

export type ConnectivityStatus = "online" | "offline" | "unknown";

export async function getConnectivityStatus(): Promise<ConnectivityStatus> {
    const state = await Network.getNetworkStateAsync();

    if (state.isConnected === false || state.isInternetReachable === false) {
        return "offline";
    }

    if (state.isConnected === true && state.isInternetReachable === true) {
        return "online";
    }

    return "unknown";
}
