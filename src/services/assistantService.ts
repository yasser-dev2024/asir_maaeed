import type { KeywordAnswer } from '../types/domain';

function normalizeArabic(value: string): string {
  return value
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ًٌٍَُِّْـ]/g, '')
    .replace(/[^\u0600-\u06FFa-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface AssistantMatch {
  answer: KeywordAnswer | null;
  confidence: number;
}

export interface AssistantProvider {
  name: string;
  send(input: string, answers: KeywordAnswer[]): Promise<AssistantMatch>;
}

export class KeywordAssistantProvider implements AssistantProvider {
  name = 'keyword-engine';

  async send(input: string, answers: KeywordAnswer[]): Promise<AssistantMatch> {
    const normalizedInput = normalizeArabic(input);
    const activeAnswers = answers.filter((answer) => answer.active);
    let best: AssistantMatch = { answer: null, confidence: 0 };

    for (const answer of activeAnswers) {
      const terms = [answer.question, ...answer.keywords].map(normalizeArabic);
      const score = terms.reduce((total, term) => {
        if (!term) {
          return total;
        }

        if (normalizedInput.includes(term)) {
          return total + 8;
        }

        const inputTokens = normalizedInput.split(' ');
        const termTokens = term.split(' ');
        const overlap = termTokens.filter((token) => inputTokens.includes(token)).length;
        return total + overlap;
      }, 0);

      if (score > best.confidence) {
        best = { answer, confidence: score };
      }
    }

    return best.confidence > 0 ? best : { answer: null, confidence: 0 };
  }
}

export const keywordAssistantProvider = new KeywordAssistantProvider();

export const futureAssistantProviders = {
  openAI: 'جاهز للتوصيل عبر طبقة AssistantProvider',
  azureAI: 'جاهز للتوصيل عبر طبقة AssistantProvider',
  googleGemini: 'جاهز للتوصيل عبر طبقة AssistantProvider',
};
