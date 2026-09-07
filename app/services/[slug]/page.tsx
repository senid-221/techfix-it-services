import { notFound } from 'next/navigation';
import { services } from '@/lib/services';
import ServiceDetailClient from './ServiceDetailClient';

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = services.find((item) => item.slug === slug);

  if (!service) notFound();

  return <ServiceDetailClient slug={service.slug} />;
}
