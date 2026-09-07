import { notFound } from 'next/navigation';
import { services } from '@/lib/services';
import { allITServices } from '@/lib/it-services';
import ServiceDetailClient from './ServiceDetailClient';

export function generateStaticParams() {
  return Array.from(new Set([...services.map(service => service.slug), ...allITServices.map(service => service.slug)])).map(slug => ({ slug }));
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exists = services.some(item => item.slug === slug) || allITServices.some(item => item.slug === slug);
  if (!exists) notFound();
  return <ServiceDetailClient slug={slug} />;
}
