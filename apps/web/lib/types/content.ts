/**
 * Marketing/content-surface types (testimonials, FAQ) — not backed by their
 * own database tables yet in docs/04-database, so these are the frontend's
 * own contract. Kept in the same shape a future CMS/API response would use
 * (flat, JSON-serializable) so lib/data/*.ts can swap its source without
 * touching any component.
 */

export interface Testimonial {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  city: string;
  rating: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}
