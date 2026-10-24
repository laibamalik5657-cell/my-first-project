import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CustomerPageHeader({
    title,
    subtitle,
    backHref = '/',
    backLabel = 'Back to shop',
}: {
    title: string
    subtitle?: string
    backHref?: string
    backLabel?: string
}) {
    return (
        <header className="border-b border-green-100 bg-white/90 shadow-sm backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center px-4 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                    <Link
                        href={backHref}
                        aria-label={backLabel}
                        className="rounded-full bg-green-50 p-2.5 text-green-700 transition hover:bg-green-100"
                    >
                        <ArrowLeft size={22} />
                    </Link>

                    <div>
                        <h1 className="text-xl font-bold text-green-700 sm:text-2xl">
                            {title}
                        </h1>

                        {subtitle && (
                            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}