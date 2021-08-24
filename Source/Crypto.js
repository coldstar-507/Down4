import crypt from 'react-native-simple-crypto';

const toRemove = [
    "-----BEGIN RSA PRIVATE KEY-----",
    "-----END RSA PRIVATE KEY-----",
    "-----BEGIN RSA PUBLIC KEY-----",
    "-----END RSA PUBLIC KEY-----"
];

export async function GenerateKeys() {
    const keyPair = await crypt.RSA.generateKeys(512);
    //console.log(keyPair.private);
    //console.log(keyPair.public);
    const private_ = keyPair.private.replace(toRemove[0], '');
    const private__ = private_.replace(toRemove[1], '');
    const public_ = keyPair.public.replace(toRemove[2], '');
    const public__ = public_.replace(toRemove[3], '');
    const private___ = private__.replace(/\n/g,'');
    const public___ = public__.replace(/\n/g, '');
    console.log("Private key:\n", private___);
    console.log("Public key:\n", public___);
    const private____ = ConvertKey(private___);
    const public____ = ConvertKey(public___);
    console.log("Converted private:\n", private____);
    console.log("Converted public:\n", public____);
    return { private: private____, public: public____ };
}

export async function GenerateNonceB64() {
    const bytes = await crypt.utils.randomBytes(8);
    const str = crypt.utils.convertArrayBufferToBase64(bytes);
    return str;
}

export function HashMessage(message) {
    return crypt.SHA.sha256(message);
}

export function ConvertKey(key) {
    const ab = crypt.utils.convertUtf8ToArrayBuffer(key);
    return crypt.utils.convertArrayBufferToBase64(ab);
}

export function ConvertBack(convertedKey) {
    const ab = crypt.utils.convertBase64ToArrayBuffer(convertedKey);
    return crypt.utils.convertArrayBufferToUtf8(ab);
}