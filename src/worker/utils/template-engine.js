export class TemplateEngine {
    static render(template, _data) {
        return template;
    }
}
export class EmailTemplateManager {
    static templates = new Map();
    static registerTemplate(name, template) {
        this.templates.set(name, template);
    }
    static getTemplate(name) {
        return this.templates.get(name);
    }
    static renderTemplate(name, data) {
        const template = this.getTemplate(name);
        if (!template) {
            throw new Error(`Template '${name}' not found`);
        }
        return TemplateEngine.render(template, data);
    }
    static getAvailableTemplates() {
        return Array.from(this.templates.keys());
    }
    static hasTemplate(name) {
        return this.templates.has(name);
    }
}
export class EmailFormatters {
    static currency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
    static formatCurrency(amount) {
        return this.currency(amount);
    }
    static formatDate(date) {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString();
    }
    static formatPercentage(value) {
        return `${(value * 100).toFixed(2)}%`;
    }
    static getAmountClass(amount) {
        return amount >= 0 ? 'positive' : 'negative';
    }
}
