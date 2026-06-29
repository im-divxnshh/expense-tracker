import { PersonDetail } from "@/features/people/person-detail";

export default async function PersonPage({ params }: PageProps<"/people/[id]">) {
  const { id } = await params;
  return <PersonDetail personId={id} />;
}
