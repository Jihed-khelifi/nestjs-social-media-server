import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash } from 'crypto';

@Injectable()
export class EncryptionService {
  encryptData(data: string, secretKey: string) {
    const key = createHash('sha512')
      .update(secretKey)
      .digest('hex')
      .substring(0, 32);
    const encryptionIV = createHash('sha512')
      .update(process.env.IV)
      .digest('hex')
      .substring(0, 16);
    const algorithm = 'aes-256-cbc';
    const cipher = createCipheriv(algorithm, key, encryptionIV);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
  decryptData(encryptedData: string, secretKey: string) {
    const algorithm = 'aes-256-cbc';
    const key = createHash('sha512')
      .update(secretKey)
      .digest('hex')
      .substring(0, 32);
    const encryptionIV = createHash('sha512')
      .update(process.env.IV)
      .digest('hex')
      .substring(0, 16);
    const decipher = createDecipheriv(algorithm, key, encryptionIV);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    console.log(decrypted);
  }
}
