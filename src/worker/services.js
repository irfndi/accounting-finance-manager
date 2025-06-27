import { FinancialAIService, AIService, createVectorizeService } from '../ai/index.js';
import { createProvider } from '../ai/providers/factory.js';
export function createFinancialAIService(env) {
    try {
        if (!env.OPENROUTER_API_KEY) {
            return null;
        }
        const provider = createProvider({
            provider: 'openrouter',
            apiKey: env.OPENROUTER_API_KEY,
            baseUrl: 'https://openrouter.ai/api/v1',
            modelId: 'google/gemini-2.5-flash-lite-preview-06-17'
        });
        const aiService = new AIService({
            primaryProvider: provider
        });
        return new FinancialAIService(aiService);
    }
    catch (error) {
        console.error('Failed to create FinancialAIService:', error);
        return null;
    }
}
export function createVectorizeServiceInstance(env, deps) {
    const { DOCUMENT_EMBEDDINGS: envVectorize, AI: envAi } = env;
    const ai = deps?.ai || envAi;
    const vectorize = deps?.vectorize || envVectorize;
    return createVectorizeService({
        vectorize,
        ai,
        embeddingModel: '@cf/baai/bge-base-en-v1.5',
        maxTextLength: 8000,
        chunkSize: 1000,
        chunkOverlap: 200
    });
}
export function createEmailService(env) {
    return {
        async sendEmail(params) {
            try {
                const { to, subject, htmlBody, textBody, from = env.SES_FROM_EMAIL, fromName = env.SES_FROM_NAME } = params;
                if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
                    throw new Error('AWS credentials not configured');
                }
                if (!from) {
                    throw new Error('From email address not configured');
                }
                // Prepare recipients
                const recipients = Array.isArray(to) ? to : [to];
                // Prepare the email body
                const body = {};
                if (htmlBody) {
                    body.Html = {
                        Charset: 'UTF-8',
                        Data: htmlBody
                    };
                }
                if (textBody) {
                    body.Text = {
                        Charset: 'UTF-8',
                        Data: textBody
                    };
                }
                // If no body provided, use subject as text body
                if (!htmlBody && !textBody) {
                    body.Text = {
                        Charset: 'UTF-8',
                        Data: subject
                    };
                }
                // Prepare the email message
                const message = {
                    Body: body,
                    Subject: {
                        Charset: 'UTF-8',
                        Data: subject
                    }
                };
                // Prepare the destination
                const destination = {
                    ToAddresses: recipients
                };
                // Prepare the source
                const source = fromName ? `${fromName} <${from}>` : from;
                // Create the SES request
                const sesRequest = {
                    Destination: destination,
                    Message: message,
                    Source: source
                };
                // Send email using AWS SES API
                const result = await sendSESEmail(sesRequest, env);
                return {
                    success: true,
                    messageId: result.MessageId
                };
            }
            catch (error) {
                console.error('Failed to send email:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        }
    };
}
// AWS SES API helper function
async function sendSESEmail(request, env) {
    const region = env.AWS_REGION || 'us-east-1';
    const service = 'ses';
    const host = `email.${region}.amazonaws.com`;
    const url = `https://${host}/`;
    // Create AWS Signature Version 4
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z';
    // Prepare the request body
    const body = new URLSearchParams();
    body.append('Action', 'SendEmail');
    body.append('Version', '2010-12-01');
    body.append('Source', request.Source);
    // Add destinations
    request.Destination.ToAddresses.forEach((email, index) => {
        body.append(`Destination.ToAddresses.member.${index + 1}`, email);
    });
    // Add message
    body.append('Message.Subject.Data', request.Message.Subject.Data);
    body.append('Message.Subject.Charset', request.Message.Subject.Charset);
    if (request.Message.Body.Text) {
        body.append('Message.Body.Text.Data', request.Message.Body.Text.Data);
        body.append('Message.Body.Text.Charset', request.Message.Body.Text.Charset);
    }
    if (request.Message.Body.Html) {
        body.append('Message.Body.Html.Data', request.Message.Body.Html.Data);
        body.append('Message.Body.Html.Charset', request.Message.Body.Html.Charset);
    }
    const bodyString = body.toString();
    // Create canonical request
    const canonicalHeaders = [
        `host:${host}`,
        `x-amz-date:${timeStamp}`
    ].join('\n');
    const signedHeaders = 'host;x-amz-date';
    const canonicalRequest = [
        'POST',
        '/',
        '',
        canonicalHeaders,
        '',
        signedHeaders,
        await sha256(bodyString)
    ].join('\n');
    // Create string to sign
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
        'AWS4-HMAC-SHA256',
        timeStamp,
        credentialScope,
        await sha256(canonicalRequest)
    ].join('\n');
    // Calculate signature
    const signature = await calculateSignature(env.AWS_SECRET_ACCESS_KEY, dateStamp, region, service, stringToSign);
    // Create authorization header
    const authorization = `AWS4-HMAC-SHA256 Credential=${env.AWS_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    // Make the request
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': authorization,
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
            'X-Amz-Date': timeStamp,
            'Host': host
        },
        body: bodyString
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SES API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const responseText = await response.text();
    // Parse XML response to get MessageId
    const messageIdMatch = responseText.match(/<MessageId>([^<]+)<\/MessageId>/);
    if (!messageIdMatch) {
        throw new Error('Failed to parse MessageId from SES response');
    }
    return { MessageId: messageIdMatch[1] };
}
// Helper functions for AWS signature
async function sha256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
async function hmacSha256(key, message) {
    const encoder = new TextEncoder();
    const keyObject = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', keyObject, encoder.encode(message));
    return new Uint8Array(signature);
}
async function calculateSignature(secretKey, dateStamp, region, service, stringToSign) {
    const encoder = new TextEncoder();
    let key = encoder.encode(`AWS4${secretKey}`);
    key = await hmacSha256(key, dateStamp);
    key = await hmacSha256(key, region);
    key = await hmacSha256(key, service);
    key = await hmacSha256(key, 'aws4_request');
    const signature = await hmacSha256(key, stringToSign);
    return Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('');
}
