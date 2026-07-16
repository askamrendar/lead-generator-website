import type { BusinessConfig } from '@/lib/generator/schema';
import type { PageDefinition } from '@/lib/builder/types';

/**
 * Deterministic legal pages (Privacy Policy / Terms of Service) for generated
 * websites, composed from the site's own business data using the EXISTING
 * `rich-text` block — no new block types, no new page format. These are honest
 * generic templates a small local business can start from, clearly labelled as
 * such; they are not legal advice.
 */

function section(title: string, text: string) {
  return { type: 'rich-text', props: { title, text } };
}

export function legalPage(kind: 'privacy' | 'terms', b: BusinessConfig): PageDefinition {
  const site = b.siteUrl;
  const contact = `${b.email} · ${b.phone}`;

  if (kind === 'privacy') {
    return {
      title: 'Privacy Policy',
      blocks: [
        section(
          'Privacy Policy',
          `This Privacy Policy describes how ${b.name} ("we", "us") collects, uses, and protects information submitted through ${site}. This is a general template provided for convenience and does not constitute legal advice.`,
        ),
        section(
          'Information We Collect',
          `When you request a quote or contact us, we collect the details you provide — typically your name, phone number, email address, and a description of the work you need. We do not sell your personal information.`,
        ),
        section(
          'How We Use Information',
          `We use your contact details to respond to your inquiry, schedule service, and follow up about your request. We may retain records of completed work for warranty and bookkeeping purposes.`,
        ),
        section(
          'Cookies & Analytics',
          `This site may use basic analytics to understand which pages visitors find useful. Analytics data is aggregated and does not identify you personally.`,
        ),
        section(
          'Your Choices',
          `You may request access to, correction of, or deletion of your personal information at any time by contacting us at ${contact}.`,
        ),
        section(
          'Contact',
          `${b.name}, ${b.address.street}, ${b.address.city}, ${b.address.stateAbbr} ${b.address.zip}. Questions about this policy: ${contact}.`,
        ),
      ],
    };
  }

  return {
    title: 'Terms of Service',
    blocks: [
      section(
        'Terms of Service',
        `These Terms govern your use of ${site} and the services provided by ${b.name}. By using this site or booking our services you agree to these Terms. This is a general template provided for convenience and does not constitute legal advice.`,
      ),
      section(
        'Services & Estimates',
        `Estimates provided through this site or by phone are good-faith approximations based on the information you provide. Final pricing is confirmed before work begins. Scheduling is subject to availability.`,
      ),
      section(
        'Payment',
        `Payment is due as agreed at the time of booking or on completion of work unless otherwise arranged in writing.`,
      ),
      section(
        'Liability',
        `${b.name} carries out all work with professional care. To the maximum extent permitted by law, our liability is limited to the amount paid for the specific service giving rise to a claim.`,
      ),
      section(
        'Changes',
        `We may update these Terms from time to time. The version published on this page applies to new bookings from its publication date.`,
      ),
      section(
        'Contact',
        `${b.name}, ${b.address.street}, ${b.address.city}, ${b.address.stateAbbr} ${b.address.zip}. Questions about these Terms: ${contact}.`,
      ),
    ],
  };
}
