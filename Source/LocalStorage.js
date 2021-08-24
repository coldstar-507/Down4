import AsyncStorage from '@react-native-async-storage/async-storage';

export function SetString(key, str) {
    AsyncStorage.setItem(key, str);
}

export function GetString(key) {
    return AsyncStorage.getItem(key);
}

export function Clear() {
    return AsyncStorage.clear();
}
