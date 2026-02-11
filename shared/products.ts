/**
 * Stripe product definitions for ticket sales
 * This file centralizes product and price configurations
 */

export interface TicketProduct {
  name: string;
  description: string;
  priceInCents: number;
  currency: string;
}

/**
 * Convert price from euros to cents for Stripe
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

/**
 * Convert price from cents to euros for display
 */
export function centsToEuros(cents: number): number {
  return cents / 100;
}

/**
 * Format price for display
 */
export function formatPrice(priceInCents: number, currency: string = 'EUR'): string {
  const euros = centsToEuros(priceInCents);
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: currency,
  }).format(euros);
}
