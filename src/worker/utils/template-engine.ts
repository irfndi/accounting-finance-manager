interface TemplateData {
  [key: string]: any
}

export class TemplateEngine {
  static render(template: string, _data: TemplateData): string {
    return template
  }
}

export class EmailTemplateManager {
  private static templates: Map<string, string> = new Map()
  
  static registerTemplate(name: string, template: string): void {
    this.templates.set(name, template)
  }
  
  static getTemplate(name: string): string | undefined {
    return this.templates.get(name)
  }
  
  static renderTemplate(name: string, data: TemplateData): string {
    const template = this.getTemplate(name)
    if (!template) {
      throw new Error(`Template '${name}' not found`)
    }
    
    return TemplateEngine.render(template, data)
  }
  
  static getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys())
  }
  
  static hasTemplate(name: string): boolean {
    return this.templates.has(name)
  }
}

export class EmailFormatters {
  static currency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }
  
  static formatCurrency(amount: number): string {
    return this.currency(amount)
  }
  
  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString()
  }
  
  static formatPercentage(value: number): string {
    return `${(value * 100).toFixed(2)}%`
  }
  
  static getAmountClass(amount: number): string {
    return amount >= 0 ? 'positive' : 'negative'
  }
}