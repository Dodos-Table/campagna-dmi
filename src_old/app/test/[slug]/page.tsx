import Link from "next/link";

export async function generateStaticParams() {
  
  return {
    slug: post.slug,
  }
}

export default async function TestSlug({params}: {params: Promise<{ slug: string }>}) {

    const {slug} = await params;

    return (
        <>
        ciao {slug}
        <Link href="/">back home</Link>
        </>
    )

}