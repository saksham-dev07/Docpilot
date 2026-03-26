import { Client, Account, Databases, Storage } from 'appwrite';

export const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = '69c180ea00142eafac4e';
export const APPWRITE_DATABASE_ID = 'main';

export const APPWRITE_COLLECTIONS = {
    USERS: 'users',
    APPOINTMENTS: 'appointments',
    CONSULTATIONS: 'consultations',
};

export const APPWRITE_BUCKET_ID = '69c18187000ba824e0a1';

export const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const appwriteStorage = new Storage(client);
