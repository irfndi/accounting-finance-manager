import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { AppContext } from '../../types';
import { authMiddleware } from '../../middleware/auth';
import { createEmailService } from '../../services';
import { EmailTemplateManager, TemplateEngine, EmailFormatters } from '../../utils/template-engine';

const notificationsRouter = new Hono<AppContext>();

// Email notification schemas
const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  isHtml: z.boolean().optional()
});

const sendBulkEmailSchema = z.object({
  recipients: z.array(z.object({
    email: z.string().email(),
    personalizations: z.record(z.string()).optional()
  })),
  template: z.object({
    subject: z.string().min(1, 'Subject is required'),
    htmlBody: z.string().optional(),
    textBody: z.string().optional()
  }),
  from: z.string().email().optional(),
  fromName: z.string().optional()
});

const sendTemplateEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  template: z.string().min(1, 'Template name is required'),
  data: z.record(z.any()).optional(),
  subject: z.string().optional() // Override template subject if provided
});

// Send single email
notificationsRouter.post('/send', authMiddleware, zValidator('json', sendEmailSchema), async (c) => {
  const { to, subject, body, isHtml } = c.req.valid('json')
  
  try {
    const emailService = createEmailService(c.env)
    
    await emailService.sendEmail({
      to: Array.isArray(to) ? to : [to],
      subject,
      ...(isHtml ? { htmlBody: body } : { textBody: body })
    })
    
    return c.json({ success: true, message: 'Email sent successfully' })
  } catch (error) {
    console.error('Failed to send email:', error)
    return c.json({ 
      error: 'Failed to send email', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// Send bulk emails
notificationsRouter.post('/send-bulk', authMiddleware, zValidator('json', sendBulkEmailSchema), async (c) => {
  try {
    const emailService = createEmailService(c.env);
    const bulkData = c.req.valid('json');
    
    const results = [];
    
    // Process emails in batches to avoid overwhelming SES
    const batchSize = 10;
    for (let i = 0; i < bulkData.recipients.length; i += batchSize) {
      const batch = bulkData.recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        try {
          // Apply personalizations to template
          let subject = bulkData.template.subject;
          let htmlBody = bulkData.template.htmlBody;
          let textBody = bulkData.template.textBody;
          
          if (recipient.personalizations) {
            for (const [key, value] of Object.entries(recipient.personalizations)) {
              const placeholder = `{{${key}}}`;
              subject = subject.replace(new RegExp(placeholder, 'g'), value);
              if (htmlBody) htmlBody = htmlBody.replace(new RegExp(placeholder, 'g'), value);
              if (textBody) textBody = textBody.replace(new RegExp(placeholder, 'g'), value);
            }
          }
          
          const result = await emailService.sendEmail({
            to: recipient.email,
            subject,
            htmlBody,
            textBody,
            from: bulkData.from,
            fromName: bulkData.fromName
          });
          
          return {
            email: recipient.email,
            success: result.success,
            messageId: result.messageId,
            error: result.error
          };
        } catch (error) {
          console.error('Error sending email to recipient:', error instanceof Error ? error.message : String(error));
          return {
            email: recipient.email,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add small delay between batches to respect SES rate limits
      if (i + batchSize < bulkData.recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    return c.json({
      success: failureCount === 0,
      totalSent: successCount,
      totalFailed: failureCount,
      results,
      message: `Bulk email completed: ${successCount} sent, ${failureCount} failed`
    });
  } catch (error) {
    console.error('Bulk email sending error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Internal server error while sending bulk emails'
    }, 500);
  }
});

// Send notification templates
notificationsRouter.post('/send-template/:templateType', authMiddleware, async (c) => {
  try {
    const templateType = c.req.param('templateType');
    const { to, data } = await c.req.json();
    
    if (!to || !Array.isArray(to) && typeof to !== 'string') {
      return c.json({
        success: false,
        error: 'Invalid recipient(s)'
      }, 400);
    }
    
    const emailService = createEmailService(c.env);
    let emailContent;
    
    // Generate email content based on template type
    switch (templateType) {
      case 'transaction-alert':
        emailContent = generateTransactionAlertEmail(data);
        break;
      case 'budget-warning':
        emailContent = generateBudgetWarningEmail(data);
        break;
      case 'monthly-report':
        emailContent = generateMonthlyReportEmail(data);
        break;
      case 'account-activity':
        emailContent = generateAccountActivityEmail(data);
        break;
      default:
        return c.json({
          success: false,
          error: `Unknown template type: ${templateType}`
        }, 400);
    }
    
    const result = await emailService.sendEmail({
      to,
      ...emailContent
    });
    
    if (result.success) {
      return c.json({
        success: true,
        messageId: result.messageId,
        templateType,
        message: 'Template email sent successfully'
      });
    } else {
      return c.json({
        success: false,
        error: result.error,
        message: 'Failed to send template email'
      }, 400);
    }
  } catch (error) {
    console.error('Template email sending error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Internal server error while sending template email'
    }, 500);
  }
});

// Get available email templates
notificationsRouter.get('/templates', authMiddleware, async (c) => {
  try {
    initializeEmailTemplates()
    
    const templates = EmailTemplateManager.getAvailableTemplates()
    
    return c.json({ 
      success: true, 
      templates: templates.map(name => ({
        name,
        description: getTemplateDescription(name)
      }))
    })
  } catch (error) {
    console.error('Failed to get templates:', error)
    return c.json({ 
      error: 'Failed to get templates', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// Send template-based email
notificationsRouter.post('/send-template', authMiddleware, zValidator('json', sendTemplateEmailSchema), async (c) => {
  const { to, template, data = {}, subject } = c.req.valid('json')
  
  try {
    // Initialize templates if not already done
    initializeEmailTemplates()
    
    const emailService = createEmailService(c.env)
    
    // Get and render template
    const templateContent = EmailTemplateManager.getTemplate(template)
    if (!templateContent) {
      return c.json({ 
        error: 'Template not found', 
        message: `Email template '${template}' does not exist`,
        availableTemplates: EmailTemplateManager.getAvailableTemplates()
      }, 404)
    }
    
    // Add common data
    const templateData = {
      ...data,
      recipientEmail: Array.isArray(to) ? to[0] : to,
      generatedDate: EmailFormatters.formatDate(new Date()),
      // Add formatters to template data
      formatCurrency: EmailFormatters.formatCurrency,
      formatDate: EmailFormatters.formatDate,
      formatPercentage: EmailFormatters.formatPercentage,
      getAmountClass: EmailFormatters.getAmountClass
    }
    
    const renderedContent = TemplateEngine.render(templateContent, templateData)
    
    // Extract subject from template if not provided
    const emailSubject = subject || extractSubjectFromTemplate(renderedContent) || `Finance Manager - ${template}`
    
    await emailService.sendEmail({
      to: Array.isArray(to) ? to : [to],
      subject: emailSubject,
      htmlBody: renderedContent
    })
    
    return c.json({ 
      success: true, 
      message: 'Template email sent successfully',
      template: template
    })
  } catch (error) {
    console.error('Failed to send template email:', error)
    return c.json({ 
      error: 'Failed to send template email', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})



// Test email configuration
notificationsRouter.post('/test', authMiddleware, async (c) => {
  try {
    const emailService = createEmailService(c.env)
    
    const fromEmail = c.env.SES_FROM_EMAIL
    if (!fromEmail) {
      throw new Error('SES_FROM_EMAIL environment variable is not configured')
    }
    
    await emailService.sendEmail({
      to: [fromEmail],
      subject: 'Email Configuration Test',
      textBody: 'This is a test email to verify AWS SES configuration.'
    })
    
    return c.json({ success: true, message: 'Test email sent successfully' })
  } catch (error) {
    console.error('Failed to send test email:', error)
    return c.json({ 
      error: 'Failed to send test email', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// Email template generators
function generateTransactionAlertEmail(data: any) {
  const { transaction, account } = data;
  
  return {
    subject: `Transaction Alert: ${transaction.type} of $${transaction.amount}`,
    htmlBody: `
      <h2>Transaction Alert</h2>
      <p>A new transaction has been recorded in your account:</p>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Account:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${account.name}</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Type:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${transaction.type}</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Amount:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">$${transaction.amount}</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Date:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${transaction.date}</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Description:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${transaction.description || 'N/A'}</td></tr>
      </table>
    `,
    textBody: `
Transaction Alert

A new transaction has been recorded in your account:

Account: ${account.name}
Type: ${transaction.type}
Amount: $${transaction.amount}
Date: ${transaction.date}
Description: ${transaction.description || 'N/A'}
    `
  };
}

function generateBudgetWarningEmail(data: any) {
  const { budget, currentAmount } = data;
  const percentage = Math.round((currentAmount / budget.amount) * 100);
  
  return {
    subject: `Budget Warning: ${budget.name} at ${percentage}% of limit`,
    htmlBody: `
      <h2>Budget Warning</h2>
      <p>Your budget "${budget.name}" has reached ${percentage}% of its limit.</p>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Budget:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${budget.name}</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Limit:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">$${budget.amount}</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Current:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">$${currentAmount}</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Remaining:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">$${budget.amount - currentAmount}</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Percentage:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${percentage}%</td></tr>
      </table>
      <p style="color: ${percentage >= 90 ? 'red' : 'orange'};">Please review your spending to stay within budget.</p>
    `,
    textBody: `
Budget Warning

Your budget "${budget.name}" has reached ${percentage}% of its limit.

Budget: ${budget.name}
Limit: $${budget.amount}
Current: $${currentAmount}
Remaining: $${budget.amount - currentAmount}
Percentage: ${percentage}%

Please review your spending to stay within budget.
    `
  };
}

function generateMonthlyReportEmail(data: any) {
  const { month, year, summary } = data;
  
  return {
    subject: `Monthly Financial Report - ${month} ${year}`,
    htmlBody: `
      <h2>Monthly Financial Report</h2>
      <h3>${month} ${year}</h3>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Total Income:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">$${summary.totalIncome}</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Total Expenses:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">$${summary.totalExpenses}</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Net Income:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">$${summary.netIncome}</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Transaction Count:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${summary.transactionCount}</td></tr>
      </table>
      <p>View your detailed financial dashboard for more insights.</p>
    `,
    textBody: `
Monthly Financial Report - ${month} ${year}

Total Income: $${summary.totalIncome}
Total Expenses: $${summary.totalExpenses}
Net Income: $${summary.netIncome}
Transaction Count: ${summary.transactionCount}

View your detailed financial dashboard for more insights.
    `
  };
}

function generateAccountActivityEmail(data: any) {
  const { account, activities, period } = data;
  
  return {
    subject: `Account Activity Summary - ${account.name}`,
    htmlBody: `
      <h2>Account Activity Summary</h2>
      <h3>${account.name} - ${period}</h3>
      <p>Recent activity in your account:</p>
      <ul>
        ${activities.map((activity: any) => `
          <li>${activity.date}: ${activity.description} - $${activity.amount}</li>
        `).join('')}
      </ul>
      <p>Total activities: ${activities.length}</p>
    `,
    textBody: `
Account Activity Summary - ${account.name} - ${period}

Recent activity in your account:
${activities.map((activity: any) => `- ${activity.date}: ${activity.description} - $${activity.amount}`).join('\n')}

Total activities: ${activities.length}
    `
  };
}

// Helper functions
function initializeEmailTemplates(): void {
  // Register built-in templates
  if (EmailTemplateManager.getAvailableTemplates().length === 0) {
    // These would typically be loaded from files or a database
    // For now, we'll register template names that correspond to our HTML files
    EmailTemplateManager.registerTemplate('transaction-alert', getTransactionAlertTemplate())
    EmailTemplateManager.registerTemplate('budget-alert', getBudgetAlertTemplate())
    EmailTemplateManager.registerTemplate('monthly-report', getMonthlyReportTemplate())
    EmailTemplateManager.registerTemplate('magic-link-login', getMagicLinkLoginTemplate())
    EmailTemplateManager.registerTemplate('magic-link-register', getMagicLinkRegisterTemplate())
    EmailTemplateManager.registerTemplate('magic-link-verify-email', getMagicLinkVerifyEmailTemplate())
    EmailTemplateManager.registerTemplate('magic-link-reset-password', getMagicLinkResetPasswordTemplate())
    EmailTemplateManager.registerTemplate('welcome', getWelcomeTemplate())
  }
}

function getTemplateDescription(templateName: string): string {
  const descriptions: Record<string, string> = {
    'transaction-alert': 'Notification for new transactions',
    'budget-alert': 'Alert when budget thresholds are exceeded',
    'monthly-report': 'Comprehensive monthly financial summary',
    'magic-link-login': 'Magic link for passwordless login',
    'magic-link-register': 'Magic link for account registration',
    'magic-link-verify-email': 'Email verification magic link',
    'magic-link-reset-password': 'Password reset magic link',
    'welcome': 'Welcome email for new users'
  }
  return descriptions[templateName] || 'Custom email template'
}

function extractSubjectFromTemplate(content: string): string | null {
  const titleMatch = content.match(/<title>([^<]+)<\/title>/i)
  return titleMatch ? titleMatch[1] : null
}

// Template content getters (in a real implementation, these would load from files)
function getTransactionAlertTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transaction Alert</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .transaction-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
        .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
        .amount.positive { color: #059669; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Transaction Alert</h1>
        <p>Finance Manager Notification</p>
    </div>
    <div class="content">
        <p>Hello,</p>
        <p>A new transaction has been recorded in your finance system:</p>
        <div class="transaction-details">
            <h3>Transaction Details</h3>
            <p><strong>Date:</strong> {{date}}</p>
            <p><strong>Description:</strong> {{description}}</p>
            <p><strong>Account:</strong> {{account}}</p>
            <p><strong>Category:</strong> {{category}}</p>
            <p><strong>Amount:</strong> <span class="amount {{amountClass}}">{{amount}}</span></p>
            {{#if reference}}<p><strong>Reference:</strong> {{reference}}</p>{{/if}}
        </div>
        <p>This notification was sent automatically by your Finance Manager system.</p>
    </div>
    <div class="footer">
        <p>Finance Manager System | Automated Notification</p>
        <p>This email was sent to {{recipientEmail}}</p>
    </div>
</body>
</html>`
}

function getBudgetAlertTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Budget Alert</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .header.warning { background: #f59e0b; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .budget-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
        .amount { font-size: 18px; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header {{alertType}}">
        <h1>🚨 Budget Alert</h1>
        <p>{{alertTitle}}</p>
    </div>
    <div class="content">
        <p>Hello,</p>
        <p>{{alertMessage}}</p>
        <div class="budget-details {{alertType}}">
            <h3>Budget Overview</h3>
            <p><strong>Budget Category:</strong> {{budgetCategory}}</p>
            <p><strong>Budget Limit:</strong> <span class="amount">{{budgetLimit}}</span></p>
            <p><strong>Current Spending:</strong> <span class="amount">{{currentSpending}}</span></p>
            <p><strong>Remaining:</strong> <span class="amount">{{remaining}}</span></p>
        </div>
        <p>You can view detailed budget reports in your Finance Manager dashboard.</p>
    </div>
    <div class="footer">
        <p>Finance Manager System | Budget Monitoring</p>
        <p>This alert was sent to {{recipientEmail}}</p>
    </div>
</body>
</html>`
}

function getMonthlyReportTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Monthly Financial Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .summary-amount { font-size: 24px; font-weight: bold; margin: 0; }
        .positive { color: #059669; } .negative { color: #dc2626; } .neutral { color: #2563eb; }
        .section { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Monthly Financial Report</h1>
        <p>{{reportPeriod}}</p>
    </div>
    <div class="content">
        <p>Dear {{recipientName}},</p>
        <p>Here's your comprehensive financial summary for {{reportPeriod}}:</p>
        <div class="section">
            <h3>Financial Summary</h3>
            <p><strong>Total Revenue:</strong> <span class="summary-amount positive">{{totalRevenue}}</span></p>
            <p><strong>Total Expenses:</strong> <span class="summary-amount negative">{{totalExpenses}}</span></p>
            <p><strong>Net Income:</strong> <span class="summary-amount {{netIncomeClass}}">{{netIncome}}</span></p>
        </div>
        <p>For detailed analysis, please visit your Finance Manager dashboard.</p>
    </div>
    <div class="footer">
        <p>Finance Manager System | Monthly Reporting</p>
        <p>Report sent to {{recipientEmail}}</p>
    </div>
</body>
</html>`
}

// Magic Link Email Templates
function getMagicLinkLoginTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login to Finance Manager</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; }
        .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .magic-link-btn { display: inline-block; background: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: background-color 0.2s; }
        .magic-link-btn:hover { background: #1d4ed8; }
        .security-note { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .expiry { color: #dc2626; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Login to Finance Manager</h1>
            <p>Secure passwordless access</p>
        </div>
        <div class="content">
            <p>Hello {{recipientName}},</p>
            <p>Click the button below to securely log in to your Finance Manager account:</p>
            
            <div style="text-align: center;">
                <a href="{{magicLinkUrl}}" class="magic-link-btn">Log In to Finance Manager</a>
            </div>
            
            <div class="security-note">
                <p><strong>🛡️ Security Notice:</strong></p>
                <ul>
                    <li>This link will expire in <span class="expiry">{{expiryText}}</span></li>
                    <li>Only use this link if you requested to log in</li>
                    <li>Never share this link with anyone</li>
                </ul>
            </div>
            
            <p>If you didn't request this login link, please ignore this email. Your account remains secure.</p>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px; font-family: monospace;">{{magicLinkUrl}}</p>
        </div>
        <div class="footer">
            <p>Finance Manager | Secure Authentication</p>
            <p>This email was sent to {{recipientEmail}}</p>
        </div>
    </div>
</body>
</html>`
}

function getMagicLinkRegisterTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Complete Your Registration</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; }
        .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #059669, #047857); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .magic-link-btn { display: inline-block; background: #059669; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: background-color 0.2s; }
        .magic-link-btn:hover { background: #047857; }
        .features { background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .expiry { color: #dc2626; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to Finance Manager!</h1>
            <p>Complete your account setup</p>
        </div>
        <div class="content">
            <p>Hello {{recipientName}},</p>
            <p>Welcome to Finance Manager! Click the button below to complete your registration and start managing your finances:</p>
            
            <div style="text-align: center;">
                <a href="{{magicLinkUrl}}" class="magic-link-btn">Complete Registration</a>
            </div>
            
            <div class="features">
                <h3>🚀 What you'll get:</h3>
                <ul>
                    <li>📊 Comprehensive financial dashboard</li>
                    <li>💰 Transaction tracking and categorization</li>
                    <li>📈 Budget management and alerts</li>
                    <li>📧 Automated financial reports</li>
                    <li>🤖 AI-powered financial insights</li>
                </ul>
            </div>
            
            <p><strong>⏰ This registration link expires in {{expiryText}}</strong></p>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px; font-family: monospace;">{{magicLinkUrl}}</p>
        </div>
        <div class="footer">
            <p>Finance Manager | Account Registration</p>
            <p>This email was sent to {{recipientEmail}}</p>
        </div>
    </div>
</body>
</html>`
}

function getMagicLinkVerifyEmailTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email Address</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; }
        .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #17a2b8, #138496); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .magic-link-btn { display: inline-block; background: #17a2b8; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: background-color 0.2s; }
        .magic-link-btn:hover { background: #138496; }
        .verification-note { background: #e1f5fe; border: 1px solid #17a2b8; border-radius: 8px; padding: 16px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .expiry { color: #dc2626; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✉️ Verify Your Email</h1>
            <p>Confirm your email address</p>
        </div>
        <div class="content">
            <p>Hello {{recipientName}},</p>
            <p>Please verify your email address to complete your Finance Manager account setup:</p>
            
            <div style="text-align: center;">
                <a href="{{magicLinkUrl}}" class="magic-link-btn">Verify Email Address</a>
            </div>
            
            <div class="verification-note">
                <p><strong>📧 Why verify your email?</strong></p>
                <ul>
                    <li>Secure your account access</li>
                    <li>Receive important financial notifications</li>
                    <li>Enable password reset functionality</li>
                    <li>Get monthly financial reports</li>
                </ul>
            </div>
            
            <p><strong>⏰ This verification link expires in {{expiryText}}</strong></p>
            
            <p>If you didn't create a Finance Manager account, please ignore this email.</p>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px; font-family: monospace;">{{magicLinkUrl}}</p>
        </div>
        <div class="footer">
            <p>Finance Manager | Email Verification</p>
            <p>This email was sent to {{recipientEmail}}</p>
        </div>
    </div>
</body>
</html>`
}

function getMagicLinkResetPasswordTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; }
        .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .magic-link-btn { display: inline-block; background: #f59e0b; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: background-color 0.2s; }
        .magic-link-btn:hover { background: #d97706; }
        .security-note { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .expiry { color: #dc2626; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔑 Reset Your Password</h1>
            <p>Secure password reset</p>
        </div>
        <div class="content">
            <p>Hello {{recipientName}},</p>
            <p>You requested to reset your Finance Manager password. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
                <a href="{{magicLinkUrl}}" class="magic-link-btn">Reset Password</a>
            </div>
            
            <div class="security-note">
                <p><strong>🛡️ Security Information:</strong></p>
                <ul>
                    <li>This link will expire in <span class="expiry">{{expiryText}}</span></li>
                    <li>Only use this link if you requested a password reset</li>
                    <li>After clicking, you'll be able to set a new password</li>
                    <li>Your current password remains active until you set a new one</li>
                </ul>
            </div>
            
            <p>If you didn't request a password reset, please ignore this email. Your account remains secure.</p>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px; font-family: monospace;">{{magicLinkUrl}}</p>
        </div>
        <div class="footer">
            <p>Finance Manager | Password Reset</p>
            <p>This email was sent to {{recipientEmail}}</p>
        </div>
    </div>
</body>
</html>`
}

function getWelcomeTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Finance Manager!</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; }
        .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .cta-btn { display: inline-block; background: #8b5cf6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: background-color 0.2s; }
        .cta-btn:hover { background: #7c3aed; }
        .features { background: #faf5ff; border: 1px solid #8b5cf6; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .getting-started { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to Finance Manager!</h1>
            <p>Your journey to financial clarity starts here</p>
        </div>
        <div class="content">
            <p>Hello {{recipientName}},</p>
            <p>Congratulations! Your Finance Manager account has been successfully created. You're now ready to take control of your financial future.</p>
            
            <div style="text-align: center;">
                <a href="{{dashboardUrl}}" class="cta-btn">Access Your Dashboard</a>
            </div>
            
            <div class="features">
                <h3>🚀 What you can do now:</h3>
                <ul>
                    <li>📊 <strong>Track Transactions:</strong> Monitor all your income and expenses</li>
                    <li>💰 <strong>Manage Budgets:</strong> Set spending limits and get alerts</li>
                    <li>📈 <strong>View Reports:</strong> Get insights into your financial patterns</li>
                    <li>🤖 <strong>AI Insights:</strong> Receive personalized financial recommendations</li>
                    <li>📧 <strong>Email Notifications:</strong> Stay updated with automated reports</li>
                </ul>
            </div>
            
            <div class="getting-started">
                <h3>🏁 Getting Started:</h3>
                <ol>
                    <li><strong>Add your first account</strong> (bank, credit card, etc.)</li>
                    <li><strong>Import or add transactions</strong> to see your financial picture</li>
                    <li><strong>Set up budgets</strong> for different spending categories</li>
                    <li><strong>Explore the dashboard</strong> to understand your finances</li>
                </ol>
            </div>
            
            <p>Need help getting started? Check out our <a href="{{helpUrl}}" style="color: #8b5cf6;">help documentation</a> or contact our support team.</p>
            
            <p>Thank you for choosing Finance Manager. We're excited to help you achieve your financial goals!</p>
        </div>
        <div class="footer">
            <p>Finance Manager | Welcome</p>
            <p>This email was sent to {{recipientEmail}}</p>
        </div>
    </div>
</body>
</html>`
}

export default notificationsRouter;