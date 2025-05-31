
'use server';
/**
 * @fileOverview Composes and sends an incident report email with HTML formatting and image embedding.
 * This flow prepares the email content and sends it using Nodemailer.
 *
 * - sendIncidentReportEmail - Composes and sends an incident report email.
 * - SendIncidentReportEmailInput - The input type for the function.
 * - SendIncidentReportEmailOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import nodemailer from 'nodemailer';

const SendIncidentReportEmailInputSchema = z.object({
  incidentType: z.string().describe('The type of incident detected.'),
  description: z.string().describe('A detailed description of the incident.'),
  location: z.string().describe('The location of the incident within the frame.'),
  timestamp: z.number().describe('Timestamp of the incident in seconds.'),
  confidence: z.number().describe('The confidence level of the detection (0-1).'), // Kept for potential direct use
  confidencePercentage: z.number().describe('The confidence level of the detection as a percentage (0-100).'),
  severity: z.string().describe('The severity level of the incident (e.g., Low, Medium, High, Critical).'),
  frameDataUri: z.string().optional().describe("Optional. A snapshot of the incident frame, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type SendIncidentReportEmailInput = z.infer<typeof SendIncidentReportEmailInputSchema>;

// Schema for the input to the AI prompt, including pre-processed values
const EmailPromptInputSchema = SendIncidentReportEmailInputSchema.extend({
  currentYear: z.number().describe('The current calendar year.'),
  severityLowerCase: z.string().describe('The severity level in lowercase, for CSS class usage.')
});

const EmailContentSchema = z.object({
  emailSubject: z.string().describe('The subject line for the incident report email.'),
  emailBodyHTML: z.string().describe('The full HTML body content for the incident report email.'),
});

const SendIncidentReportEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the email sending was successful.'),
  messageId: z.string().optional().describe('The message ID if the email was sent successfully.'),
  sentEmailContentPreview: z.string().optional().describe('A preview of the HTML email content that was attempted to be sent.'),
  error: z.string().optional().describe('An error message if sending failed.'),
});
export type SendIncidentReportEmailOutput = z.infer<typeof SendIncidentReportEmailOutputSchema>;

export async function sendIncidentReportEmail(input: SendIncidentReportEmailInput): Promise<SendIncidentReportEmailOutput> {
  return sendIncidentReportEmailFlow(input);
}

const composeEmailPrompt = ai.definePrompt({
  name: 'composeIncidentEmailPrompt',
  input: {schema: EmailPromptInputSchema}, // Use the extended schema
  output: {schema: EmailContentSchema},
  prompt: `You are an automated incident reporting system for "AEYE".
Based on the following incident details, compose a concise and professional HTML email.
The email should be addressed to the relevant authorities (the recipient is configured in the sending system).
Include all relevant details: Incident Type, Description, Location, Timestamp (in seconds), Confidence (as a percentage), and Severity.

If a company logo is conceptually available, include an <img> tag in the HTML body with src="cid:aeyelogo" in the header section. Use "AEYE Security Alert" or similar for alt text. Style it appropriately (e.g., max-width: 150px, margin-bottom: 20px).
If a frame image data URI is conceptually available (indicated by the 'frameDataUri' field in the input), include an <img> tag in the HTML body with src="cid:incidentframe". Otherwise, state that no image is available.

Incident Details:
Type: {{{incidentType}}}
Severity: {{{severity}}}
Description: {{{description}}}
Location: {{{location}}}
Timestamp: {{{timestamp}}}s
Confidence: {{confidencePercentage}}%
Frame Available (Conceptual): {{#if frameDataUri}}Yes{{else}}No{{/if}}

Please provide the email subject and the full HTML email body.

Use the following HTML structure for the email body. Adapt colors to match a professional security alert theme (primary: #2E3148 deep navy blue, accent: #FFB830 vibrant amber, background: #F0F2F5 light grey):
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Incident Report - AEYE</title>
    <style>
        body { margin: 0; padding: 0; width: 100% !important; -webkit-font-smoothing: antialiased; background-color: #F0F2F5; font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333333; }
        .email-container { max-width: 680px; margin: 20px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eeeeee; }
        .header img { max-width: 150px; height: auto; margin-bottom: 10px; }
        .content h1 { color: #2E3148; font-size: 24px; margin-top: 20px; margin-bottom:10px; font-weight: 600; }
        .content p { margin-bottom: 15px; font-size: 16px; color: #555555;}
        .details-table { width: 100%; margin-top:20px; margin-bottom: 20px; border-collapse: collapse; }
        .details-table th, .details-table td { text-align: left; padding: 12px; border: 1px solid #dddddd; font-size:15px; }
        .details-table th { background-color: #f9f9f9; color: #2E3148; font-weight: bold; width: 35%; }
        .details-table td strong { color: #2E3148; }
        .severity-critical { color: #d9534f; font-weight: bold; }
        .severity-high { color: #FFB830; font-weight: bold; } /* Amber for High */
        .severity-medium { color: #5bc0de; font-weight: bold; } /* A distinct color for medium */
        .severity-low { color: #777777; }
        .image-container { text-align: center; margin-top: 25px; padding-top: 25px; border-top: 1px solid #eeeeee; }
        .image-container img { max-width: 100%; height: auto; border: 1px solid #cccccc; border-radius: 6px; margin-top: 10px; }
        .footer { text-align: center; font-size: 0.9em; color: #777777; margin-top: 30px; padding-top: 15px; border-top: 1px solid #eeeeee;}
        .footer p { margin-bottom: 5px;}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <img src="cid:aeyelogo" alt="AEYE System Logo" style="max-width: 150px; margin-bottom: 20px;"/>
        </div>
        <div class="content">
            <h1>Incident Report: {{{incidentType}}}</h1>
            <p>An automated incident detection system has identified a potential public safety event. Please review the details below:</p>
            <table class="details-table">
                <tr><th>Severity:</th><td class="severity-{{severityLowerCase}}"><strong>{{{severity}}}</strong></td></tr>
                <tr><th>Incident Type:</th><td>{{{incidentType}}}</td></tr>
                <tr><th>Description:</th><td>{{{description}}}</td></tr>
                <tr><th>Location:</th><td>{{{location}}}</td></tr>
                <tr><th>Timestamp:</th><td>{{{timestamp}}}s</td></tr>
                <tr><th>Confidence:</th><td>{{confidencePercentage}}%</td></tr>
            </table>
            {{#if frameDataUri}}
            <div class="image-container">
                <p><strong>Incident Scene Snapshot:</strong></p>
                <img src="cid:incidentframe" alt="Incident Scene Snapshot" />
            </div>
            {{else}}
            <p style="text-align:center;"><em>No image snapshot is available for this incident.</em></p>
            {{/if}}
        </div>
        <div class="footer">
            <p>This is an automated notification from the AEYE System.</p>
            <p>&copy; {{currentYear}} AEYE. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`,
});

const sendIncidentReportEmailFlow = ai.defineFlow(
  {
    name: 'sendIncidentReportEmailFlow',
    inputSchema: SendIncidentReportEmailInputSchema,
    outputSchema: SendIncidentReportEmailOutputSchema,
  },
  async (input) => {
    let emailSubject = `AEYE Alert: ${input.incidentType} - Severity: ${input.severity}`;
    // Default HTML body if AI fails
    let emailBodyHTML = `
      <html><body>
        <h1>Incident Report: ${input.incidentType}</h1>
        <p>Severity: ${input.severity}</p>
        <p>Description: ${input.description}</p>
        <p>Location: ${input.location}</p>
        <p>Timestamp: ${input.timestamp}s</p>
        <p>Confidence: ${input.confidencePercentage}%</p>
        ${input.frameDataUri ? '<p>An image was associated with this incident. cid:incidentframe</p>' : '<p>No image was associated with this incident.</p>'}
        <p>Footer: This is an automated notification from the AEYE System.</p>
      </body></html>`;
    let sentEmailContentPreview = `To: ${process.env.SMTP_RECIPIENT_EMAIL || 'arunmouli36@gmail.com'}\nSubject: ${emailSubject}\n\nBody (HTML):\n${emailBodyHTML}`;

    try {
      // Add currentYear and pre-process severity to lowercase for the AI prompt
      const enrichedInputForPrompt: z.infer<typeof EmailPromptInputSchema> = {
        ...input,
        currentYear: new Date().getFullYear(),
        severityLowerCase: input.severity.toLowerCase(),
      };

      const {output: composedEmail} = await composeEmailPrompt(enrichedInputForPrompt);
      if (!composedEmail || !composedEmail.emailSubject || !composedEmail.emailBodyHTML) {
        console.warn('AI failed to generate email subject or HTML body. Sending with default content.');
        // Use the AI-generated subject if available, even if body fails
        if (composedEmail && composedEmail.emailSubject) emailSubject = composedEmail.emailSubject;
      } else {
        emailSubject = composedEmail.emailSubject;
        emailBodyHTML = composedEmail.emailBodyHTML;
      }
      
      sentEmailContentPreview = `To: ${process.env.SMTP_RECIPIENT_EMAIL || 'arunmouli36@gmail.com'}\nSubject: ${emailSubject}\n\nBody (HTML Preview):\n${emailBodyHTML.substring(0, 500)}...`;

      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_FROM_EMAIL || !process.env.SMTP_RECIPIENT_EMAIL) {
        console.error("SMTP environment variables are not fully configured. Cannot send email. Check .env file.");
        return { 
          success: false, 
          error: "SMTP environment variables not configured.",
          sentEmailContentPreview
        };
      }
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions: nodemailer.SendMailOptions = {
        from: `"AEYE System" <${process.env.SMTP_FROM_EMAIL}>`, // Optional: Add a name to the from address
        to: process.env.SMTP_RECIPIENT_EMAIL,
        subject: emailSubject,
        html: emailBodyHTML,
        attachments: [],
      };

      if (input.frameDataUri && mailOptions.attachments) {
        mailOptions.attachments.push({
          filename: 'incident-frame.jpg', 
          path: input.frameDataUri,
          cid: 'incidentframe' 
        });
      }
      
      // TODO: Implement AEYE logo embedding if desired.
      // This requires making the 'aeye-logo.png' file accessible to this server-side flow.
      // For example, by placing 'aeye-logo.png' in an 'assets' directory within 'src/ai/flows' or similar
      // and then using path.join to get its absolute path.
      // Example (ensure 'fs' and 'path' are imported):
      // import fs from 'fs';
      // import path from 'path';
      // const logoPath = path.join(process.cwd(), 'src', 'assets', 'aeye-logo.png'); // Adjust path as needed
      // if (fs.existsSync(logoPath) && mailOptions.attachments) {
      //   mailOptions.attachments.push({
      //     filename: 'aeye-logo.png',
      //     path: logoPath,
      //     cid: 'aeyelogo'
      //   });
      // }
      // Alternatively, store logo as a base64 string constant and use that for the attachment.
      // const logoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA..."; // Your actual base64 string
      // if (mailOptions.attachments) {
      //    mailOptions.attachments.push({
      //        filename: 'aeye-logo.png',
      //        content: logoBase64.split('base64,')[1], // Extract base64 part
      //        encoding: 'base64',
      //        cid: 'aeyelogo'
      //    });
      // }

      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", info.messageId);
      return { success: true, messageId: info.messageId, sentEmailContentPreview };

    } catch (error) {
      console.error('Error in sendIncidentReportEmailFlow:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during email processing or sending.';
      return { 
        success: false, 
        error: errorMessage,
        sentEmailContentPreview
      };
    }
  }
);

    
    