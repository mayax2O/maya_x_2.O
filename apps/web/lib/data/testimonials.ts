import testimonialsJson from "../mock/testimonials.json";
import type { Testimonial } from "../types";

const testimonials = testimonialsJson as Testimonial[];

export async function getTestimonials(limit?: number): Promise<Testimonial[]> {
  return typeof limit === "number"
    ? testimonials.slice(0, limit)
    : testimonials;
}
