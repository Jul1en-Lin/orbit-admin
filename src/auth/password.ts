import CryptoJS from 'crypto-js'

const LOGIN_KEY = CryptoJS.enc.Utf8.parse('12345678abcdefgh')

export function encryptLoginPassword(password: string): string {
  return CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(password), LOGIN_KEY, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  }).ciphertext.toString(CryptoJS.enc.Hex)
}
