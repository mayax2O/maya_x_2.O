import faqsJson from "../mock/faqs.json";
import type { FaqItem } from "../types";

const faqs = faqsJson as FaqItem[];

export async function getFaqs(category?: string): Promise<FaqItem[]> {
  return category ? faqs.filter((faq) => faq.category === category) : faqs;
}
