import { SectionHeading } from '@/components/site/SectionHeading';
import type { BlockComponent, BlockProps } from '@/lib/builder/types';

/**
 * Static-safe block substitutes for the ZIP export. Exported archives ship no
 * JavaScript, so interactive blocks are swapped (via BlockRenderer `overrides`)
 * for no-JS equivalents:
 *   - lead-form → a plain HTML <form> posting back to the SaaS app's /api/lead
 *   - faq       → native <details>/<summary> accordion
 * Everything else renders identically through the normal registry.
 */
export function staticOverrides(appOrigin: string): Record<string, BlockComponent> {
  function StaticLeadFormBlock({ ctx, config }: BlockProps) {
    const title =
      typeof config.title === 'string' ? config.title : 'Request Your Free Quote';
    return (
      <section className="container py-16">
        <div className="mx-auto max-w-2xl">
          <SectionHeading
            eyebrow={typeof config.eyebrow === 'string' ? config.eyebrow : 'Get Started'}
            title={title}
          />
          <form
            action={`${appOrigin}/api/lead`}
            method="post"
            className="mt-8 space-y-4 rounded-lg border border-border bg-background p-6"
          >
            <div>
              <label htmlFor="lead-name" className="mb-1 block text-sm font-medium">
                Name
              </label>
              <input
                id="lead-name"
                name="name"
                required
                minLength={2}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="lead-phone" className="mb-1 block text-sm font-medium">
                Phone
              </label>
              <input
                id="lead-phone"
                name="phone"
                type="tel"
                required
                minLength={7}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="lead-email" className="mb-1 block text-sm font-medium">
                Email
              </label>
              <input
                id="lead-email"
                name="email"
                type="email"
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="lead-service" className="mb-1 block text-sm font-medium">
                Service needed
              </label>
              <select
                id="lead-service"
                name="service"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a service…</option>
                {ctx.services.map((s) => (
                  <option key={s.slug} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lead-message" className="mb-1 block text-sm font-medium">
                Message
              </label>
              <textarea
                id="lead-message"
                name="message"
                rows={4}
                maxLength={1000}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            {/* Honeypot — hidden from humans; bots that fill it are dropped server-side. */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
              <label htmlFor="lead-company">Company</label>
              <input id="lead-company" name="company" tabIndex={-1} autoComplete="off" />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-brand px-4 py-2.5 font-semibold text-brand-fg"
            >
              Request Free Quote
            </button>
          </form>
        </div>
      </section>
    );
  }

  function StaticFaqBlock({ ctx, config }: BlockProps) {
    if (ctx.content.faqs.length === 0) return null;
    return (
      <section className="container py-16">
        <SectionHeading
          eyebrow={typeof config.eyebrow === 'string' ? config.eyebrow : 'FAQ'}
          title={
            typeof config.title === 'string' ? config.title : 'Frequently Asked Questions'
          }
        />
        <div className="mx-auto mt-10 max-w-3xl divide-y divide-border rounded-lg border border-border">
          {ctx.content.faqs.map((f) => (
            <details key={f.question} className="group p-5">
              <summary className="cursor-pointer font-semibold">{f.question}</summary>
              <p className="mt-3 text-muted-fg">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>
    );
  }

  return {
    'lead-form': StaticLeadFormBlock,
    faq: StaticFaqBlock,
  };
}
