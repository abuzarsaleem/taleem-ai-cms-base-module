declare const _default: () => {
    app: {
        name: string;
        port: number;
        prefix: string;
        nodeEnv: string;
    };
    database: {
        url: string | undefined;
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        schema: string;
        ssl: boolean;
        logging: boolean;
    };
    redis: {
        host: string;
        port: number;
    };
    jwt: {
        accessSecret: string;
        refreshSecret: string;
        accessExpiresIn: string;
        refreshExpiresIn: string;
    };
    auth: {
        bcryptSaltRounds: number;
        authorizationCodeTtlSeconds: number;
    };
    storage: {
        driver: string;
        localPath: string;
        upload: {
            maxImageBytes: number;
            maxDocumentBytes: number;
        };
        s3: {
            endpoint: string;
            region: string;
            accessKey: string;
            secretKey: string;
            bucket: string;
            forcePathStyle: boolean;
            signedUrls: boolean;
            signedUrlTtlSeconds: number;
            publicUrl: string;
        };
    };
    brevo: {
        apiKey: string;
        fromEmail: string;
    };
    invitation: {
        ttlHours: number;
        acceptUrlBase: string;
    };
};
export default _default;
