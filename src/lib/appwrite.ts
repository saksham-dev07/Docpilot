import { Client, Storage } from 'appwrite';

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('69c180ea00142eafac4e');

export const appwriteStorage = new Storage(client);
export const APPWRITE_BUCKET_ID = '69c18187000ba824e0a1';
